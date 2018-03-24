function openOption(event) {

		var optName = this.dataset.tabid;
    var tabIndex, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (tabIndex = 0; tabIndex < tabcontent.length; tabIndex++) {
        tabcontent[tabIndex].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (tabIndex = 0; tabIndex < tablinks.length; tabIndex++) {
        tablinks[tabIndex].className = tablinks[tabIndex].className.replace(" active", "");
    }
    document.getElementById(optName).style.display = "block";
    event.currentTarget.className += " active";
}

document.querySelectorAll(".tablinks").forEach((i) => { i.addEventListener("click", openOption) });
document.getElementById("defaultOpen").click();
