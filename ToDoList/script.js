//function test(){
//	var ul = document.getElementById("list");
//var li = document.createElement("li");
//li.appendChild(document.createTextNode("Four"));
//var button = document.createElement("button");
//button.innerHTML = "asdasd";
//li.appendChild(button);
//li.setAttribute("id","element4");
//ul.appendChild(li);
//alert(li.id);
//}

function addItem(){
    var ul = document.getElementById("dynamic-list");
    var candidate = document.getElementById("candidate");
    var li = document.createElement("li");
	var button = document.createElement("button");
	li.setAttribute('id',candidate.value);
	button.innerHTML = "X";
	button.onclick = function() { 
    	removeItem(candidate.value);
  	};
	
    
    li.appendChild(document.createTextNode(candidate.value));
	li.appendChild(button);
	
    ul.appendChild(li);
}

function removeItem(item_id){
    var ul = document.getElementById("dynamic-list");
    var item = document.getElementById(item_id);
    ul.removeChild(item);
}


function addItemPreset(item) {
    
	
	 var ul = document.getElementById("dynamic-list");
    
    var li = document.createElement("li");
	var button = document.createElement("button");
	li.setAttribute('id',item);
	button.innerHTML = "X";
	button.onclick = function() { 
    	removeItem(item);
  	};
	
    
    li.appendChild(document.createTextNode(item));
	li.appendChild(button);
	ul.appendChild(li);
}

addItemPreset("Read");
addItemPreset("another one");

document.querySelector("#add_item").addEventListener("click", addItem);
