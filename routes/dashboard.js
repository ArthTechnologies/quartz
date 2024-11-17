const express = require("express");
const Router = express.Router();
let stripeKey = require("../scripts/utils.js").getConfig().stripeKey;
const stripe = require("stripe")(stripeKey);
const config = require("../scripts/utils.js").getConfig();
const utils = require("../scripts/utils.js");
const files = require("../scripts/files.js");

Router.get("/verifyToken", (req, res) => {
  let tempToken = req.query.tempToken;
  try {
    const datajson = utils.readJSON("assets/data.json");
    if (datajson.tempToken.split(":")[1] == tempToken) {
      res.status(200).send({ success: true });
    } else {
      res.status(200).send({ success: false });
    }
  } catch (error) {
    res.status(500).send({ error: error });
  }
});

Router.get("/account/:accountId", async (req, res) => {
  let tempToken = req.query.tempToken;
  if (tempToken == utils.readJSON("assets/data.json").tempToken.split(":")[1]) {
    let accountsFolder = fs.readdirSync("accounts");
    console.log("finding account for " + req.params.accountId);
    for (let i in accountsFolder) {
      try {
        let account = utils.readJSON(`accounts/${accountsFolder[i]}`);
        if (account.accountId == req.params.accountId) {
          let accountSend = {};
          accountSend.accountId = account.accountId;
          accountSend.name = accountsFolder[i].split(".json")[0];
          accountSend.email = account.email;
          accountSend.resetAttempts = account.resetAttempts;
          accountSend.type = account.type;
          accountSend.servers = account.servers;
          accountSend.freeServers = account.freeServers;
          accountSend.lastSignIn = account.lastSignIn;
          res.status(200).send(accountSend);
          return;
        }
      } catch (error) {
        console.log(error);
      }
    }
  } else {
    res.status(401).send({ error: "Unauthorized" });
  }
});

Router.get("/customers", async (req, res) => {
  const datajson = utils.readJSON("assets/data.json");
  if (req.query.tempToken != datajson.tempToken.split(":")[1]) {
    res.status(401).send({ error: "Unauthorized" });
  } else {
    const customers = await stripe.customers.list({ limit: 100 });
    let data = [];
    for (let i = 0; i < customers.data.length; i++) {
      let str = customers.data[i];
      let valid = true;
      let subs;
      //get the scription object from stripe
      try {
        subs = await stripe.subscriptions.list({
          customer: str.id,
          status: "all",
        });

        subs = subs.data;
      } catch (error) {
        console.log(error);
      }

      let subscriptions = [];

      for (let j = 0; j < subs.length; j++) {
        let data = subs[j];
        let plan = subs[j].items.data[0].plan;

        let planType = "other";
        if (config.basic == plan.product) planType = "basic";
        else if (config.modded == plan.product) planType = "modded";
        else if (config.premium == plan.product) planType = "premium";
        else valid = false;

        if (planType != "other") {
          if (data.status == "active") {
            if (data.cancel_at != null) {
              let reason = data.cancellation_details.comment;
              if (reason == null) reason = data.cancellation_details.feedback;
              subscriptions.push(
                planType + ":canceled:" + data.cancel_at + ":" + reason
              );
            } else {
              subscriptions.push(planType + ":active");
            }
          } else if (data.status == "canceled") {
            subscriptions.push(
              planType +
                ":canceled:" +
                data.canceled_at +
                ":" +
                data.cancellation_details.comment
            );
          } else {
            subscriptions.push(
              planType + ":" + data.status + ":" + data.ended_at
            );
          }
        }
      }

      let qua;
      let quaName;
      if (fs.existsSync("accounts/email:" + str.email + ".json")) {
        qua = utils.readJSON("accounts/email:" + str.email + ".json");
      } else {
        let accounts = fs.readdirSync("accounts");
        for (let j in accounts) {
          if (accounts[j].split(":")[0] != "email") {
            let json = utils.readJSON("accounts/" + accounts[j]);
            if (json.email == str.email.toLowerCase()) {
              qua = json;
              quaName = accounts[j];
              break;
            }
          }
        }
      }
      if (qua == undefined) {
        qua = {
          servers: [],
        };
      }
      if (valid && subscriptions.length > 0) {
        let customerData = [
          {
            email: str.email,
            subscriptions: subscriptions,
          },
        ];
        try {
          customerData.push({
            servers: qua.servers,
            id: quaName,
          });
        } catch {}

        data.push(customerData);
      }
    }

    res.status(200).send(data);
  }
});

const { execSync } = require("child_process");
Router.get("/servers", async (req, res) => {
  const datajson = utils.readJSON("assets/data.json");
  if (req.query.tempToken != datajson.tempToken.split(":")[1]) {
    res.status(401).send({ error: "Unauthorized" });
  } else {
    let servers = fs.readdirSync("servers");
    let data = [];
    for (let i in servers) {
      let owner = null;
      let email = null;
      try {
        const serverId = servers[i];
        let storage = 0;

        try {
          storage = files.folderSizeRecursive("servers/" + serverId);
        } catch (e) {
          console.log(e);
        }
        if (fs.existsSync(`servers/${serverId}/server.json`)) {
          let json = utils.readJSON(`servers/${serverId}/server.json`);
          if (json.adminServer == undefined || json.adminServer == false) {
            const accountId = json.accountId;
            fs.readdirSync("accounts").forEach((file) => {
              const account = utils.readJSON(`accounts/${file}`);
              if (account.accountId == accountId) {
                owner = file;
                if (!file.includes("email:")) email = account.email;
                data.push({
                  serverId: servers[i],
                  owner: owner,
                  email: email,
                  storage: storage,
                });
              }
            });
          }
        } else {
          fs.readdirSync("accounts").forEach((file) => {
            try {
              let account = utils.readJSON(`accounts/${file}`);

              if (
                account.servers.includes(serverId) ||
                account.servers.includes(parseInt(serverId))
              ) {
                owner = file + "?";
                if (!file.includes("email:")) email = account.email + "?";

                data.push({
                  serverId: servers[i],
                  owner: owner,
                  email: email,
                  storage: storage,
                });
              }
            } catch (error) {
              console.log("error scanning account " + file);
              console.log(error);
              data = [];
            }
          });
        }
      } catch {
        console.log("error getting server owner");
      }
    }
    res.status(200).send(data);
  }
});

Router.post("/freeExpiredServer", async (req, res) => {
  const datajson = utils.readJSON("assets/data.json");
  if (req.query.tempToken != datajson.tempToken.split(":")[1]) {
    res.status(401).send({ error: "Unauthorized" });
  } else {
    try {
      let serverId = req.query.serverId;
      let owner = req.query.owner;
      let account = utils.readJSON(`accounts/${owner}.json`);
      let servers = account.servers;
      let newServers = [];
      for (let i in servers) {
        if (servers[i] != serverId && servers[i] != parseInt(serverId)) {
          newServers.push(servers[i]);
        }
      }
      account.servers = newServers;
      utils.writeJSON(`accounts/${owner}`, account);
      utils.removeDirectoryRecursiveAsync(`servers/${serverId}`);
      res.status(200).send({ success: true });
    } catch (error) {
      res.status(500).send({ error: error });
    }
  }
});
module.exports = Router;
