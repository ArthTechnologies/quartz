// importing packages
const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
const rsa = require("node-rsa");
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

//if it doesnt exist, write to /lib/store.json
if (!fs.existsSync("./stores")) {
  fs.mkdirSync("stores");
  fs.writeFileSync(
    "./stores/secrets.json",
    '{"pepper":"' +
      crypto.randomBytes(12).toString("hex") +
      '","stripekey":"' +
      process.env.stripe_key +
      '", "forwardingSecret":"' +
      crypto.randomBytes(12).toString("hex") +
      '"}'
  );

  fs.writeFileSync(
    "./stores/settings.json",
    `{
      "browserTitle": "Your Servers",
      "webLogo": "/images/sitelogo.svg",
      "enableAuth": true,
      "address": "arthmc.xyz",
      "enablePay": true,
      "latestVersion": "1.19.4",
      "maxServers": 8,
      "jarsMcUrl": "https://api.jarsmc.xyz/",
      "serverStorageLimit": 1000000000,
    }`
  );
} else {
}
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

if (!fs.existsSync("accounts")) {
  fs.mkdirSync("accounts");
}

//Migration from old file-based accounts format to new folder-based one
//Migration from old file-based servers format to new folder-based one
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
        fs.writeFileSync(
          `servers/${j}/server.json`,
          JSON.stringify(oldServers[j])
        );
      }
    }
    fs.writeFileSync(`accounts/${i}.json`, JSON.stringify(newAccount));
  }

  fs.copyFileSync("accounts.json", "backup/accounts.json");
  Jars();
  fs.unlinkSync("accounts.json");
  fs.copyFileSync("servers.json", "backup/servers.json");
  fs.unlinkSync("servers.json");
}

const s = require("./scripts/stripe.js");

let modVersions = [{ c: "modded", s: "forge", v: "1.19.4" }];

if (!fs.existsSync("data")) {
  fs.mkdirSync("data");
  fs.mkdirSync("data/downloads");
  fs.writeFileSync(
    "stores/data.json",
    `{"lastUpdate":${Date.now()},"numServers":0}`
  );
  downloadJars();
}

const datajson = require("./stores/data.json");
if (Date.now() - datajson.lastUpdate > 1000 * 60 * 60 * 12) {
  downloadJars();
  getLatestVersion();
  verifySubscriptions();
}
setInterval(() => {
  downloadJars();
  getLatestVersion();
  verifySubscriptions();
}, 1000 * 60 * 60 * 12);

function downloadJars() {
  const datajson = require("./stores/data.json");
  datajson.lastUpdate = Date.now();
  fs.writeFileSync("stores/data.json", JSON.stringify(datajson));
  //geyser
  files.downloadAsync(
    "data/downloads/cx_geyser-spigot_Geyser.jar",
    "https://ci.opencollab.dev/job/GeyserMC/job/Geyser/job/master/lastSuccessfulBuild/artifact/bootstrap/spigot/build/libs/Geyser-Spigot.jar",
    (data) => {
      if (fs.existsSync(`data/cx_geyser-spigot_Geyser.jar`)) {
        fs.unlinkSync(`data/cx_geyser-spigot_Geyser.jar`);
      }
      fs.copyFileSync(
        `data/downloads/cx_geyser-spigot_Geyser.jar`,
        `data/cx_geyser-spigot_Geyser.jar`
      );
      fs.unlinkSync(`data/downloads/cx_geyser-spigot_Geyser.jar`);
    }
  );
  files.downloadAsync(
    "data/downloads/cx_floodgate-spigot_Floodgate.jar",
    "https://ci.opencollab.dev/job/GeyserMC/job/Floodgate/job/master/lastSuccessfulBuild/artifact/spigot/build/libs/floodgate-spigot.jar",
    (data) => {
      if (fs.existsSync(`data/cx_floodgate-spigot_Floodgate.jar`)) {
        fs.unlinkSync(`data/cx_floodgate-spigot_Floodgate.jar`);
      }
      fs.copyFileSync(
        `data/downloads/cx_floodgate-spigot_Floodgate.jar`,
        `data/cx_floodgate-spigot_Floodgate.jar`
      );
      fs.unlinkSync(`data/downloads/cx_floodgate-spigot_Floodgate.jar`);
    }
  );
  files.downloadAsync(
    "data/downloads/cx_geyser-velocity_Geyser.jar",
    "https://ci.opencollab.dev/job/GeyserMC/job/Geyser/job/master/lastSuccessfulBuild/artifact/bootstrap/velocity/build/libs/Geyser-Velocity.jar",
    (data) => {
      if (fs.existsSync(`data/cx_geyser-velocity_Geyser.jar`)) {
        fs.unlinkSync(`data/cx_geyser-velocity_Geyser.jar`);
      }
      fs.copyFileSync(
        `data/downloads/cx_geyser-velocity_Geyser.jar`,
        `data/cx_geyser-velocity_Geyser.jar`
      );
      fs.unlinkSync(`data/downloads/cx_geyser-velocity_Geyser.jar`);
    }
  );
  files.downloadAsync(
    "data/downloads/cx_floodgate-velocity_Floodgate.jar",
    "https://ci.opencollab.dev/job/GeyserMC/job/Floodgate/job/master/lastSuccessfulBuild/artifact/velocity/build/libs/floodgate-velocity.jar",
    (data) => {
      if (fs.existsSync(`data/cx_floodgate-velocity_Floodgate.jar`)) {
        fs.unlinkSync(`data/cx_floodgate-velocity_Floodgate.jar`);
      }
      fs.copyFileSync(
        `data/downloads/cx_floodgate-velocity_Floodgate.jar`,
        `data/cx_floodgate-velocity_Floodgate.jar`
      );
      fs.unlinkSync(`data/downloads/cx_floodgate-velocity_Floodgate.jar`);
    }
  );
  let jarsMcUrl = "https://api.jarsmc.xyz/";
  if (fs.existsSync("stores/settings.json")) {
    const settings = require("./stores/settings.json");
    if (settings.jarsMcUrl != undefined) {
      jarsMcUrl = settings.jarsMcUrl;
    }
  }

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
              "data/downloads/" +
                jar.software +
                "-" +
                jar.version +
                "." +
                extension,
              jarsMcUrl + "jars/" + jar.software + "/" + jar.version,
              (data3) => {
                if (
                  fs.statSync(
                    `data/downloads/${jar.software}-${jar.version}.${extension}`
                  ).size > 1000
                ) {
                  fs.copyFileSync(
                    `data/downloads/${jar.software}-${jar.version}.${extension}`,
                    `data/${jar.software}-${jar.version}.${extension}`
                  );
                  fs.unlinkSync(
                    `data/downloads/${jar.software}-${jar.version}.${extension}`
                  );
                }
              }
            );
          }

          //forge needs to download from JarsMC because serverjars always has the
          //latest version, which is not always the recommended version.
          if (jar.software != "forge") {
            files.downloadAsync(
              "data/downloads/" +
                jar.software +
                "-" +
                jar.version +
                "." +
                extension,
              "https://serverjars.com/api/fetchJar/" +
                c +
                "/" +
                jar.software +
                "/" +
                jar.version,
              (data2) => {
                if (
                  !fs.existsSync(
                    `data/downloads/${jar.software}-${jar.version}.${extension}`
                  ) ||
                  fs.readFileSync(
                    `data/downloads/${jar.software}-${jar.version}.${extension}`
                  ).length == 26351
                ) {
                  downloadFromJarsMC();
                  return;
                } else {
                  fs.copyFileSync(
                    `data/downloads/${jar.software}-${jar.version}.${extension}`,
                    `data/${jar.software}-${jar.version}.${extension}`
                  );
                  fs.unlinkSync(
                    `data/downloads/${jar.software}-${jar.version}.${extension}`
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

function getLatestVersion() {
  files.GET(
    "https://launchermeta.mojang.com/mc/game/version_manifest.json",
    (vdata) => {
      let version = JSON.parse(vdata).latest.release;
      const settings = require("./stores/settings.json");
      settings.latestVersion = version;
      fs.writeFileSync("./stores/settings.json", JSON.stringify(settings));
      return version;
    }
  );
}

function verifySubscriptions() {
  const accounts = fs.readdirSync("accounts");
  for (i in accounts) {
    if (accounts[i].split(".")[accounts[i].split(".").length - 1] == "json") {
      const account = require(`./accounts/${accounts[i]}`);
      if (!account.bypassStripe) {
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
      }
    }
  }
}

//This handles commands from the terminal
process.stdin.setEncoding("utf8");

process.stdout.write(
  'Welcome to the terminal!\nType "help" for a list of commands.\n'
);

process.stdin.on("data", (data) => {
  const input = data.trim(); // Remove leading/trailing whitespace
  switch (input) {
    case "stop":
    case "end":
    case "exit":
      process.exit(0);
    case "help":
      console.log(
        "Commands:\nstop\nend\nexit\nhelp\nrefresh - downloads the latest jars, gets the latest version and verifies subscriptions. This automatically runs every 12 hours.\n"
      );
      break;
    case "refresh":
      getLatestVersion();
      downloadJars();
      verifySubscriptions();
      console.log(
        "downloading latest jars, verifying subscriptions and getting latest version"
      );
      break;
    default:
      console.log('Unknown command. Type "help" for a list of commands.');
  }
});

//api.github.com/repos/Stardust-Labs-MC/Terralith/releases/latest
if (!fs.existsSync("java")) {
  fs.mkdirSync("java");

  files.download(
    "java/java19.tar.gz",
    "https://github.com/adoptium/temurin19-binaries/releases/download/jdk-19.0.2%2B7/OpenJDK19U-jdk_x64_linux_hotspot_19.0.2_7.tar.gz"
  );
  files.download(
    "java/java17.tar.gz",
    "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.5%2B8/OpenJDK17U-jdk_x64_linux_hotspot_17.0.5_8.tar.gz"
  );
  files.download(
    "java/java11.tar.gz",
    "https://github.com/adoptium/temurin11-binaries/releases/download/jdk-11.0.18%2B10/OpenJDK11U-jdk_x64_linux_hotspot_11.0.18_10.tar.gz"
  );

  setTimeout(function () {
    files.extract("java/java19.tar.gz", "java");
    files.extract("java/java17.tar.gz", "java");
    files.extract("java/java11.tar.gz", "java");
  }, 9000);
}

const data = require("./stores/data.json");
const f = require("./scripts/mc.js");
if (data.serversWithAutomaticStartup != undefined) {
  data.serversWithAutomaticStartup.forEach((server) => {
    let id = server.split(":")[0];
    let email = server.split(":")[1];
    if (fs.existsSync("servers/" + id)) {
      f.run(id, undefined, undefined, undefined, undefined, email, false);
    }
  });
} else {
  data.serversWithAutomaticStartup = [];
  fs.writeFileSync("./stores/data.json", JSON.stringify(data));
}

// generate public and private key
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
});

const exportPublicKey = publicKey.export({
  type: "pkcs1",
  format: "pem",
});
const exportPrivateKey = privateKey.export({
  type: "pkcs1",
  format: "pem",
});

if (!fs.existsSync("public.pem")) {
  fs.writeFileSync("private.pem", exportPrivateKey, { encoding: "utf8" });
  fs.writeFileSync("public.pem", exportPublicKey, { encoding: "utf8" });
}

app.get("/", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "index.html"));
});
const rateLimit = require("express-rate-limit");
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

    if (accounts[req.headers.email].ips != undefined) {
      if (accounts[req.headers.email].ips.includes(files.getIPID(req.ip))) {
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
app.use("/servers", require("./routes/servers"));
app.use("/settings", require("./routes/settings"));
app.use("/terminal", require("./routes/terminal"));
app.use("/accounts", require("./routes/accounts"));
app.use("/curseforge", require("./routes/curseforge"));
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
