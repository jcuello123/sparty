const { response } = require("express");
const {
  setCurrentTrack,
  pauseCurrentTrack,
  getCurrentTrack,
  TOO_MANY_REQUESTS,
} = require("./spotifyRequestsUtil");
const rooms = new Map();
let numRequests = 0;
setInterval(() => {
  console.log(numRequests);
}, 30 * 1000);

function handleEvents(io) {
  io.on("connection", (socket) => {
    socket.on("initialize", (user) => {
      joinRoom(socket, user);
    });

    socket.on("disconnect", () => {
      handleDisconnect(socket);
    });
  });
}

function handleDisconnect(socket) {
  if (socket.room) {
    const room = rooms.get(socket.room);
    const users = room.get("users");
    const dj = room.get("dj");

    if (socket.username === dj.username) {
      if (users.size > 0) {
        assignNewDJ(room, users);
      } else {
        room.delete("dj");
      }
    } else {
      users.delete(socket.username);
    }

    const roomSize = users.size;

    if (roomSize === 0 && !room.has("dj")) {
      clearInterval(room.get("intervalId"));
      rooms.delete(socket.room);
    }

    console.log(`${socket.username} has disconnected`);
    console.log(rooms);
    console.log(`${socket.room} size: `, roomSize);
  }
}

function assignNewDJ(room, users) {
  const keys = Array.from(users.keys());
  const key = keys[Math.floor(Math.random() * keys.length)];
  const user = users.get(key);
  room.set("dj", user);
  room.get("users").delete(user.username);
  console.log(`new dj for room ${user.room} is ${user.username}`);
}

function joinRoom(socket, user) {
  let room = rooms.get(user.room);
  if (!room || !room.get("users").has(user.username)) {
    if (!room) {
      room = new Map();
      const users = new Map();
      room.set("users", users);
      room.set("dj", user);
      room.set("isUpdating", false);
      rooms.set(user.room, room);
      setCurrentPlayback(room);
    }
    addUserToRoom(user, room);
    socket.join(user.room);
    socket.username = user.username;
    socket.room = user.room;
    console.log(`${user.room} size:`, room.get("users").size + 1);
    console.log(`server: ${user.username} has joined the ${user.room} room.`);
  } else {
    console.log("error");
    socket.emit("error");
  }
}

function addUserToRoom(user, room) {
  if (user.username !== room.get("dj").username) {
    room.get("users").set(user.username, user);
  }
}

function setCurrentPlayback(room) {
  const intervalId = setInterval(async () => {
    if (room.get("isUpdating") === false) {
      room.set("isUpdating", true);
      const users = room.get("users");
      const dj = room.get("dj");

      // console.log("dj:", dj.username);
      numRequests++;
      const currentDJTrack = await getCurrentTrack(dj);
      // console.log("djTrack:", currentDJTrack);

      if (
        currentDJTrack.error &&
        currentDJTrack.error.status === TOO_MANY_REQUESTS
      ) {
        handleTooManyRequests(currentDJTrack, dj);
      } else {
        console.log(`success get for dj ${dj.username}`);
      }
      for (const [username, user] of users.entries()) {
        if (!dj.isOnTimeOut && !user.isOnTimeOut) {
          numRequests++;
          const currentTrack = await getCurrentTrack(user);

          if (
            currentTrack.error &&
            currentTrack.error.status === TOO_MANY_REQUESTS
          ) {
            handleTooManyRequests(currentTrack, user);
            break;
          } else {
            console.log(`success get track for ${username}`);
          }

          const isSameTrack = currentTrack.uri === currentDJTrack.uri;
          const timeDifferenceMs = Math.abs(
            currentDJTrack.progress_ms - currentTrack.progress_ms
          );

          if (!isSameTrack || timeDifferenceMs > 500) {
            numRequests++;
            const response = await setCurrentTrack(user, currentDJTrack);
            if (
              response &&
              response.error &&
              response.error.status === TOO_MANY_REQUESTS
            ) {
              handleTooManyRequests(response, user);
              break;
            } else {
              console.log(`success set track for ${username}`);
            }
          }
          if (!currentDJTrack.is_playing && currentTrack.is_playing) {
            numRequests++;
            const response = await pauseCurrentTrack(user);
            if (
              response &&
              response.error &&
              response.error.status === TOO_MANY_REQUESTS
            ) {
              handleTooManyRequests(response, user);
              break;
            } else {
              console.log(`success pause track for ${username}`);
            }
          }
        }
      }
      room.set("isUpdating", false);
    }
  }, 1000);
  room.set("intervalId", intervalId);
}

function handleTooManyRequests(response, user) {
  const seconds = response.error.headers["retry-after"];
  console.log(`${user.username} will be on timeout for ${seconds} secs`);
  user.isOnTimeOut = true;
  setTimeout(() => {
    user.isOnTimeOut = false;
  }, seconds * 1000);
}

module.exports = {
  handleEvents,
};
