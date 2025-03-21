// importing packages
const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");

const fs = require("fs");
const crypto = require("crypto");
const files = require("./scripts/files.js");

exec = require("child_process").exec;
require("dotenv").config();
if (!fs.existsSync("./backup")) {
  fs.mkdirSync("backup");
}
if (!fs.existsSync("./backup/disabledServers")) {
  fs.mkdirSync("backup/disabledServers");
}
if (!fs.existsSync("./servers")) {
  fs.mkdirSync("servers");
} else if (fs.existsSync("./servers/template")) {
  fs.rmSync("./servers/template", { recursive: true });
}

if (!fs.existsSync("config.txt")) {
  //migration from old way of storing settings to config.txt
  if (
    fs.existsSync("stores/settings.json") &&
    fs.existsSync("stores/secrets.json")
  ) {
    fs.unlinkSync("stores/settings.json");
    fs.unlinkSync("stores/secrets.json");
  }
  fs.copyFileSync("assets/template/config.txt", "config.txt");
  console.log(
    "Thanks for installing Quartz! See config.txt and arthmc.xyz/software to get started."
  );
} else {
  //this compares the current config.txt to the template, and adds any new settings to the config.txt
  let template = fs
    .readFileSync("assets/template/config.txt")
    .toString()
    .split("\n");
  let current = fs.readFileSync("config.txt").toString().split("\n");
  for (let i in template) {
    for (let j in current) {
      if (template[i].includes("=") && current[j].includes("=")) {
        let templateLine = template[i].split("=")[0];
        let currentLine = current[j].split("=")[0];
        if (templateLine == currentLine) {
          //pepper and forwardingSecret need to have random values generated
          if (
            (templateLine == "pepper" || templateLine == "forwardingSecret") &&
            current[j].split("=")[1] == ""
          ) {
            template[i] =
              template[i].split("=")[0] +
              "=" +
              crypto
                .createHash("sha256")
                .update(current[j].split("=")[1])
                .digest("hex");
          } else if (
            templateLine == "forwardingSecret" &&
            !current[j].includes("hash_")
          ) {
            template[i] =
              template[i].split("=")[0] +
              "=hash_" +
              files.hashNoSalt(current[j].split("=")[1]);
          } else if (current[j].split("=")[1] == "undefined") {
            template[i] = template[i].split("=")[0] + "=";
          } else {
            template[i] =
              template[i].split("=")[0] + "=" + current[j].split("=")[1];
          }
        }
      }
    }
  }
  fs.writeFileSync("config.txt", template.join("\n"));
}

if (!fs.existsSync("accounts")) {
  fs.mkdirSync("accounts");
  fs.writeFileSync(
    "accounts/noemail.json",
    `{"accountId":"noemail", "servers":[]}`
  );
}

const readJSON = require("./scripts/utils.js").readJSON;
const writeJSON = require("./scripts/utils.js").writeJSON;

//Migration from old file-based servers & accounts format from 1.2 to the 1.3 folder-based one
if (fs.existsSync("accounts.json") && fs.existsSync("servers.json")) {
  const oldAccounts = require("./accounts.json");
  const oldServers = require("./servers.json");
  for (i in oldAccounts) {
    let newAccount = {};
    newAccount = oldAccounts[i];
    newAccount.servers = [];
    newAccount.email = i;
    for (j in oldServers) {
      if (oldServers[j].accountId == oldAccounts[i].accountId) {
        oldServers[j].id = j;
        newAccount.servers.push(oldServers[j]);
        writeJSON(`servers/${j}/server.json`, oldServers[j]);
      }
    }
    writeJSON(`accounts/${i}.json`, newAccount);
  }

  fs.copyFileSync("accounts.json", "backup/accounts.json");

  fs.unlinkSync("accounts.json");
  fs.copyFileSync("servers.json", "backup/servers.json");
  fs.unlinkSync("servers.json");
}

fs.readdirSync("accounts").forEach((file) => {
  //if account is from old email-only system, this adds the "email:" prefix
  if (
    file.includes("@") &&
    !file.includes("email:") &&
    file.split(":")[1] == undefined
  ) {
    fs.renameSync(`accounts/${file}`, `accounts/email:${file}`);
  }
});

const s = require("./scripts/stripe.js");

let modVersions = [{ c: "modded", s: "forge", v: "1.19.4" }];

const config = require("./scripts/utils.js").getConfig();
const stripe = require("stripe")(config.stripeKey);

if (!fs.existsSync("assets/jars")) {
  fs.mkdirSync("assets/java");
  fs.mkdirSync("assets/jars");
  fs.mkdirSync("assets/jars/downloads");
  fs.mkdirSync("assets/uploads");

  fs.writeFileSync(
    "assets/data.json",
    `{"lastUpdate":${Date.now()},"numServers":0}`
  );
  refreshTempToken();
  downloadJars();
}

const datajson = readJSON("./assets/data.json");
if (Date.now() - datajson.lastUpdate > 1000 * 60 * 60 * 12) {
  downloadJars();
  verifySubscriptions();
  backup();
  refreshTempToken();
  removeUnusedAccounts();
}
setInterval(() => {
  downloadJars();
  verifySubscriptions();
  backup();
  refreshTempToken();
  removeUnusedAccounts();
}, 1000 * 60 * 60 * 12);

function refreshTempToken() {
  const datajson = readJSON("./assets/data.json");
  if (datajson.tempToken == undefined) {
    datajson.tempToken =
      Date.now() + ":" + crypto.randomBytes(16).toString("hex");
  }
  if (datajson.tempToken.split("").length < 10) {
    datajson.tempToken =
      Date.now() + ":" + crypto.randomBytes(16).toString("hex");
    writeJSON("assets/data.json", datajson);
  } else {
    //if its more than a week old, refreshes it
    if (Date.now() - datajson.tempToken.split(":")[0] > 1000 * 60 * 60 * 24 * 7)
      datajson.tempToken =
        Date.now() + ":" + crypto.randomBytes(16).toString("hex");
    writeJSON("assets/data.json", datajson);
  }
}

function downloadJars() {
  const datajson = readJSON("./assets/data.json");
  datajson.lastUpdate = Date.now();
  writeJSON("assets/data.json", datajson);
  //geyser
  files.downloadAsync(
    "assets/jars/downloads/cx_geyser-spigot_Geyser.jar",
    "https://download.geysermc.org/v2/projects/geyser/versions/latest/builds/latest/downloads/spigot",
    (data) => {
      if (fs.existsSync(`assets/jars/cx_geyser-spigot_Geyser.jar`)) {
        fs.unlinkSync(`assets/jars/cx_geyser-spigot_Geyser.jar`);
      }
      fs.copyFileSync(
        `assets/jars/downloads/cx_geyser-spigot_Geyser.jar`,
        `assets/jars/cx_geyser-spigot_Geyser.jar`
      );
      fs.unlinkSync(`assets/jars/downloads/cx_geyser-spigot_Geyser.jar`);
    }
  );
  files.downloadAsync(
    "assets/jars/downloads/cx_floodgate-spigot_Floodgate.jar",
    "https://download.geysermc.org/v2/projects/floodgate/versions/latest/builds/latest/downloads/spigot",
    (data) => {
      if (fs.existsSync(`assets/jars/cx_floodgate-spigot_Floodgate.jar`)) {
        fs.unlinkSync(`assets/jars/cx_floodgate-spigot_Floodgate.jar`);
      }
      fs.copyFileSync(
        `assets/jars/downloads/cx_floodgate-spigot_Floodgate.jar`,
        `assets/jars/cx_floodgate-spigot_Floodgate.jar`
      );
      fs.unlinkSync(`assets/jars/downloads/cx_floodgate-spigot_Floodgate.jar`);
    }
  );
  files.downloadAsync(
    "assets/jars/downloads/cx_geyser-velocity_Geyser.jar",
    "https://download.geysermc.org/v2/projects/geyser/versions/latest/builds/latest/downloads/velocity",
    (data) => {
      if (fs.existsSync(`assets/jars/cx_geyser-velocity_Geyser.jar`)) {
        fs.unlinkSync(`assets/jars/cx_geyser-velocity_Geyser.jar`);
      }
      fs.copyFileSync(
        `assets/jars/downloads/cx_geyser-velocity_Geyser.jar`,
        `assets/jars/cx_geyser-velocity_Geyser.jar`
      );
      fs.unlinkSync(`assets/jars/downloads/cx_geyser-velocity_Geyser.jar`);
    }
  );
  files.downloadAsync(
    "assets/jars/downloads/cx_floodgate-velocity_Floodgate.jar",
    "https://download.geysermc.org/v2/projects/floodgate/versions/latest/builds/latest/downloads/velocity",
    (data) => {
      if (fs.existsSync(`assets/jars/cx_floodgate-velocity_Floodgate.jar`)) {
        fs.unlinkSync(`assets/jars/cx_floodgate-velocity_Floodgate.jar`);
      }
      fs.copyFileSync(
        `assets/jars/downloads/cx_floodgate-velocity_Floodgate.jar`,
        `assets/jars/cx_floodgate-velocity_Floodgate.jar`
      );
      fs.unlinkSync(
        `assets/jars/downloads/cx_floodgate-velocity_Floodgate.jar`
      );
    }
  );
  let jarsMcUrl = "https://api.jarsmc.xyz/";
  jarsMcUrl = config.jarsMcUrl;

  //plugins
  files.GET(jarsMcUrl + "jars/arthHosting", (data) => {
    if (!data.includes("html")) {
      data = JSON.parse(data);
      let downloadProgress = [];
      for (i in data) {
        for (j in data[i]) {
          let jar = data[i][j];
          let extension = "jar";
          switch (jar.software) {
            case "terralith":
            case "structory":
            case "incendium":
            case "nullscape":
              extension = "zip";
              break;
          }
          let c = "";
          switch (jar.software) {
            case "paper":
              c = "servers";
              break;
            case "velocity":
              c = "proxies";
              break;
            case "quilt":
              c = "modded";
              break;
            case "vanilla":
              c = "vanilla";
              break;
            case "waterfall":
              c = "proxies";
              break;
            case "forge":
              c = "modded";
              break;
            case "fabric":
              c = "modded";
              break;
            case "snapshot":
              c = "vanilla";
              break;
            case "spigot":
              c = "servers";
              break;
          }

          downloadProgress.push(false);
          function downloadFromJarsMC() {
            files.downloadAsync(
              "assets/jars/downloads/" +
                jar.software +
                "-" +
                jar.version +
                "." +
                extension,
              jarsMcUrl + "jars/" + jar.software + "/" + jar.version,
              (data3) => {
                if (
                  fs.statSync(
                    `assets/jars/downloads/${jar.software}-${jar.version}.${extension}`
                  ).size > 4096
                ) {
                  fs.copyFileSync(
                    `assets/jars/downloads/${jar.software}-${jar.version}.${extension}`,
                    `assets/jars/${jar.software}-${jar.version}.${extension}`
                  );
                  fs.unlinkSync(
                    `assets/jars/downloads/${jar.software}-${jar.version}.${extension}`
                  );
                } else {
                }
              }
            );
          }

          //forge needs to download from JarsMC because serverjars always has the
          //latest version, which is not always the recommended version.
          if (jar.software != "forge") {
            files.downloadAsync(
              "assets/jars/downloads/" +
                jar.software +
                "-" +
                jar.version +
                "." +
                extension,
              "https://centrojars.com/api/fetchJar/" +
                c +
                "/" +
                jar.software +
                "/" +
                jar.version,
              (data2) => {
                if (
                  !fs.existsSync(
                    `assets/jars/downloads/${jar.software}-${jar.version}.${extension}`
                  ) ||
                  fs.readFileSync(
                    `assets/jars/downloads/${jar.software}-${jar.version}.${extension}`
                  ).length == 26351 ||
                  fs.readFileSync(
                    `assets/jars/downloads/${jar.software}-${jar.version}.${extension}`
                  ).length <= 4096
                ) {
                  downloadFromJarsMC();
                  return;
                } else {
                  fs.copyFileSync(
                    `assets/jars/downloads/${jar.software}-${jar.version}.${extension}`,
                    `assets/jars/${jar.software}-${jar.version}.${extension}`
                  );
                  fs.unlinkSync(
                    `assets/jars/downloads/${jar.software}-${jar.version}.${extension}`
                  );
                }
              }
            );
          } else {
            downloadFromJarsMC();
          }
        }
      }
    }
  });
}

function backup() {
  console.log("Backing up");
  try {
    console.log("Backing up");
    if (JSON.parse(config.enableBackups)) {
      let backupsList = config.backupsList.split(",");
      let nodeName = config.nodeName;

      for (i in backupsList) {
        if (backupsList[i] != "") {
          //if backupsList[i]'s last character is a /, remove it
          if (backupsList[i].charAt(backupsList[i].length - 1) == "/") {
            backupsList[i] = backupsList[i].slice(0, -1);
          }

          //if nodeName's first character is a /, remove it
          if (nodeName.charAt(0) == "/") {
            nodeName = nodeName.slice(1);
          }

          exec(
            `rsync -a --delete . ${backupsList[i]}/${nodeName}`,
            (err, stdout, stderr) => {
              if (err) {
                console.log(err);
              } else {
                console.log("Backup to " + backupsList[i] + " successful");
              }
            }
          );
        }
      }
    }
  } catch {
    console.log("Backup setting can't be found in config.");
  }
}

function verifySubscriptions() {
  //we wait 5 minutes to avoid the user of the terminal having a lag spike at startup
  setTimeout(() => {
    if (config.stripeKey != "" && config.enablePay) {
      const accounts = fs.readdirSync("accounts");
      for (i in accounts) {
        if (
          accounts[i].split(".")[accounts[i].split(".").length - 1] == "json"
        ) {
          const account = readJSON(`./accounts/${accounts[i]}`);
          if (account.freeServers == undefined) {
            try {
              const amountOfServers = account.servers.length;
              s.checkSubscription(account.email, (data) => {
                if (data.data.length < amountOfServers) {
                  for (j in account.servers) {
                    const ls = require("child_process").execSync;
                    f.stopAsync(account.servers[j].id, () => {
                      ls(
                        `mv servers/${account.servers[j].id} backup/disabledServers${account.servers[j].id}`
                      );
                    });
                  }

                  if (account.disabledServers == undefined) {
                    account.disabledServers = [];
                  }
                  account.disabledServers.push(account.servers);
                  account.servers = [];
                }
              });
            } catch {
              console.log("Error verifying subscription for " + account.email);
            }
          }
        }
      }
    }
  }, 1000 * 60 * 5);
}

function removeUnusedAccounts() {
  const accounts = fs.readdirSync("accounts");
  for (let i = 0; i < accounts.length; i++) {
    const account = readJSON(`accounts/${accounts[i]}`);

    //there is no system to tell file creation date accurately yet
    let openedRecently =
      account.lastSignin > Date.now() - 1000 * 60 * 60 * 24 * 30;

    let hasServers = account.servers.length > 0;

    if (!hasServers && !openedRecently) {
      let email;
      if (accounts[i].includes("email:"))
        email = accounts[i].split("email:")[1];
      else email = account.email;
      console.log(email);
      if (email != undefined) {
        //checks stripe to see if the account has a subscription
        stripe.customers.list(
          {
            limit: 100,
            email: email,
          },
          function (err, customers) {
            if (err) {
              console.log("err", err);
            } else {
              if (customers.data.length == 0) {
                console.log("Removing unused account" + accounts[i]);
                fs.unlinkSync(`accounts/${accounts[i]}`);
                if (!fs.existsSync("assets/deletions-log.txt")) {
                  fs.writeFileSync(
                    "assets/deletions-log.txt",
                    "[" +
                      new Date().toLocaleString() +
                      "] " +
                      accounts[i] +
                      " was deleted due to inactivity.\n"
                  );
                } else {
                  fs.appendFileSync(
                    "assets/deletions-log.txt",
                    "[" +
                      new Date().toLocaleString() +
                      "] " +
                      accounts[i] +
                      " was deleted due to inactivity.\n"
                  );
                }
              }
            }
          }
        );
      }
    }
  }
}

//This handles commands from the terminal
process.stdin.setEncoding("utf8");

process.stdout.write(
  'Welcome to the terminal!\nType "help" for a list of commands.\n'
);
let userInput = false;
process.stdin.on("data", (data) => {
  const input = data.trim(); // Remove leading/trailing whitespace
  switch (input) {
    case "stop":
    case "end":
    case "exit":
      process.exit(0);
    case "help":
      console.log(
        "Commands:\nstop\nend\nexit\nnumServersOnline\ngetServerOwner\ngetDashboardToken\nscanAccountIds\nscanAccountServers\nbroadcast\nhelp\nclear - clears the terminal\nrefresh - downloads the latest jars, gets the latest version and verifies subscriptions. This automatically runs every 12 hours.\n"
      );
      break;
    case "numServersOnline":
      let numServersOnline = 0;
      fs.readdirSync("servers").forEach((file) => {
        if (f.getState(file) == "true") {
          numServersOnline++;
        }
      });
      console.log(
        numServersOnline +
          " - " +
          (numServersOnline / parseInt(fs.readdirSync("servers").length)) *
            100 +
          "%"
      );
      break;
    case "getServerOwner":
      userInput = true;
      console.log("Enter server id:");
      process.stdin.once("data", (data) => {
        try {
          const serverId = data.trim();
          if (fs.existsSync(`servers/${serverId}/server.json`)) {
            const accountId = readJSON(
              `servers/${serverId}/server.json`
            ).accountId;
            fs.readdirSync("accounts").forEach((file) => {
              const account = readJSON(`accounts/${file}`);
              if (account.accountId == accountId) {
                console.log(file);
                if (!file.includes("email:")) console.log(account.email);
              }
            });
          } else {
            fs.readdirSync("accounts").forEach((file) => {
              try {
                let account = readJSON(`accounts/${file}`);
                if (account.servers.includes(serverId)) {
                  console.log(file);
                  if (!file.includes("email:")) console.log(account.email);
                }
              } catch {
                console.log("error scanning account " + file);
              }
            });
          }
        } catch {
          console.log("error getting server owner");
        }
      });
      break;
    case "getDashboardToken":
      refreshTempToken();
      console.log(datajson.tempToken.split(":")[1]);
      break;
    case "broadcast":
      userInput = true;
      console.log(
        `Enter broadcast message (ex: "Server shutting down in 5 minutes"):`
      );
      process.stdin.once("data", (data) => {
        const message = data.trim();
        for (let i in fs.readdirSync("servers")) {
          const serverId = fs.readdirSync("servers")[i];
          f.writeTerminal(serverId, "say [Broadcast] " + message);
        }
        console.log("Broadcasted message to all servers.");
        userInput = false;
      });

      break;
    case "clear":
      process.stdout.write("\x1B[2J\x1B[0f");
      break;
    case "refresh":
      downloadJars();
      verifySubscriptions();
      refreshTempToken();
      removeUnusedAccounts();
      console.log("downloading latest jars and verifying subscriptions...");
      break;
    case "scanAccountIds":
      fs.readdirSync("accounts").forEach((file) => {
        try {
          let account = readJSON(`accounts/${file}`);
          console.log(account.accountId + " - " + file);
        } catch {
          console.log("error scanning account " + file);
        }
      });
      break;
    case "scanAccountServers":
      fs.readdirSync("accounts").forEach((file) => {
        try {
          let account = readJSON(`accounts/${file}`);
          console.log(file + " - " + account.servers);
        } catch {
          console.log("error scanning account " + file);
        }
      });
      break;
    default:
      if (!userInput) {
        console.log('Unknown command. Type "help" for a list of commands.');
      }
  }
});

let stdout = "";
process.stdout.write = (function (write) {
  return function (string, encoding, fd) {
    stdout += string;
    write.apply(process.stdout, arguments);
  };
})(process.stdout.write);

//this logs the terminal every 5 minutes
setInterval(() => {
  if (stdout != "") {
    fs.writeFileSync("assets/terminal-log.txt", stdout);
  }
}, 1000 * 60 * 5);

files.downloadAsync(
  "assets/java/java21.tar.gz",
  "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.3%2B9/OpenJDK21U-jdk_x64_linux_hotspot_21.0.3_9.tar.gz",
  (data) => {
    files.extractAsync("assets/java/java21.tar.gz", "assets/java", () => {
      fs.unlinkSync("assets/java/java21.tar.gz");
    });
  }
);
files.downloadAsync(
  "assets/java/java17.tar.gz",
  "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.5%2B8/OpenJDK17U-jdk_x64_linux_hotspot_17.0.5_8.tar.gz",
  (data) => {
    files.extractAsync("assets/java/java17.tar.gz", "assets/java", () => {
      fs.unlinkSync("assets/java/java17.tar.gz");
    });
  }
);
files.downloadAsync(
  "assets/java/java8.tar.gz",
  "https://github.com/adoptium/temurin8-binaries/releases/download/jdk8u382-b05/OpenJDK8U-jdk_x64_linux_hotspot_8u382b05.tar.gz",
  (data) => {
    files.extractAsync("assets/java/java8.tar.gz", "assets/java", () => {
      fs.unlinkSync("assets/java/java8.tar.gz");
    });
  }
);
const f = require("./scripts/mc.js");
//this gets the server states every 5 minutes so that if quartz restarts, servers that were up will startup again
function getServerStates() {
  const data = readJSON("./assets/data.json");

  if (data.serverStates == undefined) {
    data.serverStates = [];
  }
  fs.readdirSync("servers").forEach((file) => {
    data.serverStates[file] = file + ":" + f.getState(file);
  });

  writeJSON("./assets/data.json", data);
}

//automatic server start-up systen
const data = readJSON("./assets/data.json");
for (i in data.serverStates) {
  if (data.serverStates[i].split(":")[1] == "true") {
    let id = parseInt(data.serverStates[i].split(":")[0]);
    if (
      fs.existsSync("servers/" + id + "/server.json") &&
      f.getState(id) == "false"
    ) {
      //the multiplier determines the stagger delay by the amount of servers
      let multiplier = data.serverStates.length / 16;

      setTimeout(() => {
        f.run(id, undefined, undefined, undefined, undefined, undefined, false);
      }, 3000 * i * multiplier);
    }
  }
}
setInterval(() => {
  getServerStates();
}, 1000 * 60 * 2);

app.get("/", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "assets/clientMessage.html"));
});
const rateLimit = require("express-rate-limit");
const { get } = require("http");

const limiter = rateLimit({
  max: 300,
  windowMs: 1000,
  message: "Too many request from this IP",
});

const security = (req, res, next) => {
  if (req.url.includes("/accounts/")) {
    next();
  } else {
    accounts = require("./accounts.json");

    if (accounts[req.headers.username].ips != undefined) {
      if (accounts[req.headers.username].ips.includes(files.getIPID(req.ip))) {
        next();
      } else {
        res.status(403).send({
          status: "ERROR",
          error: "IP not allowed",
        });
      }
    }
  }
};
// middlewares
app.use(limiter, express.json(), cors());

app.use("/server", require("./routes/server"));
app.use("/dashboard", require("./routes/dashboard"));
app.use("/checkout", require("./routes/checkout"));
app.use("/info", require("./routes/info"));
app.use("/terminal", require("./routes/terminal"));
app.use("/accounts", require("./routes/accounts"));
app.use("/curseforge", require("./routes/curseforge"));
app.use("/translate", require("./routes/translate"));
app.use("/node", require("./routes/node"));

// port
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Listening on Port: ${port}`));

app.use((err, req, res, next) => {
  switch (err.message) {
    case "NoCodeProvided":
      return res.status(400).send({
        status: "ERROR",
        error: err.message,
      });
    default:
      return res.status(500).send({
        status: "ERROR",
        error: err.message,
      });
  }
});
