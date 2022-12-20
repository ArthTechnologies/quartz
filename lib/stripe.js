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
      } else {
        if (customers.data.length > 0) {
          const customer_id = customers.data[0].id;
          console.log(customer_id);
        } else {
          console.log("No customers found.");
        }
      }
    }
  );
}

module.exports = { getCustomerID };
