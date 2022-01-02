const express = require("express");
const router = express.Router();
const request = require("request");
const querystring = require("querystring");
const redirect_uri = process.env.SERVER_IP
  ? `${process.env.SERVER_IP}:3000/callback`
  : "http://localhost:3000/callback";

router.get("/login", function (req, res) {
  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: process.env.SPOTIFY_CLIENT_ID,
        scope:
          "user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing",
        redirect_uri,
      })
  );
});

router.get("/callback", function (req, res) {
  let code = req.query.code || null;
  let authOptions = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      code: code,
      redirect_uri,
      grant_type: "authorization_code",
    },
    headers: {
      Authorization:
        "Basic " +
        new Buffer.from(
          process.env.SPOTIFY_CLIENT_ID +
            ":" +
            process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
    },
    json: true,
  };
  request.post(authOptions, function (error, response, body) {
    const access_token = body.access_token;
    res.redirect("/index.html" + "?access_token=" + access_token);
  });
});

module.exports = router;
