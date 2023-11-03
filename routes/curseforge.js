const express = require("express");
const Router = express.Router();
const fs = require("fs");
const settings = require("../stores/settings.json");
const data = require("../stores/data.json");
const files = require("../scripts/files.js");
const secrets = require("../stores/secrets.json");
const apiKey = secrets.curseforgeKey;
Router.get("/search", (req, res) => {
   if (apiKey != undefined) {
    let gameVersion = req.query.version;
    let modLoaderType = req.query.loader;
    let searchFilter = req.query.query;
    let results = [];

    const exec = require("child_process").exec;
    exec(
        `curl -X GET "https://api.curseforge.com/v1/mods/search` +
        `?gameId=432` +
        `&gameVersion=${gameVersion}` +
        `&modLoaderType=${modLoaderType}` +
        `&searchFilter=${searchFilter}` +
        `&pageSize=10` +
        `&sortField=2` +
        `&sortOrder=desc"` +
        ` -H 'x-api-key: ${apiKey}'`,
        (error, stdout, stderr) => {
            if (!error && stdout != undefined) {
                console.log(stdout)
            res.status(200).json(JSON.parse(stdout));
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
            if (!error && stdout != undefined) {
                console.log(stdout)
            res.status(200).json(JSON.parse(stdout).data);
        } else {
            res.status(500).json({ msg: "Internal server error." });
        }
        }
    );
    }
   });
module.exports = Router;
