let stripeKey = require("./config.js").getConfig().stripeKey;
const stripe = require("stripe")(stripeKey);
const express = require("express");

async function getCustomerID(email) {
  try {
    const customers = await stripe.customers.list({ limit: 100, email: email });
    if (customers.data.length > 0) {
      const customer_id = customers.data[0].id;
      console.log(customer_id);
      return customer_id;
    } else {
      console.log("No customers found.");
      return null;
    }
  } catch (err) {
    console.log(err);
    return null;
  }
}

function checkSubscription(email) {
  const cid = getCustomerID(email);

  //wait 5 seconds
  setTimeout(function () {
    console.log("waiting");

    stripe.subscriptions.list({ customer: cid }, function (err, subscriptions) {
    
      if (err) {
        console.log(err);
      } else {
        if (
          subscriptions.data[0] != undefined &&
          subscriptions.data[0].id.length > 0
        ) {
          console.log("Subscribed: " + subscriptions.data[0].id);
          return subscriptions;
        } else {
          if (subscriptions.data[0] != undefined) {
            console.log(subscriptions.data);
          }
          console.log("Not subscribed");
          return subscriptions;
        }
      }
    });
  }, 5000);
}
//get the last 4 digits of customer's card ( )
async function getCreditId(email) {
  const cid = await getCustomerID(email);
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: cid,
      type: "card",
    });
    return paymentMethods.data[0].card.last4;
  } catch (err) {
    console.log("Error retrieving customer payment method:", err);
    return null;
  }
}

module.exports = { getCustomerID, checkSubscription, getCreditId };
