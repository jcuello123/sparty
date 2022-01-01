require("dotenv").config();
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server);
const port = process.env.PORT || 3000;
const cors = require("cors");
const { handleEvents } = require("./eventHandler");

//middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/", require("./routes/routes"));

handleEvents(io);

server.listen(port, () => {
	console.log(`Listening on port ${port}`);
});
