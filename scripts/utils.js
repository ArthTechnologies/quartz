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

function getJSON(file) {
  let json = {};
  try {
    json = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    console.log("error parsing json for " + file, error);
  }
  return json;
}

module.exports = { getConfig, getJSON };
