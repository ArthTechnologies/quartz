const express = require("express");
const Router = express.Router();
let stripeKey = require("../scripts/config.js").getConfig().stripeKey;
const stripe = require("stripe")(stripeKey);
const config = require("../scripts/config.js").getConfig();

Router.post("/:plan", async (req, res) => {
  let plan = req.params.plan;
  let quantity = req.query.quantity;
  if (quantity == undefined) {
    quantity = 1;
  }
  let priceId;
  if (plan == "basic") {
    priceId = config.basicPlanPriceId;
  } else if (plan == "modded") {
    priceId = config.moddedPlanPriceId;
  }

  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    line_items: [
      {
        // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
        price: priceId,
        quantity: quantity,
      },
    ],
    mode: "subscription",
    return_url: config.stripeReturnUrl,
    automatic_tax: { enabled: true },
  });

  res.send({ clientSecret: session.client_secret });
});

module.exports = Router;
