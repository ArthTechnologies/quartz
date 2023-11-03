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
          const text = fs.readFileSync(`servers/${server}/server.json`);
          try {
            serverstoObject.push(JSON.parse(text));
          } catch {
            console.log("error parsing " + server)
          }
    
        }
      });
      fs.readdirSync("accounts").forEach((account) => {
        const text = fs.readFileSync(`accounts/${account}`);
        try {
          accountstoObject.push(JSON.parse(text));
        } catch {
          console.log("error parsing " + account)
        }
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

Router.post("/account", (req, res) => {
  if (secrets.forwardingSecret != undefined) {

    if (files.hashNoSalt(req.query.forwardingSecret) == secrets.forwardingSecret) {
      if (req.body.account != undefined) {
        if (fs.existsSync(`accounts/${req.body.account}`)) {
          res.status(200).json({ msg: "Account already exists." });
        } else {
          fs.writeFileSync(`accounts/${req.body.account}`, JSON.stringify({}));
          res.status(200).json({ msg: "Account created." });
        }
      } else {
        res.status(400).json({ msg: "No account specified." });
      }
    }
  } else {
  res.status(401).json({ msg: "This node does not support forwarding." });
}
});

module.exports = Router;
