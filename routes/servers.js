const express = require("express");
const router = express.Router();
const fs = require("fs");
let email = "";

const f = require("../scripts/mc.js");
const files = require("../scripts/files.js");
const config = require("../scripts/utils.js").getConfig();
const getJSON = require("../scripts/utils.js").getJSON;
const enableAuth = JSON.parse(config.enableAuth);
const stripeKey = config.stripeKey;
const stripe = require("stripe")(stripeKey);

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

router.get(`/subscriptions`, function (req, res) {
  email = req.headers.username;
  token = req.headers.token;
  account = getJSON(`accounts/${email}.json`);
  if (!enableAuth) email = "noemail";
  if (token === account.token || !enableAuth) {
    stripe.customers.list(
      {
        limit: 100,
        email: account.email,
      },
      function (err, customers) {
        if (err) {
          console.log("err", err);
        } else {
          cid = customers.data[0].id;

          //check the customer's subscriptions and return it
          stripe.subscriptions.list(
            {
              customer: cid,
              limit: 100,
            },
            function (err, subscriptions2) {
              let moddedSubscriptions = 0;
              let basicSubscriptions = 0;
              let subscriptions = 0;

              for (i in subscriptions2.data) {
                if (config.moddedPlanPriceId != "") {
                  if (
                    subscriptions2.data[i].plan.id == config.moddedPlanPriceId
                  ) {
                    moddedSubscriptions++;
                    subscriptions++;
                  } else if (
                    subscriptions2.data[i].plan.id == config.basicPlanPriceId
                  ) {
                    basicSubscriptions++;
                    subscriptions++;
                  }
                } else {
                  subscriptions++;
                }
              }
              res.status(200).json({
                moddedSubscriptions: moddedSubscriptions,
                basicSubscriptions: basicSubscriptions,
                subscriptions: subscriptions,
                freeServers: account.freeServers,
              });
            }
          );
        }
      }
    );
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
