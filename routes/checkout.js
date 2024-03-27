const express = require("express");
const Router = express.Router();
let stripeKey = require("../scripts/utils.js").getConfig().stripeKey;
const stripe = require("stripe")(stripeKey);
const config = require("../scripts/utils.js").getConfig();

Router.post("/:plan", async (req, res) => {
  let plan = req.params.plan;
  let quantity = req.query.quantity || 1;
  let customer_email = req.query.customer_email || null;
  if (customer_email == "") customer_email = null;
  let currency = req.query.currency || "usd";
  if (currency == "") currency = "usd";
  let locale = req.query.locale || "en";
  if (locale == "") locale = "en";
  if (quantity == undefined) {
    quantity = 1;
  }
  let priceId;
  if (plan == "basic") {
    priceId = config.basicPlanPriceId;
  } else if (plan == "modded") {
    priceId = config.moddedPlanPriceId;
  }
  console.log("Customer Email: "+customer_email);
  try {
  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    ...(customer_email && { customer_email: customer_email }), // This line will only add the customer_email field if it's not null
    currency: currency,
    locale: locale,
    allow_promotion_codes: true,
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
} catch (err) {
  console.log(err);
  res.status(500).send({ error: err });
}
});

module.exports = Router;
