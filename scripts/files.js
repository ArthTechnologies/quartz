const { createHash, scryptSync, randomBytes } = require("crypto");
const config = require("./config.js").getConfig();

function download(file, url) {
  exec(`curl -o ${file} -LO "${url}"`);
}

function downloadAsync(file, url, callback) {
  exec(`curl -o ${file} -LO "${url}"`, (error, stdout, stderr) => {
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

function hashNoSalt(input) {
  return scryptSync(input, config.pepper, 48).toString(
    "hex"
  );
}

function folderSizeRecursive(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    console.log(`Directory "${directoryPath}" does not exist.`);
    return;
  }

  let bytes = 0;
  const files = fs.readdirSync(directoryPath);
  files.forEach((file) => {
    const curPath = `${directoryPath}/${file}`;

    if (fs.lstatSync(curPath).isDirectory()) {
      bytes += folderSizeRecursive(curPath);
    } else {
      bytes += fs.statSync(curPath).size;
    }
  });
  return bytes;
}

function readFilesRecursive(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    console.log(`Directory "${directoryPath}" does not exist.`);
    return;
  }

  const result = [];
  const files = fs.readdirSync(directoryPath);

  files.forEach((file) => {
    //if it isn't a hidden file/directory
    if (file.charAt(0) != ".") {
      const curPath = `${directoryPath}/${file}`;

    if (fs.lstatSync(curPath).isDirectory()) {
      const subDir = readFilesRecursive(curPath);
      result.push([file + ":" + curPath, subDir]);
    } else {
      result.push(file + ":" + curPath);
    }
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
    fs.rmSync(directoryPath);
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
    fs.rmSync(directoryPath);
    console.log(`Directory "${directoryPath}" removed.`);
    if (callback != undefined) {
      callback();
    }
  } else {
    console.log(`Directory "${directoryPath}" does not exist.`);
  }
}

function getIPID(ip) {
  return hash(ip, config.pepper).split(":")[1];
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
        break;
    }
  }
  if (terminalLines[0] != "" && software != "velocity") {
    return "[" + terminalLines.join("\n[");
  }

  return terminalLines.join("\n[");
}

function getIndex(callback) {
  let index = {};
  exec("ls -1 data | sort -r -V", (error, stdout, stderr) => {
    // Split the sorted file names into an array
    const sortedFiles = stdout.trim().split("\n");
    // Process the sorted files
    sortedFiles.forEach((file) => {
      switch (file) {
        case "cx_geyser-velocity_Geyser.jar":
          file = "geyser-velocity.jar";
          break;
        case "cx_geyser-spigot_Geyser.jar":
          file = "geyser-spigot.jar";
          break;
        case "cx_floodgate-velocity_Floodgate.jar":
          file = "floodgate-velocity.jar";
          break;
        case "cx_floodgate-spigot_Floodgate.jar":
          file = "floodgate-spigot.jar";
          break;
      }
        
      
      if (file.includes("-")) {
        let software = file.split("-")[0];
        let version = "";
        if (file.includes(".jar")) {
          console.log(file);
          version = file.split("-")[1].split(".jar")[0];
        } else {
          version = file.split("-")[1].split(".zip")[0];
        }
        if (index[software] == undefined) {
          index[software] = [];
        }
        let date;
        if (fs.existsSync("./assets/jars/" + file)) {
          date = fs.statSync("./assets/jars/" + file).mtime;
        }
        index[software].push({
          version: version,
          link: `jars/${software}/${version}`,
          date: date,
          software: software,
        });
        
      }
    
    });
    callback(index);
  });

}
module.exports = {
  hash,
  hashNoSalt,
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
  folderSizeRecursive,
  getIndex
};
