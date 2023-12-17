const express = require("express");
const Router = express.Router();
let stripeKey = require("../scripts/config.js").getConfig().stripeKey;
const stripe = require("stripe")(stripeKey);

Router.post("/:plan", async (req, res) => {
  let plan = req.params.plan;
  let quantity = req.query.quantity;
  if (quantity == undefined) {
    quantity = 1;
  }
  let priceId;
  if (plan == "basic") {
    priceId = "price_1OLajDJYPXquzaSzCMWB6bxH";
  } else if (plan == "modded") {
    priceId = "price_1OLaahJYPXquzaSzTKOn08Rn";
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
    return_url: `https://servers.arthmc.xyz/subscription-success`,
    automatic_tax: { enabled: true },
  });

  res.send({ clientSecret: session.client_secret });
});

Router.post("/intent/:plan", async (req, res) => {
  let plan = req.params.plan;
  let quantity = req.query.quantity;
  if (quantity == undefined) {
    quantity = 1;
  }
  let priceId;
  if (plan == "basic") {
    priceId = "price_1OLajDJYPXquzaSzCMWB6bxH";
  } else if (plan == "modded") {
    priceId = "price_1OLaahJYPXquzaSzTKOn08Rn";
  }

  const { items } = req.body;

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(items),
    currency: "usd",
    // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});
module.exports = Router;
