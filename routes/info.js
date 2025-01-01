const express = require("express");
const router = express.Router();
const fs = require("fs");
let email = "";

const f = require("../scripts/mc.js");
const files = require("../scripts/files.js");
const config = require("../scripts/utils.js").getConfig();
const readJSON = require("../scripts/utils.js").readJSON;
const enableAuth = JSON.parse(config.enableAuth);
const stripeKey = config.stripeKey;
const stripe = require("stripe")(stripeKey);

router.get(`/servers`, function (req, res) {
  email = req.headers.username;
  token = req.headers.token;

  if (!enableAuth) email = "noemail";
  //prevents a crash that has occurred
  if (email != undefined) {
    account = readJSON(`accounts/${email}.json`);
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
  
        account.servers[i] = parseInt(account.servers[i]);
      if (fs.existsSync(`servers/${account.servers[i]}/server.json`)) {
        account.servers[i] = readJSON(
          `servers/${account.servers[i]}/server.json`
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
  account = readJSON(`accounts/${email}.json`);
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
          if (customers.data.length == 0) {
            res.status(200).json({
              moddedSubscriptions: 0,
              basicSubscriptions: 0,
              subscriptions: 0,
              freeServers: account.freeServers,
            });
            return;
          }
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
              let premiumSubscriptions = 0;
              let subscriptions = 0;

              for (i in subscriptions2.data) {
                let plan = subscriptions2.data[i].items.data[0].plan;
                if (config.premium != "") {
                  if (config.premium == plan.product) {
                    premiumSubscriptions++;
                    subscriptions++;
                  } else if (config.plus == plan.product) {
                    moddedSubscriptions++;
                    subscriptions++;
                  } else if (config.basic == plan.product) {
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
                premiumSubscriptions: premiumSubscriptions,
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
  returnObject["enableVirusScan"] = config.enableVirusScan;
  returnObject["enableCloudflareVerify"] = config.enableCloudflareVerify;
  returnObject["cloudflareVerifySiteKey"] = config.cloudflareVerifySiteKey;
  returnObject["enableDeepL"] =
    config.deeplKey != "" && config.deeplKey != null;
  for (var key in readJSON("assets/data.json")) {
    returnObject[key] = readJSON("assets/data.json")[key];
  }
  res.json(returnObject);
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
  //sort
  returnArray = sortFiles(returnArray);
  //reverse
  returnArray.reverse();
  res.status(200).json(returnArray);
});

function sortFiles(files) {
  return files.sort((a, b) => {
      const regex = /([a-zA-Z]+)-(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:\*(\w+))?\.jar|\.zip/;
      const matchA = a.match(regex);
      const matchB = b.match(regex);
      
      const nameA = matchA ? matchA[1] : a;
      const versionA = matchA ? [parseInt(matchA[2]), matchA[3] ? parseInt(matchA[3]) : 0, matchA[4] ? parseInt(matchA[4]) : 0] : [0, 0, 0];
      const preA = matchA ? matchA[5] || '' : '';

      const nameB = matchB ? matchB[1] : b;
      const versionB = matchB ? [parseInt(matchB[2]), matchB[3] ? parseInt(matchB[3]) : 0, matchB[4] ? parseInt(matchB[4]) : 0] : [0, 0, 0];
      const preB = matchB ? matchB[5] || '' : '';

      if (nameA !== nameB && nameA != undefined && nameB != undefined) return nameA.localeCompare(nameB);
      for (let i = 0; i < 3; i++) {
          if (versionA[i] !== versionB[i]) return versionA[i] - versionB[i];
      }
      return preA.localeCompare(preB);
  });
}



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

router.get(`/capacity`, function (req, res) {
  let maxServers = parseInt(config.maxServers);
  let numServers = 0;
  let folders = [];
  fs.readdirSync("servers").forEach((file) => {
    if (fs.existsSync(`servers/${file}/server.json`)) {
      try {
        if (!readJSON(`servers/${file}/server.json`).adminServer) {
          numServers++;
          folders.push(file + ":normal");
        } else {
          folders.push(file + ":admin");
        }
      } catch (e) {
        console.log(e);
        folders.push(file + ":error");
      }
    } else {
      let foundOwner = false;
      try {
        for (i in fs.readdirSync(`accounts`)) {
          if (
            readJSON(
              `accounts/${fs.readdirSync(`accounts`)[i]}`
            ).servers.includes(file)
          ) {
            folders.push(file + ":normal");
            foundOwner = true;
            break;
          }
        }
      } catch (e) {}
      if (!foundOwner) {
        folders.push(file + ":error");
      }
      numServers++;
    }
  });
  console.log("numServers:" + numServers);
  res.status(200).json({
    atCapacity: numServers >= maxServers,
    numServers: numServers,
    maxServers: maxServers,
    folders: folders,
  });
});

router.get(`/accounts`, function (req, res) {
  let forwardingPinReq = req.query.forwardingPin;
  let forwardingPinConfig = config.forwardingPin;
  if (forwardingPinReq == forwardingPinConfig) {
    let accounts =[];
    let accountsTsv = fs.readFileSync("accounts.tsv", "utf8");
    for (let line of accountsTsv.split("\n")) {
      let username = line.split("\t")[1];
      let servers = line.split("\t")[3];
      accounts.push(username + ":" + servers);
    }
    res.status(200).send(accounts);
  } else {
    res.status(401).send(undefined);
  }
});

module.exports = router;
