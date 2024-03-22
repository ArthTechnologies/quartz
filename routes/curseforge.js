const express = require("express");
const Router = express.Router();
const config = require("../scripts/utils.js").getConfig();
const apiKey = config.curseforgeKey;

Router.get("/search", (req, res) => {
  if (apiKey != "") {
    let gameVersion = req.query.version;
    let modLoaderType = req.query.loader;
    let searchFilter = req.query.query;
    let classId = req.query.classId;
    let index = req.query.index || 0;
    let sortField = req.query.sortField || 1;
    let results = [];
    let categories = req.query.categories || "";
    console.log(index);
    const exec = require("child_process").exec;
    exec(
      `curl -X GET "https://api.curseforge.com/v1/mods/search` +
        `?gameId=432` +
        `&gameVersion=${gameVersion}` +
        `&modLoaderType=${modLoaderType}` +
        `&searchFilter=${searchFilter}` +
        `&classId=${classId}` +
        `&index=${index}` +
        `&pageSize=15` +
        `&sortField=${sortField}` +
        `&sortOrder=desc` +
        `&categoryIds=[${categories}]"` +
        ` -H 'x-api-key: ${apiKey}'`,
      (error, stdout, stderr) => {
        if (!error && stdout != undefined) {
          console.log(error + stdout + stderr);
          try {
            res.status(200).json(JSON.parse(stdout));
          } catch {
            res.status(400).json({ msg: "Error parsing JSON." });
          }
        } else {
          res.status(500).json({ msg: "Internal server error." });
        }
      }
    );
  }
});

Router.get("/:id", (req, res) => {
  if (apiKey != "") {
    let id = req.params.id;
    const exec = require("child_process").exec;
    exec(
      `curl -X GET "https://api.curseforge.com/v1/mods/${id}"` +
        ` -H 'x-api-key: ${apiKey}'`,
      (error, stdout, stderr) => {
        console.log(stdout);
        if (!error && stdout != undefined) {
          try {
            res.status(200).json(JSON.parse(stdout).data);
          } catch {
            res.status(400).json({ msg: "Error parsing JSON." });
          }
        } else {
          res.status(500).json({ msg: "Internal server error." });
        }
      }
    );
  }
});

Router.get("/:id/description", (req, res) => {
  if (apiKey != "") {
    let id = req.params.id;
    const exec = require("child_process").exec;
    exec(
      `curl -X GET "https://api.curseforge.com/v1/mods/${id}/description"` +
        ` -H 'x-api-key: ${apiKey}'`,
      (error, stdout, stderr) => {
        if (!error && stdout != undefined) {
          try {
            res.status(200).json(JSON.parse(stdout).data);
          } catch {
            res.status(400).json({ msg: "Error parsing JSON." });
          }
        } else {
          res.status(500).json({ msg: "Internal server error." });
        }
      }
    );
  }
});

Router.get("/:id/versions", (req, res) => {
  if (apiKey != "") {
    let id = req.params.id;
    const exec = require("child_process").exec;
    exec(
      `curl -X GET "https://api.curseforge.com/v1/mods/${id}/files"` +
        ` -H 'x-api-key: ${apiKey}'`,
      (error, stdout, stderr) => {
        if (!error && stdout != undefined) {
          try {
            res.status(200).json(JSON.parse(stdout).data);
          } catch {
            res.status(400).json({ msg: "Error parsing JSON." });
          }
        } else {
          res.status(500).json({ msg: "Internal server error." });
        }
      }
    );
  }
});

Router.get("/:id/version/:versionId/changelog", (req, res) => {
  if (apiKey != "") {
    let id = req.params.id;
    let versionId = req.params.versionId;
    const exec = require("child_process").exec;
    exec(
      `curl -X GET "https://api.curseforge.com/v1/mods/${id}/files/${versionId}/changelog"` +
        ` -H 'x-api-key: ${apiKey}'`,
      (error, stdout, stderr) => {
        if (!error && stdout != undefined) {
          try {
            res.status(200).json(JSON.parse(stdout).data);
          } catch {
            res.status(400).json({ msg: "Error parsing JSON." });
          }
        } else {
          res.status(500).json({ msg: "Internal server error." });
        }
      }
    );
  }
});

Router.get("/:id/version/:versionId/", (req, res) => {
  if (apiKey != "") {
    let id = req.params.id;
    let versionId = req.params.versionId;
    const exec = require("child_process").exec;
    exec(
      `curl -X GET "https://api.curseforge.com/v1/mods/${id}/files/${versionId}/"` +
        ` -H 'x-api-key: ${apiKey}'`,
      (error, stdout, stderr) => {
        if (!error && stdout != undefined) {
          try {
            res.status(200).json(JSON.parse(stdout).data);
          } catch {
            res.status(400).json({ msg: "Error parsing JSON." });
          }
        } else {
          res.status(500).json({ msg: "Internal server error." });
        }
      }
    );
  }
});
module.exports = Router;
