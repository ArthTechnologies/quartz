const express = require("express");
const Router = express.Router();
let stripeKey = require("../scripts/utils.js").getConfig().stripeKey;
const stripe = require("stripe")(stripeKey);
const config = require("../scripts/utils.js").getConfig();

Router.post("/:plan", async (req, res) => {
  let plan = req.params.plan;
  let quantity = req.query.quantity || 1;
  let customer_email = req.query.customer_email || null;
  let currency = req.query.currency || "usd";
  let locale = req.query.locale || "en";
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
    customer_email: customer_email,
    currency: currency,
    locale: locale,
    allow_promo_codes: true,
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
