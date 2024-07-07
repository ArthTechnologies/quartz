const express = require("express");
const Router = express.Router();
let stripeKey = require("../scripts/utils.js").getConfig().stripeKey;
const stripe = require("stripe")(stripeKey);
const config = require("../scripts/utils.js").getConfig();
const utils = require("../scripts/utils.js");

Router.get("/verifyToken", (req, res) => {
  let tempToken = req.query.tempToken;
  try {
    const datajson = utils.readJSON("data.json");
    if (datajson.tempToken.split(":")[1] == tempToken) {
      res.status(200).send({ successs: true });
    } else {
      res.status(200).send({ success: false });
    }
  } catch (error) {
    res.status(500).send({ error: error });
  }
});
