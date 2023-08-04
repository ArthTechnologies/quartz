const express = require("express");
const router = express.Router();
const files = require("../scripts/files.js");
const f = require("../scripts/mc.js");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const data = require("../stores/data.json");

const fs = require("fs");

let stripekey = require("../stores/secrets.json").stripekey;
const stripe = require("stripe")(stripekey);

router.get(`/:id`, function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (token === account.token && server.accountId == account.accountId) {
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
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (token === account.token && server.accountId == account.accountId) {
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
          f.stopAsync(id, () => {
            f.run(id, undefined, undefined, undefined, undefined, email, false);
          });
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
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (token === account.token && server.accountId == account.accountId) {
    id = req.params.id;
    pluginId = req.query.pluginId;
    pluginPlatform = req.query.pluginPlatform;
    pluginName = req.query.pluginName;
    token = req.headers.token;
    modtype = req.params.modtype;

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
  email = req.headers.email;
  token = req.headers.token;
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (token === account.token && server.accountId == account.accountId) {
    let modtype = req.params.modtype;
    let mods = [];
    let id = req.params.id;
    let modpack;
    if (fs.existsSync(`servers/${id}/modrinth.index.json`)) {
      modpack = require(`../servers/${id}/modrinth.index.json`);
    }

    fs.readdirSync(`servers/${id}/${modtype}`).forEach((file) => {
      if (file.startsWith("gh_")) {
        mods.push({
          platform: file.split("_")[0],
          id: file.split("_")[1] + "/" + file.split("_")[2],
          name: file.split("_")[3].replace(".jar", ""),
        });
      } else if (file.startsWith("lr_")) {
        mods.push({
          platform: file.split("_")[0],
          id: file.split("_")[1],
          name: file.split("_")[2].replace(".jar", ""),
        });
      } else if (file.startsWith("cx_")) {
        mods.push({
          platform: file.split("_")[0],
          id: file.split("_")[1],
          name: file.split("_")[2].replace(".jar", ""),
        });
      }
    });

    //sort mods by name
    mods.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

    if (modpack != undefined) {
      modpack.files.sort((a, b) => {
        const nameA = a.path.split("/")[1];
        const nameB = b.path.split("/")[1];
        return nameA.localeCompare(nameB);
      });
    }

    res.status(200).json({ mods: mods, modpack: modpack });
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

router.post(`/:id/update/`, function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (token === account.token && server.accountId == account.accountId) {
    id = req.params.id;
    version = req.query.version;

    server.version = version;
    fs.writeFileSync(
      "servers/" + id + "/server.json",
      JSON.stringify(server, null, 2)
    );
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
  email = req.headers.email;
  token = req.headers.token;
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (token === account.token && server.accountId == account.accountId) {
    //add cors header
    res.header("Access-Control-Allow-Origin", "*");
    id = req.params.id;
    pluginUrl = req.query.pluginUrl;
    pluginId = req.query.id;
    pluginName = req.query.name;
    pluginName = pluginName.replace(/\//g, "-");
    modtype = req.params.modtype;
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
  email = req.headers.email;
  token = req.headers.token;
  account = require("../accounts/" + email + ".json");
  if (token === account.token) {
    let amount = account.servers.length;
    //add cors header
    res.header("Access-Control-Allow-Origin", "*");
    const settings = require("../stores/settings.json");
    //1 is subtracted because of the "template" subdirectory
    var id = fs.readdirSync("servers").length - 1;
    const datajson = require("../stores/data.json");
    datajson.numServers = id;
    fs.writeFileSync("data.json", JSON.stringify(datajson, null, 2));
    em = req.query.email;

    var store = {
      name: req.body.name,
      software: req.body.software,
      version: req.body.version,
      addons: req.body.addons,
      accountId: account.accountId,
    };

    let cid = "";
    if (
      (stripekey.indexOf("sk") == -1) | (account.bypassStripe == true) &&
      (settings.maxServers > data.numServers ||
        settings.maxServers == undefined ||
        data.numServers == undefined)
    ) {
      if (
        em !== "noemail" &&
        req.body.software !== "undefined" &&
        req.body.version !== "undefined" &&
        req.body.name !== "undefined"
      ) {
        server = {};
        server.name = req.body.name;
        server.software = req.body.software;
        server.version = req.body.version;
        server.addons = req.body.addons;
        server.accountId = account.accountId;
        if (!fs.existsSync("servers/" + id)) {
          fs.mkdirSync("servers/" + id);
        }
        fs.writeFile(
          "servers/" + id + "/server.json",
          JSON.stringify(server, null, 4),
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
    } else if (settings.maxServers <= data.numServers) {
      res
        .status(400)
        .json({ success: false, msg: "Maxiumum servers reached." });
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
                    if (
                      em !== "noemail" &&
                      req.body.software !== "undefined" &&
                      req.body.version !== "undefined" &&
                      req.body.name !== "undefined"
                    ) {
                      server = {};
                      server.name = req.body.name;
                      server.software = req.body.software;
                      server.version = req.body.version;
                      server.addons = req.body.addons;
                      server.accountId = account.accountId;

                      fs.writeFile(
                        "servers/" + id + "/server.json",
                        JSON.stringify(server, null, 4),
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
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (token === account.token && server.accountId == account.accountId) {
    id = req.params.id;
    iconUrl = req.body.icon;
    desc = req.body.desc;
    if (f.checkServer(id).software == "velocity") {
      var text = fs.readFileSync(`servers/${id}/velocity.toml`).toString();
      var textByLine = text.split("\n");
      textByLine[8] = `motd = "${desc}"`;
      text = textByLine.join("\n");

      fs.writeFileSync(`servers/${id}/velocity.toml`, text);
    } else {
      f.proxiesToggle(req.params.id, req.body.proxiesEnabled, req.body.fSecret);
      //set line 33 of server.properties in the server folder to "motd=" + desc
      var text = fs.readFileSync(`servers/${id}/server.properties`).toString();
      var textByLine = text.split("\n");
      textByLine[32] = `motd=${desc}`;
      text = textByLine.join("\n");
      console.log(desc + " " + iconUrl);
      fs.writeFileSync(`servers/${id}/server.properties`, text);
    }

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
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (token === account.token && server.accountId == account.accountId) {
    //send the motd and iconUrl
    let iconUrl = "/images/placeholder.webp";
    let desc = "";
    let secret;
    let proxiesEnabled;
    id = req.params.id;

    if (f.checkServer(id).software == "velocity") {
      var text = fs.readFileSync(`servers/${id}/velocity.toml`).toString();
      var textByLine = text.split("\n");
      desc = textByLine[8].split("=")[1];

      //cut off the quotes
      desc = desc.substring(2, desc.length - 1);
    } else {
      var text = fs.readFileSync(`servers/${id}/server.properties`).toString();
      var textByLine = text.split("\n");
      desc = textByLine[32].split("=")[1];
      secret = fs.readFileSync(`servers/${id}/config/paper-global.yml`, "utf8");

      let secretLines = secret.split("\n");

      let index = secretLines.findIndex((line) => {
        return line.includes("secret:");
      });

      let onlineMode = textByLine[
        textByLine.findIndex((line) => {
          return line.includes("online-mode");
        })
      ]
        .split("=")[1]
        .trim();

      if (onlineMode == "true") {
        proxiesEnabled = false;
      } else {
        proxiesEnabled = true;
      }

      secret = secretLines[index].split(":")[1].trim();
      //cut quotes off of secret
      secret = secret.substring(1, secret.length - 1);
    }

    if (fs.existsSync(`servers/${id}/iconurl.txt`)) {
      iconUrl = fs.readFileSync(`servers/${id}/iconurl.txt`).toString();
    }
    res.status(200).json({
      msg: `Success: Got server info`,
      iconUrl: iconUrl,
      desc: desc,
      secret: secret,
      proxiesEnabled: proxiesEnabled,
    });
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

router.delete(`/:id`, function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (token === account.token && server.accountId == account.accountId) {
    res.header("Access-Control-Allow-Origin", "*");
    id = req.params.id;
    f.stop(id);

    account.servers.findIndex = function () {
      for (var i = 0; i < this.length; i++) {
        if (account.servers[i].id == id) {
          return i;
        }
      }
    };
    account.servers.splice(account.servers.findIndex(), 1);
    fs.writeFileSync(`accounts/${email}.json`, JSON.stringify(account));

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
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (token === account.token && server.accountId == account.accountId) {
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
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (token === account.token && server.accountId == account.accountId) {
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

router.get("/:id/proxy/info", function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (token === account.token && server.accountId == account.accountId) {
    if (f.checkServer(req.params.id)["software"] === "velocity") {
      let lobbyName;

      let config = fs.readFileSync(
        `servers/${req.params.id}/velocity.toml`,
        "utf8"
      );
      let lines = config.split("\n");
      let index = lines.findIndex((line) => {
        return line.includes("try = [");
      });
      lobbyName = lines[index + 1].split('"')[1];
      res.status(200).json({
        secret: fs.readFileSync(
          `servers/${req.params.id}/forwarding.secret`,
          "utf8"
        ),
        lobbyName: lobbyName,
      });
    } else {
      res.status(400).json({ msg: "Not a proxy." });
    }
  } else {
    res.status(401).json({ msg: "Invalid credentials." });
  }
});

router.post("/:id/proxy/info", function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (token === account.token && server.accountId == account.accountId) {
    if (f.checkServer(req.params.id)["software"] === "velocity") {
      let config = fs.readFileSync(
        `servers/${req.params.id}/velocity.toml`,
        "utf8"
      );
      let lines = config.split("\n");
      let index = lines.findIndex((line) => {
        return line.includes("try = [");
      });
      lines[index + 1] = `  "${req.query.lobbyName}"`;
      let newConfig = lines.join("\n");
      fs.writeFileSync(`servers/${req.params.id}/velocity.toml`, newConfig);
      res.status(200).json({ msg: "Done" });
    } else {
      res.status(400).json({ msg: "Not a proxy." });
    }
  } else {
    res.status(401).json({ msg: "Invalid credentials." });
  }
});

router.get("/:id/proxy/servers", function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (token === account.token && server.accountId == account.accountId) {
    if (f.checkServer(req.params.id)["software"] === "velocity") {
      let config = fs.readFileSync(
        `servers/${req.params.id}/velocity.toml`,
        "utf8"
      );

      let index = config.split("\n").findIndex((line) => {
        return line.startsWith("[servers]");
      });

      console.log(index);
      let servers = [];
      let lines = config.split("\n");
      for (let i = index + 3; i < lines.length; i++) {
        console.log(lines[i]);
        if (lines[i].indexOf(" = ") > -1) {
          let item = lines[i];
          servers.push({
            name: item.split(" = ")[0],
            ip: item
              .split(" = ")[1]
              .substring(1, item.split(" = ")[1].length - 1),
          });
        } else {
          break;
        }
      }

      res.status(200).json(servers);
    } else {
      res.status(400).json({ msg: "Not a proxy." });
    }
  } else {
    res.status(401).json({ msg: "Invalid credentials." });
  }
});

router.post("/:id/proxy/servers", function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (token === account.token && server.accountId == account.accountId) {
    if (f.checkServer(req.params.id)["software"] === "velocity") {
      let config = fs.readFileSync(
        `servers/${req.params.id}/velocity.toml`,
        "utf8"
      );

      let index = config.split("\n").findIndex((line) => {
        return line.startsWith("[servers]");
      });

      console.log(index);
      let servers = [];

      let newConfig = config.split("\n");
      for (let i = index + 3; i < newConfig.length; i++) {
        if (newConfig[i].indexOf(" = ") > -1) {
          let item = newConfig[i];
          servers.push({
            name: item.split(" = ")[0],
            ip: item
              .split(" = ")[1]
              .substring(1, item.split(" = ")[1].length - 1),
          });
        } else {
          newConfig =
            newConfig.slice(0, i).join("\n") +
            "\n" +
            req.query.name +
            " = " +
            `"${req.query.ip}"` +
            "\n" +
            newConfig.slice(i, newConfig.length).join("\n");

          console.log(newConfig);
          break;
        }
      }

      if (
        servers.findIndex((server) => server.name === req.query.name) === -1
      ) {
        servers.push({ name: req.query.name, ip: req.query.ip });
      }
      fs.writeFileSync(`servers/${req.params.id}/velocity.toml`, newConfig);

      if (
        req.query.ip.split(":")[0] == require("../stores/settings.json").address
      ) {
        let subserverId = parseInt(req.query.ip.split(":")[1]) - 10000;
        if (
          require("../servers/" + subserverId + "/server.json").accountId ==
          account.accountId
        ) {
          f.proxiesToggle(subserverId, true, req.query.secret);
          res.status(200).json(servers);
        } else {
          res.state(400).json({ msg: "You don't own this subserver." });
        }
      } else {
        res.status(200).json(servers);
      }
    } else {
      res.status(400).json({ msg: "Not a proxy." });
    }
  } else {
    res.status(401).json({ msg: "Invalid credentials." });
  }
});

router.delete("/:id/proxy/servers", function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (token === account.token && server.accountId == account.accountId) {
    if (f.checkServer(req.params.id)["software"] === "velocity") {
      let config = fs.readFileSync(
        `servers/${req.params.id}/velocity.toml`,
        "utf8"
      );

      let index = config.split("\n").findIndex((line) => {
        return line.startsWith("[servers]");
      });

      console.log(config);
      let servers = [];
      let lines = config.split("\n");
      for (let i = index + 3; i < lines.length && lines[i] !== undefined; i++) {
        if (lines[i].indexOf(" = ") > -1) {
          let item = lines[i];
          if (item.split(" = ")[0] !== req.query.name) {
            servers.push({
              name: item.split(" = ")[0],
              ip: item
                .split(" = ")[1]
                .substring(1, item.split(" = ")[1].length - 1),
            });
          } else {
            lines.splice(i, 1);
            i--;
          }
        } else {
          break;
        }
      }

      console.log(servers);
      console.log(
        fs.readFileSync(`servers/${req.params.id}/velocity.toml`, "utf8")
      );
      fs.writeFileSync(
        `servers/${req.params.id}/velocity.toml`,
        lines.join("\n")
      );
      res.status(200).json(servers);
    } else {
      res.status(400).json({ msg: "Not a proxy." });
    }
  } else {
    res.status(401).json({ msg: "Invalid credentials." });
  }
});

router.get("/:id/files", function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (token === account.token && server.accountId == account.accountId) {
    if (fs.existsSync(`servers/${req.params.id}/`)) {
      res
        .status(200)
        .json(files.readFilesRecursive(`servers/${req.params.id}/`));
    } else {
      res.status(200).json([]);
    }
  }
});

router.get("/:id/file/:path", function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (token === account.token && server.accountId == account.accountId) {
    let path = req.params.path.split("*").join("/");
    if (fs.existsSync(`servers/${req.params.id}/${path}`)) {
      if (fs.lstatSync(`servers/${req.params.id}/${path}`).isDirectory()) {
        res.status(200).json({ msg: "This is a directory." });
      } else {
        let extension = path.split(".")[path.split(".").length - 1];

        if (extension == "png" || extension == "jepg" || extension == "svg") {
          res.status(200).json("Image files can't be edited.");
        } else if (
          extension == "jar" ||
          extension == "exe" ||
          extension == "sh"
        ) {
          res.status(200).json("Binary files can't be edited or viewed.");
        } else if (
          fs.statSync(`servers/${req.params.id}/${path}`).size > 500000
        ) {
          res.status(200).json("File too large.");
        } else {
          res
            .status(200)
            .json(fs.readFileSync(`servers/${req.params.id}/${path}`, "utf8"));
        }
      }
    } else {
      res.status(200).json([]);
    }
  }
});

router.post("/:id/file/:path", function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (
    token === account.token &&
    server.accountId == account.accountId &&
    fs.existsSync(`servers/${req.params.id}/`)
  ) {
    let path = req.params.path;
    if (req.params.path.includes("*")) {
      path = req.params.path.split("*").join("/");
    }
    let extension = path.split(".")[path.split(".").length - 1];
    if (
      req.body.content !== undefined &&
      fs.existsSync(`servers/${req.params.id}/${path}`) &&
      (extension == "yml" ||
        extension == "yaml" ||
        extension == "json" ||
        extension == "toml")
    ) {
      fs.writeFileSync(`servers/${req.params.id}/${path}`, req.body.content);
      res.status(200).json({ msg: "Done" });
    } else {
      res.status(400).json({ msg: "Invalid request." });
    }
  } else {
    res.status(401).json({ msg: "Invalid credentials." });
  }
});

module.exports = router;
