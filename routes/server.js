const express = require("express");
const router = express.Router();
let techname;
const f = require("./lib.js");

const fs = require("fs");

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
  if ((state == "start") | (state == "stop") | (state == "restart")) {
    res.status(202).json({ msg: `Success. Server will ${state}.` });
    switch (state) {
      case "start":
        f.run(id);
        break;
      default:
        console.log("Invalid state.");
    }
    console.log(req.headers.request);
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

  console.log(store);

  //scan servers.csv for req.body.name and if it exists, return 409

  let servers = fs.readFileSync("servers.csv").toString();
  console.log(req.body.name + servers);
  console.log(servers.indexOf("Arth"));
  if (servers.indexOf(req.body.name) > -1) {
    res.status(409).json({ msg: `Server name already exists.` });
  } else {
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
    f.run(id, req.body.software);

    res.status(202).json({ msg: `Request recieved.` });
  }
});

module.exports = router;
