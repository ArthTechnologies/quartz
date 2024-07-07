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
/*
Router.get("/customers", async (req, res) => {
  try {
    const customers = await stripe.customers.list();
    let data = [];
    for (let i = 0; i < customers.data.length; i++) {
      let str = customers.data[i];
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
        console.log(str);
        let customerData = [
          {
            id: str.id,
            email: str.email,
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
  } catch (error) {
    res.status(500).send({ error: error });
  }
});*/

module.exports = Router;
