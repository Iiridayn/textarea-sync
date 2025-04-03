const contentScripts = new Map(); // To track content script connections

let ws;
function connectWebSocket() {
	ws = new WebSocket('ws://localhost:16557');

	ws.onopen = () => {
		console.log('Connected to WebSocket server');
	};

	ws.onclose = () => {
		console.log('WebSocket connection closed, reconnecting...');
		setTimeout(connectWebSocket, 1000); // Reconnect after 1 second
	};

	ws.onmessage = (event) => {
		//console.log('Message from server:', event.data);
		const data = JSON.parse(event.data);
		console.log('Server updated', data['key']);
		const key = data['key']

		// Send the updated value to the corresponding content script
		if (contentScripts.has(key)) {
			const contentScriptId = contentScripts.get(key);
			chrome.tabs.sendMessage(contentScriptId, {
				action: 'update', key: key.split('#')[1], value: data['value']
			});
		}
	};
}
// Initialize WebSocket connection
connectWebSocket();

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender) => {
	const key = `${message.host}#${message.textareaId}`;
	if (message.action === 'add') {
		if (contentScripts.has(key)) {
			console.log('Already have that textarea! ' + key);
		} else {
			console.log(`Registered textarea: ${key}`);
			contentScripts.set(key, sender.tab.id);
		}
		ws.send(JSON.stringify({ key, value: message.value }));
	} else if (message.action === 'update') {
		if (!contentScripts.has(key)) {
			console.log('Can\'t update a textarea I don\'t have! Adding: ' + key);
			contentScripts.set(key, sender.tab.id);
		}
		ws.send(JSON.stringify({ key, value: message.value }));
	} else if (message.action === 'remove') {
		if (!contentScripts.has(key))
			console.log('Can\'t delete a textarea I don\'t have! ' + key);
		contentScripts.delete(key);
		ws.send(JSON.stringify({ key, remove: true }));
	}
});
