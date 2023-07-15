const { createHash, scryptSync, randomBytes } = require("crypto");

function download(file, url) {
  exec(`curl -o ${file} -LO ${url}`);
}

function downloadAsync(file, url, callback) {
  exec(`curl -o ${file} -LO ${url}`, (error, stdout, stderr) => {
    console.log(stdout);
    callback(stdout);
  });
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

function removeDirectoryRecursive(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const curPath = `${directoryPath}/${file}`;

      if (fs.lstatSync(curPath).isDirectory()) {
        // Recursive call if the file is a directory
        removeDirectoryRecursive(curPath);
      } else {
        // Delete the file
        fs.unlinkSync(curPath);
      }
    });

    // Remove the directory itself
    fs.rmdirSync(directoryPath);
    console.log(`Directory "${directoryPath}" removed.`);
    return;
  } else {
    console.log(`Directory "${directoryPath}" does not exist.`);
    return;
  }
}

function getIPID(ip) {
  const secrets = require("../stores/secrets.json");

  if (secrets.pepper == undefined) {
    secrets.pepper = randomBytes(12).toString("hex");

    fs.writeFileSync("stores/secrets.json", JSON.stringify(secrets));
  }
  return hash(ip, secrets.pepper).split(":")[1];
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

module.exports = {
  hash,
  download,
  extract,
  write,
  GET,
  getIPID,
  removeDirectoryRecursive,
  downloadAsync,
};
