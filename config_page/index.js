config = {}

// Get references to elements on the page
config_box = document.querySelector("#show_config")
todos_box = document.querySelector("#show_todos")
update_config_button = document.querySelector("#update_config")
update_todos_button = document.querySelector("#update_todos")
status_div = document.querySelector("#status")
error_div = document.querySelector("#errors")
blocking_enabled = document.querySelector("#blocking_enabled")
reset_timer = document.querySelector("#reset_timer")

// Open up a connection with the background page
port = chrome.runtime.connect()
port.onMessage.addListener((message) => {
	console.log(message)
	status_div.innerHTML = "Got action '" + message.action + "' at: [" + new Date() + "]"

	switch(message.action) {
		case "configChanged":
			// Fires when the configuration is changed
			config = message.newConfig
			config_box.value = window.JSON.stringify(config, null, 2)
			break

		case "todosChanged":
			// Fires when the todo list is changed
			todos = message.newTodos
			todos_box.value = window.JSON.stringify(todos, null, 2)
			break

		case "blockingChanged":
			// Fires when blocking becomes active or inactive
			blocking_enabled.checked = message.value
			break
	}
})

// Update the config from the given JSON when the update button is pressed
update_config_button.addEventListener("click", () => {
	// Clear out status fields
	status_div.innerHTML = ""
	error_div.innerHTML = ""

	// Try to parse the JSON
	try {
		let info = JSON.parse(document.querySelector("#show_config").value)
		// Send the request to change the config
		port.postMessage({action: "updateConfig", changes: info})
	} catch(e) {
		error_div.innerHTML = e
		return
	}
})

// Update the todos from the given JSON when the update button is pressed
update_todos_button.addEventListener("click", () => {
	// Clear out status fields
	status_div.innerHTML = ""
	error_div.innerHTML = ""

	// Try to parse the JSON
	try {
		let info = JSON.parse(document.querySelector("#show_todos").value)
		// Send the request to change the todos
		port.postMessage({action: "updateTodos", changes: info})
	} catch(e) {
		error_div.innerHTML = e
		return
	}
})

blocking_enabled.addEventListener("change", () => {
	port.postMessage({action: "blockingChanged", value: blocking_enabled.checked})
})

reset_timer.addEventListener("click", () => {
	port.postMessage({action: "resetActiveTime"})
})
