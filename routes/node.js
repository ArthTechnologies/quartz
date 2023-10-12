const express = require("express");
const Router = express.Router();
const fs = require("fs");
const settings = require("../stores/settings.json");
const data = require("../stores/data.json");
const files = require("../scripts/files.js");
const secrets = require("../stores/secrets.json");

Router.get("/", (req, res) => {
  //1 is subtracted because of the "template" subdirectory
  data.numServers = fs.readdirSync("servers").length - 1;
  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
  res.status(200).json({
    maxServers: settings.maxServers,
    numServers: data.numServers,
  });
});


Router.get("/secrets", (req, res) => {
  if (secrets.forwardingSecret != undefined) {
    if (files.hashNoSalt(req.query.forwardingSecret) == secrets.forwardingSecret) {
      let serverstoObject = [];
      let accountstoObject = [];
      fs.readdirSync("servers").forEach((server) => {
        if (server != "template") {
          serverstoObject.push(require(`../servers/${server}/server.json`));
        }
      });
      fs.readdirSync("accounts").forEach((account) => {
        accountstoObject.push(require(`../accounts/${account}`));
      });
      res
        .status(200)
        .json({ servers: serverstoObject, accounts: accountstoObject });
    } else {
      res.status(401).json({ msg: "Invalid forwarding secret." });
    }
  } else {
    res.status(401).json({ msg: "This node does not support forwarding." });
  }
});

Router.post("/secrets/forwardingSecret", (req, res) => {
  if (secrets.forwardingSecret == undefined) {
    secrets.forwardingSecret = files.hashNoSalt(req.query.forwardingSecret);
    fs.writeFileSync("stores/secrets.json", JSON.stringify(secrets));
    res.status(200).json({ msg: "Forwarding enabled." });
  } else {
    res.status(401).json({ msg: "Forwarding already enabled." });
  }
});

module.exports = Router;
