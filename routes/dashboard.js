const express = require("express");
const Router = express.Router();
let stripeKey = require("../scripts/utils.js").getConfig().stripeKey;
const stripe = require("stripe")(stripeKey);
const config = require("../scripts/utils.js").getConfig();
const utils = require("../scripts/utils.js");

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

Router.get("/customers", async (req, res) => {
  const datajson = utils.readJSON("assets/data.json");
  if (req.query.tempToken != datajson.tempToken.split(":")[1]) {
    res.status(401).send({ error: "Unauthorized" });
  } else {
    const customers = await stripe.customers.list();
    let data = [];
    for (let i = 0; i < customers.data.length; i++) {
      let str = customers.data[i];

      let subs;
      //get the scription object from stripe
      try {
        subs = await stripe.subscriptions.list({ customer: str.id });

        subs = subs.data;
      } catch (error) {
        console.log(error);
      }

      let subscriptions = [];
      console.log(subs);
      for (let j = 0; j < subs.length; j++) {
        let plan = subs[j].items.data[0].plan;
        console.log(plan);

        if (plan.id == config.basicPlanPriceId) {
          if (plan.active) {
            if (plan.cancel_at != null) {
              subscriptions.push(
                "basic:cancelled:" +
                  plan.cancel_at +
                  ":" +
                  plan.cancellation_details.feedback
              );
            } else {
              subscriptions.push("basic:active");
            }
          } else {
            subscriptions.push("basic:inactive");
          }
        }
        if (plan.id == config.moddedPlanPriceId) {
          if (plan.active) {
            if (plan.cancel_at != null) {
              subscriptions.push(
                "modded:cancelled:" +
                  plan.cancel_at +
                  ":" +
                  plan.cancellation_details.feedback
              );
            } else {
              subscriptions.push("modded:active");
            }
          } else {
            subscriptions.push("modded:inactive");
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
            if (json.email == str.email) {
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

    res.status(200).send(data);
  }
});

module.exports = Router;
