const express = require("express");
const router = express.Router();
const accounts = require("../accounts.json");
const servers = require("../servers.json");
const files = require("../scripts/files.js");
const f = require("../scripts/mc.js");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const fs = require("fs");

let stripekey = require("../stores/secrets.json").stripekey;
const stripe = require("stripe")(stripekey);

router.get(`/:id`, function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  if (token == accounts[email].token) {
    //add cors header
    res.header("Access-Control-Allow-Origin", "*");
    id = req.params.id;
    res.status(200).json(f.checkServer(id));
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});
router.post(`/:id/state/:state`, function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  if (token == accounts[email].token) {
    state = req.params.state;
    id = req.params.id;
    token = req.headers.token;

    if ((state == "start") | (state == "stop") | (state == "restart")) {
      switch (state) {
        case "start":
          f.run(id, undefined, undefined, undefined, undefined, email, false);
          break;
        case "stop":
          f.stop(id);
          break;
        case "restart":
          f.stop(id);
          //wait 5 seconds
          setTimeout(function () {
            f.run(id, undefined, undefined, undefined, undefined, email, false);
          }, 5000);
          break;
        default:
      }

      res.status(202).json({ msg: `Success. Server will ${state}.` });
    } else {
      res.status(404).json({
        msg: `Invalid state. Valid states are start, stop, & restart.`,
      });
    }
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

router.delete(`/:id/:modtype`, function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  modtype = req.params.modtype;
  if (token == accounts[email].token) {
    id = req.params.id;
    pluginId = req.query.pluginId;
    pluginPlatform = req.query.pluginPlatform;
    pluginName = req.query.pluginName;
    token = req.headers.token;

    const fs = require("fs");

    //delete platform_id_name.jar
    console.log(
      id + modtype + pluginPlatform + "_" + pluginId + "_" + pluginName + ".jar"
    );
    fs.unlinkSync(
      `servers/${id}/${modtype}/${pluginPlatform}_${pluginId}_${pluginName}.jar`
    );

    res.status(200).json({ msg: `Success. Mod deleted.` });
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

router.get(`/:id/:modtype(plugins|mods)`, function (req, res) {
  const fs = require("fs");
  email = req.headers.email;
  token = req.headers.token;
  modtype = req.params.modtype;
  if (token == accounts[email].token) {
    let platforms = [];
    let names = [];
    let ids = [];
    let id = req.params.id;
    let modpack;
    if (fs.existsSync(`servers/${id}/modrinth.index.json`)) {
      modpack = require(`../servers/${id}/modrinth.index.json`);
    }

    fs.readdirSync(`servers/${id}/${modtype}`).forEach((file) => {
      if (file.startsWith("gh_")) {
        platforms.push(file.split("_")[0]);

        ids.push(file.split("_")[1] + "/" + file.split("_")[2]);
        names.push(file.split("_")[3].replace(".jar", ""));
      } else if (file.startsWith("lr_")) {
        platforms.push(file.split("_")[0]);

        ids.push(file.split("_")[1]);
        names.push(file.split("_")[2].replace(".jar", ""));
      } else if (file.startsWith("cx_")) {
        platforms.push(file.split("_")[0]);
        ids.push(file.split("_")[1]);
        names.push(file.split("_")[2].replace(".jar", ""));
      }
    });

    res.status(200).json({ platforms, names, ids, modpack });
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

router.post(`/:id/update/`, function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  if (token == accounts[email].token) {
    id = req.params.id;
    version = req.query.version;

    servers[id].version = version;
    fs.writeFileSync("servers.json", JSON.stringify(servers, null, 2));
    f.stop(id);
    //wait 5 seconds
    setTimeout(function () {
      f.run(id, undefined, undefined, undefined, undefined, email, false);
    }, 5000);
    res.status(202).json({ msg: `Success. Server updated.` });
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

let lastPlugin = "";
router.post(`/:id/add/:modtype`, function (req, res) {
  console.log(req.params.modtype);
  email = req.headers.email;
  token = req.headers.token;
  modtype = req.params.modtype;
  if (token == accounts[email].token) {
    //add cors header
    res.header("Access-Control-Allow-Origin", "*");
    id = req.params.id;
    pluginUrl = req.query.pluginUrl;
    pluginId = req.query.id;
    pluginName = req.query.name;
    pluginName = pluginName.replace(/\//g, "-");
    if (
      pluginUrl.startsWith("https://cdn.modrinth.com/data/") |
      pluginUrl.startsWith("https://github.com/")
    ) {
      if (pluginUrl != lastPlugin) {
        files.download(
          `servers/${id}/${modtype}s/${pluginId}_${pluginName}.jar`,
          pluginUrl
        );
        lastPlugin = pluginUrl;
      }

      res.status(202).json({ msg: `Success. Plugin added.` });
    }
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

router.post(`/new`, function (req, res) {
  console.log(req.body.accountId);

  console.log(req.body.version);
  email = req.headers.email;

  token = req.headers.token;
  if (token == accounts[email].token) {
    let amount = f.checkServers(accounts[email].accountId).amount;
    //add cors header
    res.header("Access-Control-Allow-Origin", "*");

    var id = Object.keys(servers).length;

    em = req.query.email;

    var store = {
      name: req.body.name,
      software: req.body.software,
      version: req.body.version,
      addons: req.body.addons,
      accountId: accounts[email].accountId,
    };
    let cid = "";
    if (
      (stripekey.indexOf("sk") == -1) |
      (accounts[email].bypassStripe == true)
    ) {
      if (
        em !== "noemail" &&
        req.body.software !== "undefined" &&
        req.body.version !== "undefined" &&
        req.body.name !== "undefined"
      ) {
        servers[id] = {};
        servers[id].name = req.body.name;
        servers[id].software = req.body.software;
        servers[id].version = req.body.version;
        servers[id].addons = req.body.addons;
        servers[id].accountId = accounts[email].accountId;
        console.log(JSON.stringify(servers) + "servers.json");
        //console log if ../servers.json exists
        console.log(fs.existsSync("../servers.json") + "servers.json");
        fs.writeFile(
          "servers.json",
          JSON.stringify(servers, null, 4),
          (err) => {
            if (err) {
              console.error(err);
              return;
            }
            console.log("File has been created");
          }
        );
      }

      f.run(
        id,
        req.body.software,
        req.body.version,
        req.body.addons,
        req.body.cmd,
        undefined,
        true,
        req.body.modpackURL
      );
      res.status(202).json({ success: true, msg: `Success. Server created.` });
    } else {
      stripe.customers.list(
        {
          limit: 100,
          email: em,
        },
        function (err, customers) {
          if (err) {
            console.log("err");
            return "no";
          } else {
            console.log("...");
            if (customers.data.length > 0) {
              cid = customers.data[0].id;

              if (JSON.stringify(servers).indexOf(req.body.name) > -1) {
                res
                  .status(409)
                  .json({ success: false, msg: `Sorry, that name is taken.` });
              } else {
                //check the customer's subscriptions and return it
                stripe.subscriptions.list(
                  {
                    customer: cid,
                    limit: 100,
                  },
                  function (err, subscriptions) {
                    console.log(subscriptions);
                    let subs = 0;
                    //go through each item in the subscriptions.data array and if its not undefined, add 1 to the subscriptions variable
                    for (i in subscriptions.data) {
                      if (subscriptions.data[i] != undefined) {
                        subs++;
                      }
                    }
                    if (subs > amount) {
                      console.log(subs + " > " + amount);
                      if (
                        em !== "noemail" &&
                        req.body.software !== "undefined" &&
                        req.body.version !== "undefined" &&
                        req.body.name !== "undefined"
                      ) {
                        servers[id] = {};
                        servers[id].name = req.body.name;
                        servers[id].software = req.body.software;
                        servers[id].version = req.body.version;
                        servers[id].addons = req.body.addons;
                        servers[id].accountId = accounts[email].accountId;
                        console.log(JSON.stringify(servers[id]));
                        console.log(
                          "servers.json" + fs.existsSync("../servers.json")
                        );
                        fs.writeFile(
                          "servers.json",
                          JSON.stringify(servers, null, 4),
                          (err) => {
                            if (err) {
                              console.error(err);
                              return;
                            }
                            console.log("File has been created");
                          }
                        );
                      }
                      f.run(
                        id,
                        req.body.software,
                        req.body.version,
                        req.body.addons,
                        req.body.cmd,
                        undefined,
                        true,
                        req.body.modpackURL
                      );
                      res.status(202).json({
                        success: true,
                        msg: `Success: Starting Server`,
                        subscriptions: subs,
                        isCustomer: true,
                        cmds: req.body.cmd,
                      });
                    } else {
                      res.status(200).json({
                        success: false,
                        msg: `If you want another server, please make a new subscription.`,
                        subscriptions: subs,
                        isCustomer: true,
                      });
                    }
                  }
                );
              }
            } else {
              console.log("No customers found.");

              res.status(200).json({
                success: false,
                msg: `You need to subscribe first.`,
                subscriptions: 0,
                isCustomer: false,
              });
            }
          }
        }
      );
    }
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});
router.post(`/:id/setInfo`, function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  if (token == accounts[email].token) {
    id = req.params.id;
    iconUrl = req.body.icon;
    desc = req.body.desc;
    //set line 33 of server.properties in the server folder to "motd=" + desc
    var text = fs.readFileSync(`servers/${id}/server.properties`).toString();
    var textByLine = text.split("\n");
    textByLine[32] = `motd=${desc}`;
    text = textByLine.join("\n");
    console.log(desc + " " + iconUrl);
    fs.writeFileSync(`servers/${id}/server.properties`, text);

    files.download(`servers/${id}/server-icon.png`, iconUrl);

    //if command "convert" exists, convert the icon to 64x64
    if (fs.existsSync("/usr/bin/convert")) {
      if (fs.existsSync(`servers/${id}/server-icon.png`)) {
        var sizeOf = require("image-size");
        var dimensions = sizeOf(`servers/${id}/server-icon.png`);
        console.log(dimensions.width, dimensions.height);
        if (dimensions.width > 64 || dimensions.height > 64) {
          //if the image is equal in width and height, convert it to 64x64
          if (dimensions.width == dimensions.height) {
            //convert the image to 64x64, make sure its not smaller, squish it if nesescary
            exec(
              `convert servers/${id}/server-icon.png -resize 64x64 servers/${id}/server-icon.png`,
              (err, stdout, stderr) => {
                if (err) {
                  console.log(err);
                } else {
                  console.log("icon resized");
                }
              }
            );
          } else if (dimensions.width > dimensions.height) {
            let ratio = dimensions.width / dimensions.height;

            let newWidth = 64 * ratio;
            let newHeight = 64;

            exec(
              `convert servers/${id}/server-icon.png -resize ${newWidth}x${newHeight} -gravity center -crop 64x64+0+0 +repage servers/${id}/server-icon.png`,
              (err, stdout, stderr) => {
                if (err) {
                  console.log(err);
                }
              }
            );
          } else if (dimensions.width < dimensions.height) {
            //this doesnt work for some reason
          }
        }
      }
    } else {
      console.log("convert command not found, not converting image.");
    }

    //add iconurl.txt to the server folder with the icon url
    fs.writeFileSync(`servers/${id}/iconurl.txt`, iconUrl);
    res.status(200).json({ msg: `Success: Set server info` });
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

router.get(`/:id/getInfo`, function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  if (token == accounts[email].token) {
    //send the motd and iconUrl
    let iconUrl = "/images/placeholder.webp";
    let desc = "";
    id = req.params.id;

    var text = fs.readFileSync(`servers/${id}/server.properties`).toString();
    var textByLine = text.split("\n");
    desc = textByLine[32].split("=")[1];

    if (fs.existsSync(`servers/${id}/iconurl.txt`)) {
      iconUrl = fs.readFileSync(`servers/${id}/iconurl.txt`).toString();
    }
    res
      .status(200)
      .json({ msg: `Success: Got server info`, iconUrl: iconUrl, desc: desc });
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

router.delete(`/:id`, function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  if (token == accounts[email].token) {
    res.header("Access-Control-Allow-Origin", "*");
    id = req.params.id;
    f.stop(id);

    servers[id] = "deleted";
    files.write("servers.json", JSON.stringify(servers));
    //delete /servers/id
    exec(`rm -rf servers/${id}`, (err, stdout, stderr) => {
      if (err) {
        console.log(err);
      } else {
        console.log("deleted server");
      }
    });

    res.status(202).json({ msg: `Request recieved.` });
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

router.get("/:id/world", function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  if (token == accounts[email].token) {
    //zip /servers/id/world and send it to the client
    id = req.params.id;
    const exec = require("child_process").exec;
    exec(
      `zip -r -q -X ../world.zip .`,
      { cwd: `servers/${id}/world` },
      (err) => {
        res.setHeader("Content-Type", "application/zip");

        res.setHeader("Content-Disposition", `attachment; filename=world.zip`);

        res.status(200).download(`servers/${id}/world.zip`, "world.zip", () => {
          //delete the zip file
          fs.unlinkSync(`servers/${id}/world.zip`);
        });
      }
    );
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

router.post("/:id/world", upload.single("file"), function (req, res) {
  id = req.params.id;
  email = req.headers.email;
  token = req.headers.token;
  if (token == accounts[email].token) {
    let lock = false;
    let lock2 = false;
    f.stopAsync(req.params.id, () => {
      setTimeout(() => {
        if (!lock2) {
          lock2 = true;
          if (!req.file) {
            files.removeDirectoryRecursive(`servers/${id}/world`);
            fs.mkdirSync(`servers/${id}/world`);
            fs.mkdirSync(`servers/${id}/world/datapacks`);

            if (req.query.seed == undefined) {
              req.query.seed = "";
            }
            //read server.properties, find the line with the seed, replace it with 'seed={req.query.seed}'
            var text = fs
              .readFileSync(`servers/${id}/server.properties`)
              .toString();
            var textByLine = text.split("\n");
            var index = textByLine.findIndex((line) =>
              line.startsWith("level-seed")
            );
            textByLine[index] = `level-seed=${req.query.seed}`;
            var newText = textByLine.join("\n");
            console.log("seed\n" + newText);
            fs.writeFile(`servers/${id}/server.properties`, newText, (err) => {
              if (err) {
                console.log(err);
              }

              f.run(
                id,
                undefined,
                undefined,
                undefined,
                undefined,
                email,
                false
              );
            });
          } else {
            var text = fs
              .readFileSync(`servers/${id}/server.properties`)
              .toString();
            var textByLine = text.split("\n");
            var index = textByLine.findIndex((line) =>
              line.startsWith("level-seed")
            );
            textByLine[index] = `level-seed=`;
            var newText = textByLine.join("\n");
            fs.writeFileSync(`servers/${id}/server.properties`, newText);
            files.removeDirectoryRecursiveAsync(`servers/${id}/world`, () => {
              fs.mkdirSync(`servers/${id}/world`);
              fs.mkdirSync(`servers/${id}/world/datapacks`);
              //unzip the file and put it in /servers/id/world

              const exec = require("child_process").exec;
              //wait 5s
              setTimeout(() => {
                exec(
                  `unzip -o ${req.file.path} -d servers/` + id + `/world`,
                  (err, stdout, stderr) => {
                    if (err) {
                      console.log(err);
                    } else if (!lock) {
                      console.log("unzipped world");
                      //start server back up
                      f.run(
                        id,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        email,
                        false
                      );
                      1;
                      lock = true;
                    }
                  }
                );
              }, 5000);
            });
          }
        }
      }, 2000);
    });
    res.status(200).json({ msg: `Done` });
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

module.exports = router;
