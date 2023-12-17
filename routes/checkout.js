const express = require("express");
const Router = express.Router();
let stripeKey = require("../scripts/config.js").getConfig().stripeKey;
const stripe = require("stripe")(stripeKey);

Router.post("/:plan", async (req, res) => {
  let plan = req.params.plan;
  let quantity = req.query.quantity;
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

Router.get("/status", async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);

  res.send({
    status: session.status,
    customer_email: session.customer_details.email,
  });
});

module.exports = Router;
