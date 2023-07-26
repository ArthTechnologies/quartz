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
//import /lib/stripe.js
console.log(process.env.stripe_key);
if (!fs.existsSync("./backup")) {
  fs.mkdirSync("backup");
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
      "latestVersion": "1.19.4"
    }`
  );
}
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

if (!fs.existsSync("accounts.json")) {
  fs.writeFileSync("accounts.json", "{}");
}
if (!fs.existsSync("servers.json")) {
  fs.writeFileSync("servers.json", "{}");
}

const s = require("./scripts/stripe.js");

let modVersions = [{ c: "modded", s: "forge", v: "1.19.4" }];

if (!fs.existsSync("data")) {
  fs.mkdirSync("data");
  fs.mkdirSync("data/downloads");
  fs.writeFileSync("stores/data.json", `{"lastUpdate":${Date.now()}}`);
  downloadJars();
}

const datajson = require("./stores/data.json");
if (Date.now() - datajson.lastUpdate > 1000 * 60 * 60 * 12) {
  downloadJars();
}
setInterval(() => {
  downloadJars();
}, 1000 * 60 * 60 * 12);

function downloadJars() {
  fs.writeFileSync("stores/data.json", `{"lastUpdate":${Date.now()}}`);
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

  //plugins
  files.GET("https://api.jarsmc.xyz/jars/arthHosting", (data) => {
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

        console.log(jar.version + " " + jar.software);
        downloadProgress.push(false);
        function downloadFromJarsMC() {
          files.downloadAsync(
            "data/downloads/" +
              jar.software +
              "-" +
              jar.version +
              "." +
              extension,
            "https://api.jarsmc.xyz/jars/" +
              jar.software +
              "/" +
              jar.version,
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
        if(jar.software != "forge") {
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
              console.log(
                "failed to download " +
                  jar.software +
                  jar.version +
                  " from serverjars.com, trying jarsmc.xyz"
              );

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
        console.log("SOFTWARE FORGE")
        downloadFromJarsMC();
      }
    }
  }
});
}

/*downloadWorldgenMods();
setInterval(() => {
  downloadWorldgenMods();
}, 1000 * 60 * 60 * 12);
//download worlden mods for latest version
function downloadWorldgenMods() {
  const settings = require("./stores/settings.json");
  let worldgenMods = ["Terralith", "Structory", "Incendium", "Nullscape"];
  files.GET(
    "https://launchermeta.mojang.com/mc/game/version_manifest.json",
    (vdata) => {
      let version = JSON.parse(vdata).latest.release;

      settings.latestVersion = version;
      fs.writeFileSync("./stores/settings.json", JSON.stringify(settings));

      worldgenMods.forEach((wmod) => {
        files.GET(
          "https://api.github.com/repos/Stardust-Labs-MC/" +
            wmod +
            "/releases/latest",
          (terraData) => {
            terraData = JSON.parse(terraData);
            if (terraData.assets == undefined) {
              console.log("Rate limit likely reached");
            } else {
              terraData.assets.forEach((asset) => {
                files.download(
                  "data/downloads/" +
                    wmod.toLowerCase() +
                    "-" +
                    version +
                    ".zip",
                  asset.browser_download_url
                );
              });
            }
          }
        );
      });
    }
  );
}*/

//api.github.com/repos/Stardust-Labs-MC/Terralith/releases/latest
https: if (!fs.existsSync("java")) {
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
    console.log(req.url + req.ip);

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
