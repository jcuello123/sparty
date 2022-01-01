const axios = require("axios");
const TOO_MANY_REQUESTS = 429;

async function setCurrentTrack(user, djTrack) {
	console.log("trying to set " + djTrack.uri + "for user " + user.username);
	const url = "https://api.spotify.com/v1/me/player/play";
	const data = {
		uris: [djTrack.uri],
		position_ms: djTrack.progress_ms,
	};
	const config = {
		headers: {
			"Content-type": "application/json",
			Authorization: `Bearer ${user.access_token}`,
		},
	};

	try {
		await axios.put(url, data, config);
	} catch (error) {
		console.log(
			`error when setting track for ${user.username}`,
			error.response.data
		);

		if (error.response.status === TOO_MANY_REQUESTS) {
			return { error: error.response };
		}
	}
}

async function pauseCurrentTrack(user) {
	const url = "https://api.spotify.com/v1/me/player/pause";

	const config = {
		headers: {
			"Content-type": "application/json",
			Authorization: `Bearer ${user.access_token}`,
		},
	};

	try {
		await axios.put(url, {}, config);
	} catch (error) {
		console.log(
			`request error for pauseCurrentTrack for user ${user.username}:`,
			error.response.data
		);

		if (error.response.status === TOO_MANY_REQUESTS) {
			return { error: error.response };
		}
	}
}

async function getCurrentTrack(user) {
	const url = "https://api.spotify.com/v1/me/player/currently-playing";
	const config = {
		headers: {
			"Content-type": "application/json",
			Authorization: `Bearer ${user.access_token}`,
		},
	};

	try {
		let response = await axios.get(url, config);
		if (response.data === "" || response.data.item === null) {
			console.log(`${user.username} is possibly not listening yet.`);
			return { error: { message: "User possibly not listening yet" } };
		}
		return {
			uri: response.data.item.uri,
			progress_ms: response.data.progress_ms,
			is_playing: response.data.is_playing,
		};
	} catch (error) {
		console.log(
			`request error for getCurrentTrack for user ${user.username}:`,
			error.response.data
		);

		if (error.response.status === TOO_MANY_REQUESTS) {
			return { error: error.response };
		}

		return { error: error.response.data };
	}
}

module.exports = {
	setCurrentTrack,
	pauseCurrentTrack,
	getCurrentTrack,
	TOO_MANY_REQUESTS,
};
