// importing packages
const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
const rsa = require("node-rsa");
const fs = require("fs");
const crypto = require("crypto");

exec = require("child_process").exec;
require("dotenv").config();
//import /lib/stripe.js
console.log(process.env.stripe_key);
//if it doesnt exist, write to /lib/store.json
if (!fs.existsSync("./stores/secrets.json")) {
  fs.writeFileSync(
    "./stores/secrets.json",
    '{"stripemode":"test","stripekey":"' + process.env.stripe_key + '"}'
  );
}

if (!fs.existsSync("accounts.json")) {
  fs.writeFileSync(
    "accounts.json",
    '{}'
  );
}

const s = require("./scripts/stripe.js");
exec(
  "curl -LO https://ci.opencollab.dev/job/GeyserMC/job/Geyser/job/master/lastSuccessfulBuild/artifact/bootstrap/spigot/build/libs/Geyser-Spigot.jar",
  {
    cwd: "servers/template",
  }
);

if (!fs.existsSync("java")) {
  fs.mkdirSync("java");

  exec(
    "curl -LO https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.5%2B8/OpenJDK17U-jdk_x64_linux_hotspot_17.0.5_8.tar.gz",
    {
      cwd: "java",
    }
  );
  exec(
    "curl -LO https://github.com/adoptium/temurin11-binaries/releases/download/jdk-11.0.18%2B10/OpenJDK11U-jdk_x64_linux_hotspot_11.0.18_10.tar.gz",
    {
      cwd: "java",
    }
  );

  setTimeout(function () {
    exec("tar -xvf OpenJDK11U-jdk_x64_linux_hotspot_11.0.18_10.tar.gz", {
      cwd: "java",
    });
  }, 9000);

    setTimeout(function () {
      exec("tar -xvf OpenJDK17U-jdk_x64_linux_hotspot_17.0.5_8.tar.gz", {
        cwd: "java",
      });
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

//create servers.csv if it doesn't exist

if (!fs.existsSync("servers.csv")) {
  fs.writeFile("servers.csv", "", function (err) {
    if (err) throw err;
    console.log("File is created successfully.");
  });
}
app.get("/", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "index.html"));
});

// middlewares
app.use(express.json(), cors());

// adding routes
app.use("/server", require("./routes/server"));
app.use("/servers", require("./routes/servers"));
app.use("/settings", require("./routes/settings"));
app.use("/keys", require("./routes/keys"));
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
