import asyncio
import json
import os
import queue
import tempfile
import websockets
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Map from host#id to tmpfile
# Watch files
# Dictionary to hold textarea file paths
textarea_files = {}

async def send_messages(websocket, message_queue):
    while True:
        message = await asyncio.get_event_loop().run_in_executor(None, message_queue.get)
        await websocket.send(message)

async def handle_connection(websocket):
    message_queue = queue.Queue()
    asyncio.create_task(send_messages(websocket, message_queue))

    async for message in websocket:
        #print(message)
        data = json.loads(message)
        key = data['key']

        if "remove" in data:
            if key not in textarea_files:
                print(f"{key} not known file!")
                continue
            observer = textarea_files[key]['observer']
            observer.stop()
            observer.join()
            os.unlink(textarea_files[key]['file'])
            print(f"Removed {key} and {textarea_files[key]['file']}")
            del textarea_files[key]
            continue

        updating = False
        if key not in textarea_files:
            file = tempfile.NamedTemporaryFile(delete = False)

            def on_modified(event):
                if updating:
                    return
                print(f'File {file.name} for {key} modified')
                with open(textarea_files[key]['file'], 'r') as f:
                    message_queue.put(json.dumps({'key': key, 'value': f.read()}))

            event_handler = FileSystemEventHandler()
            event_handler.on_modified = on_modified
            observer = Observer()
            observer.schedule(event_handler, path=file.name, recursive=False)
            observer.start()

            textarea_files[key] = {
                'file': file.name,
                'observer': observer,
            }
            print(f"Created {file.name} for {key}")

        print(f"Updated {key}")
        updating = True
        with open(textarea_files[key]['file'], 'w') as f:
            f.write(data['value'])
        updating = False

async def main():
    async with websockets.serve(handle_connection, "localhost", 16557):
        print("Listening…")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
