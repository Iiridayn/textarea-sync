// Maps to hold the relationship between incrementing IDs and textarea elements
const idToTextareaMap = new Map();
const textareaToIdMap = new Map();
let currentId = 0; // Counter for incrementing IDs

// Function to create a UI button for registering the textarea
function createRegisterButton(textarea) {
	const button = document.createElement('button');
	button.id = 'watchbutton';
	button.innerText = 'Watch';
	button.style.position = 'absolute';
	button.style.zIndex = '1000';
	button.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
	button.style.color = 'white';
	button.style.border = 'none';
	button.style.padding = '5px 10px';
	button.style.borderRadius = '5px';
	button.style.cursor = 'pointer';

	// Position the button near the textarea
	const rect = textarea.getBoundingClientRect();
	button.style.top = `${rect.top + window.scrollY}px`;
	button.style.left = `${rect.left + window.scrollX + rect.width + 5}px`;

	// Add click event to register the textarea
	button.addEventListener('click', () => {
		toggleWatch(textarea);
		document.body.removeChild(button); // Remove the button after clicking
	});

	document.body.appendChild(button);
}

const textareaSelector = 'textarea, [contenteditable="true"]'; // Select both textareas and contenteditable elements
document.querySelectorAll(textareaSelector).forEach(textarea => {
    textarea.addEventListener('mouseenter', () => createRegisterButton(textarea));
    //textarea.addEventListener('mouseleave', handleMouseLeave);
});

function debounce(func, delay) {
	let timeoutId;
	return function(...args) {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
		timeoutId = setTimeout(() => {
			func.apply(this, args);
		}, delay);
	};
}

function toggleWatch(ta) {
	if (textareaToIdMap.has(ta)) {
		const data = textareaToIdMap.get(ta);
		console.log('Removing textarea', data['id']);
		chrome.runtime.sendMessage({
			action: 'remove',
			host: window.location.hostname,
			textareaId: data['id'],
		});
		ta.removeEventListener('input', data['handler']);
		idToTextareaMap.delete(data['id'])
		textareaToIdMap.delete(ta)

		ta.style.outline = '';
		return;
	}

	const textareaId = '' + currentId++;
	ta.style.outline = '2px solid blue';

	console.log('Adding textarea', textareaId);
	chrome.runtime.sendMessage({
		action: 'add',
		host: window.location.hostname,
		textareaId: textareaId,
		value: ta.value
	});

	const changeHandler = debounce(() => {
		console.log('Textarea', textareaId, 'changed');
		chrome.runtime.sendMessage({
			action: 'update',
			host: window.location.hostname,
			textareaId: textareaId,
			value: ta.value
		});
	}, 300);
	ta.addEventListener('input', changeHandler);

	textareaToIdMap.set(ta, { 'id': textareaId, 'handler': changeHandler });
	idToTextareaMap.set(textareaId, ta);
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message) => {
	if (message.action === 'update') {
		const textarea = idToTextareaMap.get(message.key)
		console.log('Updating textarea', message.key);

		if (textarea) {
			textarea.value = message.value; // Update the textarea with the new value
			//textarea.dispatchEvent(new Event('input')); // Trigger input event if needed
		}
	}
});
