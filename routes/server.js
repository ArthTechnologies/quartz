const express = require("express");
const router = express.Router();
const accounts = require("../accounts.json");
let techname;
const f = require("../scripts/mc.js");
const s = require("../scripts/stripe.js");

const fs = require("fs");

let stripekey = require("../stores/secrets.json").stripekey;
const stripe = require("stripe")(stripekey);

let name = "MySurvival Server";

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
  em = req.params.email;
  token = req.headers.token;

  console.log(state);
  if ((state == "start") | (state == "stop") | (state == "restart")) {
    switch (state) {
      case "start":
        f.run(id, undefined, undefined, undefined, undefined, em, false);
        break;
      case "stop":
        f.stop(id);
        break;
      case "restart":
        f.stop(id);
        //wait 5 seconds
        setTimeout(function () {
          f.run(id, undefined, undefined, undefined, undefined, em, false);
        }, 5000);
        break;
      default:
        console.log("Invalid state.");
    }
    console.log(req.headers.request);
    res.status(202).json({ msg: `Success. Server will ${state}.` });
  } else {
    res
      .status(404)
      .json({ msg: `Invalid state. Valid states are start, stop, & restart.` });
  }
    } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

router.delete (`/:id/plugins`, function (req, res) {
    email = req.headers.email;
  token = req.headers.token;
  if (token == accounts[email].token) {
  id = req.params.id;
  pluginId = req.query.pluginId;
  pluginPlatform = req.query.pluginPlatform;
  pluginName = req.query.pluginName;
  token = req.headers.token;

  const fs = require("fs");

  //delete platform_id_name.jar

  fs.unlinkSync(`servers/${id}/plugins/${pluginPlatform}_${pluginId}_${pluginName}.jar`);

  res.status(200).json({ msg: `Success. Plugin deleted.` });

  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

router.get(`/:id/plugins`, function (req, res) {
    email = req.headers.email;
  token = req.headers.token;
  if (token == accounts[email].token) {
  let platforms = [];
  let names = [];
  let ids = [];
  let id = req.params.id;
  token = req.headers.token;

  const fs = require("fs");

  fs.readdirSync(`servers/${id}/plugins`).forEach((file) => {
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

  res.status(200).json({ platforms, names, ids });
    } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

let lastPlugin = "";
router.post(`/:id/addplugin`, function (req, res) {
    email = req.headers.email;
  token = req.headers.token;
  if (token == accounts[email].token) {
  //add cors header
  res.header("Access-Control-Allow-Origin", "*");
  id = req.params.id;
  pluginUrl = req.query.pluginUrl;
  pluginId = req.query.id;
  pluginName = req.query.name;
  
  if (
    pluginUrl.startsWith("https://cdn.modrinth.com/data/") |
    pluginUrl.startsWith("https://github.com/")
  ) {
    const fs = require("fs");
    const exec = require("child_process").exec;
    console.log(`curl -o servers/${id}/plugins/${pluginId}_${pluginName}.jar -LO ${pluginUrl}`);
    if (pluginUrl != lastPlugin) {
      exec(
        `curl -o servers/${id}/plugins/${pluginId}_${pluginName}.jar -LO ${pluginUrl}`,
        function (error) {
          if (error) {
            console.log(error);
          }
          lastPlugin = pluginUrl;
        }
      );
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
  if (token == accounts[email].token) {
  //add cors header
  res.header("Access-Control-Allow-Origin", "*");

  //set id to the number of the last line in servers.csv
  var id = fs.readFileSync("servers.csv").toString().split("\n").length - 1;

  em = req.query.email;
  console.log("creating server.. email: " + req.query.email);
  var store =
    req.body.name +
    "," +
    req.body.software +
    "," +
    req.body.version +
    "," +
    "[" +
    req.body.addons +
    "]" +
    "," +
    em +
    "\n";
  let cid = "";
  if (stripekey.indexOf("sk") == -1) {
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
    console.log(req.body.modpackId + " " + req.body.modpackVersion);
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
  } else {
    console.log(stripekey);
    stripe.customers.list(
      {
        limit: 100,
        email: em,
      },
      function (err, customers) {
        if (err) {
          console.log(err);
          return "no";
        } else {
          if (customers.data.length > 0) {
            cid = customers.data[0].id;
            console.log(cid);

            let servers = fs.readFileSync("servers.csv").toString();
            console.log(req.body);
            console.log(servers.indexOf("Arth"));
            if (servers.indexOf(req.body.name) > -1) {
              res
                .status(409)
                .json({ msg: `Faliure: Server name already exists.` });
            } else {
              console.log("yo");
              //check the customer's subscriptions and return it
              stripe.subscriptions.list(
                {
                  customer: cid,
                  limit: 100,
                },
                function (err, subscriptions) {
                  console.log(subscriptions.data);
                  let subs = 0;
                  //go through each item in the subscriptions.data array and if its not undefined, add 1 to the subscriptions variable
                  for (i in subscriptions.data) {
                    if (subscriptions.data[i] != undefined) {
                      subs++;
                    }
                  }
                  console.log(subs);
                  if (subs > 0) {
                    //create server
                    console.log("creating server");
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
                    console.log("cmds: " + req.body.cmd);
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
                      msg: `Success: Starting Server`,
                      subscriptions: subs,
                      isCustomer: true,
                      cmds: req.body.cmd,
                    });
                  } else {
                    res.status(200).json({
                      msg: `Faliure: Insufficient Funds`,
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
              msg: `Faliure: Please Subscribe`,
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
  //set line 12 of server.properties in the server folder to "motd=" + desc
  var text = fs.readFileSync(`servers/${id}/server.properties`).toString();
  var textByLine = text.split("\n");
  textByLine[11] = `motd=${desc}`;
  text = textByLine.join("\n");
  console.log(desc + " " + iconUrl)
  fs.writeFileSync(`servers/${id}/server.properties`, text);

  //download the icon url with curl and save it to the server folder as server-icon.png
  exec(`curl -LO ${iconUrl} -o servers/${id}/server-icon.png`, (err, stdout, stderr) => {
    if (err) {
      console.log(err);
    } else {
      console.log("icon set");
     //if command "convert" exists, convert the icon to 64x64
     if (fs.existsSync("/usr/bin/convert")) {
      if ( fs.existsSync(`servers/${id}/server-icon.png`)) {
        var sizeOf = require('image-size');
        var dimensions = sizeOf(`servers/${id}/server-icon.png`);
        console.log(dimensions.width, dimensions.height);
        if (dimensions.width > 64 || dimensions.height > 64) {
          //if the image is equal in width and height, convert it to 64x64
          if (dimensions.width == dimensions.height) {
            //convert the image to 64x64, make sure its not smaller, squish it if nesescary
          exec(`convert servers/${id}/server-icon.png -resize 64x64 servers/${id}/server-icon.png`, (err, stdout, stderr) => {
            if (err) {
              console.log(err);
            } else {
              console.log("icon resized");
            }
          });
        } else if (dimensions.width > dimensions.height) {
          let ratio = dimensions.width / dimensions.height;

          let newWidth = 64 * ratio;
          let newHeight = 64;

          exec(`convert servers/${id}/server-icon.png -resize ${newWidth}x${newHeight} -gravity center -crop 64x64+0+0 +repage servers/${id}/server-icon.png`, (err, stdout, stderr) => {
            if (err) {
              console.log(err);
            }
          });
        } else if (dimensions.width < dimensions.height) {
          //this doesnt work for some reason
        }
        }
      }
    } else {
      console.log("convert command not found, not converting image.")
    }
  }
  });





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
  let iconUrl = "";
  let desc = "";
  id = req.params.id;
  var text = fs.readFileSync(`servers/${id}/server.properties`).toString();
  var textByLine = text.split("\n");
  desc = textByLine[11].split("=")[1];

  iconUrl = fs.readFileSync(`servers/${id}/iconurl.txt`).toString();
  res.status(200).json({ msg: `Success: Got server info`, iconUrl: iconUrl, desc: desc });
  } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});


router.delete(`/:id`, function (req, res) {
    email = req.headers.email;
  token = req.headers.token;
  if (token == accounts[email].token) {
  //add cors header
  res.header("Access-Control-Allow-Origin", "*");
  id = req.params.id;
  f.stop(id);
  //remove the idth line from servers.csv and replace it with "deleted"
  var text = fs.readFileSync("servers.csv").toString();
  var textByLine = text.split("\n");
  textByLine[id] = "deleted";
  text = textByLine.join("\n");

  fs.writeFileSync("servers.csv", text);
  fs.writeFile("servers.csv", text, function (err) {
    if (err) return console.log(err);
    console.log("deleted server");
  });
  res.status(202).json({ msg: `Request recieved.` });
    } else {
    res.status(401).json({ msg: `Invalid credentials.` });
  }
});

module.exports = router;
