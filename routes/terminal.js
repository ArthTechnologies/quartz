const express = require("express");
const router = express.Router();
const f = require("../scripts/mc.js");
const enableAuth = require("../scripts/config.js").getConfig().enableAuth;

router.get("/:id", (req, res) => {
  email = req.headers.email;
  token = req.headers.token;
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (hasAccess(token,account)) {
    res.send(f.readTerminal(req.params.id));
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

router.post("/:id", (req, res) => {
  email = req.headers.email;
  token = req.headers.token;
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (hasAccess(token,account)) {
    console.log("revieved request: " + req.query.cmd);
    f.writeTerminal(req.params.id, req.query.cmd);
    res.send("Success");

  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

function hasAccess(token,account) {
  if (!enableAuth) return true;
  else return token === account.token && server.accountId == account.accountId;
}

module.exports = router;
