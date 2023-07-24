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
    const curPath = `${directoryPath}/${file}`;
    if (fs.lstatSync(curPath).isDirectory()) {
      const subDir = readFilesRecursive(curPath);
      result.push([file, subDir]);
    } else {
      result.push(file);
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

function simplifyTerminal(terminal) {
  let terminalLines;
  if (terminal == undefined) {
    return "";
  }else {
    terminalLines = terminal.split("\n[");
  }

  terminalLines.forEach((line, index) => {

    switch(line) {
      case includes("The timings profiler"):
        terminalLines[index] = "";
        break;
      case includes("***********"):
        console.log(line);
        terminalLines[index] = "";
        break;
      case includes("had been replaced by \njava.base"):
        terminalLines[index] = "";
        break;
      case includes("Loaded plugin geyser"):
        terminalLines[index] = line.split("]: ")[0] + "Launching Geyser";
        break;
      case split("]: ")[1] == "[geyser]: ":
        terminalLines[index] = "";
        break;
    }


      

    });


  

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
  simplifyTerminal
};
