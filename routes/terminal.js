const express = require("express");
const router = express.Router();
const f = require("../scripts/mc.js");
const accounts = require("../accounts.json");

router.get("/:id", (req, res) => {
  email = req.headers.email;
  token = req.headers.token;
  if (token == accounts[email].token) {
  res.send(f.readTerminal(req.params.id));
} else {
  res.status(401).json({ msg: `Invalid credentials.` });
}
});

router.post("/:id", (req, res) => {
  email = req.headers.email;
  token = req.headers.token;
  if (token == accounts[email].token) {
  console.log("revieved request: " + req.query.cmd);
  f.writeTerminal(req.params.id, req.query.cmd);
  res.send("Success");
} else {
  res.status(401).json({ msg: `Invalid credentials.` });
}
});

module.exports = router;
