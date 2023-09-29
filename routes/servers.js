const express = require("express");
const router = express.Router();
const fs = require("fs");
let email = "";

const f = require("../scripts/mc.js");
const files = require("../scripts/files.js");

router.get(`/`, function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  //prevents a crash that has occurred
  if (email != undefined) {
    account = require("../accounts/" + email + ".json");
  }
  if (token === account.token) {
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
    if (fs.existsSync(`data/${file}-${req.query.version}.zip`)) {
      returnArray.push(file.split("-")[0]);
    }
  });

  res.status(200).json(returnArray);
});

router.get(`/jars`, function (req, res) {
  let returnArray = [];
  fs.readdirSync("data").forEach((file) => {
    if (file.includes(".jar")) {
      returnArray.push(file);
    }
  }
  );
  res.status(200).json(returnArray);
});

router.get(`/jarsIndex`, function (req, res) {
  let index = files.getIndex();
  console.log(files.getIndex);
  index.otherSoftwares = [index.terralith, index.incendium, index.nullscape, index.structory];

  index.terralith = null;
  index.incendium = null;
  index.nullscape = null;
  index.structory = null;
  res.status(200).json(index);
}
);

module.exports = router;
