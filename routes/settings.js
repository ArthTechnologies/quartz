const express = require("express");
const router = express.Router();
const fs = require("fs");
const config = require("../scripts/config.js").getConfig();

if (process.env.SERVERS_PER_USER) {
  config.serversPerUser = process.env.WEB_PORT;
}
if (process.env.BROWSER_TITLE) {
  config.browserTitle = process.env.WEB_PORT;
}

if (process.env.WEB_NAME) {
  config.webName = process.env.WEB_PORT;
}

if (process.env.TRUSTED_DOMAINS) {
  config.trustedDomains = process.env.WEB_PORT;
}

router.get(`/`, function (req, res) {
  //add cors header
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  let returnObject = {};
  //add every non-secret from config and everything from data.json to returnObject
  returnObject["address"] = config.address;
  returnObject["enablePay"] = config.enablePay;
  returnObject["enableAuth"] = config.enableAuth;
  returnObject["maxServers"] = config.maxServers;
  returnObject["serverStorageLimit"] = config.serverStorageLimit;
  for (var key in require("../assets/data.json")) {
    returnObject[key] = require("../assets/data.json")[key];
  }
  res.json(returnObject);
});

//To-DO: This route needs to be locked behind some kind of admin system, otherwise anyone could remotely change the panel's config.

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
      //write settings to config.json
      fs.writeFile(
        "stores/config.json",
        JSON.stringify(settings),
        function (err) {
          if (err) throw err;
          console.log("File is created successfully.");
        }
      );
    }
    //return config.json
    res.json(settings);
  }
});
*/
module.exports = router;
