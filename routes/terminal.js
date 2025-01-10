const express = require("express");
const router = express.Router();
const f = require("../scripts/mc.js");
const config = require("../scripts/utils.js").getConfig();
const readJSON = require("../scripts/utils.js").readJSON;
const enableAuth = JSON.parse(config.enableAuth);
router.get("/:id", (req, res) => {
  email = req.headers.username;
  token = req.headers.token;
  account = readJSON("accounts/" + email + ".json");
  server = readJSON("servers/" + req.params.id + "/server.json");
  if (hasAccess(token, account, req.params.id)) {
    res.send(f.readTerminal(req.params.id));
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

router.post("/:id", (req, res) => {
  email = req.headers.username;
  token = req.headers.token;
  account = readJSON("accounts/" + email + ".json");
  server = readJSON("servers/" + req.params.id + "/server.json");
  if (hasAccess(token, account, req.params.id)) {
    console.log("revieved request: " + req.query.cmd);
    f.writeTerminal(req.params.id, req.query.cmd);
    res.send("Success");
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

function hasAccess(token, account, id) {
  let server = readJSON(`servers/${id}/server.json`);
  if (!enableAuth) return true;
  let accountOwner = token === account.token;
  let serverOwner = server.accountId == account.accountId;
  let allowedAccount  = false;
  if (server.allowedAccounts !== undefined) {
    allowedAccount = server.allowedAccounts.includes(account.accountId);
  }

  return accountOwner && (serverOwner || allowedAccount);
}


module.exports = router;
