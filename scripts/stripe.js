//stripekey is stripe.key from lib/store.json

let stripekey = require("./store.json").stripekey;
const stripe = require("stripe")(stripekey);
const express = require("express");

async function getCustomerID(email) {
  let ret;
  let ret2;
  stripe.customers
    .list(
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
            ret = true;
          } else {
            console.log("No customers found.");
            ret = false;
          }
        }
      }
    )
    .then(function () {
      ret2 = true;
      console.log("response received");
    });

  setTimeout(function () {
    if (ret2) {
      console.log("hi");
      return ret;
    }
  }, 1000);
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
