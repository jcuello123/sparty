const urlParams = new URLSearchParams(window.location.search);

if (!urlParams.has("access_token")) {
	window.location.replace("/login");
}

function join() {
	const username = document.getElementById("username").value;
	const room = document.getElementById("room").value;
	if (urlParams.has("access_token")) {
		window.location.replace(
			`/room.html?username=${username}&room=${room}&access_token=${urlParams.get(
				"access_token"
			)}`
		);
	}
}
