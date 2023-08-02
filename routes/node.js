const express = require("express");
const Router = express.Router();
const fs = require("fs");
const settings = require("../stores/settings.json");
const data = require("../stores/data.json");
const servers = require("../servers.json");
const files = require("../scripts/files.js");
const secrets = require("../stores/secrets.json");

Router.get("/", (req, res) => {
  let numServers = 0;
  for (i in servers) {
    if (servers[i] != "deleted") {
      numServers++;
    }
  }

  data.numServers = numServers;
  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
  res.status(200).json({
    maxServers: settings.maxServers,
    numServers: numServers,
  });
});

Router.get("/secrets", (req, res) => {
  if (files.hash(req.query.forwardingSecret) == secrets.forwardingSecret) {
    res
      .status(200)
      .json({ servers: servers, accounts: require("../accounts.json") });
  } else {
    res.status(401).json({ msg: "Invalid forwarding secret." });
  }
});

module.exports = Router;
