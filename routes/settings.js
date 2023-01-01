const express = require("express");
const router = express.Router();
const fs = require("fs");

//import settings.json
let settings = require("../settings.json");

//if environment variable WEB_PORT is set, set settings.webport to that
if (process.env.SERVERS_PER_USER) {
  settings.serversPerUser = process.env.WEB_PORT;
}
if (process.env.BROWSER_TITLE) {
  settings.browserTitle = process.env.WEB_PORT;
}

if (process.env.WEB_NAME) {
  settings.webName = process.env.WEB_PORT;
}
if (process.env.ENABLE_PAY) {
  settings.enablePay = process.env.WEB_PORT;
}
if (process.env.TRUSTED_DOMAINS) {
  settings.trustedDomains = process.env.WEB_PORT;
}

router.get(`/`, function (req, res) {
  //add cors header
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  //return settings.json
  res.json(settings);
});

router.post(`/`, function (req, res) {
  var keyMatch = true;
  //add cors header
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );

  settings = {
    serversPerUser: req.body.serversPerUser,
    browserTitle: req.body.browserTitle,
    webLogo: req.body.webLogo,
    enablePay: req.body.enablePay,
    trustedDomains: req.body.trustedDomains,
  };
  console.log(settings);
  if (keyMatch) {
    //write settings to settings.json
    fs.writeFile("settings.json", JSON.stringify(settings), function (err) {
      if (err) throw err;
      console.log("File is created successfully.");
    });
  }
  //return settings.json
  res.json(settings);
});

module.exports = router;
