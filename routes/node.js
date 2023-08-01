const express = require("express");
const Router = express.Router();
const fs = require("fs");
const settings = require("../stores/settings.json");
const servers = require("../servers.json");

Router.get("/", (req, res) => {
  res.status(200).json({
    maxServers: settings.maxServers,
    numServers: Object.keys(servers).length - 1,
  });
});

module.exports = Router;
