var events = require("events");
var eventEmitter = new events.EventEmitter();
fs = require("fs");
let states = [];
const files = require("./files.js");
let servers = require("../servers.json");
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

  const args = [
    "-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1HeapRegionSize=8M -XX:G1ReservePercent=20 -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1 -Daikars.new.flags=true -Dusing.aikars.flags=https://mcflags.emc.gs -jar server.jar",
  ];
  //make a new folder called name using fs
  let s = "paper";
  let c = "servers";
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

  switch (version) {
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

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
    //fs.writeFileSync(folder + "/world.zip", worldFile);
    if (!fs.existsSync(folder + "/mods/")) {
      fs.mkdirSync(folder + "/mods/");
    }
  }
  if (c == "modded") {
    fs.copyFileSync(
      "servers/template/downloading/" + s + "/" + version + ".jar",
      folder + "/server.jar"
    );
    const { exec } = require("child_process");
    if ((version = "latest")) {
      version = "1.19.4";
    }
    let modpack;

    exec(
      "curl -o " + folder + "/modpack.mrpack -LO " + modpackURL,
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
                    exec(
                      "curl -o " +
                        folder +
                        "/" +
                        modpack.files[i].path +
                        " -LO " +
                        modpack.files[i].downloads[0]
                    );
                  }
                }
              }
            );
          }
        );
      }
    );
  } else {
    fs.copyFileSync("servers/template/server.jar", folder + "/server.jar");
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
        "servers/template/" + addons[i] + ".zip",
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

  //add new file eula.txt in folder
  fs.writeFileSync(folder + "/eula.txt", "eula=true");

  fs.writeFileSync(
    folder + "/serverjars.properties",
    "category=" +
      c +
      "\ntype=" +
      s +
      "\nversion=" +
      version +
      "\nuseHomeDirectory=true"
  );
  //copy /server/template/Geyser-Spigot.jar to folder/plugins

  if (!fs.existsSync(folder + "/plugins")) {
    fs.mkdirSync(folder + "/plugins");
  }
  const { exec } = require("child_process");
  let ls;
  if (s == "forge") {
    if (isNew) {
      timeout = 10000;
      exec(path + " -jar server.jar --installServer", { cwd: folder });
    } else {
      timeout = 0;
    }

    //wait for forge to install
    setTimeout(() => {
      //-Dlog4j.configurationFile=consoleconfig.xml
      //get the forge version from the name of the folder inside /libraries/net/minecraftforge/forge/
      let forgeVersion = fs
        .readdirSync(folder + "/libraries/net/minecraftforge/forge/")[0]
        .substring(0, 16);

      console.log("starting server" + forgeVersion);
      ls = exec(
        path +
          ` @user_jvm_args.txt @libraries/net/minecraftforge/forge/` +
          forgeVersion +
          `/unix_args.txt  "$@"`,
        { cwd: folder }
      );
    }, timeout);
  } else {
    ls = exec(path + " " + args, { cwd: folder });
  }

  //for every item in the cmd array, run the command
  for (i in cmd) {
    if (cmd[i] != undefined && cmd[i] != "op") {
      ls.stdin.write(cmd[i] + "\n");
    }
  }
  //if geyser is fully downloaded, copy it to folder
  if (
    fs.statSync("servers/template/downloading/cx_geyser-spigot_Geyser.jar")
      .size > 13000000
  ) {
    fs.copyFileSync(
      "servers/template/downloading/cx_geyser-spigot_Geyser.jar",
      folder + "/plugins/cx_geyser-spigot_Geyser.jar"
    );
  }

  //if floodgate is fully downloaded, copy it to folder
  if (
    fs.statSync(
      "servers/template/downloading/cx_floodgate-spigot_Floodgate.jar"
    ).size > 10200000
  ) {
    fs.copyFileSync(
      "servers/template/downloading/cx_floodgate-spigot_Floodgate.jar",
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
  fs.copyFileSync(
    "servers/template/downloading/cx_geyser-spigot_Geyser.jar",
    folder + "/plugins/cx_geyser-spigot_Geyser.jar"
  );

  fs.copyFileSync(
    "servers/template/downloading/cx_floodgate-spigot_Floodgate.jar",
    folder + "/plugins/cx_floodgate-spigot_Floodgate.jar"
  );

  let out = [];
  let count = 0;

  ls.stdout.on("data", function (data, er) {
    if (er) {
      console.error(er);
    }

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
    if (states[id] == "false") {
      ls.stdin.write("stop\n");
    }
  }, 200);
  eventEmitter.on("writeCmd", function () {
    ls.stdin.write(terminalInput + "\n");
  });
  ls.on("exit", () => {
    states[id] = "false";
  });

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
  states[id] = "false";
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
};
