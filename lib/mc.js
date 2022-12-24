const { stdin } = require("process");

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
  console.log("state: " + states[id]);
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

function run(id, software, version, addons, cmd, em, isNew) {
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
  console.log("addons: " + addons);
  for (i in cmd) {
    if (cmd[i] != undefined) {
      cmd[i] = cmd[i].toLowerCase();
    }
  }
  const path = "../../java/jdk-17.0.5+8/bin/java";
  const folder = "servers/" + id;
  const args = ["-jar server.jar"];
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
    case "mohist":
      s = "mohist";
      c = "modded";
      break;
    case "spigot":
      s = "spigot";
      c = "servers";
      break;
  }

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }

  //copy ../servers/template/server.jar to folder
  fs.copyFileSync("servers/template/server.jar", folder + "/server.jar");
  //run code for each item in addons
  //mkdir folder/world/datapacks
  // if world folder doesnt exist
  if (!fs.existsSync(folder + "/world")) {
    fs.mkdirSync(folder + "/world");
    fs.mkdirSync(folder + "/world/datapacks");
  }

  for (i in addons) {
    if (addons[i] != undefined) {
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
  fs.writeFileSync(folder + "/server.properties", result, "utf8");

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

  console.log(folder + "/plugins/Geyser-Spigot.jar");
  console.log("starting commands are: " + cmd);

  //run server.jar
  const { exec } = require("child_process");
  exec(
    "curl -LO https://ci.opencollab.dev/job/GeyserMC/job/Geyser/job/master/lastSuccessfulBuild/artifact/bootstrap/spigot/build/libs/Geyser-Spigot.jar",
    {
      cwd: folder + "/plugins",
    }
  );
  const ls = exec(path + " " + args, { cwd: folder });

  //for every item in the cmd array, run the command
  for (i in cmd) {
    if (cmd[i] != undefined && cmd[i] != "op") {
      console.log(cmd[i]);
      ls.stdin.write(cmd[i] + "\n");
    }
  }
  console.log("test");
  let out = [];
  //log output
  ls.stdout.on("data", function (data) {
    out.push(data);
    console.log(out.slice(-12, 0));

    terminalOutput[id] = out.join("\n");
    console.log(data);
    if (data.indexOf("Done") > -1) {
      //replace states[id] with true
      states[id] = "true";
    }
  });

  //check every 2 seconds if stop is true
  setInterval(function () {
    if (states[id] == "false") {
      ls.stdin.write("stop\n");
    }
    if (x == true) {
      ls.stdin.write(terminalInput + "\n");
      x = false;
    }
  }, 200);

  ls.on("exit", function (code) {
    console.log("Server Stopped: exit code " + code);
    states[id] = "false";
  });
}

function stop(id) {
  states[id] = "false";
}

function readTerminal(id) {
  console.log(terminalOutput[id]);
  //turn the array in to a string with each item seperated by \n
  let ret = terminalOutput[id];
  return ret;
}

function writeTerminal(id, cmd) {
  x = true;
  terminalInput = cmd;
}

module.exports = {
  checkServers,
  run,
  stop,
  checkServer,
  readTerminal,
  writeTerminal,
};
