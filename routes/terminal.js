const express = require("express");
const router = express.Router();
const f = require("../scripts/mc.js");

router.get("/", (req, res) => {
  res.send(f.readTerminal(req.headers.id));
});

router.post("/", (req, res) => {
  f.writeTerminal(req.headers.id, req.headers.cmd);
  res.send(req.headers.id, req.headers.cmd);
});

module.exports = router;
