const express = require("express");
const router = express.Router();
const fs = require("fs");
let email = "";

const f = require("../scripts/mc.js");
const files = require("../scripts/files.js");
const config = require("../scripts/config.js").getConfig();
const enableAuth = config.enableAuth;

router.get(`/`, function (req, res) {

  email = req.headers.email;
  token = req.headers.token;

  if (!enableAuth) email = "noemail";
  //prevents a crash that has occurred
  if (email != undefined) {
    account = require("../accounts/" + email + ".json");
    console.log(!enableAuth + "enableAuth" + token === account.token || !enableAuth);
  }
  if (token === account.token || !enableAuth) {
    //if req.body.email is "noemail" return 404
    if (req.query.email == ("noemail" | "undefined")) {
      //res.status(404).json({ msg: `Invalid email.` });
    }
    //set email to the email in the request
    accountId = req.query.accountId;
    for (i in account.servers) {
      account.servers[i].state = f.getState(account.servers[i].id);
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
