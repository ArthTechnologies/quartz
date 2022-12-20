fs = require("fs");

let a = [];
function checkServers(em) {
  console.log("Checking servers for " + em);
  amount = 0;

  a = fs.readFileSync("servers.csv", "utf8");
  a = a.split("\n");

  var n = [];
  var s = [];
  var v = [];
  var addons = [];
  var ids = [];

  for (i in a) {
    if (a[i] != (undefined | "")) {
      if (a[i].indexOf(em) > 0) {
        n.push(a[i].split(",")[0]);
        s.push(a[i].split(",")[1]);
        v.push(a[i].split(",")[2]);
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
    ids: ids,
  };
}

function run(id, software, version, addons, cmd, em) {
  if (software == undefined || version == undefined) {
    //run checkServers and store it
    let servers = checkServers(em);
    software = servers.softwares[id];
    version = servers.versions[id];
    addons = servers.addons[id];
  }
  for (i in cmd) {
    if (cmd[i] == undefined) {
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
  console.log(addons.split(","));
  for (i in addons.split(",")) {
    console.log(addons.split(",")[i] + " addon");
    if (addons.split(",")[i] != undefined) {
      console.log("copying " + addons.split(",")[i] + " to " + folder);
      fs.copyFileSync(
        "servers/template/" + addons.split(",")[i] + ".zip",
        folder + "/world/datapacks/" + addons.split(",")[i] + ".zip"
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

  console.log("starting commands are: " + cmd);

  //run server.jar
  const { exec } = require("child_process");

  const ls = exec(path + " " + args, { cwd: folder });

  //for every item in the cmd array, run the command
  for (i in cmd) {
    ls.stdin.write(cmd[i] + "\n");
  }

  ls.on("exit", function (code) {
    console.log("Server Stopped: exit code " + code);
  });
}

module.exports = { checkServers, run };
