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

router.post(`/`, function (req, res) {
  //if req.body.email is "noemail" return 404
  if (req.body.email == ("noemail" | "undefined")) {
    //res.status(404).json({ msg: `Invalid email.` });
  }
  //set email to the email in the request
  email = req.body.email;

  //if servers.csv isnt blank, run checkServers

  //wait for checkServers to finish

  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  var r = f.checkServers(email);

  delay(0).then(() => res.status(200).json(r));
});

module.exports = router;
