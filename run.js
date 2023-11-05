// importing packages
const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");

const fs = require("fs");
const crypto = require("crypto");

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
} else if (fs.existsSync("./assets/template")) {
  fs.rmSync("./assets/template", { recursive: true });
}


if (!fs.existsSync("config.txt")) {
  //migration from old way of storing settings to config.txt
  if (fs.existsSync("stores/settings.json") && fs.existsSync("stores/secrets.json")) {
    const settings = require("./stores/settings.json");
    const secrets = require("./stores/secrets.json");
    fs.writeFileSync(
      "config.txt",
      `# The address that servers will be ran under:\n` +
      `address=${settings.address}\n` +
      `# Do you want to make users pay for servers? (If so, you'll need a Stripe API Key):\n` +
      `enablePay=${settings.enablePay}\n` +
      `# Do you want to make users login to access their servers? (Setting this to false is experimental):\n` +
      `enableAuth=${settings.enableAuth}\n` +
      `# The maximum amount of servers that this panel is allowed to create:\n` +
      `maxServers=${settings.maxServers}\n` +
      `# The maximum amount of storage that each server can use (in bytes):\n` +
      `serverStorageLimit=${settings.serverStorageLimit}\n\n` +
      `# The CurseForge API Key to use for downloading mods (You can apply for one at docs.curseforge.com):\n` +
      `curseforgeKey=${secrets.curseforgeKey}\n` +
      `# The Stripe API Key to use for charging users (You can apply for one at stripe.com):\n` +
      `stripeKey=${secrets.stripeKey}\n\n` +
      "# Advanced Settings:\n\n" +
      `# The forwarding secret to use for connecting to an ocelot (software that connects quartz instances) instance:\n` +
      `forwardingSecret=${secrets.forwardingSecret}\n` +
      `# The JarsMC instance to get server files and more from (Leave this unless you know what this means):\n` +
      `jarsMcUrl=${settings.jarsMcUrl}\n` +
      `# The 'pepper', used to obfuscate things such as IP addresses and forwarding secrets:\n` +
      `pepper=${secrets.pepper}\n`
    );
    fs.copyFileSync("stores/settings.json", "backup/settings.json");
    fs.unlinkSync("stores/settings.json");
    fs.copyFileSync("stores/secrets.json", "backup/secrets.json");
    fs.unlinkSync("stores/secrets.json");
  }else {
    fs.writeFileSync(
      "config.txt",
      `# The address that servers will be ran under:\n` +
      `address=arthmc.xyz\n` +
      `# Do you want to make users pay for servers? (If so, you'll need a Stripe API Key):\n` +
      `enablePay=true\n` +
      `# Do you want to make users login to access their servers? (Setting this to false is experimental):\n` +
      `enableAuth=true\n` +
      `# The maximum amount of servers that this panel is allowed to create:\n` +
      `maxServers=8\n` +
      `# The maximum amount of storage that each server can use (in bytes):\n` +
      `serverStorageLimit=1000000000\n\n` +
      `# The CurseForge API Key to use for downloading mods (You can apply for one at docs.curseforge.com):\n` +
      `curseforgeKey=${process.env.curseforge_key}\n` +
      `# The Stripe API Key to use for charging users (You can apply for one at stripe.com):\n` +
      `stripeKey=${process.env.stripe_key}\n\n` +
      "# Advanced Settings:\n\n" +
      `# The forwarding secret to use for connecting to an ocelot (software that connects quartz instances) instance:\n` +
      `forwardingSecret=${crypto.randomBytes(12).toString("hex")}\n` +
      `# The JarsMC instance to get server files and more from (Leave this unless you know what this means):\n` +
      `jarsMcUrl=https://api.jarsmc.xyz/\n` +
      `# The 'pepper', used to obfuscate things such as IP addresses and forwarding secrets:\n` +
      `pepper=${crypto.randomBytes(12).toString("hex")}\n`);
  }
}
const files = require("./scripts/files.js");
const config = require("./scripts/config.js").getConfig();

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

if (!fs.existsSync("assets/jars")) {
  fs.mkdirSync("assets/java");
  fs.mkdirSync("assets/jars");
  fs.mkdirSync("assets/jars/downloads");
  fs.mkdirSync("assets/uploads");

  fs.writeFileSync(
    "assets/data.json",
    `{"lastUpdate":${Date.now()},"numServers":0,"latestVersion":"1.20.2"}`
  );
  downloadJars();
}

//migration from the old template location
if (fs.existsSync("servers/template")) {
  if (!fs.existsSync("assets/template")) {
    fs.mkdirSync("assets/template");
    for (i in fs.readdirSync("servers/template")) {
    if (!fs.statSync(fs.readdirSync("servers/template")[i]).isDirectory()) {
      fs.cpSync("servers/template/"+fs.readdirSync("servers/template")[i], "assets/template/"+fs.readdirSync("servers/template")[i]);
    }
  }
  }
  fs.rmSync("servers/template", { recursive: true });
}
const datajson = require("./assets/data.json");
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
  const datajson = require("./assets/data.json");
  datajson.lastUpdate = Date.now();
  fs.writeFileSync("assets/data.json", JSON.stringify(datajson));
  //geyser
  files.downloadAsync(
    "assets/jars/downloads/cx_geyser-spigot_Geyser.jar",
    "https://ci.opencollab.dev/job/GeyserMC/job/Geyser/job/master/lastSuccessfulBuild/artifact/bootstrap/spigot/build/libs/Geyser-Spigot.jar",
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
    "https://ci.opencollab.dev/job/GeyserMC/job/Floodgate/job/master/lastSuccessfulBuild/artifact/spigot/build/libs/floodgate-spigot.jar",
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
    "https://ci.opencollab.dev/job/GeyserMC/job/Geyser/job/master/lastSuccessfulBuild/artifact/bootstrap/velocity/build/libs/Geyser-Velocity.jar",
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
    "https://ci.opencollab.dev/job/GeyserMC/job/Floodgate/job/master/lastSuccessfulBuild/artifact/velocity/build/libs/floodgate-velocity.jar",
    (data) => {
      if (fs.existsSync(`assets/jars/cx_floodgate-velocity_Floodgate.jar`)) {
        fs.unlinkSync(`assets/jars/cx_floodgate-velocity_Floodgate.jar`);
      }
      fs.copyFileSync(
        `assets/jars/downloads/cx_floodgate-velocity_Floodgate.jar`,
        `assets/jars/cx_floodgate-velocity_Floodgate.jar`
      );
      fs.unlinkSync(`assets/jars/downloads/cx_floodgate-velocity_Floodgate.jar`);
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
                  ).size > 1000
                ) {
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
              "https://serverjars.com/api/fetchJar/" +
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
                  ).length == 26351
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

function getLatestVersion() {
  files.GET(
    "https://launchermeta.mojang.com/mc/game/version_manifest.json",
    (vdata) => {
      let version = JSON.parse(vdata).latest.release;
      let datajson = require("./assets/data.json");
      data.latestVersion = version;
      fs.writeFileSync("./assets/data.json", JSON.stringify(datajson));
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



files.downloadAsync(
  "assets/java/java19.tar.gz",
  "https://github.com/adoptium/temurin19-binaries/releases/download/jdk-19.0.2%2B7/OpenJDK19U-jdk_x64_linux_hotspot_19.0.2_7.tar.gz",
  (data) => {
    files.extract("assets/java/java19.tar.gz", "assets/java");
    fs.unlinkSync("assets/java/java19.tar.gz");
  });
files.downloadAsync(
  "assets/java/java17.tar.gz",
  "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.5%2B8/OpenJDK17U-jdk_x64_linux_hotspot_17.0.5_8.tar.gz",
  (data) => {
    files.extract("assets/java/java17.tar.gz", "assets/java");
    fs.unlinkSync("assets/java/java17.tar.gz");
  });
files.downloadAsync(
  "assets/java/java11.tar.gz",
  "https://github.com/adoptium/temurin11-binaries/releases/download/jdk-11.0.18%2B10/OpenJDK11U-jdk_x64_linux_hotspot_11.0.18_10.tar.gz",
  (data) => {
    files.extract("assets/java/java11.tar.gz", "assets/java");
    fs.unlinkSync("assets/java/java11.tar.gz");
  });




const data = require("./assets/data.json");
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
  fs.writeFileSync("./assets/data.json", JSON.stringify(data));
}

app.get("/", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "assets/clientMessage.html"));
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
