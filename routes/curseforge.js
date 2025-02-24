const express = require("express");
const Router = express.Router();
const config = require("../scripts/utils.js").getConfig();
const apiKey = config.curseforgeKey;

Router.get("/search", (req, res) => {
  if (apiKey != "") {
    let gameVersion = req.query.version;
    if (gameVersion.includes(".0")) {
      gameVersion = gameVersion.replace(".0", "");
    }
    let modLoaderType = req.query.loader;

    if (typeof modLoaderType != "number") {
      if (modLoaderType == "forge") {
        modLoaderType = 1;
      } else if (modLoaderType == "fabric") {
        modLoaderType = 4;
      } else if (modLoaderType == "neoforge") {
        modLoaderType = 6;
      } 
    }
    let filterText = req.query.query;
    let classId = req.query.classId;
    let index = req.query.index || 0;
    let sortField = req.query.sortField || 1;
    let results = [];
    let categories = req.query.categories || "";

    const exec = require("child_process").exec;

    console.log(`curseforge request ?gameId=432&gameVersion=${gameVersion}&modLoaderType=${modLoaderType}&searchFilter=${filterText}&classId=${classId}&index=${index}&pageSize=15&sortField=${sortField}&sortOrder=desc&categoryIds=${categories}`);

    exec(
      `curl -X GET "https://api.curseforge.com/v1/mods/search` +
        `?gameId=432` +
        `&gameVersion=${gameVersion}` +
        `&modLoaderType=${modLoaderType}` +
        `&searchFilter=${filterText}` +
        `&classId=${classId}` +
        `&index=${index}` +
        `&pageSize=15` +
        `&sortField=${sortField}` +
        `&sortOrder=desc` +
        `&categoryIds=${categories}"` +
        ` -H 'x-api-key: ${apiKey}'`,
      (error, stdout, stderr) => {
        if (!error && stdout != undefined) {
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
    let indexString = "";
    if (req.query.index != undefined) {
      indexString = "?index=" + req.query.index;
    }
    const exec = require("child_process").exec;
    exec(
      `curl -X GET "https://api.curseforge.com/v1/mods/${id}/files${indexString}"` +
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
