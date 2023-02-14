const express = require("express");
const router = express.Router();
const f = require("../scripts/mc.js");

router.get("/:id", (req, res) => {
  res.send(f.readTerminal(req.params.id));
});

router.post("/:id", (req, res) => {
  console.log("revieved request: " + req.query.cmd);
  f.writeTerminal(req.params.id, req.query.cmd);
  res.send("Success");
});

module.exports = router;
