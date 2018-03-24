// This script runs persistently in the background, listening to the content scripts and 
// managing logic for blocking of sites.

// Keep a list of all of the connections, so all tabs will be notified of changes
allPorts = []

// True when the plugin should be blocking
isBlocking = false

// Number of minutes the user has been active on distracting websites
activeMinutes = 0

// Set to true whenever there's activity on a distracting website.
// Set to false each minute. If it was true, `activityFor` will be 
// incremented.
hasBeenActive = false

// The configuration settings
config = {
	// The list of blocked sites
	blockList: ["www.reddit.com", "www.youtube.com", "twitter.com"],
	activeMinutes: 15,
	disabled: false
}

// Load the new config
chrome.storage.sync.get("config", function(new_config) {
	config = Object.assign(config, new_config.config)

	// Send the update if anyone has connected early
	allPorts.forEach((p) => {
		p.postMessage({action: "configChanged", newConfig: config })
	})
})

// The list of things to do
todos = []

// Load the todos
chrome.storage.sync.get("todos", function(new_todos) {
	todos = Object.assign(todos, new_todos.todos)

	// Send the update if anyone has connected early
	allPorts.forEach((p) => {
		p.postMessage({action: "todosChanged", newtodos: todos })
	})
})

// We'll listen for activity from connected pages, and send updates back to those pages
chrome.runtime.onConnect.addListener((port) => {
	allPorts.push(port)

	// Send some initial messages to inform the newly connected port of the current plugin state
	port.postMessage({action: "configChanged", newConfig: config})
	port.postMessage({action: "todosChanged", newTodos: todos})
	port.postMessage({action: "blockingChanged", value: isBlocking})

	port.onMessage.addListener((message) => {
		switch(message.action) {
			case "updateConfig":
				// Overwrite the config values with the new config values
				config = message.changes
				chrome.storage.sync.set({config: config}) 

				// Send the update to all listeners
				allPorts.forEach((p) => {
					p.postMessage({action: "configChanged", newConfig: config})
				})
				break

			case "pageActivity":
				console.log("Page Activity")
				hasBeenActive = true
				break

			case "resetActiveTime":
				hasBeenActive = false
				activeMinutes = 0
				break

			case "blockingChanged":
				if(isBlocking != message.value) {
					allPorts.forEach((p) => {
						p.postMessage({action: "blockingChanged", value: message.value})
					})
				}

				isBlocking = message.value

				break

			case "updateTodos":
				// Overwrite the config values with the new config values
				todos = message.changes
				chrome.storage.sync.set({todos: todos}) 

				// Send the update to all listeners
				allPorts.forEach((p) => {
					p.postMessage({action: "todosChanged", newTodos: todos})
				})
				break

			case "openTodos":
				chrome.tabs.create({
					url: "config_page/index.html",
				})
				break
		}
	})

	// Remove the port from the list of ports when it disconnects
	port.onDisconnect.addListener((port) => {
		console.log("Port disconnect")
		allPorts = allPorts.filter(item => item !== port)
	})
})

// Set up an alarm that will fire every minute
chrome.alarms.create("checkActivity", { periodInMinutes: 1 })
chrome.alarms.onAlarm.addListener((alarm) => {
	if(alarm.name !== "checkActivity") {
		return
	}

	// If hasBeenActive is set, we know that the user interacted in this minute
	if(hasBeenActive) {
		activeMinutes += 1
		console.log("Active for " + activeMinutes + " minute(s)")
	}
	hasBeenActive = false

	// Don't keep track of minutes if disabled
	if(config.disabled) {
		activeMinutes = 0
	}

	// Check if the timeout has been exceeded
	if(activeMinutes >= config.activeMinutes && !isBlocking) {
		isBlocking = true

		allPorts.forEach((p) => {
			p.postMessage({action: "blockingChanged", value: true})
		})
	}

	let shouldStopBlocking = false
	if(shouldStopBlocking && isBlocking) {
		isBlocking = false
		activeMinutes = 0
	}
})

// Set up the page to open when we click on the extension icon
chrome.browserAction.onClicked.addListener(() => {
	chrome.tabs.create({
		url: "config_page/index.html",
	})
})
