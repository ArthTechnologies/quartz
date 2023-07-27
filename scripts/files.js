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

function readFilesRecursive(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    console.log(`Directory "${directoryPath}" does not exist.`);
    return;
  }

  const result = [];
  const files = fs.readdirSync(directoryPath);

  files.forEach((file) => {
    const curPath = `${directoryPath}${file}`;
    let filePath = curPath.split("/").splice(0, 3).join("/");
    console.log(curPath);
    if (fs.lstatSync(curPath).isDirectory()) {
      const subDir = readFilesRecursive(curPath);
      result.push([file + ":" + filePath, subDir]);
    } else {
      result.push(file + ":" + filePath);
    }
  });

  return result;
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

function removeDirectoryRecursiveAsync(directoryPath, callback) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const curPath = `${directoryPath}/${file}`;

      if (fs.lstatSync(curPath).isDirectory()) {
        // Recursive call if the file is a directory
        removeDirectoryRecursiveAsync(curPath);
      } else {
        // Delete the file
        fs.unlinkSync(curPath);
      }
    });

    // Remove the directory itself
    fs.rmdirSync(directoryPath);
    console.log(`Directory "${directoryPath}" removed.`);
    if (callback != undefined) {
      callback();
    }
  } else {
    console.log(`Directory "${directoryPath}" does not exist.`);
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

function simplifyTerminal(terminal, software) {
  let terminalLines;
  if (terminal == undefined) {
    return "";
  } else {
    terminalLines = terminal.split("\n[");
  }

  for (let i = terminalLines.length - 1; i >= 0; i--) {
    let line = terminalLines[i];
    switch (true) {
      case line.includes("is missing mods.toml"):
        terminalLines.splice(i, 1);
        break;
      case line.includes("Incorrect Key"):
        terminalLines.splice(i, 1);
        break;
      case line.includes("union:/"):
        terminalLines.splice(i, 1);
        break;
      case line.includes("mojang/Yggdrasil"):
        terminalLines.splice(i, 1);
        break;
      case line.includes("This server is running"):
        terminalLines.splice(i, 1);
        break;
      case line.includes("SERVER IS RUNNING IN OFFLINE"):
        terminalLines.splice(i, 1);
        terminalLines.splice(i, 1);
        terminalLines.splice(i, 1);
        terminalLines.splice(i, 1);
        break;
      case line.includes("Couldn't load server icon"):
        terminalLines[i] =
          terminalLines[i].split("]: ")[0] +
          "]: Couldn't load server icon. It may be too large.";
        break;
      case line.includes("Paper: Using"):
        terminalLines.splice(i, 1);
        terminalLines.splice(i, 1);
        break;
      case line.includes("Server permissions file"):
        terminalLines.splice(i, 1);
        break;
      case line.includes("There's a new Geyser update available"):
        terminalLines[i] =
          line.split("]: ")[0] +
          "]: Geyser has an update available. It will arrive in our database within 12 hours if it hasn't already. Restart to apply it.";
        break;
      case line.includes("The timings profiler"):
        terminalLines.splice(i, 1);
        break;
      case line.includes("***********"):
        terminalLines.splice(i, 1);
        break;
      case line.includes("java.base/jdk.internal.reflect"):
        terminalLines.splice(i, 1);
        terminalLines.splice(i, 1);
        break;
      case line == "[to be removed":
        terminalLines.splice(i, 1);
        break;
      case line.includes("Loaded plugin geyser"):
        terminalLines[i] = line.split("]: ")[0] + "]: Launching Geyser";
        break;
      case line.includes("Loading Geyser version"):
        terminalLines[i] = line.split("]: ")[0] + "]: Loading Geyser";
        terminalLines.splice(i - 1, 1);
        terminalLines.splice(i, 1);
        terminalLines.splice(i, 1);
    }
  }
  if (terminalLines[0] != "" && software != "velocity") {
    return "[" + terminalLines.join("\n[");
  }

  return terminalLines.join("\n[");
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
  removeDirectoryRecursiveAsync,
  readFilesRecursive,
  simplifyTerminal,
};
