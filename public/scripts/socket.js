const urlParams = new URLSearchParams(window.location.search);

if (
	!urlParams.has("access_token") ||
	!urlParams.has("username") ||
	!urlParams.has("room")
) {
	window.location.replace("/index.html");
}

const access_token = urlParams.get("access_token");
const username = urlParams.get("username");
const room = urlParams.get("room");
const socket = io();

socket.on("connect", () => {
	console.log("initializing");
	socket.emit("initialize", {
		username,
		room,
		access_token,
		socketId: socket.id,
		isOnTimeOut: false,
	});

	document.getElementById("room").textContent = `Room - ${room}`;
});

socket.on("error", () => {
	console.log("error");
	window.location.replace("/login");
});

socket.on("displayUser", (usertoDisplay) => {
	const usersList = document.getElementById("users");
	const li = createLi(usertoDisplay);
	usersList.appendChild(li);
});

socket.on("userDisconnected", (userToRemove) => {
	const usersList = document.getElementById("users");
	const li = document.getElementById(userToRemove);
	usersList.removeChild(li);
});

socket.on("displayAllUsers", (users) => {
	users.forEach((user) => {
		displayUser(user);
	});
});

socket.on("updateDjUponDisconnect", (userToDisplayCrown) => {
	displayCrown(userToDisplayCrown);
});

socket.on("changeDj", (userToRemoveCrownFrom, userToDisplayCrown) => {
	console.log("change dj called");
	removeCrown(userToRemoveCrownFrom);
	displayCrown(userToDisplayCrown);
});

function displayUser(userToDisplay) {
	const usersList = document.getElementById("users");
	let li = createLi(userToDisplay.username);

	if (userToDisplay.isDj) {
		li = displayCrown(userToDisplay.username);
	}

	usersList.appendChild(li);
}

function createLi(userToDisplay) {
	const li = document.createElement("li");
	li.textContent = userToDisplay;
	li.id = userToDisplay;
	li.addEventListener("click", assignDj);
	return li;
}

function displayCrown(userToDisplayCrown) {
	let li = document.getElementById(userToDisplayCrown);
	const img = document.createElement("img");
	img.src = "Logos/crown.png";
	img.width = "30";
	img.style = "pointer-events: none";
	if (li === null) {
		li = createLi(userToDisplayCrown);
	}
	li.appendChild(img);
	console.log(li);
	return li;
}

function assignDj(e) {
	const userClicked = e.target.id;
	socket.emit("shouldChangeDj", username, userClicked);
}

function removeCrown(userToRemoveCrownFrom) {
	console.log("removing crown from" + userToRemoveCrownFrom);
	const li = document.getElementById(userToRemoveCrownFrom);
	li.removeChild(li.childNodes[1]);
}
