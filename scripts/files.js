const { createHash, scryptSync, randomBytes } = require("crypto");
function download(file, url) {
  exec(`curl -o ${file} -LO ${url}`);
}

function extract(archive, dir) {
  exec(`tar -xvf ${archive} -C ${dir}`);
}

function hash(input, salt) {
  if (salt == undefined) {
    salt = randomBytes(12).toString("hex");
  }

  return salt + ":" + scryptSync(input, salt, 48).toString("hex");
}

function getIPID(ip) {
  const secrets = require("../stores/secrets.json");
  if (secrets.pepper == undefined) {
    secrets.pepper = randomBytes(12).toString("hex");
    fs.writeFileSync("stores/secrets.json", secrets);
  }
  return hash(ip, require("../stores/secrets.json").pepper).split(":")[1];
}

function write(file, content) {
  const fs = require("fs");
  const oldFile = fs.readFileSync(file, "utf8");
  fs.writeFileSync(`backup/${file}`, oldFile);

  fs.writeFileSync(file, content);
}

function GET(url, callback) {
  exec(`curl ` + url, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    callback(stdout);
  });
}

module.exports = { hash, download, extract, write, GET, getIPID };
