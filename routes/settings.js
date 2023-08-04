const express = require("express");
const router = express.Router();
const fs = require("fs");

//import settings.json
let settings = require("../stores/settings.json");

let sk = require("../stores/secrets.json").stripekey;

if (process.env.SERVERS_PER_USER) {
  settings.serversPerUser = process.env.WEB_PORT;
}
if (process.env.BROWSER_TITLE) {
  settings.browserTitle = process.env.WEB_PORT;
}

if (process.env.WEB_NAME) {
  settings.webName = process.env.WEB_PORT;
}

if (process.env.TRUSTED_DOMAINS) {
  settings.trustedDomains = process.env.WEB_PORT;
}

router.get(`/`, function (req, res) {
  if (sk.indexOf("sk") == "-1") {
    settings.enablePay = false;
  }
  //add cors header
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  //return settings.json
  res.json(settings);
});

//To-DO: This route needs to be locked behind some kind of admin system, otherwise anyone could remotely change the panel's settings.

/*
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
    disableAuth: req.body.disableAuth,
    trustedDomains: req.body.trustedDomains,
  };

  //for each setting, if its not blank set it to settings
  for (var setting in req.body) {
    console.log(settings);
    if (keyMatch) {
      //write settings to settings.json
      fs.writeFile(
        "stores/settings.json",
        JSON.stringify(settings),
        function (err) {
          if (err) throw err;
          console.log("File is created successfully.");
        }
      );
    }
    //return settings.json
    res.json(settings);
  }
});
*/
module.exports = router;
