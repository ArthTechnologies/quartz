const { stdin } = require("process");
var events = require('events');
var eventEmitter = new events.EventEmitter();
fs = require("fs");
let states = [];
let a = [];
let x = false;

let terminalOutput = [];
let terminalInput = "";
function checkServers(em) {
  console.log("Checking servers for " + em);
  amount = 0;

  a = fs.readFileSync("servers.csv", "utf8");
  a = a.split("\n");

  var n = [];
  var s = [];
  var v = [];
  var addons = [];
  var st = [];
  var ids = [];

  for (i in a) {
    if (states[i] == undefined) {
      states[i] = "false";
    }
    if (a[i] != (undefined | "")) {
      if (a[i].indexOf(em) > 0) {
        n.push(a[i].split(",")[0]);
        s.push(a[i].split(",")[1]);
        v.push(a[i].split(",")[2]);
        st.push(states[i]);
        //push addons, which start after the first [ and end before the last ]
        addons.push(a[i].slice(a[i].indexOf("[") + 1, a[i].lastIndexOf("]")));
      }
    }

    v = v.filter(function (el) {
      return el != null;
    });
    s = s.filter(function (el) {
      return el != null;
    });
    n = n.filter(function (el) {
      return el != "";
    });

    if (a[i].indexOf(em) > 0) {
      amount++;

      ids.push(i);
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
  let line;
  let st = states[id];
  //line is the idth line in servers.csv
  line = fs.readFileSync("servers.csv", "utf8").split("\n")[id];
  //split the line by commas except for commas inside []s
  let split = line.split(/,(?![^[]*])/);
  let addons = split[3];
  //remove []s from addons
  addons = addons.slice(1, addons.length - 1);

  return {
    version: split[2],
    software: split[1],
    addons: addons,
    state: st,
  };
}

function run(id, software, version, addons, cmd, em, isNew, modpackURL) {

  states[id] = "starting";
  console.log(states);
  // i isNew is undefined, set it to true
  if (isNew == undefined) {
    isNew = true;
  }

  //make sure isNew is a boolean
  isNew = Boolean(isNew);
  console.log("isNew: " + isNew);
  if (isNew === false) {
    console.log("already created server, grabing data...");
    //run checkServers and store it
    let servers = checkServer(id);
    software = servers.software;
    version = servers.version;
    addons = servers.addons;
    addons = addons.split(",");
  } else {
    console.log("creating new server...");
  }
  console.log("cmds: " + cmd);
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
      s = "quilt";
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
    case "latest": path = "../../java/jdk-17.0.5+8/bin/java"; break;
    case "Latest": path = "../../java/jdk-17.0.5+8/bin/java"; break;
    case "1.19.3": path = "../../java/jdk-17.0.5+8/bin/java"; break;
    case "1.18.2": path = "../../java/jdk-17.0.5+8/bin/java"; break;
    case "1.17.1": path = "../../java/jdk-17.0.5+8/bin/java"; break;
    default: path = "../../java/jdk-11.0.18+10/bin/java"; break;
  }
    


  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
  if (c == "modded" && isNew) {
    const {exec} = require("child_process");
    //extract modpack.mrpack to folder
    const decompress = require("decompress");
    exec("curl -o " + folder + "/modpack.zip "+ modpackURL, (error, stdout, stderr) => {
      decompress(folder + "/modpack.zip", "dist", ).then((files) => {
        console.log("done");
      });
  

    });



  }
  //copy ../servers/template/server.jar to folder
  fs.copyFileSync("servers/template/server.jar", folder + "/server.jar");
  //run code for each item in addons
  //mkdir folder/world/datapacks
  // if world folder doesnt exist
  if (!fs.existsSync(folder + "/world") && software != "mohist") {
    fs.mkdirSync(folder + "/world");
    fs.mkdirSync(folder + "/world/datapacks");
  }

  for (i in addons) {
    if (addons[i] != undefined && addons[i] != "") {
      console.log("copying " + addons[i] + " to " + folder);
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

  console.log("starting server on port " + port);
 if(isNew) {
  fs.writeFileSync(folder + "/server.properties", result, "utf8");
 }

  //add new file eula.txt in folder
  fs.writeFileSync(folder + "/eula.txt", "eula=true");
  console.log("writing to serverjars");
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
  const ls = exec(path + " " + args, { cwd: folder });
  console.log(folder + "/plugins/Geyser-Spigot.jar");
  console.log("starting commands are: " + cmd);
  //for every item in the cmd array, run the command
  for (i in cmd) {
    if (cmd[i] != undefined && cmd[i] != "op") {
      console.log(cmd[i]);
      ls.stdin.write(cmd[i] + "\n");
    }
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

  exec(
    "curl -o cx_geyser-spigot_Geyser.jar -LO https://ci.opencollab.dev/job/GeyserMC/job/Geyser/job/master/lastSuccessfulBuild/artifact/bootstrap/spigot/build/libs/Geyser-Spigot.jar",
    {
      cwd: folder + "/plugins",
    }
  );
  exec(
    "curl -o cx_floodgate-spigot_Floodgate.jar -LO https://ci.opencollab.dev/job/GeyserMC/job/Floodgate/job/master/lastSuccessfulBuild/artifact/spigot/build/libs/floodgate-spigot.jar",
    {
      cwd: folder + "/plugins",
    }
  );
let mohisteula = false;
  let out = [];
  let count = 0;
  //log output
  console.log("test1");
  ls.stdout.on("data", function (data, er) {
    if (er) {
      console.log(er);
    }
    count++;
    if (count >= 9) {
      out.push(data);
    }
  console.log(data);
    terminalOutput[id] = out.join("\n");
    if (terminalOutput[id].indexOf("Done") > -1) {
      //replace states[id] with true
      states[id] = "true";
    }
  });
  if (software == "mohist" && mohisteula == false) {
    ls.stdin.write("true\n");
    mohisteula = true;
  }
  
  setInterval(function () {
    if (states[id] == "false") {
      ls.stdin.write("stop\n");
    }

  }, 200); 
  eventEmitter.on('writeCmd', function () {
    ls.stdin.write(terminalInput + "\n");
  });
  ls.on("exit", function (code) {
    console.log("Server Stopped: exit code " + code);
    states[id] = "false";
  });
}

function stop(id) {
  states[id] = "false";
}

function readTerminal(id) {
  let ret = terminalOutput[id];

  return ret;
}

function writeTerminal(id, cmd) {
  console.log("writing command: " + cmd)
  x = true;
  terminalInput = cmd;
  eventEmitter.emit('writeCmd');
}

module.exports = {
  checkServers,
  run,
  stop,
  checkServer,
  readTerminal,
  writeTerminal,
};
