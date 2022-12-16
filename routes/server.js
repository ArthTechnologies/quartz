const express = require("express");
const router = express.Router();
let techname;

const fs = require("fs");

let name = "MySurvival Server";
router.post(`/`, function (req, res) {
  //add cors header
  res.header("Access-Control-Allow-Origin", "*");
  techname = req.headers.techname;
  res.status(200).json({
    server_technical_name: `${techname}`,
    server_name: `${name}`,
    server_status: `online`,
    version: `1.16.5`,
    software: `paper`,
  });
  console.log(req.headers.techname);
});
router.get(`/change-state`, function (req, res) {
  state = req.headers.request;
  if ((state == "start") | (state == "stop") | (state == "restart")) {
    res.status(202).json({ msg: `Success. Server will ${state}.` });
    console.log(req.headers.request);
  } else {
    res
      .status(404)
      .json({ msg: `Invalid state. Valid states are start, stop, & restart.` });
  }
});

router.post(`/new`, function (req, res) {


  //add cors header
  res.header("Access-Control-Allow-Origin", "*");

  var id = 0;
  console.log(id);
  var fs = require("fs");
  em = req.body.email;
  console.log(em);
  var store =
    req.body.name +
    "," +
    req.body.software +
    "," +
    req.body.version +
    "," +
    em +
    "," +
    id +
    "\n";

  console.log(store);
  if (
    em !== "noemail" &&
    req.body.software !== "undefined" &&
    req.body.version !== "undefined" &&
    req.body.name !== "undefined"
  ) {
    fs.appendFile("servers.csv", store, function (err) {
      if (err) {
        // append failed
        console.log("failed to write to file.");
      } else {
        // done
        console.log("written to file.");
      }
    });
  }


  

  run(id, req.body.software);

  res.status(202).json({ msg: `Request recieved.` });
});

function run(name, software) {
  const path = "java";
  const folder="servers/"+name;
  const args = ["-jar server.jar"];
  //make a new folder called name using fs
  let s = "paper";
  let c = "servers";

  switch (software) {
    case "paper": s = "paper"; c = "servers"; break;
    case "velocity": s = "velocity"; c = "proxies"; break;
    case "quilt": s = "quilt"; c = "modded"; break;
    case "vanilla": s = "vanilla"; c = "vanilla"; break;
    case "waterfall": s = "waterfall"; c = "proxies"; break;
    case "forge": s = "forge"; c = "modded"; break;
    case "fabric": s = "fabric"; c = "modded"; break;
    case "mohist": s = "mohist"; c = "modded"; break;
    case "spigot": s = "spigot"; c = "servers"; break;
  }

  if (!fs.existsSync(folder)){
    fs.mkdirSync(folder);
  }

  //copy ../servers/template/server.jar to folder
  fs.copyFileSync("servers/template/server.jar", folder+"/server.jar");



  //add new file eula.txt in folder
  fs.writeFileSync(folder+"/eula.txt", "eula=true");

  fs.writeFileSync(folder+"/serverjars.properties", "category="+c+"\ntype="+s+"\nversion=latest\nuseHomeDirectory=true");

  //run server.jar
  const { exec } = require('child_process');

  const ls = exec(path + ' ' + args, {cwd: folder}, function (error, stdout, stderr) {
    
    if (error) {
      console.log(error.stack);
      console.log('Error code: ' + error.code);
      console.log('Signal received: ' + error.signal);
    }
    console.log('Child Process STDOUT: ' + stdout);
    console.log('Child Process STDERR: ' + stderr);
  });
  
  ls.on('exit', function (code) {
    console.log('Child process exited with exit code ' + code);
  });

}


module.exports = router;