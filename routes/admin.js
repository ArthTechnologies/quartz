const express = require("express");
const router = express.Router();
const fs = require("fs");
const { readJSON } = require("../scripts/utils.js");

router.get("/", (req, res) => {
  res.json({
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    versions: process.versions
  });
});

module.exports = router;