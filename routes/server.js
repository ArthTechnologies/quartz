const express = require("express");
const router = express.Router();
let techname;
const f = require("../lib/mc.js");
const s = require("../lib/stripe.js");

const fs = require("fs");

let stripekey = require("../lib/store.json").stripekey;
const stripe = require("stripe")(stripekey);

let name = "MySurvival Server";
router.post(`/`, function (req, res) {
  //add cors header
  res.header("Access-Control-Allow-Origin", "*");
  techname = req.headers.techname;
  res.status(200).json({
    server_technical_name: `${techname}`,
    server_name: `${name}`,
    server_status: `online`,
    version: `1.16.5`,
    software: `paper`,
  });
  console.log(req.headers.techname);
});
router.get(`/change-state`, function (req, res) {
  state = req.headers.state;
  id = req.headers.id;
  em = req.headers.email;
  console.log(s.getCustomerID(em));
  if ((state == "start") | (state == "stop") | (state == "restart")) {
    switch (state) {
      case "start":
        f.run(id, undefined, undefined, undefined, undefined, em, false);
        break;
      case "stop":
        f.stop(id);
        break;
      case "restart":
        f.stop(id);
        //wait 5 seconds
        setTimeout(function () {
          f.run(id, undefined, undefined, undefined, undefined, em, false);
        }, 5000);
        break;
      default:
        console.log("Invalid state.");
    }
    console.log(req.headers.request);
    res.status(202).json({ msg: `Success. Server will ${state}.` });
  } else {
    res
      .status(404)
      .json({ msg: `Invalid state. Valid states are start, stop, & restart.` });
  }
});

router.post(`/new`, function (req, res) {
  //add cors header
  res.header("Access-Control-Allow-Origin", "*");

  //set id to the number of the last line in servers.csv
  var id = fs.readFileSync("servers.csv").toString().split("\n").length - 1;

  em = req.body.email;
  console.log(em);
  var store =
    req.body.name +
    "," +
    req.body.software +
    "," +
    req.body.version +
    "," +
    "[" +
    req.body.addons +
    "]" +
    "," +
    em +
    "\n";

  let xx;
  stripe.customers.list(
    {
      limit: 100,
      email: em,
    },
    function (err, customers) {
      if (err) {
        console.log(err);
        return "no";
      } else {
        if (customers.data.length > 0) {
          const customer_id = customers.data[0].id;
          console.log(customer_id);
          let servers = fs.readFileSync("servers.csv").toString();
          console.log(req.body);
          console.log(servers.indexOf("Arth"));
          if (servers.indexOf(req.body.name) > -1) {
            res.status(409).json({ msg: `Server name already exists.` });
          } else {
            console.log("creating server");
            if (
              em !== "noemail" &&
              req.body.software !== "undefined" &&
              req.body.version !== "undefined" &&
              req.body.name !== "undefined"
            ) {
              fs.appendFile("servers.csv", store, function (err) {
                if (err) {
                  // append failed
                  console.log("failed to write to file.");
                } else {
                  // done
                  console.log("written to file.");
                }
              });
            }

            f.run(
              id,
              req.body.software,
              req.body.version,
              req.body.addons,
              req.body.cmd,
              undefined,
              true
            );
          }
          res.status(202).json({ msg: `Request recieved.` });
        } else {
          console.log("No customers found.");

          res.status(404).json({ msg: `Invalid email.` });
        }
      }
    }
  );
});

module.exports = router;
