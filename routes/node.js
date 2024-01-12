const express = require("express");
const Router = express.Router();
const fs = require("fs");
const readJSON = require("../scripts/utils.js").readJSON;
const data = readJSON("assets/data.json");
const files = require("../scripts/files.js");
const config = require("../scripts/utils.js").getConfig();

Router.get("/", (req, res) => {
  data.numServers = fs.readdirSync("servers").length;
  fs.writeFileSync("assets/data.json", JSON.stringify(data, null, 2));
  res.status(200).json({
    maxServers: config.maxServers,
    numServers: data.numServers,
  });
});

Router.get("/secrets", (req, res) => {
  if (config.forwardingSecret != undefined) {
    if (req.query.forwardingSecret == config.forwardingSecret) {
      let serverstoObject = {};
      let accountstoObject = {};
      fs.readdirSync("servers").forEach((server) => {
        if (fs.existsSync(`servers/${server}/server.json`)) {
          const text = fs.readFileSync(`servers/${server}/server.json`);
          try {
            serverstoObject[server] = JSON.parse(text);
          } catch {
            console.log("error parsing " + server);
          }
        } else {
          serverstoObject[server] = "not created yet";
        }
      });
      fs.readdirSync("accounts").forEach((account) => {
        const text = fs.readFileSync(`accounts/${account}`);
        try {
          accountstoObject[account] = JSON.parse(text);
        } catch {
          console.log("error parsing " + account);
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
  if (config.forwardingSecret == undefined) {
    let configTxt = fs.readFileSync("config.txt", "utf8");
    //find line including forwardingSecret
    let line = configTxt.split("\n").find((line) => {
      return line.includes("forwardingSecret");
    });
    configTxt = configTxt.replace(
      line,
      `forwardingSecret=${req.query.forwardingSecret}`
    );
    res.status(200).json({ msg: "Forwarding enabled." });
  } else {
    res.status(401).json({ msg: "Forwarding already enabled." });
  }
});

Router.post("/account", (req, res) => {
  if (config.forwardingSecret != undefined) {
    if (
      files.hashNoSalt(req.query.forwardingSecret) == config.forwardingSecret
    ) {
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
