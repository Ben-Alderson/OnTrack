// This script runs persistently in the background, listening to the content scripts and 
// managing logic for blocking of sites.

// Keep a list of all of the connections, so all tabs will be notified of changes
allPorts = []

// Represents the state of the plugin one of {"remind", "idle", "blocking", "snooze"}
state = "remind"

// Number of minutes the user has been active on distracting websites
remindTimer = 0

// A list of websites active this minute
activeWebsites = []

// An object that stores the total number of minutes spent on each website
websiteTotals = {}

// The configuration settings
config = {
	// The list of blocked sites
	blockList: ["www.reddit.com", "www.youtube.com", "twitter.com", "www.facebook.com"],
	remindMin: 15,
	snoozeMin: 1
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
	port.postMessage({action: "stateChanged", value: state})
	port.postMessage({action: "activityFor", time: remindTimer})

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
				console.log("Page Activity " + message.website)
				if(activeWebsites.indexOf(message.website) == -1) {
					activeWebsites.push(message.website)
				}
				break

			case "resetActiveTime":
				remindTimer = 0
				allPorts.forEach((p) => {
					p.postMessage({action: "activityFor", time: remindTimer});
				})
				break

			case "changeState":
				if(state != message.value) {
					state = message.value
					remindTimer = 0
					allPorts.forEach((p) => {
						p.postMessage({action: "activityFor", time: remindTimer});
					})
					allPorts.forEach((p) => {
						p.postMessage({action: "stateChanged", value: state})
					})
				}

				break

			case "updateTodos":
				// Overwrite the todo list with the new todo list
				todos = message.changes
				chrome.storage.sync.set({todos: todos}) 

				// Send the update to all listeners
				allPorts.forEach((p) => {
					p.postMessage({action: "todosChanged", newTodos: todos})
				})
				break

			case "openTodos":
				chrome.tabs.create({
					url: "settings_page/mainPage.html",
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

	var hasBeenActive = false;
	for(website of activeWebsites) {
		console.log("Visited " + website)
		if(config.blockList.indexOf(website) > -1) { 
			// A blocked site was active
			hasBeenActive = true;
		}
		if(websiteTotals[website] !== undefined) {
			websiteTotals[website] += 1
		} else {
			websiteTotals[website] = 1
		}

		// Add to blocked list if visited for more than 3 minutes
		if(websiteTotals[website] >= 3) {
			if(config.blockList.indexOf(website) == -1) {
				console.log("Automatically blocked website: " + website)
				config.blockList.push(website)
				allPorts.forEach((p) => {
					p.postMessage({action: "configChanged", newConfig: config})
				})
			}
		}
	}
	activeWebsites = []

	switch(state) {
		case "remind":
			// If hasBeenActive is set, we know that the user interacted in this minute
			if(hasBeenActive) {
				remindTimer += 1
				console.log("Active for " + remindTimer + " minute(s)")

				allPorts.forEach((p) => {
					p.postMessage({action: "activityFor", time: remindTimer});
				})
			}

			// Check if the timeout has been exceeded
			if(remindTimer >= config.remindMin) {
				state = "blocking"

				allPorts.forEach((p) => {
					p.postMessage({action: "stateChanged", value: state})
				})
			}
			break
		case "snooze":
			// If hasBeenActive is set, we know that the user interacted in this minute
			if(hasBeenActive) {
				remindTimer += 1
				console.log("Active for " + remindTimer + " minute(s)")

				allPorts.forEach((p) => {
					p.postMessage({action: "activityFor", time: remindTimer});
				})
			}

			// Check if the timeout has been exceeded
			if(remindTimer >= config.snoozeMin) {
				state = "blocking"

				allPorts.forEach((p) => {
					p.postMessage({action: "stateChanged", value: state})
				})
			}
			break
		case "idle":
			break
		case "blocking":
			break
	}
})

// Set up the page to open when we click on the extension icon
chrome.browserAction.onClicked.addListener(() => {
	chrome.tabs.create({
		url: "settings_page/index.html",
	})
})
