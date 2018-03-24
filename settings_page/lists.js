function clearAllItems(ul) {
	ul.innerHTML = '';
}

function addItemPreset(ul, item) {
    var li = document.createElement("li");
	var button = document.createElement("button");
	button.innerHTML = "X";
	button.onclick = function() { 
    	removeItem(item);
  	};
    
    li.appendChild(document.createTextNode(item));
	li.appendChild(button);
	ul.appendChild(li);
}

// Keep track of todos
todos = []

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

function addItem() {
	todos.push(document.getElementById("task-newitem").value);
	port.postMessage({ action: "updateTodos", changes: todos });
}

function removeItem(item_id) {
	var index = todos.indexOf(item_id);
	todos.splice(index, 1);
	port.postMessage({ action: "updateTodos", changes: todos });
}

document.querySelector("#task-add").addEventListener("click", addItem);
document.querySelector("#task-newitem").addEventListener("keyup", (e) => { if(e.key == 13 || e.keyCode == 13) { addItem(); } });
