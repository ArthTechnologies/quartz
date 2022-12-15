const express = require("express");
const router = express.Router();
let techname;

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
  state = req.headers.request;
  if ((state == "start") | (state == "stop") | (state == "restart")) {
    res.status(202).json({ msg: `Success. Server will ${state}.` });
    console.log(req.headers.request);
  } else {
    res
      .status(404)
      .json({ msg: `Invalid state. Valid states are start, stop, & restart.` });
  }
});

router.post(`/new`, function (req, res) {
  var fs = require("fs");

  //add cors header
  res.header("Access-Control-Allow-Origin", "*");

  var id = 0;
  //set id to a uuid
  var uuid = require("uuid");
  id = uuid.v4();
  console.log(id);
  var fs = require("fs");
  em = req.body.email;
  console.log(em);
  var store =
    req.body.name +
    "," +
    req.body.software +
    "," +
    req.body.version +
    "," +
    em +
    "," +
    id +
    "\n";

  console.log(store);
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

  res.status(202).json({ msg: `Request recieved.` });
});

module.exports = router;