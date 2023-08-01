const express = require("express");
const Router = express.Router();
const fs = require("fs");
const settings = require("../stores/settings.json");
const data = require("../stores/data.json");

Router.get("/", (req, res) => {
  res.status(200).json({
    maxServers: settings.maxServers,
    numServers: data.numServers,
  });
});

module.exports = Router;
