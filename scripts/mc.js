var events = require("events");
var eventEmitter = new events.EventEmitter();
fs = require("fs");
let states = [];
const files = require("./files.js");
let servers = require("../servers.json");
const { time } = require("console");
let terminalOutput = [];
let terminalInput = "";
function checkServers(accountId) {
  amount = 0;

  var n = [];
  var s = [];
  var v = [];
  var addons = [];
  var st = [];
  var ids = [];

  for (i in servers) {
    if (states[i] == undefined) {
      states[i] = "false";
    }
    if (servers[i] != (undefined | "")) {
      if (
        servers[i].accountId != undefined &&
        servers[i].accountId == accountId
      ) {
        n.push(servers[i].name);
        s.push(servers[i].software);
        v.push(servers[i].version);
        st.push(states[i]);

        addons = servers[i].addons;
        amount++;

        ids.push(i);
      }
    }
  }

  names = n;
  softwares = s;
  versions = v;
  return {
    names: names,
    amount: amount,
    versions: versions,
    softwares: softwares,
    addons: addons,
    states: st,
    ids: ids,
  };
}

function checkServer(id) {
  if (states[id] == undefined) {
    states[id] = "false";
  }
  let server = servers[id];

  return {
    version: server.addons,
    software: server.software,
    addons: server.addons,
    state: states[id],
  };
}

function run(id, software, version, addons, cmd, em, isNew, modpackURL) {
  servers = require("../servers.json");
  states[id] = "starting";

  // i isNew is undefined, set it to true
  if (isNew == undefined) {
    isNew = true;
  }

  //make sure isNew is a boolean
  isNew = Boolean(isNew);

  if (isNew === false) {
    //run checkServers and store it
    software = servers[id].software;
    version = servers[id].version;
    addons = servers[id].addons;
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
    default:
      path = "../../java/jdk-11.0.18+10/bin/java";
      break;
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
  if (!fs.existsSync(folder + "/world") && software != "mohist") {
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
  let data = fs.readFileSync("servers/template/server.properties", "utf8");
  let result = data.replace(/server-port=25565/g, "server-port=" + port);

  if (isNew) {
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
        });
      }
    }, interval);
  } else {
    ls = exec(path + " " + args, { cwd: folder }, (error, stdout, stderr) => {
      console.log("stdout: " + stdout);
      console.log("stderr: " + stderr);
      console.log("error: " + error);
      console.log("path: " + path + " " + args);
    });
  }

  //for every item in the cmd array, run the command
  for (i in cmd) {
    if (cmd[i] != undefined && cmd[i] != "op") {
      ls.stdin.write(cmd[i] + "\n");
    }
  }

  if (fs.existsSync("cx_geyser-spigot_Geyser")) {
    fs.copyFileSync(
      "data/cx_geyser-spigot_Geyser.jar",
      folder + "/plugins/cx_geyser-spigot_Geyser.jar"
    );
    fs.copyFileSync(
      "data/cx_floodgate-spigot_Floodgate.jar",
      folder + "/plugins/cx_floodgate-spigot_Floodgate.jar"
    );
  }

  //replace line 15 of folder/plugins/Geyser-Spigot/config.yml with "port: " + port

  var text = fs.readFileSync("servers/template/geyserconfig.yml", "utf8");
  var textByLine = text.split("\n");
  textByLine[15] = "  port: " + port;

  text = textByLine.join("\n");

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

  let out = [];
  let count = 0;

  if (ls != undefined) {
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
    });
  }
  files.download(
    "java/servers/template/downloading/cx_geyser-spigot_Geyser.jar",
    "https://ci.opencollab.dev/job/GeyserMC/job/Geyser/job/master/lastSuccessfulBuild/artifact/bootstrap/spigot/build/libs/Geyser-Spigot.jar"
  );
  files.download(
    "java/servers/template/downloading/cx_floodgate-spigot_Floodgate.jar",
    "https://ci.opencollab.dev/job/GeyserMC/job/Floodgate/job/master/lastSuccessfulBuild/artifact/spigot/build/libs/floodgate-spigot.jar"
  );
}
function stop(id) {
  states[id] = "stopping";
}

function stopAsync(id, callback) {
  states[id] = "stopping";
  setInterval(() => {
    if (states[id] == "false") {
      callback();
    }
  }, 200);
}

function readTerminal(id) {
  let ret = terminalOutput[id];

  return ret;
}

function writeTerminal(id, cmd) {
  terminalInput = cmd;
  eventEmitter.emit("writeCmd");
}

module.exports = {
  checkServers,
  run,
  stop,
  checkServer,
  readTerminal,
  writeTerminal,
  stopAsync,
};
