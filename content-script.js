// The element obscuring the page
blocking_el = undefined

isBlocking = false
config = {blockList: []}

function isOnBlockList() {
	return config.blockList.indexOf(window.location.hostname) > -1
}

function checkBlocking() {
	let shouldBlock = isBlocking && isOnBlockList()

	if(shouldBlock && !blocking_el) {
		// Create a blocker
		blocking_el = document.createElement('div')
		blocking_el.style["position"] = "fixed"
		blocking_el.style["top"] = 0
		blocking_el.style["left"] = 0
		blocking_el.style["height"] = "100vh"
		blocking_el.style["width"] = "100vw"
		blocking_el.style["background"] = "red"
		blocking_el.style["z-index"] = 10000
		document.body.appendChild(blocking_el)

		// Stop all playing video and audio
		document.querySelectorAll("video").forEach((el) => el.pause())
		document.querySelectorAll("audio").forEach((el) => el.pause())
	} else if(!shouldBlock && blocking_el) {
		// Delete the blocker
		blocking_el.parentElement.removeChild(blocking_el)
		blocking_el = undefined
	}
}

port = chrome.runtime.connect()
port.onMessage.addListener((message) => {
	switch(message.action) {
		case "configChanged":
			config = message.newConfig
			checkBlocking()
			break

		case "blockingChanged":
			isBlocking = message.value
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
