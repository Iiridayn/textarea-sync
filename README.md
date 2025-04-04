I need a system with three parts.

1. A browser extension content script which can select textareas to watch, and communicates the host and a textarea identifier to the extension background script. The extension background script can use that to coordinate with the content script and target a chosen textarea. It watches the textarea for changes and when it does it reports those to the background script.
2. A background script which connects to a localhost websocket server on port 16557 and listens for content script connections. It should reconnect to the websocket server when that restarts. It should know when a content script goes away - for example the website reloads - and manage a list of hosts and textareas. It should primarily serve to relay this information to the websocket server.
3. A websocket server in python. It creates a named temporary file for each new textarea and watches that file for changes; when the file changes it notifies the browser extension with the new content of the file. It lets those files close when it is notified by the background script that the textarea has gone away.

TODO - remove files when the page reloads or tab is closed; probably a keepalive
of some kind. Eh, it works good enough for now.
TODO - actually test it w/contenteditable

NOTE - This code was hacked together in 4 hours using extensive GPT-4o support.
It is not quality nor meant to be representative of quality. I just wanted the
problem finally solved. Making it quality will involve more time and cleanup. I
understand the majority of the code well (with the notable exception of the
python `asyncio` stuff), but chose to use the AI output with mostly only
light/moderate modifications for the sake of speed. I've included the chat
transcript for clarity; it cuts off suddenly due to reaching the maximum chat
length. It gave enough information; I didn't want to fiddle w/the frontend, and
it picked an adequate option.

Also of note, the first 2 of those 4 hours were spent diagnosing websocket
issues and in initial preparation. I started with some other code samples from
AI and blogs about watching a file in Python, and had changed direction from a
standard socket server to websockets. Much of that time was diagnosing that I
couldn't connect directly to an unsecured websocket on localhost from a page
environment, and in fact needed the three code file architecture noted above. AI
was not very helpful in identifying the issue alone, but it was helpful coming
up with some quick tests I could run when prompted. The provided transcript
starts from the point those issues were resolved, I had a clear architectural
direction, and had learned a bit more about the Python Observable library via
documentation, blogs, and some simple tests.
