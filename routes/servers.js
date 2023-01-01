const express = require("express");
const router = express.Router();
const fs = require("fs");
let email = "";
let names = [];
let softwares = [];
let versions = [];
var array = fs.readFileSync("servers.csv").toString().split("\n");
var amount = 0;
let ids = [];
const f = require("../scripts/mc.js");

router.get(`/`, function (req, res) {
  email = req.headers.email;
  //if req.body.email is "noemail" return 404
  if (email == ("noemail" | "undefined")) {
    res.status(404).json({ msg: `Invalid email.` });
  }

  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  var r = f.checkServers(email);

  delay(0).then(() => res.status(200).json(r));
});

module.exports = router;
