const express = require("express");
const Router = express.Router();
const config = require("../scripts/config.js").getConfig();
const apiKey = config.curseforgeKey;

Router.get("/search", (req, res) => {
  if (apiKey != undefined) {
    let gameVersion = req.query.version;
    let modLoaderType = req.query.loader;
    let searchFilter = req.query.query;
    let classId = req.query.classId;
    let results = [];

    const exec = require("child_process").exec;
    exec(
      `curl -X GET "https://api.curseforge.com/v1/mods/search` +
        `?gameId=432` +
        `&gameVersion=${gameVersion}` +
        `&modLoaderType=${modLoaderType}` +
        `&searchFilter=${searchFilter}` +
        `&classId=${classId}` +
        `&pageSize=10` +
        `&sortField=2` +
        `&sortOrder=desc"` +
        ` -H 'x-api-key: ${apiKey}'`,
      (error, stdout, stderr) => {
        if (!error && stdout != undefined) {
          res.status(200).json(JSON.parse(stdout));
        } else {
          res.status(500).json({ msg: "Internal server error." });
        }
      }
    );
  }
});

Router.get("/:id", (req, res) => {
  if (apiKey != undefined) {
    let id = req.params.id;
    const exec = require("child_process").exec;
    exec(
      `curl -X GET "https://api.curseforge.com/v1/mods/${id}"` +
        ` -H 'x-api-key: ${apiKey}'`,
      (error, stdout, stderr) => {
        console.log(stdout);
        if (
          !error &&
          stdout != undefined &&
          JSON.parse(stdout).data != undefined
        ) {
          res.status(200).json(JSON.parse(stdout).data);
        } else {
          res.status(500).json({ msg: "Internal server error." });
        }
      }
    );
  }
});

Router.get("/:id/description", (req, res) => {
  if (apiKey != undefined) {
    let id = req.params.id;
    const exec = require("child_process").exec;
    exec(
      `curl -X GET "https://api.curseforge.com/v1/mods/${id}/description"` +
        ` -H 'x-api-key: ${apiKey}'`,
      (error, stdout, stderr) => {
        if (
          !error &&
          stdout != undefined &&
          JSON.parse(stdout).data != undefined
        ) {
          res.status(200).json(JSON.parse(stdout).data);
        } else {
          res.status(500).json({ msg: "Internal server error." });
        }
      }
    );
  }
});
module.exports = Router;
