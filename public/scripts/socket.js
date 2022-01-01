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
});

socket.on("error", () => {
	console.log("error");
	window.location.replace("/login");
});
