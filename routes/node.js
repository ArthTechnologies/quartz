const express = require("express");
const Router = express.Router();
const fs = require("fs");
const settings = require("../stores/settings.json");

Router.get("/", (req, res) => {
  res.status(200).json({
    maxServers: settings.maxServers,
    numServer: Object.keys(settings).length - 1,
  });
});

module.exports = Router;
