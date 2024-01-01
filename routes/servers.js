const express = require("express");
const router = express.Router();
const fs = require("fs");
let email = "";

const f = require("../scripts/mc.js");
const files = require("../scripts/files.js");
const config = require("../scripts/utils.js").getConfig();
const getJSON = require("../scripts/utils.js").getJSON;
const enableAuth = JSON.parse(config.enableAuth);

router.get(`/`, function (req, res) {
  email = req.headers.username;
  token = req.headers.token;

  if (!enableAuth) email = "noemail";
  //prevents a crash that has occurred
  if (email != undefined) {
    account = getJSON(`accounts/${email}.json`);
    console.log(account);
    console.log("../accounts/" + email + ".json");
  }

  if (token === account.token || !enableAuth) {
    //if req.body.email is "noemail" return 404
    if (req.query.username == ("noemail" | "undefined")) {
      //res.status(404).json({ msg: `Invalid email.` });
    }

    console.log("debug1");
    for (i in account.servers) {
      console.log("server " + account.servers[i]);
      console.log("debug2");
      if (typeof account.servers[i] == "object")
        account.servers[i] = account.servers[i].id;
      if (fs.existsSync(`servers/${account.servers[i]}/server.json`)) {
        account.servers[i] = getJSON(
          "servers/" + account.servers[i] + "/server.json"
        );
        account.servers[i].state = f.getState(account.servers[i].id);
      } else {
        console.log("sever is not created yet");
        account.servers[i] = account.servers[i] + ":not created yet";
      }
    }
    res.status(200).json(account.servers);
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

router.get(`/worldgenMods`, function (req, res) {
  //for each file in worldgen, if it has req.query.version, add filename.split("-")[0] to the returj array
  let wmods = ["terralith", "incendium", "nullscape", "structory"];
  let returnArray = [];
  wmods.forEach((file) => {
    console.log(file);
    if (fs.existsSync(`assets/jars/${file}-${req.query.version}.zip`)) {
      returnArray.push(file.split("-")[0]);
    }
  });

  res.status(200).json(returnArray);
});

router.get(`/jars`, function (req, res) {
  let returnArray = [];
  fs.readdirSync("assets/jars").forEach((file) => {
    if (file.includes(".jar") || file.includes(".zip")) {
      returnArray.push(file);
    }
  });
  res.status(200).json(returnArray);
});

router.get(`/jarsIndex`, function (req, res) {
  files.getIndex((index) => {
    index.otherSoftwares = [
      index.terralith,
      index.incendium,
      index.nullscape,
      index.structory,
      index.geyser,
      index.floodgate,
    ];

    index.terralith = null;
    index.incendium = null;
    index.nullscape = null;
    index.structory = null;
    index.geyser = null;
    index.floodgate = null;
    res.status(200).json(index);
  });
});

module.exports = router;
