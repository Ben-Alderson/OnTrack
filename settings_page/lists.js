function clearAllItems(ul) {
	ul.innerHTML = '';
}

function addItemPreset(ul, item, cb) {
    var li = document.createElement("li");
	var button = document.createElement("button");
	button.innerHTML = "X";
	button.onclick = function() { 
    	cb(item);
  	};
    
    li.appendChild(document.createTextNode(item));
	li.appendChild(button);
	ul.appendChild(li);
}

// Keep track of todos
todos = []
config = {}

// Open up a connection with the background page
port = chrome.runtime.connect()
port.onMessage.addListener((message) => {
	console.log(message)

	switch(message.action) {
		case "todosChanged":
			// Fires when the todo list is changed
			todos = message.newTodos
			clearAllItems(document.querySelector("#task-list"))
			for(todo of todos) {
				addItemPreset(document.querySelector("#task-list"), todo, removeTodoItem)
			}
			break

		case "configChanged":
			// Fires when the configuration is changed
			config = message.newConfig
			clearAllItems(document.querySelector("#website-list"))
			for(site of config.blockList) {
				addItemPreset(document.querySelector("#website-list"), site, removeWebsiteItem)
			}
			document.querySelector("#RemindMin").value = config.remindMin
			document.querySelector("#SnoozeMin").value = config.snoozeMin
			break
	}
})

function addTodoItem(value) {
	todos.push(document.querySelector("#task-newitem").value);
	port.postMessage({ action: "updateTodos", changes: todos });
}

function removeTodoItem(item_id) {
	var index = todos.indexOf(item_id);
	todos.splice(index, 1);
	port.postMessage({ action: "updateTodos", changes: todos });
}

function addWebsiteItem(value) {
	config.blockList.push(document.querySelector("#website-newitem").value);
	port.postMessage({ action: "updateConfig", changes: config });
}

function removeWebsiteItem(item_id) {
	var index = config.blockList.indexOf(item_id);
	config.blockList.splice(index, 1);
	port.postMessage({ action: "updateConfig", changes: config });
}

function updateConfig(key, value) {
	config[key] = value;
	port.postMessage({ action: "updateConfig", changes: config });
}

document.querySelector("#website-add").addEventListener("click", addWebsiteItem);
document.querySelector("#website-newitem").addEventListener("keyup", (e) => {
	if(e.key == 13 || e.keyCode == 13) {
		addWebsiteItem()
	}
});

document.querySelector("#task-add").addEventListener("click", addTodoItem);
document.querySelector("#task-newitem").addEventListener("keyup", (e) => {
	if(e.key == 13 || e.keyCode == 13) {
		addTodoItem()
	}
});
document.querySelector("#RemindMin").addEventListener("keyup", (e) => {
	if(e.key == 13 || e.keyCode == 13) {
		updateConfig("remindMin", document.querySelector("#RemindMin").value)
	}
})
document.querySelector("#SnoozeMin").addEventListener("keyup", (e) => {
	if(e.key == 13 || e.keyCode == 13) {
		updateConfig("snoozeMin", document.querySelector("#SnoozeMin").value)
	}
})
