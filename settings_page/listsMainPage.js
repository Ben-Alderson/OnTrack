function clearAllItems(ul) {
	ul.innerHTML = '';
}

function addItemPreset(ul, item) {
    var li = document.createElement("li");
    
    li.appendChild(document.createTextNode(item));
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
				addItemPreset(document.querySelector("#task-list"), todo)
			}
			break

	}
})

function addTodoItem(value) {
	todos.push(document.querySelector("#task-newitem").value);
	port.postMessage({ action: "updateTodos", changes: todos });
}