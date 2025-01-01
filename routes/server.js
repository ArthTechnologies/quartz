const express = require("express");
const router = express.Router();
const files = require("../scripts/files.js");
const f = require("../scripts/mc.js");
const multer = require("multer");
const upload = multer({ dest: "assets/uploads/" });
const readJSON = require("../scripts/utils.js").readJSON;
const data = readJSON("assets/data.json");
const JsDiff = require("diff");
const config = require("../scripts/utils.js").getConfig();
const exec = require("child_process").exec;
const fs = require("fs");
const writeJSON = require("../scripts/utils.js").writeJSON;

const stripeKey = config.stripeKey;
const stripe = require("stripe")(stripeKey);
const enableAuth = JSON.parse(config.enableAuth);
const enablePay = JSON.parse(config.enablePay);
const enableVirusScan = JSON.parse(config.enableVirusScan);
const portOffset = parseInt(config.portOffset);
const idOffset = parseInt(config.idOffset);

function writeServer(id, owner, state, name, software, version, productID, allowedAccounts, specialDatapacks, specialPlugins) {
  let tsv = fs.readFileSync("servers.tsv", "utf8").split("\n");
  let row = [id, owner, state, name, software, version, productID, allowedAccounts, specialDatapacks, specialPlugins].join("\t") + "\n";
  let alreadyExists = false;
  for (let i in tsv) {
    if (tsv[i].split("\t")[0] == id) {
      alreadyExists = true;
      tsv[i] = row;
    }
  }
  if (!alreadyExists) {
    tsv.push(row);
  }
  fs.writeFileSync("servers.tsv", tsv.join("\n"));
}
router.get(`/reserve`, function (req, res) {
  let email = req.headers.username;
  let token = req.headers.token;
  let account = readJSON("accounts/" + email + ".json");
  if (token === account.token || !enableAuth) {
    let resObj = {atCapacity: true, id: -1};
    //see if there is an available id
    let id = -1;
    let serversFolder = fs.readdirSync("servers");
    if (serversFolder.length  == 0) {
      id = 0;
    }
    //remove any non-numerical folders
    serversFolder = serversFolder.filter((item) => {
      return !isNaN(parseInt(item));
    });
    //sort numerically
    serversFolder.sort((a, b) => {
      return a - b;
    }
    );
    for (let i = 0; i < serversFolder.length; i++) {
      if (!fs.existsSync("servers/" + i)) {
        id = i;
        break;
      }
    }
    //make sure the id is not above the max
    if (id > parseInt(config.maxServers)) {
      id = -1;
    } else {
      resObj.atCapacity = false;
    }
    resObj.id = id;
    res.status(200).json(resObj);
    //note: once tsv system is fully implemented, the server should be written to the tsv file so the session can be cleared even if quartz restarts
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
}
);

router.get(`/claim/:id`, function (req, res) {
  let email = req.headers.username;
  let token = req.headers.token;
  let account = readJSON("accounts/" + email + ".json");
  let id = (parseInt(req.params.id) + parseInt(idOffset));
  if (token === account.token || !enableAuth) {
    if (id < parseInt(config.maxServers)) {
      console.log(account.servers + " servers");
      if (!account.servers.includes(id)) {
        account.servers.push(id);
        writeJSON("accounts/" + email + ".json", account);
        //to-do: make a way to write the account tsv file
        fs.mkdirSync("servers/" + id);
        res.status(200).json({ msg: `Success. Server claimed.` });
      } else {
        res.status(400).json({ msg: `Server already claimed.` });
      }
    } else {
      res.status(400).json({ msg: `Invalid server ID.` });
    }
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

router.get(`/:id`, function (req, res) {
  try {
    let email = req.headers.username;
    let token = req.headers.token;
    let account = readJSON("accounts/" + email + ".json");

 
    if (hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset)))) {
      //add cors header
      res.header("Access-Control-Allow-Origin", "*");
    let id = (parseInt(req.params.id) + parseInt(idOffset));
      res.status(200).json(f.checkServer(id));
    } else {
      res.status(401).json({ msg: `Invalid credentials.` });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: err });
  }
});
router.post(`/:id/state/:state`, function (req, res) {
  let email = req.headers.username;
  let token = req.headers.token;
  let account = readJSON("accounts/" + email + ".json");
  let server = readJSON("servers/" + (parseInt(req.params.id) + parseInt(idOffset)) + "/server.json");
  if (hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset)))) {
    state = req.params.state;
  let id = (parseInt(req.params.id) + parseInt(idOffset));
    let token = req.headers.token;

    if (
      (state == "start") |
      (state == "stop") |
      (state == "restart") |
      (state == "kill")
    ) {
      switch (state) {
        case "start":
          f.run(id, undefined, undefined, undefined, undefined, email, false);
          break;
        case "stop":
          f.stop(id);
          break;
        case "kill":
          f.kill(id);
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

router.delete(`/:id/:modtype(plugin|datapack|mod)`, function (req, res) {
  let email = req.headers.username;
  let token = req.headers.token;
  let account = readJSON("accounts/" + email + ".json");
  let server = readJSON("servers/" + (parseInt(req.params.id) + parseInt(idOffset)) + "/server.json");
  if (hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset)))) {
  let id = (parseInt(req.params.id) + parseInt(idOffset));
    pluginId = req.query.pluginId;
    pluginPlatform = req.query.pluginPlatform;
    pluginName = req.query.pluginName;
    let extension = "jar";
    modtype = req.params.modtype;
    if (modtype == "datapack") {
      modtype = "world/datapack";
      extension = "zip";
    }

    const fs = require("fs");

    //delete platform_id_name.jar
    console.log(
      id + modtype + pluginPlatform + "_" + pluginId + "_" + pluginName + "." + extension
    );
    fs.unlinkSync(
      `servers/${id}/${modtype}/${pluginPlatform}_${pluginId}_${pluginName}.${extension}`
    );

    res.status(200).json({ msg: `Success. Mod deleted.` });
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

router.get(`/:id/:modtype(plugins|datapacks|mods)`, function (req, res) {
  let email = req.headers.username;
  let token = req.headers.token;
  let account = readJSON("accounts/" + email + ".json");
  let server = readJSON("servers/" + (parseInt(req.params.id) + parseInt(idOffset)) + "/server.json");
  if (hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset)))) {
    let modtype = req.params.modtype;
    let extension = "jar";
    if (modtype == "datapacks") {
      modtype = "world/datapacks";
      extension = "zip";
    }
    let mods = [];
    let unknownMods = [];
    let id = (parseInt(req.params.id) + parseInt(idOffset));
    let modpack;

    let path = "servers/" + id;
    if (server.software == "quilt") {
      path += "/server";
    }
    if (fs.existsSync(`${path}/modrinth.index.json`)) {
      modpack = readJSON(`${path}/modrinth.index.json`);
    } else if (fs.existsSync(`${path}/curseforge.index.json`)) {
      modpack = readJSON(`${path}/curseforge.index.json`);
    }

    fs.readdirSync(`${path}/${modtype}`).forEach((file) => {
      if (file.startsWith("gh_")) {
        mods.push({
          platform: file.split("_")[0],
          id: file.split("_")[1] + "/" + file.split("_")[2],
          name: file.split("_")[3].replace("."+extension, ""),
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
          name: file.split("_")[2].replace("."+extension, ""),
          filename: file,
          date: fs.statSync(`${path}/${modtype}/${file}`).mtimeMs,
        });
      } else if (!fs.statSync(`${path}/${modtype}/${file}`).isDirectory()) {
        unknownMods.push({
          filename: file,
          date: fs.statSync(`${path}/${modtype}/${file}`).mtimeMs,
        });
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
  let email = req.headers.username;
  let token = req.headers.token;
  let account = readJSON("accounts/" + email + ".json");
  let server = readJSON("servers/" + (parseInt(req.params.id) + parseInt(idOffset)) + "/server.json");
  if (hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset)))) {
  let id = (parseInt(req.params.id) + parseInt(idOffset));
    version = req.query.version;

    server.version = version;
    writeJSON("servers/" + id + "/server.json", server);

    f.stopAsync(id, () => {
      f.run(id, undefined, undefined, undefined, undefined, email, false);
    });
    res.status(202).json({ msg: `Success. Server updated.` });
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

let lastPlugin = "";
router.post(`/:id/add/:modtype(plugin|datapack|mod)`, function (req, res) {
  let email = req.headers.username;
  let token = req.headers.token;
  let account = readJSON("accounts/" + email + ".json");
  let server = readJSON("servers/" + (parseInt(req.params.id) + parseInt(idOffset)) + "/server.json");
  if (hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset)))) {
    //add cors header
    res.header("Access-Control-Allow-Origin", "*");
  let id = (parseInt(req.params.id) + parseInt(idOffset));
    let extension = "jar";
    pluginUrl = req.query.pluginUrl;
    pluginId = req.query.id;
    pluginName = req.query.name;
    pluginName = pluginName.replace(/\//g, "-");
    modtype = req.params.modtype;
    if (modtype == "datapack") {
      modtype = "world/datapack";
      extension = "zip";
    }
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
          `servers/${id}/${modtype}s/${platform}_${pluginId}_${pluginName}.${extension}`,
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
  let email = req.headers.username;
  let token = req.headers.token;
  let account = readJSON("accounts/" + email + ".json");
  let server = readJSON("servers/" + (parseInt(req.params.id) + parseInt(idOffset)) + "/server.json");
  if (hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset)))) {
    f.stopAsync((parseInt(req.params.id) + parseInt(idOffset)), () => {
      f.downloadModpack(
        (parseInt(req.params.id) + parseInt(idOffset)),
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

router.post(`/:id/toggleDisable/:modtype(plugin|datapack|mod)`, function (req, res) {
  let email = req.headers.username;
  let token = req.headers.token;
  let account = readJSON("accounts/" + email + ".json");
  let server = readJSON("servers/" + (parseInt(req.params.id) + parseInt(idOffset)) + "/server.json");
  if (hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset)))) {
  let id = (parseInt(req.params.id) + parseInt(idOffset));
  
    filename = req.query.filename;
    modtype = req.params.modtype;
    if (modtype == "datapack") {
      modtype = "world/datapack";
    }
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

router.post(`/new/:id`, function (req, res) {
  try {
    let email = req.headers.username;
    let token = req.headers.token;
  let id = (parseInt(req.params.id) + parseInt(idOffset));
    if (!enableAuth) email = "noemail";
    let account = readJSON("accounts/" + email + ".json");
    console.log(
      "creating server for " +
        email +
        "owns id? " +
        JSON.stringify(account.servers).includes(id)
    );
    console.log("../accounts/" + email + ".json");
    console.log("account", account);
    if (token === account.token || !enableAuth) {
      if (!fs.existsSync("servers/" + id + "/server.json")) {
        console.log(id);
        console.log(account.servers);
        if (JSON.stringify(account.servers).includes(id)) {
          console.log("debug: " + email + req.headers.username);
          if (account.servers == undefined) account.servers = [];
          let fullServers = 0;
          for (i in account.servers) {
            if (account.servers[i] != undefined) {
              if (fs.existsSync("servers/" + account.servers[i]+"/server.json")) fullServers++;
            }
          }
          //add cors header
          res.header("Access-Control-Allow-Origin", "*");

          const datajson = readJSON("assets/data.json");
          let serverFolders = fs.readdirSync("servers");
          let numServers = 0;
          for (let i = 0; i < serverFolders.length; i++) {
            if (fs.existsSync("servers/" + i + "/server.json")) {
              numServers++;
            }
          }
          datajson.numServers = numServers;
          writeJSON("assets/data.json", datajson);
          em = req.headers.username;

          let cid = "";
          console.log("debug: " + email + req.headers.username + em);
          if (
            (!enablePay ||
              (account.servers.length == account.freeServers &&
                account.freeServers > 0)) &&
            (config.maxServers > datajson.numServers ||
              config.maxServers == undefined ||
              datajson.numServers == undefined)
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
              server.webmap = false;
              server.voicechat = false;
              server.discordsrv = false;
              server.chunky = false;
              if (!fs.existsSync("servers/" + id)) {
                fs.mkdirSync("servers/" + id);
              }
              writeJSON("servers/" + id + "/server.json", server);
              console.log("debuglog2 " + id + server.id);
              writeJSON("accounts/" + email + ".json", account);
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
            res
              .status(202)
              .json({ success: true, msg: `Success. Server created.` });
          } else if (config.maxServers < datajson.numServers) {
            console.log(
              "max servers reached, " +
                config.maxServers +
                " " +
                datajson.numServers
            );
            res
              .status(400)
              .json({ success: false, msg: "Maximum servers reached." });
          } else {
            console.log("debug: " + email + req.headers.username + em);
            stripe.customers.list(
              {
                limit: 100,
                email: account.email,
              },
              function (err, customers) {
                if (err) {
                  console.log("err");
                  return "no";
                } else {
                  console.log("debug: " + email + req.headers.username + em);

                  if (customers.data.length > 0) {
                    cid = customers.data[0].id;

                    //check the customer's subscriptions and return it
                    stripe.subscriptions.list(
                      {
                        customer: cid,
                        limit: 100,
                      },
                      function (err, subscriptions) {
                        let subs = 0;
                        let planId = "";
                        //go through each item in the subscriptions.data array and if its not undefined, add 1 to the subscriptions variable
                        for (i in subscriptions.data) {
                          console.log("plan object");
                          console.log(subscriptions.data[i].plan);
                          planId = subscriptions.data[i].plan.product;
                          if (subscriptions.data[i] != undefined) {
                            subs++;
                          }
                        }
                        let freeServers = 0;
                        if (account.freeServers != undefined) {
                          freeServers = parseInt(account.freeServers);
                        }
                        let canCreateServer = subs + freeServers > fullServers;
                        console.log("canCreateServer: " + subs + " "+freeServers + ">" + fullServers);
                        if (canCreateServer) {
                          if (
                            em !== "noemail" &&
                            req.body.software !== "undefined" &&
                            req.body.version !== "undefined" &&
                            req.body.name !== "undefined"
                          ) {
                            console.log(
                              "debug: " + email + req.headers.username + em
                            );
                            server = {};
                            server.name = req.body.name;
                            server.software = req.body.software;
                            server.version = req.body.version;
                            server.addons = req.body.addons;
                            server.accountId = account.accountId;
                            server.id = id;
                            server.productID = planId;
                            if (!fs.existsSync("servers/" + id)) {
                              fs.mkdirSync("servers/" + id);
                            }
                            writeJSON("servers/" + id + "/server.json", server);
                            writeJSON("accounts/" + email + ".json", account);
                            console.log(req.body);
                          }
                          console.log(
                            "debug: " + email + req.headers.username + em
                          );
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
          res.status(401).json({
            success: false,
            msg: `You don't own (ID: ${(parseInt(req.params.id) + parseInt(idOffset))}).`,
          });
        }
      } else {
        res.status(401).json({
          success: false,
          msg: `There's already a server using (ID: ${(parseInt(req.params.id) + parseInt(idOffset))}). Contact support if you think this is a mistake.`,
        });
      }
    } else {
      res.status(401).json({ success: false, msg: `Invalid credentials.` });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: err });
  }
});
router.post(`/:id/setInfo`, function (req, res) {
  let email = req.headers.username;
  let token = req.headers.token;
  let account = readJSON("accounts/" + email + ".json");
  let server = readJSON("servers/" + (parseInt(req.params.id) + parseInt(idOffset)) + "/server.json");
  if (hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset)))) {
  let id = (parseInt(req.params.id) + parseInt(idOffset));
    iconUrl = req.body.icon;
    desc = req.body.desc;

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
      if (f.checkServer(id).software == "paper") {
        f.proxiesToggle(
          (parseInt(req.params.id) + parseInt(idOffset)),
          req.body.proxiesEnabled,
          req.body.fSecret
        );
      }
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
  let email = req.headers.username;
  let token = req.headers.token;
  let account = readJSON("accounts/" + email + ".json");
  let server = readJSON("servers/" + (parseInt(req.params.id) + parseInt(idOffset)) + "/server.json");
  if (hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset)))) {
    //send the motd and iconUrl
    let iconUrl = "/images/placeholder.webp";
    let desc = "";
    let secret;
    let proxiesEnabled;
  let id = (parseInt(req.params.id) + parseInt(idOffset));

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
      if (f.checkServer(id).software == "paper") {
        secret = fs.readFileSync(
          `servers/${id}/config/paper-global.yml`,
          "utf8"
        );

        let secretLines = secret.split("\n");

        let index2 = secretLines.findIndex((line) => {
          return line.includes("secret:");
        });
        secret = secretLines[index2].split(":")[1].trim();
        //cut quotes off of secret
        secret = secret.substring(1, secret.length - 1);
      }

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
    }

    if (fs.existsSync(`servers/${id}/iconurl.txt`)) {
      iconUrl = fs.readFileSync(`servers/${id}/iconurl.txt`).toString();
    }

    let automaticStartup = false;

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
  try {
    console.log("deleting1 " + (parseInt(req.params.id) + parseInt(idOffset)));
    let email = req.headers.username;
    let token = req.headers.token;
    let account = readJSON("accounts/" + email + ".json");
    let server = readJSON("servers/" + (parseInt(req.params.id) + parseInt(idOffset)) + "/server.json");

    if (hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset)))) {
      if (!fs.existsSync("assets/deletions-log.txt")) {
        fs.writeFileSync(
          "assets/deletions-log.txt",
          "[" +
            new Date().toLocaleString() +
            "] " +
            email +
            " made a delete request for server " +
            (parseInt(req.params.id) + parseInt(idOffset)) +
            "\n"
        );
      } else {
        fs.appendFileSync(
          "assets/deletions-log.txt",
          "[" +
            new Date().toLocaleString() +
            "] " +
            email +
            " made a delete request for server " +
            (parseInt(req.params.id) + parseInt(idOffset)) +
            "\n"
        );
      }

      if (
        files.hash(req.body.password, account.salt).split(":")[1] ==
          account.password ||
        !enableAuth ||
        account.type != "email"
      ) {
        console.log("deleting2 " + (parseInt(req.params.id) + parseInt(idOffset)));
        if (f.getState((parseInt(req.params.id) + parseInt(idOffset))) == "true") {
          console.log("deleting2.5 server is still on, killing it...");
          f.killAsync((parseInt(req.params.id) + parseInt(idOffset)), () => {
            console.log("deleting2.6 server killed");
            deleteServer();
          });
        } else {
          deleteServer();
        }

        function deleteServer() {
          console.log("deleting3 " + (parseInt(req.params.id) + parseInt(idOffset)));
          writeJSON(`accounts/${email}.json`, account);
          console.log("deleting4 " + (parseInt(req.params.id) + parseInt(idOffset)));
          files.removeDirectoryRecursiveAsync(
            `servers/${(parseInt(req.params.id) + parseInt(idOffset))}`,
            () => {
              console.log("deleting5 " + (parseInt(req.params.id) + parseInt(idOffset)));
              res.status(200).json({ msg: `Deleted server` });
              console.log("checking if server still exists...");
              setTimeout(() => {
                //sometimes, it'll delete the files inside a folder but not the folder itself.

                console.log("making sure server is deleted...");
                files.removeDirectoryRecursive(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}`);
              }, 5000);
            }
          );
        }
      } else {
        res.status(401).json({ msg: `Invalid credentials.` });
      }
    } else {
      res.status(401).json({ msg: `Invalid credentials.` });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: err });
  }
});

router.get("/:id/world", function (req, res) {
  console.log(req.headers);
  let email = req.headers.username;
  let token = req.headers.token;
  let account = readJSON("accounts/" + email + ".json");
  let server = readJSON("servers/" + (parseInt(req.params.id) + parseInt(idOffset)) + "/server.json");
  if (hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset)))) {
    //zip /servers/id/world and send it to the client
  let id = (parseInt(req.params.id) + parseInt(idOffset));
    let path = "servers/" + id;
    if (server.software == "quilt") {
      path += "/server";
    }

    let cwd = path + "/world";
    //some modpacks make a world folder with a capital W, this checks for that
    if (fs.existsSync(path + "/World")) {
      const { execSync } = require("child_process");
      let sizeOfLowercase = parseInt(execSync(`du -s ${path}/world | cut -f1`));
      let sizeOfUppercase = parseInt(execSync(`du -s ${path}/World | cut -f1`));

      if (sizeOfUppercase > sizeOfLowercase) {
        cwd = path + "/World";
      }
    }

    try {
      exec(`zip -r -q -X ../world.zip .`, { cwd: cwd }, (err) => {
        res.setHeader("Content-Type", "application/zip");

        res.setHeader("Content-Disposition", `attachment; filename=world.zip`);

        res.status(200).download(`${path}/world.zip`, "world.zip", () => {
          //delete the zip file
          fs.unlinkSync(`${path}/world.zip`);
        });
      });
    } catch {
      console.log("error downloading or zipping world");
    }
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

router.post("/:id/world", upload.single("file"), function (req, res) {
  console.log("upload world 0");
  //this disables timeouts if virus scanning takes too long
  req.setTimeout(0);
let id = (parseInt(req.params.id) + parseInt(idOffset));
  let email = req.headers.username;
  let token = req.headers.token;
  let account = readJSON("accounts/" + email + ".json");
  let server = readJSON("servers/" + (parseInt(req.params.id) + parseInt(idOffset)) + "/server.json");
  if (hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset)))) {
    let lock = false;
    let lock2 = false;
    console.log("before stopping");
    f.killAsync((parseInt(req.params.id) + parseInt(idOffset)), () => {
      console.log("after stopping");
      setTimeout(() => {
        if (!lock2) {
          lock2 = true;
          if (!req.file) {
            files.removeDirectoryRecursiveAsync(`servers/${id}/world`, () => {
              console.log("no file");
              let worldgenMods = [];
              if (req.query.worldgenMods != undefined) {
                if (req.query.worldgenMods.indexOf(",") > -1) {
                  worldgenMods = req.query.worldgenMods.split(",");
                } else if (req.query.worldgenMods != "") {
                  worldgenMods.push(req.query.worldgenMods);
                }
              }
              const serverJson = readJSON(`servers/${id}/server.json`);
              serverJson.addons = worldgenMods;
              writeJSON(`servers/${id}/server.json`, serverJson);
              try {
                fs.mkdirSync(`servers/${id}/world`);
              } catch (err) {
                console.log(err);
              }
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
              textByLine[
                index2
              ] = `level-type=minecraft:${req.query.worldType}`;
              var newText = textByLine.join("\n");

              fs.writeFile(
                `servers/${id}/server.properties`,
                newText,
                (err) => {
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
                }
              );
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
              console.log("debug log");
              try {
                fs.mkdirSync(`servers/${id}/world`);
              } catch (err) {
                console.log(err);
              }
              fs.mkdirSync(`servers/${id}/world/datapacks`);
              files.removeDirectoryRecursive(`servers/${id}/world_nether`);
              files.removeDirectoryRecursive(`servers/${id}/world_the_end`);
              //unzip the file and put it in /servers/id/world

              const exec = require("child_process").exec;

              if (enableVirusScan) {
                console.log(req.file.path);
                exec(
                  `clamdscan --multiscan --fdpass ${req.file.path}`,
                  {},
                  (err, stdout, stderr) => {
                    if (stdout.indexOf("Infected files: 0") != -1) {
                      res.send("Upload Complete. No Viruses Detected.");
                      unzipFile();
                    } else {
                      res.send("Virus Detected.");
                      fs.rmSync(req.file.path);
                    }
                  }
                );
              } else {
                res.send("Upload Complete.");

                unzipFile();
              }
              function unzipFile() {
                //wait 5s
                setTimeout(() => {
                  exec(
                    `unzip -o ${req.file.path} -d servers/` + id + `/world`,
                    (err, stdout, stderr) => {
                      fs.rmSync(req.file.path);
                      if (err) {
                        console.log(err);
                      } else if (!lock) {
                        console.log("unzipped world");
                        //this makes sure that the unzipped folder is valid
                        if (!fs.existsSync(`servers/${id}/world/level.dat`)) {
                          //checks which folder is the biggest. this should eb the proper world folder
                          let worldFolders = fs.readdirSync(
                            `servers/${id}/world`
                          );
                          console.log("worldFolders: " + worldFolders);
                          let biggestFolder = "";
                          let biggestSize = 0;
                          for (i in worldFolders) {
                            let folder = worldFolders[i];
                            let size = files.folderSizeRecursive(
                              `servers/${id}/world/${folder}`
                            );
                            if (size > biggestSize) {
                              biggestSize = size;
                              biggestFolder = folder;
                            }
                          }
                          exec(
                            `mv servers/${id}/world/${biggestFolder}/* servers/${id}/world/`,
                            (err) => {
                              if (err) {
                                console.log(err);
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
                        } else {
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
                    }
                  );
                }, 5000);
              }
            });
          }
        }
      }, 1000);
    });
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

router.get("/:id/proxy/info", function (req, res) {
  let email = req.headers.username;
  let token = req.headers.token;
  let account = readJSON("accounts/" + email + ".json");
  let server = readJSON("servers/" + (parseInt(req.params.id) + parseInt(idOffset)) + "/server.json");
  if (hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset)))) {
    if (f.checkServer((parseInt(req.params.id) + parseInt(idOffset)))["software"] == "velocity") {
      let lobbyName;

      let config = fs.readFileSync(
        `servers/${(parseInt(req.params.id) + parseInt(idOffset))}/velocity.toml`,
        "utf8"
      );
      let lines = config.split("\n");
      let index = lines.findIndex((line) => {
        return line.includes("try = [");
      });
      lobbyName = lines[index + 1].split('"')[1];
      res.status(200).json({
        secret: fs.readFileSync(
          `servers/${(parseInt(req.params.id) + parseInt(idOffset))}/forwarding.secret`,
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
  let email = req.headers.username;
  let token = req.headers.token;
  let account = readJSON("accounts/" + email + ".json");
  let server = readJSON("servers/" + (parseInt(req.params.id) + parseInt(idOffset)) + "/server.json");
  if (hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset)))) {
    if (f.checkServer((parseInt(req.params.id) + parseInt(idOffset)))["software"] === "velocity") {
      let config = fs.readFileSync(
        `servers/${(parseInt(req.params.id) + parseInt(idOffset))}/velocity.toml`,
        "utf8"
      );
      let lines = config.split("\n");
      let index = lines.findIndex((line) => {
        return line.includes("try = [");
      });
      lines[index + 1] = `  "${req.query.lobbyName}"`;
      let newConfig = lines.join("\n");
      fs.writeFileSync(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/velocity.toml`, newConfig);
      res.status(200).json({ msg: "Done" });
    } else {
      res.status(400).json({ msg: "Not a proxy." });
    }
  } else {
    res.status(401).json({ msg: "Invalid credentials." });
  }
});

router.get("/:id/proxy/servers", function (req, res) {
  let email = req.headers.username;
  let token = req.headers.token;
  let account = readJSON("accounts/" + email + ".json");
  let server = readJSON("servers/" + (parseInt(req.params.id) + parseInt(idOffset)) + "/server.json");
  if (hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset)))) {
    if (f.checkServer((parseInt(req.params.id) + parseInt(idOffset)))["software"] === "velocity") {
      let config = fs.readFileSync(
        `servers/${(parseInt(req.params.id) + parseInt(idOffset))}/velocity.toml`,
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
  let email = req.headers.username;
  let token = req.headers.token;
  let account = readJSON("accounts/" + email + ".json");
  let server = readJSON("servers/" + (parseInt(req.params.id) + parseInt(idOffset)) + "/server.json");
  if (hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset)))) {
    if (f.checkServer((parseInt(req.params.id) + parseInt(idOffset)))["software"] === "velocity") {
      let config = fs.readFileSync(
        `servers/${(parseInt(req.params.id) + parseInt(idOffset))}/velocity.toml`,
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
      fs.writeFileSync(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/velocity.toml`, newConfig);

      if (req.query.ip.split(":")[0] == config.address) {
        let subserverId = parseInt(req.query.ip.split(":")[1]) - portOffset;
        if (
          readJSON("servers/" + subserverId + "/server.json").accountId ==
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
          f.stopAsync((parseInt(req.params.id) + parseInt(idOffset)), () => {
            f.run(
              (parseInt(req.params.id) + parseInt(idOffset)),
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
  let email = req.headers.username;
  let token = req.headers.token;
  let account = readJSON("accounts/" + email + ".json");
  let server = readJSON("servers/" + (parseInt(req.params.id) + parseInt(idOffset)) + "/server.json");
  if (hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset)))) {
    if (f.checkServer((parseInt(req.params.id) + parseInt(idOffset)))["software"] === "velocity") {
      let config = fs.readFileSync(
        `servers/${(parseInt(req.params.id) + parseInt(idOffset))}/velocity.toml`,
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
        fs.readFileSync(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/velocity.toml`, "utf8")
      );
      fs.writeFileSync(
        `servers/${(parseInt(req.params.id) + parseInt(idOffset))}/velocity.toml`,
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
  let email = req.headers.username;
  let token = req.headers.token;
  let account = readJSON("accounts/" + email + ".json");
  let server = readJSON("servers/" + (parseInt(req.params.id) + parseInt(idOffset)) + "/server.json");
  if (hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset)))) {
    if (fs.existsSync(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/`)) {
      res
        .status(200)
        .json(files.readFilesRecursive(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/`));
    } else {
      res.status(200).json([]);
    }
  }
});

router.get("/:id/file/:path", function (req, res) {
  let email = req.headers.username;
  let token = req.headers.token;
  let account = readJSON("accounts/" + email + ".json");
  let server = readJSON("servers/" + (parseInt(req.params.id) + parseInt(idOffset)) + "/server.json");
  if (hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset)))) {
    let path = req.params.path.split("*").join("/");
    if (fs.existsSync(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/${path}`)) {
      if (fs.lstatSync(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/${path}`).isDirectory()) {
        res.status(200).json({
          content:
            "This is a directory, not a file. Listing files: " +
            fs.readdirSync(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/${path}`),
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
          fs.statSync(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/${path}`).size > 500000
        ) {
          res.status(200).json({ content: "File too large." });
        } else {
          let versionsArray = [];
          //get the file's previous versions
          if (
            fs.existsSync(
              `servers/${(parseInt(req.params.id) + parseInt(idOffset))}/.fileVersions/${req.params.path}`
            )
          ) {
            versionsArray = fs.readdirSync(
              `servers/${(parseInt(req.params.id) + parseInt(idOffset))}/.fileVersions/${req.params.path}`
            );
          }
          res.status(200).json({
            content: fs.readFileSync(
              `servers/${(parseInt(req.params.id) + parseInt(idOffset))}/${path}`,
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

router.get("/:id/file/download/:path", function (req, res) {
  let email = req.headers.username;
  let token = req.headers.token;
  let account = readJSON("accounts/" + email + ".json");
  let server = readJSON("servers/" + (parseInt(req.params.id) + parseInt(idOffset)) + "/server.json");
  if (hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset)))) {
    let path = req.params.path;
    if (req.params.path.includes("*")) {
      path = req.params.path.split("*").join("/");
    }
    if (fs.existsSync(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/${path}`)) {
      if (fs.statSync(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/${path}`).isDirectory()) {
        //zip the folder and send it to the client
        exec(
          `zip -r -q -X ../${req.params.path}.zip .`,
          { cwd: `servers/${(parseInt(req.params.id) + parseInt(idOffset))}/${path}` },
          (err) => {
            res.setHeader("Content-Type", "application/zip");

            res.setHeader(
              "Content-Disposition",
              `attachment; filename=${req.params.path}.zip`
            );

            res.status(200).download(
              `servers/${(parseInt(req.params.id) + parseInt(idOffset))}/${path}.zip`,
              `${req.params.path}.zip`,
              () => {
                //delete the zip file
                fs.unlinkSync(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/${path}.zip`);
              }
            );
          }
        );
      } else {
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=${req.params.path}`
        );
        res.status(200).download(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/${path}`);
      }
    } else {
      res.status(400).json({ msg: "Invalid request." });
    }
  } else {
    res.status(401).json({ msg: "Invalid credentials." });
  }
});

router.post("/:id/file/:path", function (req, res) {
  let email = req.headers.username;
  let token = req.headers.token;
  let account = readJSON("accounts/" + email + ".json");
  let server = readJSON("servers/" + (parseInt(req.params.id) + parseInt(idOffset)) + "/server.json");
  if (
    hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset))) &&
    fs.existsSync(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/`)
  ) {
    let path = req.params.path;
    if (req.params.path.includes("*")) {
      path = req.params.path.split("*").join("/");
    }
    let extension = path.split(".")[path.split(".").length - 1];
    let filename = path.split("/")[path.split("/").length - 1];
    if (
      req.body.content !== undefined &&
      fs.existsSync(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/${path}`) &&
      (extension == "yml" ||
        extension == "yaml" ||
        extension == "json" ||
        extension == "toml" ||
        extension == "txt" ||
        extension == "properties") &&
      filename != "server.json" &&
      filename != "velocity.toml" &&
      filename != "modrinth.index.json" &&
      filename != "curseforge.index.json" &&
      !path.includes("Geyser-") &&
      fs.statSync(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/${path}`).size <= 500000
    ) {
      if (
        !fs.existsSync(
          `servers/${(parseInt(req.params.id) + parseInt(idOffset))}/.fileVersions/${req.params.path}`
        )
      ) {
        fs.mkdirSync(
          `servers/${(parseInt(req.params.id) + parseInt(idOffset))}/.fileVersions/${req.params.path}`
        );
      }
      //write only the difference between the old file and the new file
      let oldFile = fs.readFileSync(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/${path}`, "utf8");
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
      let filename = fs.statSync(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/${path}`).mtimeMs;
      console.log(filename);
      fs.writeFileSync(
        `servers/${(parseInt(req.params.id) + parseInt(idOffset))}/.fileVersions/${req.params.path}/${filename}`,
        diffString
      );

      fs.writeFileSync(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/${path}`, req.body.content);
      res.status(200).json({ msg: "Done" });
    } else {
      res.status(400).json({ msg: "Invalid request." });
    }
  } else {
    res.status(401).json({ msg: "Invalid credentials." });
  }
});

router.post(
  "/:id/file/upload/:path",
  upload.single("file"),
  function (req, res) {
    let email = req.headers.username;
    let token = req.headers.token;
    let account = readJSON("accounts/" + email + ".json");
    let server = readJSON("servers/" + (parseInt(req.params.id) + parseInt(idOffset)) + "/server.json");
    if (
      hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset))) &&
      fs.existsSync(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/`)
    ) {
      let id = (parseInt(req.params.id) + parseInt(idOffset));	
      let path = req.params.path;
      let filename = req.query.filename;
      if (req.params.path.includes("*")) {
        path = req.params.path.split("*").join("/");
      }

      if (enableVirusScan) {
        console.log(req.file.path);
        exec(
          `clamdscan --multiscan --fdpass ${req.file.path}`,
          {},
          (err, stdout, stderr) => {
            if (stdout.indexOf("Infected files: 0") != -1) {

              loadFile();
            } else {
              res.send("Virus Detected.");
              fs.rmSync(req.file.path);
            }
          }
        );
      } else {

        loadFile();
      }

      function loadFile() {
        fs.copyFileSync(
          req.file.path,
          "servers/" + id + "/" + path + "/" + filename
        );
        fs.rmSync(req.file.path);
        res.status(200).send("Upload Complete.");

      }
    } else {
      res.status(401).json({ msg: "Invalid credentials." });
    }
  }
);

router.delete("/:id/file/:path", function (req, res) {
  let email = req.headers.username;
  let token = req.headers.token;
  let account = readJSON("accounts/" + email + ".json");
  let server = readJSON(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/server.json`);
  if (
    hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset))) &&
    fs.existsSync(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/`)
  ) {
    let path = req.params.path;
    console.log("DELETING " + req.params.path + " " + email);
    if (req.params.path.includes("*")) {
      path = req.params.path.split("*").join("/");
    }
    let extension = path.split(".")[path.split(".").length - 1];
    let filename = path.split("/")[path.split("/").length - 1];
    if (
      fs.existsSync(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/${path}`) &&
      filename != "server.json"
    ) {
      fs.unlinkSync(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/${path}`);
      res.status(200).json({ msg: "Done" });
    } else {
      res.status(400).json({ msg: "Invalid request." });
    }
  } else {
    res.status(401).json({ msg: "Invalid credentials." });
  }
});

router.delete("/:id/folder/:path", function (req, res) {
  let email = req.headers.username;
  let token = req.headers.token;
  password = req.body.password;
  let account = readJSON("accounts/" + email + ".json");
  let server = readJSON(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/server.json`);
  if (
    hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset))) &&
    fs.existsSync(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/`) &&
    files.hash(password, account.salt).split(":")[1] == account.password
  ) {
    console.log("DELETING " + req.params.path + " " + email);
    let path = req.params.path;
    if (req.params.path.includes("*")) {
      path = req.params.path.split("*").join("/");
    }
    if (
      fs.existsSync(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/${path}`) &&
      path.split("").length >= 3
    ) {
      exec(`rm -rf servers/${(parseInt(req.params.id) + parseInt(idOffset))}/${path}`, (err) => {
        if (err) {
          console.log(err);
        }
      });
      res.status(200).json({ msg: "Done" });
    } else {
      res.status(400).json({ msg: "Invalid request." });
    }
  } else {
    res.status(401).json({ msg: "Invalid credentials." });
  }
});

router.post("/:id/rename/", function (req, res) {
  let email = req.headers.username;
  let token = req.headers.token;
  let account = readJSON("accounts/" + email + ".json");
  if (
    hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset))) &&
    fs.existsSync(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/`)
  ) {
    let server = readJSON(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/server.json`);
    server.name = req.query.newName;
    writeJSON(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/server.json`, server);

    let account = readJSON("accounts/" + email + ".json");

    writeJSON(`accounts/${email}.json`, account);
    res.status(200).json({ msg: "Done" });
  } else {
    res.status(401).json({ msg: "Invalid credentials." });
  }
});

router.get("/:id/storageInfo", function (req, res) {
  let email = req.headers.username;
  let token = req.headers.token;
  let account = readJSON("accounts/" + email + ".json");
  if (
    hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset))) &&
    fs.existsSync(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/`)
  ) {
    let limit = -1;
    let used = files.folderSizeRecursive(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/`);
    let plugins = files.folderSizeRecursive(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/plugins`);
    let mods = files.folderSizeRecursive(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/mods`);
    let worlds = files.folderSizeRecursive(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/world`);

    if (config.serverStorageLimit !== undefined) {
      limit = config.serverStorageLimit * 1024 * 1024 * 1024;
    }

    res.status(200).json({
      used: used,
      limit: limit,
      plugins: plugins,
      mods: mods,
      worlds: worlds,
    });
  } else {
    res.status(401).json({ msg: "Invalid credentials." });
  }
});

router.get("/:id/memoryInfo", function (req, res) {
  let email = req.headers.username;
  let token = req.headers.token;
  let account = readJSON("accounts/" + email + ".json");
  if (
    hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset))) &&
    fs.existsSync(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/`)
  ) {
    try {
      exec(
        `docker ps --filter "publish=${portOffset + id}" --format "{{.ID}}"`,
        (error, stdout, stderr) => {
          let pid = stdout.trim();

          exec(
            `docker stats ${pid} --no-stream --format "{{.MemUsage}}"
    `,
            (err, stdout, stderr) => {
              if (err) {
                res.status(500).json({ success: false, data: err });
              }
              let memory = stdout.split("/")[0];
              res.status(200).json({ success: true, data: memory });
            }
          );
        }
      );
    } catch (e) {
      res.status(500).json({ success: false, data: e });
    }
  } else {
    res.status(401).json({ msg: "Invalid credentials." });
  }
});

router.post("/:id/claimSubdomain", function (req, res) {
  let subdomain = req.query.subdomain;
  let email = req.headers.username;
  let token = req.headers.token;
  let account = readJSON("accounts/" + email + ".json");
  let server = readJSON(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/server.json`);
  if (
    hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset))) &&
    fs.existsSync(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}`)
  ) {
    if (server.subdomain !== undefined) {
      res.status(400).json({ msg: "Server already has a subdomain." });
    } else {
      console.log(`curl https://api.cloudflare.com/client/v4/zones/${
        config.cloudflareZone
      }/dns_records \
    -H 'Content-Type: application/json' \
    -H "X-Auth-Email: ${config.cloudflareEmail}" \
    -H "X-Auth-Key: ${config.cloudflareKey}" \
    -d '{
    "name": "_minecraft._tcp.${subdomain}}",
          "type": "SRV",
      "data": {
         "port": ${portOffset + parseInt((parseInt(req.params.id) + parseInt(idOffset)))},
         "priority": ${portOffset + parseInt((parseInt(req.params.id) + parseInt(idOffset)))},
         "target": "join.arthmc.xyz",
         "weight": 5
      }

    }'`);
      exec(
        `curl https://api.cloudflare.com/client/v4/zones/${
          config.cloudflareZone
        }/dns_records \
    -H 'Content-Type: application/json' \
    -H "X-Auth-Email: ${config.cloudflareEmail}" \
    -H "X-Auth-Key: ${config.cloudflareKey}" \
    -d '{
    "name": "_minecraft._tcp.${subdomain}",
          "type": "SRV",
      "data": {
         "port": ${portOffset + parseInt((parseInt(req.params.id) + parseInt(idOffset)))},
         "priority": ${portOffset + parseInt((parseInt(req.params.id) + parseInt(idOffset)))},
         "target": "join.arthmc.xyz",
         "weight": 5
      }

    }'`,
        (err, stdout, stderr) => {
          if (err) {
            console.log(err);
            res.status(500).json({ msg: "Error claiming subdomain. (1)" });
          } else {
          exec(
            `curl https://api.cloudflare.com/client/v4/zones/${
              config.cloudflareZone
            }/dns_records \
        -H 'Content-Type: application/json' \
        -H "X-Auth-Email: ${config.cloudflareEmail}" \
        -H "X-Auth-Key: ${config.cloudflareKey}" \
        -d '{
        "name": "_minecraft.udp.${subdomain}",
              "type": "SRV",
          "data": {
             "port": ${portOffset + parseInt((parseInt(req.params.id) + parseInt(idOffset)))},
             "priority": ${portOffset + parseInt((parseInt(req.params.id) + parseInt(idOffset)))},
             "target": "join.arthmc.xyz",
             "weight": 5
          }
    
        }'`,
            (err, stdout, stderr) => {
          if (err) {
            console.log(err);
            res.status(500).json({ msg: "Error claiming subdomain. (1)" });
          } else {
            let res2 = JSON.parse(stdout);
            console.log(res2);
            if (res2.success == false) {
              if (res2.errors[0].code == 81058) {
                res.status(400).json({ msg: "Subdomain already taken." });
              } else {
                res.status(500).json({ msg: "Error claiming subdomain. (2)" });
              }
            } else {
              server.subdomain = subdomain;
              writeJSON(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/server.json`, server);
              res.status(200).json({ msg: "Done" });
            }
          }
        }
      );
    }
    });
    }
  } else {
    res.status(401).json({ msg: "Invalid credentials." });
  }
});

router.post("/:id/deleteSubdomain", function (req, res) {
  let email = req.headers.username;
  let token = req.headers.token;
  let subdomain = req.query.subdomain;
  let account = readJSON("accounts/" + email + ".json");
  let server = readJSON(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/server.json`);
  if (
    hasAccess(token, account, (parseInt(req.params.id) + parseInt(idOffset))) &&
    fs.existsSync(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}`) &&
    subdomain == server.subdomain
  ) {
    if (server.subdomain === undefined) {
      res.status(400).json({ msg: "Server doesn't have a subdomain." });
    } else {
      console.log(`curl https://api.cloudflare.com/client/v4/zones/${config.cloudflareZone}/dns_records?name=_minecraft._tcp.${subdomain} \
    -X DELETE \
    -H 'Content-Type: application/json' \
    -H "X-Auth-Email: ${config.cloudflareEmail}" \
    -H "X-Auth-Key: ${config.cloudflareKey}"`);
      exec(
        `curl https://api.cloudflare.com/client/v4/zones/${config.cloudflareZone}/dns_records?name=_minecraft._tcp.${subdomain} \
    -X DELETE \
    -H 'Content-Type: application/json' \
    -H "X-Auth-Email: ${config.cloudflareEmail}" \
    -H "X-Auth-Key: ${config.cloudflareKey}"`,
        (err, stdout, stderr) => {
          if (err) {
            console.log(err);
            res.status(500).json({ msg: "Error deleting subdomain. (1)" });
          } else {
            let res2 = JSON.parse(stdout);
            console.log(res2);
            if (res2.success == false) {
              res.status(500).json({ msg: "Error deleting subdomain. (2)" });
            } else {
              server.subdomain = undefined;
              writeJSON(`servers/${(parseInt(req.params.id) + parseInt(idOffset))}/server.json`, server);
              res.status(200).json({ msg: "Done" });
            }
          }
        }
      );
    }
  } else {
    res.status(401).json({ msg: "Invalid credentials." });
  }
});

/*const httpProxy = require("http-proxy");
const proxy = httpProxy.createProxyServer();

router.get("/:id/webmap", function (req, res) {
  let url = `http://0.0.0.0:${parseInt((parseInt(req.params.id) + parseInt(idOffset))) + 10200}`;
  console.log(`Proxying request to: ${url}`);
  req.url = "/"; // Set the URL to the root before proxying
  proxy.web(req, res, { target: url });
});

router.get("/:id/webmap/:path", function (req, res) {
  let url =
    `http://0.0.0.0:${parseInt((parseInt(req.params.id) + parseInt(idOffset))) + 10200}/` + req.params.path;
  console.log(`Proxying request to: ${url}`);
  req.url = "/"; // Set the URL to the root before proxying
  proxy.web(req, res, { target: url });
});

router.get("/:id/webmap/:path/:path2/", function (req, res) {
  let path2 = req.params.path2;
  req.url = "/"; // Set the URL to the root before proxying
  if (path2.includes("?")) {
    req.url = path2.split("?")[0];
  }

  let url =
    `http://0.0.0.0:${parseInt((parseInt(req.params.id) + parseInt(idOffset))) + 10200}/` +
    req.params.path +
    "/" +
    path2;
  console.log(`Proxying request to: ${url}`);

  proxy.web(req, res, { target: url });
});

router.get("/:id/webmap/:path/:path2/:path3", function (req, res) {
  let url =
    `http://0.0.0.0:${parseInt((parseInt(req.params.id) + parseInt(idOffset))) + 10200}/` +
    req.params.path +
    "/" +
    req.params.path2 +
    "/" +
    req.params.path3;
  console.log(`Proxying request to: ${url}`);
  req.url = "/"; // Set the URL to the root before proxying
  proxy.web(req, res, { target: url });
});*/

function hasAccess(token, account, id) {
  let server = readJSON(`servers/${parseInt(id) - idOffset}/server.json`);
  if (!enableAuth) return true;
  else return token === account.token && server.accountId == account.accountId;
}

module.exports = router;
