var events = require("events");
var eventEmitter = new events.EventEmitter();
fs = require("fs");
let states = [];
const files = require("./files.js");
const { time } = require("console");
const { randomBytes } = require("crypto");
let terminalOutput = [];
let terminalInput = "";

function proxiesToggle(id, toggle, secret) {
  if (toggle == true) {
    let paperGlobal = fs.readFileSync(
      `servers/${id}/config/paper-global.yml`,
      "utf8"
    );

    paperGlobal = paperGlobal.replace(/secret: ""/g, `secret: "${secret}"`);
    paperGlobal = paperGlobal.replace(/secret: ''/g, `secret: "${secret}"`);

    //set the line after 'velocity:' to 'enabled: true'
    let paperGlobalLines = paperGlobal.split("\n");
    let index = paperGlobalLines.indexOf("  velocity:");
    paperGlobalLines[index + 1] = "    enabled: true";
    paperGlobal = paperGlobalLines.join("\n");

    fs.writeFileSync(`servers/${id}/config/paper-global.yml`, paperGlobal);

    let serverProperties = fs.readFileSync(
      `servers/${id}/server.properties`,
      "utf8"
    );

    serverProperties = serverProperties.replace(
      /online-mode=true/g,
      `online-mode=false`
    );

    fs.writeFileSync(`servers/${id}/server.properties`, serverProperties);
  } else {
    let paperGlobal = fs.readFileSync(
      `servers/${id}/config/paper-global.yml`,
      "utf8"
    );

    let index = paperGlobal.split("\n").indexOf("secret: ");
    let paperGlobalLines = paperGlobal.split("\n");

    paperGlobalLines[index] == "secret: " + secret;

    //set the line after 'velocity:' to 'enabled: false'
    let index2 = paperGlobalLines.indexOf("  velocity:");
    paperGlobalLines[index2 + 1] = "    enabled: false";
    paperGlobal = paperGlobalLines.join("\n");

    fs.writeFileSync(`servers/${id}/config/paper-global.yml`, paperGlobal);

    let serverProperties = fs.readFileSync(
      `servers/${id}/server.properties`,
      "utf8"
    );

    serverProperties = serverProperties.replace(
      /online-mode=false/g,
      `online-mode=true`
    );

    fs.writeFileSync(`servers/${id}/server.properties`, serverProperties);
  }
}

function getState(id) {
  if (states[id] == undefined) {
    states[id] = "false";
  }
  return states[id];
}
function checkServer(id) {
  if (states[id] == undefined) {
    states[id] = "false";
  }
  let server = require("../servers/" + id + "/server.json");

  return {
    version: server.addons,
    software: server.software,
    addons: server.addons,
    state: states[id],
  };
}

function run(id, software, version, addons, cmd, em, isNew, modpackURL) {
  let server = require("../servers/" + id + "/server.json");
  console.log("server.json: " + server);
  let out = [];
  states[id] = "starting";

  // i isNew is undefined, set it to true
  if (isNew == undefined) {
    isNew = true;
  }

  //make sure isNew is a boolean
  isNew = Boolean(isNew);

  if (isNew === false) {
    software = server.software;
    version = server.version;
    addons = server.addons;
  } else {
  }

  for (i in cmd) {
    if (cmd[i] != undefined) {
      cmd[i] = cmd[i].toLowerCase();
    }
  }
  let path = "../../java/jdk-17.0.5+8/bin/java";
  const folder = "servers/" + id;

  let args = [
    "-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1HeapRegionSize=8M -XX:G1ReservePercent=20 -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1 -Daikars.new.flags=true -Dusing.aikars.flags=https://mcflags.emc.gs -jar server.jar",
  ];
  //make a new folder called name using fs
  let s = "paper";
  let c = "servers";
  let installer = false;
  //make software all lowercase
  software = software.toLowerCase();
  switch (software) {
    case "paper":
      s = "paper";
      c = "servers";
      break;
    case "velocity":
      s = "velocity";
      c = "proxies";
      break;
    case "quilt":
      s = "fabric";
      c = "modded";
      installer = true;
      break;
    case "vanilla":
      s = "vanilla";
      c = "vanilla";
      break;
    case "waterfall":
      s = "waterfall";
      c = "proxies";
      break;
    case "forge":
      s = "forge";
      c = "modded";
      installer = true;
      break;
    case "fabric":
      s = "fabric";
      c = "modded";

      break;
    case "snapshot":
      s = "snapshot";
      c = "vanilla";
      break;
    case "spigot":
      s = "spigot";
      c = "servers";
      break;
  }

  const settings = require("../stores/settings.json");
  let latestVersion = settings.latestVersion;
  switch (version) {
    case latestVersion:
      version = latestVersion;
      path = "../../java/jdk-19.0.2+7/bin/java";
      break;
    case "latest":
      version = "1.19.4";
      path = "../../java/jdk-19.0.2+7/bin/java";
      break;
    case "Latest":
      version = "1.19.4";
      path = "../../java/jdk-19.0.2+7/bin/java";
      break;
    case "1.19.4":
      path = "../../java/jdk-19.0.2+7/bin/java";
      break;
    case "1.18.2":
      path = "../../java/jdk-17.0.5+8/bin/java";
      break;
    case "1.17.1":
      path = "../../java/jdk-17.0.5+8/bin/java";
      break;
    case "3.2.0":
      path = "../../java/jdk-17.0.5+8/bin/java";
    default:
      path = "../../java/jdk-11.0.18+10/bin/java";
      break;
  }

  if (software == "velocity") {
    path = "../../java/jdk-17.0.5+8/bin/java";
  }
  let doneInstalling = false;

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
    //fs.writeFileSync(folder + "/world.zip", worldFile);
    if (!fs.existsSync(folder + "/mods/")) {
      fs.mkdirSync(folder + "/mods/");
    }
  }
  if (c == "modded") {
    const { exec } = require("child_process");

    let modpack;

    files.downloadAsync(
      folder + "/modpack.mrpack",
      modpackURL,
      (error, stdout, stderr) => {
        exec(
          "unzip " + folder + "/modpack.mrpack" + " -d " + folder,
          (error, stdout, stderr) => {
            exec(
              "cp -r " + folder + "/overrides/* " + folder + "/",
              (error, stdout, stderr) => {
                if (
                  !fs.existsSync(folder + "/overrides/mods") &&
                  fs.existsSync(folder + "/modrinth.index.json")
                ) {
                  modpack = JSON.parse(
                    fs.readFileSync(folder + "/modrinth.index.json")
                  );

                  //for each file in modpack.files, download it
                  for (i in modpack.files) {
                    files.downloadAsync(
                      folder + "/" + modpack.files[i].path,
                      modpack.files[i].downloads[0],
                      () => {
                        console.log("done downloading");
                      }
                    );
                  }
                }
              }
            );
          }
        );
      }
    );
  }
  console.log(software);

  if (software != "quilt") {
    fs.copyFileSync(
      "data/" + software + "-" + version + ".jar",
      folder + "/server.jar"
    );
  } else {
    fs.copyFileSync("data/" + software + "-0.5.1.jar", folder + "/server.jar");
    args = [
      "-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1HeapRegionSize=8M -XX:G1ReservePercent=20 -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1 -Daikars.new.flags=true -Dusing.aikars.flags=https://mcflags.emc.gs -jar server.jar install server " +
        version +
        " --download-server",
    ];
  }

  //run code for each item in addons
  //mkdir folder/world/datapacks
  // if world folder doesnt exist
  if (!fs.existsSync(folder + "/world/datapacks") && software != "mohist") {
    fs.mkdirSync(folder + "/world");
    fs.mkdirSync(folder + "/world/datapacks");
  }

  for (i in addons) {
    if (addons[i] != undefined && addons[i] != "") {
      fs.copyFileSync(
        "data/" + addons[i] + "-" + version + ".zip",
        folder + "/world/datapacks/" + addons[i] + ".zip"
      );
    }
  }
  let port = 10000 + parseInt(id);
  //change line 49 of folder/server.properties to server-port=if+20000
  let data;
  if (software == "velocity") {
    if (isNew) {
      data = fs.readFileSync("servers/template/velocity.toml", "utf8");
    } else {
      data = fs.readFileSync("servers/" + id + "/velocity.toml", "utf8");
    }

    let result = data
      .replace(/bind = "0.0.0.0:25577"/g, `bind = "0.0.0.0:${port}"`)
      .replace(
        /player-info-forwarding-mode = "NONE"/g,
        `player-info-forwarding-mode = "modern"`
      );

    fs.writeFileSync(folder + "/velocity.toml", result, "utf8");

    if (!fs.existsSync(folder + "/forwarding.secret")) {
      let secret = randomBytes(12).toString("hex");
      fs.writeFileSync(folder + "/forwarding.secret", secret, "utf8");
    }
  } else {
    if (isNew) {
      data = fs.readFileSync("servers/template/server.properties", "utf8");
      data = data.replace(/spawn-protection=16/g, `spawn-protection=0`);
      let paperGlobal = fs.readFileSync(
        "servers/template/paper-global.yml",
        "utf8"
      );
      fs.writeFileSync(folder + "/paper-global.yml", paperGlobal, "utf8");
    } else {
      data = fs.readFileSync("servers/" + id + "/server.properties", "utf8");
    }

    let result = data.replace(/server-port=25565/g, "server-port=" + port);

    fs.writeFileSync(folder + "/server.properties", result, "utf8");
  }

  if (software == "quilt") {
    //add new file eula.txt in folder
    fs.writeFileSync(folder + "/server/eula.txt", "eula=true");
  } else {
    //add new file eula.txt in folder
    fs.writeFileSync(folder + "/eula.txt", "eula=true");
  }

  //copy /server/template/Geyser-Spigot.jar to folder/plugins

  if (!fs.existsSync(folder + "/plugins")) {
    fs.mkdirSync(folder + "/plugins");
  }
  const { exec } = require("child_process");
  let ls;
  let interval = 0;
  if (installer) {
    if (isNew) {
      interval = 500;
      states[id] = "installing";

      if (software == "forge") {
        exec(path + " -jar server.jar --installServer", { cwd: folder }, () => {
          doneInstalling = true;
        });
      } else {
        //quilt
        exec(path + " " + args, { cwd: folder }, (error, stdout, stderr) => {
          console.log("stdout: " + stdout);
          console.log("stderr: " + stderr);
          console.log("error: " + error);
        });
      }
    } else {
      doneInstalling = true;
    }
    let timeToLoad = true;

    //wait for forge to install
    setInterval(() => {
      if (doneInstalling & timeToLoad) {
        console.log("going" + timeToLoad);
        timeToLoad = false;
        states[id] = "starting";
        //-Dlog4j.configurationFile=consoleconfig.xml
        //get the forge version from the name of the folder inside /libraries/net/minecraftforge/forge/
        let forgeVersion = fs.readdirSync(
          folder + "/libraries/net/minecraftforge/forge/"
        )[0];

        let execLine = "";
        let cwd = folder;

        console.log(
          fs.readdirSync(folder + "/libraries/net/minecraftforge/forge/")[0]
        );
        if (software == "forge") {
          execLine =
            path +
            ` @user_jvm_args.txt @libraries/net/minecraftforge/forge/${forgeVersion}/unix_args.txt "$@"`;
        } else {
          path = "../" + path;
          cwd += "/server";
          execLine = path + " -jar quilt-server-launch.jar nogui";
        }

        ls = exec(execLine, { cwd: cwd }, (error, stdout, stderr) => {
          console.log("stdout: " + stdout);
          console.log("stderr: " + stderr);
          console.log("error: " + error);
        });

        ls.stdout.on("data", (data) => {
          count++;
          if (count >= 9) {
            out.push(data);
          }

          terminalOutput[id] = out.join("\n");
          if (terminalOutput[id].indexOf("Done") > -1) {
            //replace states[id] with true
            states[id] = "true";
          }
        });
        setInterval(() => {
          if (states[id] == "stopping") {
            ls.stdin.write("stop\n");
          }
        }, 200);
        eventEmitter.on("writeCmd", function () {
          ls.stdin.write(terminalInput + "\n");
        });
        ls.on("exit", () => {
          states[id] = "false";
          terminalOutput[id] = out.join("\n");
        });
      }
    }, interval);
  } else {
    let count = 0;

    ls = exec(path + " " + args, { cwd: folder }, (error, stdout, stderr) => {
      console.log("stdout: " + stdout);
      console.log("stderr: " + stderr);
      console.log("error: " + error);
      console.log("path: " + path + " " + args);
    });
    ls.stdout.on("data", (data) => {
      count++;
      if (count >= 9) {
        out.push(data);
      }

      terminalOutput[id] = out.join("\n");
      if (terminalOutput[id].indexOf("Done") > -1) {
        //replace states[id] with true
        states[id] = "true";
      }
    });

    setInterval(() => {
      if (states[id] == "stopping") {
        ls.stdin.write("stop\n");
      }
    }, 200);
    eventEmitter.on("writeCmd", function () {
      ls.stdin.write(terminalInput + "\n");
    });
    ls.on("exit", () => {
      states[id] = "false";
      terminalOutput[id] = out.join("\n");
    });
  }

  //for every item in the cmd array, run the command
  for (i in cmd) {
    if (cmd[i] != undefined && cmd[i] != "op") {
      ls.stdin.write(cmd[i] + "\n");
    }
  }

  //replace line 15 of folder/plugins/Geyser-Spigot/config.yml with "port: " + port

  var text = fs.readFileSync("servers/template/geyserconfig.yml", "utf8");
  var textByLine = text.split("\n");
  textByLine[15] = "  port: " + port;

  text = textByLine.join("\n");

  if (software == "paper" || software == "spigot") {
    if (
      fs.existsSync("data/cx_geyser-spigot_Geyser.jar") &&
      (fs.existsSync(folder + "/plugins/cx_geyser-spigot_Geyser.jar") || isNew)
    ) {
      if (!isNew) {
        fs.unlinkSync(folder + "/plugins/cx_geyser-spigot_Geyser.jar");
        fs.unlinkSync(folder + "/plugins/cx_floodgate-spigot_Floodgate.jar");
      }
      fs.copyFileSync(
        "data/cx_geyser-spigot_Geyser.jar",
        folder + "/plugins/cx_geyser-spigot_Geyser.jar"
      );
      fs.copyFileSync(
        "data/cx_floodgate-spigot_Floodgate.jar",
        folder + "/plugins/cx_floodgate-spigot_Floodgate.jar"
      );
    }
    //create /plugins/Geyser-Spigot/
    if (!fs.existsSync(folder + "/plugins/Geyser-Spigot")) {
      fs.mkdirSync(folder + "/plugins/Geyser-Spigot");
    }
    fs.writeFileSync(folder + "/plugins/Geyser-Spigot/config.yml", text);

    fs.copyFile(
      "servers/template/downloading/cx_geyser-spigot_Geyser.jar",
      folder + "/plugins/cx_geyser-spigot_Geyser.jar",
      (err) => {}
    );

    fs.copyFile(
      "servers/template/downloading/cx_floodgate-spigot_Floodgate.jar",
      folder + "/plugins/cx_floodgate-spigot_Floodgate.jar",
      (err) => {}
    );
  } else if (software == "velocity") {
    if (
      fs.existsSync("data/cx_geyser-velocity_Geyser.jar") &&
      (fs.existsSync(folder + "/plugins/cx_geyser-velocity_Geyser.jar") ||
        isNew)
    ) {
      if (!isNew) {
        fs.unlinkSync(folder + "/plugins/cx_geyser-velocity_Geyser.jar");
        fs.unlinkSync(folder + "/plugins/cx_floodgate-velocity_Floodgate.jar");
      }
      fs.copyFileSync(
        "data/cx_geyser-velocity_Geyser.jar",
        folder + "/plugins/cx_geyser-velocity_Geyser.jar"
      );
      fs.copyFileSync(
        "data/cx_floodgate-velocity_Floodgate.jar",
        folder + "/plugins/cx_floodgate-velocity_Floodgate.jar"
      );
    }
    //create /plugins/Geyser-Spigot/
    if (!fs.existsSync(folder + "/plugins/Geyser-Velocity")) {
      fs.mkdirSync(folder + "/plugins/Geyser-Velocity");
    }
    fs.writeFileSync(folder + "/plugins/Geyser-Velocity/config.yml", text);

    fs.copyFile(
      "servers/template/downloading/cx_geyser-velocity_Geyser.jar",
      folder + "/plugins/cx_geyser-velocity_Geyser.jar",
      (err) => {}
    );

    fs.copyFile(
      "servers/template/downloading/cx_floodgate-velocity_Floodgate.jar",
      folder + "/plugins/cx_floodgate-velocity_Floodgate.jar",
      (err) => {}
    );
  }

  let count = 0;
}
function stop(id) {
  states[id] = "stopping";
}

function stopAsync(id, callback) {
  if (states[id] == "false") {
    callback();
  } else {
    states[id] = "stopping";
    const intervalId = setInterval(() => {
      if (states[id] === "false") {
        clearInterval(intervalId); // Clear the interval once the condition is met
        callback();
      }
    }, 200);
  }
}

function readTerminal(id) {
  let server = require("../servers/" + id + "/server.json");
  let ret = terminalOutput[id];

  ret = files.simplifyTerminal(ret, server.software);
  console.log(ret);
  return ret;
}

function writeTerminal(id, cmd) {
  terminalInput = cmd;
  eventEmitter.emit("writeCmd");
}

module.exports = {
  run,
  stop,
  checkServer,
  readTerminal,
  writeTerminal,
  stopAsync,
  proxiesToggle,
  getState,
};
