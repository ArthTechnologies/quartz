fs = require("fs");

let a = [];
function checkServers(em) {
  amount = 0;

  fs.readFile("servers.csv", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(data.split("\n"));
    // split the file data by '\n' and assign it to the 'array' variable
    a = data.split("\n");

    // do something with the array
  });

  var n = [];
  var s = [];
  var v = [];
  var o = [];
  var ids = [];

  for (i in a) {
    if (a[i] != (undefined | "")) {
      if (a[i].indexOf(em) > 0) {
        n.push(a[i].split(",")[0]);
        s.push(a[i].split(",")[1]);
        v.push(a[i].split(",")[2]);
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
    ids: ids,
  };
}

function run(name, software) {
  const path = "java/jdk-17.0.5+8/bin/java";
  const folder = "servers/" + name;
  const args = ["-jar server.jar"];
  //make a new folder called name using fs
  let s = "paper";
  let c = "servers";

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
  let port = 10000 + parseInt(name);
  //change line 49 of folder/server.properties to server-port=name+20000
  let data = fs.readFileSync("servers/template/server.properties", "utf8");
  let result = data.replace(/server-port=25565/g, "server-port=" + port);

  console.log(port);
  fs.writeFileSync(folder + "/server.properties", result, "utf8");

  //add new file eula.txt in folder
  fs.writeFileSync(folder + "/eula.txt", "eula=true");

  fs.writeFileSync(
    folder + "/serverjars.properties",
    "category=" + c + "\ntype=" + s + "\nversion=latest\nuseHomeDirectory=true"
  );

  //run server.jar
  const { exec } = require("child_process");

  const ls = exec(
    path + " " + args,
    { cwd: folder },
    function (error, stdout, stderr) {
      if (error) {
        console.log(error.stack);
        console.log("Error code: " + error.code);
        console.log("Signal received: " + error.signal);
      }
      console.log("Child Process STDOUT: " + stdout);
      console.log("Child Process STDERR: " + stderr);
      //
    }
  );

  ls.on("exit", function (code) {
    console.log("Child process exited with exit code " + code);
  });
}

module.exports = { checkServers, run };
