//stripekey is stripe.key from lib/store.json

let stripekey = require("../lib/store.json").stripekey;
const stripe = require("stripe")(stripekey);
const express = require("express");

function getCustomerID(email) {
  stripe.customers.list(
    {
      limit: 100,
      email: email,
    },
    function (err, customers) {
      if (err) {
        console.log(err);
        return "no";
      } else {
        if (customers.data.length > 0) {
          const customer_id = customers.data[0].id;
          console.log(customer_id);
          return true;
        } else {
          console.log("No customers found.");
          return false;
        }
      }
    }
  );
}

function checkSubscription(email) {
  const cid = getCustomerID(email);

  //wait 5 seconds
  setTimeout(function () {
    console.log("waiting");

    stripe.subscriptions.list({ customer: cid }, function (err, subscriptions) {
      console.log("customer: " + JSON.stringify(subscriptions.data[0]));
      if (err) {
        console.log(err);
      } else {
        if (subscriptions.data[0].id.length > 0) {
          console.log("Subscribed: " + subscriptions.data[0].id);
          return subscriptions;
        } else {
          console.log("Not subscribed");
          return subscriptions;
        }
      }
    });
  }, 5000);
}
module.exports = { getCustomerID, checkSubscription };
