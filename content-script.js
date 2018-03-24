// The element obscuring the page
blocking_el = undefined

num_todos = undefined
minutes = undefined

isBlocking = false
config = {blockList: []}

function isOnBlockList() {
	return config.blockList.indexOf(window.location.hostname) > -1
}

function checkBlocking() {
	let shouldBlock = isBlocking && isOnBlockList()

	// Delete the blocker
	if(blocking_el) {
		blocking_el.parentElement.removeChild(blocking_el)
		blocking_el = undefined
	}

	if(shouldBlock) {
		// Create a blocker
		blocking_el = document.createElement("div")
		blocking_el.style["position"] = "fixed"
		blocking_el.style["top"] = 0
		blocking_el.style["left"] = 0
		blocking_el.style["height"] = "100vh"
		blocking_el.style["width"] = "100vw"
		blocking_el.style["background-color"] = "rgba(0, 0, 0, 0.5)"
		blocking_el.style["z-index"] = 10000

		var popup = document.createElement("div")
		popup.style["position"] = "fixed"
		popup.style["transform"] = "translate(-50%, -50%)"
		popup.style["left"] = "50%"
		popup.style["top"] = "50%"
		popup.style["background-color"] = "white"
		popup.style["border-radius"] = "10px"
		popup.style["padding"] = "1em"
		popup.style["font-size"] = "1em"
		blocking_el.appendChild(popup)

		var minutes_el = document.createElement("span")
		minutes_el.innerHTML = "You have been active for " + minutes + " minutes."
		popup.appendChild(minutes_el)
		popup.appendChild(document.createElement("br"))

		var num_todos_el = document.createElement("span")
		num_todos_el.innerHTML = "You have " + num_todos + " todos."
		popup.appendChild(num_todos_el)
		popup.appendChild(document.createElement("br"))
		
		var snooze = document.createElement("a")
		snooze.innerHTML = "Snooze&nbsp;&nbsp;&nbsp;"
		snooze.href = "javascript:void(0)"
		snooze.addEventListener("click", (e) => {
			e.preventDefault()
			port.postMessage({action: "changeState", value: "snooze"})
		})
		popup.appendChild(snooze)

		var accept = document.createElement("a")
		accept.innerHTML = "Accept&nbsp;&nbsp;&nbsp;"
		accept.href = chrome.runtime.getURL("config_page/index.html")
		accept.addEventListener("click", (e) => {
			e.preventDefault()
			port.postMessage({action: "openTodos"})
		})
		popup.appendChild(accept)

		var idle = document.createElement("a")
		idle.innerHTML = "Idle&nbsp;&nbsp;&nbsp;"
		idle.href = "javascript:void(0)"
		idle.addEventListener("click", (e) => {
			e.preventDefault()
			port.postMessage({action: "changeState", value: "idle"})
		})
		popup.appendChild(idle)

		document.body.appendChild(blocking_el)

		// Stop all playing video and audio
		document.querySelectorAll("video").forEach((el) => el.pause())
		document.querySelectorAll("audio").forEach((el) => el.pause())
	}
}

port = chrome.runtime.connect()
port.onMessage.addListener((message) => {
	switch(message.action) {
		case "configChanged":
			config = message.newConfig
			checkBlocking()
			break

		case "stateChanged":
			isBlocking = message.value == "blocking"
			checkBlocking()
			break

		case "todosChanged":
			num_todos = message.newTodos.length
			checkBlocking()
			break

		case "activityFor":
			minutes = message.time
			checkBlocking()
			break
	}
})

port.onDisconnect.addListener(() => {
	console.log("Disconnect from bg page")
})

function onActivity() {
	if(!"blockList" in config) {
		// Retry if we haven't loaded config yet
		//console.log("Retry")
		setTimeout(onActivity, 100)
		return
	}

	if(!document.hasFocus()) {
		//console.log("NoFocus")
		// Don't log events where the user is just hovering over the window.
	} else if(!isOnBlockList()) {
		//console.log("NotOnBlock")
	} else {
		// Send activity notification if we're blocked
		port.postMessage({action: "pageActivity"})
	}
	
	// Wait 1 second before sending another activity event
	document.body.removeEventListener("click", onActivity)
	document.body.removeEventListener("wheel", onActivity)
	document.body.removeEventListener("mousemove", onActivity)
	document.body.removeEventListener("keypress", onActivity)
	setTimeout(() => {
		document.body.addEventListener("click", onActivity)
		document.body.addEventListener("wheel", onActivity)
		document.body.addEventListener("mousemove", onActivity)
		document.body.addEventListener("keypress", onActivity)
	}, 1000)
}

onActivity()
