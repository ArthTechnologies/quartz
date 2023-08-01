const express = require("express");
const Router = express.Router();
const fs = require("fs");
const settings = require("../stores/settings.json");

Router.get("/", (req, res) => {
  res.send.json({
    maxServers: settings,
    numServer: Object.keys(settings).length - 1,
  });
});

module.exports = Router;
