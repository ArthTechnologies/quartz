const express = require("express");
const router = express.Router();
const files = require("../scripts/files.js");
const f = require("../scripts/mc.js");
const multer = require("multer");
const upload = multer({ dest: "assets/uploads/" });
const data = require("../assets/data.json");
const JsDiff = require("diff");
const config = require("../scripts/config.js").getConfig();

const fs = require("fs");

const stripeKey = config.stripeKey;
const stripe = require("stripe")(stripeKey);
const enableAuth = JSON.parse(config.enableAuth);

router.get(`/:id`, function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (hasAccess(token, account)) {
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
  if (hasAccess(token, account)) {
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

router.delete(`/:id/:modtype(plugin|mod)`, function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (hasAccess(token, account)) {
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
  if (hasAccess(token, account)) {
    let modtype = req.params.modtype;
    let mods = [];
    let unknownMods = [];
    let id = req.params.id;
    let modpack;

    let path = "servers/" + id;
    if (server.software == "quilt") {
      path += "/server";
    }
    if (fs.existsSync(`${path}/modrinth.index.json`)) {
      modpack = require(`../${path}/modrinth.index.json`);
    } else if (fs.existsSync(`${path}/curseforge.index.json`)) {
      modpack = require(`../${path}/curseforge.index.json`);
    }

    fs.readdirSync(`${path}/${modtype}`).forEach((file) => {
      console.log(file);
      if (file.startsWith("gh_")) {
        mods.push({
          platform: file.split("_")[0],
          id: file.split("_")[1] + "/" + file.split("_")[2],
          name: file.split("_")[3].replace(".jar", ""),
          filename: file,
          date: fs.statSync(`${path}/${modtype}/${file}`).mtimeMs,
        });
      } else if (
        file.startsWith("lr_") |
        file.startsWith("cx_") |
        file.startsWith("cf_")
      ) {
        mods.push({
          platform: file.split("_")[0],
          id: file.split("_")[1],
          name: file.split("_")[2].replace(".jar", ""),
          filename: file,
          date: fs.statSync(`${path}/${modtype}/${file}`).mtimeMs,
        });
      } else if (!fs.statSync(`${path}/${modtype}/${file}`).isDirectory()) {
        unknownMods.push({
          filename: file,
          date: fs.statSync(`${path}/${modtype}/${file}`).mtimeMs,
        });
        console.log(unknownMods);
      }
    });

    //sort mods by name if there are any
    if (mods.length > 1) {
      mods.sort((a, b) => {
        return a.name.localeCompare(b.name);
      });
    }

    if (modpack != undefined) {
      if (modpack.files.length > 0) {
        for (i in modpack.files) {
          if (modpack.files[i].path != undefined) {
            if (modpack.files[i].path.includes("\\")) {
              modpack.files[i].path = modpack.files[i].path.replace(/\\/g, "/");
            }
            if (!fs.existsSync(`${path}/` + modpack.files[i].path)) {
              modpack.files.splice(i, 1);
            }
          }
        }
      }
    }

    //add unknownMods array to the end of mods
    for (i in unknownMods) {
      mods.push(unknownMods[i]);
    }

    res.status(200).json({ mods: mods, modpack: modpack });
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

router.post(`/:id/version/`, function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (hasAccess(token, account)) {
    id = req.params.id;
    version = req.query.version;

    server.version = version;
    fs.writeFileSync(
      "servers/" + id + "/server.json",
      JSON.stringify(server, null, 2)
    );
    account.servers[account.servers.findIndex((e) => e.id == id)].version =
      version;
    f.stopAsync(id, () => {
      f.run(id, undefined, undefined, undefined, undefined, email, false);
    });
    res.status(202).json({ msg: `Success. Server updated.` });
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

let lastPlugin = "";
router.post(`/:id/add/:modtype(plugin|mod)`, function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (hasAccess(token, account)) {
    //add cors header
    res.header("Access-Control-Allow-Origin", "*");
    id = req.params.id;
    pluginUrl = req.query.pluginUrl;
    pluginId = req.query.id;
    pluginName = req.query.name;
    pluginName = pluginName.replace(/\//g, "-");
    modtype = req.params.modtype;
    console.log("downloading plugin" + pluginUrl);
    if (
      pluginUrl.startsWith("https://cdn.modrinth.com/data/") |
      pluginUrl.startsWith("https://github.com/") |
      pluginUrl.startsWith("https://edge.forgecdn.net/")
    ) {
      let platform = "lr";
      if (pluginUrl.startsWith("https://github.com/")) platform = "gh";
      if (pluginUrl.startsWith("https://edge.forgecdn.net/")) platform = "cf";
      if (pluginUrl != lastPlugin) {
        files.download(
          `servers/${id}/${modtype}s/${platform}_${pluginId}_${pluginName}.jar`,
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

router.post(`/:id/modpack`, function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (hasAccess(token, account)) {
    f.stopAsync(req.params.id, () => {
      f.downloadModpack(
        req.params.id,
        req.query.modpackURL,
        req.query.modpackID,
        req.query.versionID
      );
      res.status(202).json({ msg: `Success. Modpack Downloaded.` });
    });
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

router.post(`/:id/toggleDisable/:modtype(plugin|mod)`, function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (hasAccess(token, account)) {
    id = req.params.id;
    filename = req.query.filename;
    modtype = req.params.modtype;
    let text = "disabled";

    if (
      !fs.existsSync(
        "servers/" + id + "/" + modtype + "s/" + filename + ".disabled"
      )
    ) {
      fs.copyFileSync(
        "servers/" + id + "/" + modtype + "s/" + filename,
        "servers/" + id + "/" + modtype + "s/" + filename + ".disabled"
      );
      fs.unlinkSync("servers/" + id + "/" + modtype + "s/" + filename);
    } else {
      text = "enabled";
      fs.copyFileSync(
        "servers/" + id + "/" + modtype + "s/" + filename + ".disabled",
        "servers/" + id + "/" + modtype + "s/" + filename
      );
      fs.unlinkSync(
        "servers/" + id + "/" + modtype + "s/" + filename + ".disabled"
      );
    }
    res.status(202).json({ msg: `Success. Plugin ${text}.` });
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

router.post(`/new`, function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  if (!enableAuth) email = "noemail";
  account = require("../accounts/" + email + ".json");
  if (token === account.token || !enableAuth) {
    if (account.servers == undefined) account.servers = [];
    let amount = account.servers.length;
    //add cors header
    res.header("Access-Control-Allow-Origin", "*");

    let serverFolders = fs.readdirSync("servers");
    let serverFolder = serverFolders.sort((a, b) => a - b);
    let id = -1;
    let lastNum = -1;
    for (i in serverFolder) {
      let num = serverFolder[i].split(".")[0];
      console.log(num, i);
      if (num !== i) {
        id = i;
        break; // Break out of the loop when the first available ID is found.
      }
      lastNum = parseInt(num);
    }

    if (id === -1) {
      id = lastNum + 1;
    }
    const datajson = require("../assets/data.json");
    datajson.numServers = serverFolders.length;
    fs.writeFileSync("assets/data.json", JSON.stringify(datajson, null, 2));
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
      (stripeKey.indexOf("sk") == -1 || account.bypassStripe == true) &&
      (config.maxServers > data.numServers ||
        config.maxServers == undefined ||
        data.numServers == undefined)
    ) {
      console.log("debug");
      if (
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
        server.id = id;
        if (!fs.existsSync("servers/" + id)) {
          fs.mkdirSync("servers/" + id);
        }
        fs.writeFileSync(
          "servers/" + id + "/server.json",
          JSON.stringify(server, null, 4)
        );

        account.servers.push(server);

        fs.writeFileSync(
          "accounts/" + email + ".json",
          JSON.stringify(account, null, 4)
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
        req.body.modpackURL,
        req.body.modpackID,
        req.body.modpackVersionID
      );
      res.status(202).json({ success: true, msg: `Success. Server created.` });
    } else if (config.maxServers <= data.numServers) {
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
                      server.id = id;
                      if (!fs.existsSync("servers/" + id)) {
                        fs.mkdirSync("servers/" + id);
                      }
                      fs.writeFileSync(
                        "servers/" + id + "/server.json",
                        JSON.stringify(server, null, 4)
                      );

                      account.servers.push(server);
                      fs.writeFileSync(
                        "accounts/" + email + ".json",
                        JSON.stringify(account, null, 4)
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
                      req.body.modpackURL,
                      req.body.modapckID
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
  if (hasAccess(token, account)) {
    id = req.params.id;
    iconUrl = req.body.icon;
    desc = req.body.desc;

    //setting automaticStartup
    let dataJson = require("../assets/data.json");
    let server = id + ":" + email;
    if (dataJson.serversWithAutomaticStartup == undefined) {
      dataJson.serversWithAutomaticStartup = [];
    }
    if (req.body.automaticStartup) {
      if (!dataJson.serversWithAutomaticStartup.includes(server)) {
        dataJson.serversWithAutomaticStartup.push(server);
      }
      fs.writeFileSync("assets/data.json", JSON.stringify(dataJson, null, 2));
    } else {
      if (dataJson.serversWithAutomaticStartup.includes(server)) {
        dataJson.serversWithAutomaticStartup.splice(
          dataJson.serversWithAutomaticStartup.indexOf(server),
          1
        );
      }
      fs.writeFileSync("assets/data.json", JSON.stringify(dataJson, null, 2));
    }

    //setting description
    if (f.checkServer(id).software == "velocity") {
      var text = fs.readFileSync(`servers/${id}/velocity.toml`).toString();
      var textByLine = text.split("\n");
      let index = textByLine.findIndex((line) => {
        return line.includes("motd");
      });
      textByLine[index] = `motd = "${desc}"`;
      text = textByLine.join("\n");

      fs.writeFileSync(`servers/${id}/velocity.toml`, text);
    } else {
      f.proxiesToggle(req.params.id, req.body.proxiesEnabled, req.body.fSecret);
      var text = fs.readFileSync(`servers/${id}/server.properties`).toString();
      var textByLine = text.split("\n");
      let index = textByLine.findIndex((line) => {
        return line.includes("motd");
      });
      textByLine[index] = `motd=${desc}`;
      text = textByLine.join("\n");
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
  if (hasAccess(token, account)) {
    //send the motd and iconUrl
    let iconUrl = "/images/placeholder.webp";
    let desc = "";
    let secret;
    let proxiesEnabled;
    id = req.params.id;

    if (f.checkServer(id).software == "velocity") {
      var text = fs.readFileSync(`servers/${id}/velocity.toml`).toString();
      var textByLine = text.split("\n");
      let index = textByLine.findIndex((line) => {
        return line.includes("motd");
      });
      desc = textByLine[index].split("=")[1];

      //cut off the quotes
      desc = desc.substring(2, desc.length - 1);
    } else {
      var text = fs.readFileSync(`servers/${id}/server.properties`).toString();
      var textByLine = text.split("\n");
      let index = textByLine.findIndex((line) => {
        return line.includes("motd");
      });
      desc = textByLine[index].split("=")[1];
      secret = fs.readFileSync(`servers/${id}/config/paper-global.yml`, "utf8");

      let secretLines = secret.split("\n");

      let index2 = secretLines.findIndex((line) => {
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

      secret = secretLines[index2].split(":")[1].trim();
      //cut quotes off of secret
      secret = secret.substring(1, secret.length - 1);
    }

    if (fs.existsSync(`servers/${id}/iconurl.txt`)) {
      iconUrl = fs.readFileSync(`servers/${id}/iconurl.txt`).toString();
    }

    let automaticStartup = false;
    if (data.serversWithAutomaticStartup != undefined) {
      if (data.serversWithAutomaticStartup.includes(id + ":" + email)) {
        automaticStartup = true;
      }
    }
    res.status(200).json({
      msg: `Success: Got server info`,
      iconUrl: iconUrl,
      desc: desc,
      secret: secret,
      proxiesEnabled: proxiesEnabled,
      automaticStartup: automaticStartup,
    });
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

router.delete(`/:id`, function (req, res) {
  //log

  if (!fs.existsSync("deleteLog.txt")) {
    fs.writeFileSync(
      "deleteLog.txt",
      "Recieved A Delete Request for server " + req.params.id + "\n"
    );
  } else {
    fs.appendFileSync(
      "deleteLog.txt",
      "Recieved A Delete Request for server " + req.params.id + "\n"
    );
  }

  //
  email = req.headers.email;
  token = req.headers.token;
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (hasAccess(token, account)) {
    if (
      files.hash(req.query.password, account.salt).split(":")[1] ==
        account.password ||
      !enableAuth
    ) {
      id = req.params.id;
      if (f.getState(id) == "true") {
        f.stopAsync(id, () => {
          deleteServer();
        });
      } else {
        deleteServer();
      }

      function deleteServer() {
        account.servers.findIndex = function () {
          for (var i = 0; i < this.length; i++) {
            if (account.servers[i].id == id) {
              return i;
            }
          }
        };
        account.servers.splice(account.servers.findIndex(), 1);
        fs.writeFileSync(`accounts/${email}.json`, JSON.stringify(account));

        files.removeDirectoryRecursiveAsync(`servers/${id}`, () => {
          res.status(200).json({ msg: `Deleted server` });
        });

        const data = require("../assets/data.json");
        for (i in data.serversWithAutomaticStartup) {
          if (data.serversWithAutomaticStartup[i].includes(id)) {
            data.serversWithAutomaticStartup.splice(i, 1);
          }
        }
      }
    } else {
      res.status(401).json({ msg: `Invalid credentials.` });
    }
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

router.get("/:id/world", function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (hasAccess(token, account)) {
    //zip /servers/id/world and send it to the client
    id = req.params.id;
    let path = "servers/" + id;
    if (server.software == "quilt") {
      path += "/server";
    }
    const exec = require("child_process").exec;
    exec(`zip -r -q -X ../world.zip .`, { cwd: `${path}/world` }, (err) => {
      res.setHeader("Content-Type", "application/zip");

      res.setHeader("Content-Disposition", `attachment; filename=world.zip`);

      res.status(200).download(`${path}/world.zip`, "world.zip", () => {
        //delete the zip file
        fs.unlinkSync(`${path}/world.zip`);
      });
    });
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
  if (hasAccess(token, account)) {
    let lock = false;
    let lock2 = false;
    console.log("before stopping");
    f.stopAsync(req.params.id, () => {
      console.log("after stopping");
      setTimeout(() => {
        if (!lock2) {
          lock2 = true;
          if (!req.file) {
            console.log("no file");
            let worldgenMods = [];
            if (req.query.worldgenMods != undefined) {
              if (req.query.worldgenMods.indexOf(",") > -1) {
                worldgenMods = req.query.worldgenMods.split(",");
              } else if (req.query.worldgenMods != "") {
                worldgenMods.push(req.query.worldgenMods);
              }
            }
            const serverJson = require(`../servers/${id}/server.json`);
            serverJson.addons = worldgenMods;
            fs.writeFileSync(
              `servers/${id}/server.json`,
              JSON.stringify(serverJson, null, 2)
            );
            files.removeDirectoryRecursive(`servers/${id}/world`);
            fs.mkdirSync(`servers/${id}/world`);
            fs.mkdirSync(`servers/${id}/world/datapacks`);
            files.removeDirectoryRecursive(`servers/${id}/world_nether`);
            files.removeDirectoryRecursive(`servers/${id}/world_the_end`);

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
            var index2 = textByLine.findIndex((line) =>
              line.startsWith("level-type")
            );
            textByLine[index2] = `level-type=minecraft:${req.query.worldType}`;
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
              res.status(200).json({ msg: `Done` });
            });
          } else {
            console.log("yes file");
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
              files.removeDirectoryRecursive(`servers/${id}/world_nether`);
              files.removeDirectoryRecursive(`servers/${id}/world_the_end`);
              //unzip the file and put it in /servers/id/world

              const exec = require("child_process").exec;
              console.log(JSON.parse(config.enableVirusScan) + "virus scans");
              if (!JSON.parse(config.enableVirusScan)) {
                res.write("Upload Complete.");
                res.end();
                unzipFile();
              } else {
                res.write("Upload Complete. Scanning for Viruses...");
                exec(
                  `clamdscan --multiscan --fdpass servers/${id}/world`,
                  {},
                  (err, stdout, stderr) => {
                    if (stdout.indexOf("Infexted files: 0")) {
                      res.write("No Viruses Detected.");
                      res.end();
                      unzipFile();
                    } else {
                      res.write("Virus Detected.");
                      res.end();
                    }
                  }
                );
              }
              function unzipFile() {
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
              }
            });
          }
        }
      }, 2000);
    });
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

router.get("/:id/proxy/info", function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  account = require("../accounts/" + email + ".json");
  server = require("../servers/" + req.params.id + "/server.json");
  if (hasAccess(token, account)) {
    if (f.checkServer(req.params.id)["software"] == "velocity") {
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
  if (hasAccess(token, account)) {
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
  if (hasAccess(token, account)) {
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
  if (hasAccess(token, account)) {
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

      if (req.query.ip.split(":")[0] == config.address) {
        let subserverId = parseInt(req.query.ip.split(":")[1]) - 10000;
        if (
          require("../servers/" + subserverId + "/server.json").accountId ==
          account.accountId
        ) {
          f.proxiesToggle(subserverId, true, req.query.secret);
          f.stopAsync(subserverId, () => {
            f.run(
              subserverId,
              undefined,
              undefined,
              undefined,
              undefined,
              email,
              false
            );
          });
          f.stopAsync(req.params.id, () => {
            f.run(
              req.params.id,
              undefined,
              undefined,
              undefined,
              undefined,
              email,
              false
            );
          });

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
  if (hasAccess(token, account)) {
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
  if (hasAccess(token, account)) {
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
  if (hasAccess(token, account)) {
    let path = req.params.path.split("*").join("/");
    if (fs.existsSync(`servers/${req.params.id}/${path}`)) {
      if (fs.lstatSync(`servers/${req.params.id}/${path}`).isDirectory()) {
        res.status(200).json({
          content:
            "This is a directory, not a file. Listing files: " +
            fs.readdirSync(`servers/${req.params.id}/${path}`),
        });
      } else {
        let extension = path.split(".")[path.split(".").length - 1];

        if (extension == "png" || extension == "jepg" || extension == "svg") {
          res
            .status(200)
            .json({ content: "Image files can't be edited or viewed." });
        } else if (
          extension == "jar" ||
          extension == "exe" ||
          extension == "sh"
        ) {
          res
            .status(200)
            .json({ content: "Binary files can't be edited or viewed." });
        } else if (
          fs.statSync(`servers/${req.params.id}/${path}`).size > 500000
        ) {
          res.status(200).json({ content: "File too large." });
        } else {
          let versionsArray = [];
          //get the file's previous versions
          if (
            fs.existsSync(
              `servers/${req.params.id}/.fileVersions/${req.params.path}`
            )
          ) {
            versionsArray = fs.readdirSync(
              `servers/${req.params.id}/.fileVersions/${req.params.path}`
            );
          }
          res.status(200).json({
            content: fs.readFileSync(
              `servers/${req.params.id}/${path}`,
              "utf8"
            ),
            versions: versionsArray,
          });
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
  if (hasAccess(token, account) && fs.existsSync(`servers/${req.params.id}/`)) {
    let path = req.params.path;
    if (req.params.path.includes("*")) {
      path = req.params.path.split("*").join("/");
    }
    let extension = path.split(".")[path.split(".").length - 1];
    let filename = path.split("/")[path.split("/").length - 1];
    if (
      req.body.content !== undefined &&
      fs.existsSync(`servers/${req.params.id}/${path}`) &&
      (extension == "yml" ||
        extension == "yaml" ||
        extension == "json" ||
        extension == "toml") &&
      filename != "server.json" &&
      filename != "velocity.toml" &&
      filename != "modrinth.index.json" &&
      filename != "curseforge.index.json" &&
      filename != "config.yml" &&
      fs.statSync(`servers/${req.params.id}/${path}`).size <= 500000
    ) {
      if (
        !fs.existsSync(
          `servers/${req.params.id}/.fileVersions/${req.params.path}`
        )
      ) {
        fs.mkdirSync(
          `servers/${req.params.id}/.fileVersions/${req.params.path}`
        );
      }
      //write only the difference between the old file and the new file
      let oldFile = fs.readFileSync(`servers/${req.params.id}/${path}`, "utf8");
      let newFile = req.body.content;
      let diff = JsDiff.diffLines(oldFile, newFile);
      let diffString = "";
      diff.forEach((part) => {
        if (part.added) {
          diffString += `+${part.value}`;
        } else if (part.removed) {
          diffString += `-${part.value}`;
        } else {
          diffString += part.value;
        }
      });
      console.log(diffString);
      let filename = fs.statSync(`servers/${req.params.id}/${path}`).mtimeMs;
      console.log(filename);
      fs.writeFileSync(
        `servers/${req.params.id}/.fileVersions/${req.params.path}/${filename}`,
        diffString
      );

      fs.writeFileSync(`servers/${req.params.id}/${path}`, req.body.content);
      res.status(200).json({ msg: "Done" });
    } else {
      res.status(400).json({ msg: "Invalid request." });
    }
  } else {
    res.status(401).json({ msg: "Invalid credentials." });
  }
});

router.delete("/:id/file/:path", function (req, res) {
  email = req.headers.email;
  token = req.headers.token;
  account = require("../accounts/" + email + ".json");
  server = require(`../servers/${req.params.id}/server.json`);
  if (hasAccess(token, account) && fs.existsSync(`servers/${req.params.id}/`)) {
    let path = req.params.path;
    if (req.params.path.includes("*")) {
      path = req.params.path.split("*").join("/");
    }
    let extension = path.split(".")[path.split(".").length - 1];
    let filename = path.split("/")[path.split("/").length - 1];
    if (
      fs.existsSync(`servers/${req.params.id}/${path}`) &&
      (extension == "yml" ||
        extension == "yaml" ||
        extension == "json" ||
        extension == "toml" ||
        extension == "jar") &&
      filename != "server.json" &&
      filename != "velocity.toml" &&
      filename != "modrinth.index.json" &&
      filename != "curseforge.index.json"
    ) {
      fs.unlinkSync(`servers/${req.params.id}/${path}`);
      res.status(200).json({ msg: "Done" });
    } else {
      res.status(400).json({ msg: "Invalid request." });
    }
  } else {
    res.status(401).json({ msg: "Invalid credentials." });
  }
});

router.post("/:id/rename/", function (req, res) {
  let email = req.headers.email;
  let token = req.headers.token;
  let account = require("../accounts/" + email + ".json");
  if (hasAccess(token, account) && fs.existsSync(`servers/${req.params.id}/`)) {
    server = require(`../servers/${req.params.id}/server.json`);
    server.name = req.query.newName;
    fs.writeFileSync(
      `servers/${req.params.id}/server.json`,
      JSON.stringify(server, null, 2)
    );

    account = require("../accounts/" + email + ".json");
    account.servers[
      account.servers.findIndex((server) => {
        return server.id == req.params.id;
      })
    ].name = req.query.newName;
    fs.writeFileSync(
      `accounts/${email}.json`,
      JSON.stringify(account, null, 2)
    );
    res.status(200).json({ msg: "Done" });
  } else {
    res.status(401).json({ msg: "Invalid credentials." });
  }
});

router.get("/:id/storageInfo", function (req, res) {
  let email = req.headers.email;
  let token = req.headers.token;
  let account = require("../accounts/" + email + ".json");
  if (hasAccess(token, account) && fs.existsSync(`servers/${req.params.id}/`)) {
    let limit = -1;
    let used = files.folderSizeRecursive(`servers/${req.params.id}/`);

    if (config.serverStorageLimit !== undefined) {
      limit = config.serverStorageLimit;
    }

    res.status(200).json({ used: used, limit: limit });
  } else {
    res.status(401).json({ msg: "Invalid credentials." });
  }
});

function hasAccess(token, account) {
  if (!enableAuth) return true;
  else return token === account.token && server.accountId == account.accountId;
}

module.exports = router;
