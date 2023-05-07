const express = require("express");
const router = express.Router();
const fs = require("fs");
let email = "";
const accounts = require("../accounts.json");
const f = require("../scripts/mc.js");

router.get(`/`, function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  if (token == accounts[email].token) {
    //if req.body.email is "noemail" return 404
    if (req.query.email == ("noemail" | "undefined")) {
      //res.status(404).json({ msg: `Invalid email.` });
    }
    //set email to the email in the request
    accountId = req.query.accountId;

    //if servers.csv isnt blank, run checkServers

    //wait for checkServers to finish

    function delay(time) {
      return new Promise((resolve) => setTimeout(resolve, time));
    }

    var r = f.checkServers(accountId);

    delay(0).then(() => res.status(200).json(r));
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

router.get(`/worldgenMods`, function (req, res) {
  //for each file in worldgen, if it has req.query.version, add filename.split("-")[0] to the returj array
  let dirArray = fs.readdirSync("servers/template/downloading/worldgen");
  let returnArray = [];
  dirArray.forEach((file) => {
    console.log(file);
    if (file.includes(req.query.version)) {
      returnArray.push(file.split("-")[0]);
    }
  });

  res.status(200).json(returnArray);
});

module.exports = router;
