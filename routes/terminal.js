const express = require("express");
const router = express.Router();
const f = require("../scripts/mc.js");

router.get("/:id", (req, res) => {
  email = req.headers.email;
  token = req.headers.token;
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (token === account.token && server.accountId == account.accountId) {
    res.send(f.readTerminal(31));
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

router.post("/:id", (req, res) => {
  email = req.headers.email;
  token = req.headers.token;
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (token === account.token && server.accountId == account.accountId) {
    console.log("revieved request: " + req.query.cmd);
    f.writeTerminal(req.params.id, req.query.cmd);
    res.send("Success");
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

module.exports = router;
