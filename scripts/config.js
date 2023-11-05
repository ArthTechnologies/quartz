const fs = require("fs");

function getConfig() {
  let configTxt = fs.readFileSync("config.txt", "utf8").split("\n");
    let config = {};
    configTxt.forEach((line) => {
      if (line.includes("=")) {
        let splitLine = line.split("=");
        config[splitLine[0]] = splitLine[1];
      }
    });
    return config;
}

module.exports = {getConfig}