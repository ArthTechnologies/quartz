const express = require("express");
const Router = express.Router();
const fs = require("fs");
const s = require("../scripts/stripe.js");

const { v4: uuidv4 } = require("uuid");
const files = require("../scripts/files.js");
const config = require("../scripts/config.js").getConfig();

Router.post("/email/signup/", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");

  let account = {};
  let emailExists = false;
  let password = req.query.password;
  let email = req.query.email;
  let confirmPassword = req.query.confirmPassword;

  if (fs.existsSync("accounts/" + email + ".json")) {
    emailExists = true;
  }

  if (password == confirmPassword) {
    if (password.length >= 7) {
      if (!emailExists) {
        let accountId = uuidv4();
        [salt, password] = files.hash(password).split(":");

        account.password = password;
        account.accountId = accountId;
        account.token = uuidv4();
        account.salt = salt;
        account.resetAttempts = 0;
        account.ips = [];
        account.ips.push(files.getIPID(req.ip));
        account.type = "email";
        fs.writeFileSync(
          "accounts/" + email + ".json",
          JSON.stringify(accounts, null, 4),
          {
            encoding: "utf8",
          }
        );
        res.status(200).send({ token: account.token, accountId: accountId });
      } else {
        res.status(400).send({ token: -1, reason: "Email already exists" });
      }
    } else {
      res.status(400).send({ token: -1, reason: "Password is too short" });
    }
  } else {
    res.status(400).send({ token: -1, reason: "Passwords do not match" });
  }
});

Router.post("/email/signin/", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");

  let password = req.query.password;
  let email = req.query.email;
  let account = require("../accounts/" + email + ".json");
  let response = {};

  let salt = account.salt;

  if (account.password == files.hash(password, salt).split(":")[1]) {
    if (account.ips.indexOf(files.getIPID(req.ip)) == -1) {
      account.ips.push(files.getIPID(req.ip));
    }
    response = {
      token: account.token,
      accountId: account.accountId,
    };
  } else {
    response = { token: -1, reason: "Incorrect email or password" };
  }

  res.status(200).send(response);
});

Router.delete("/email", (req, res) => {
  email = req.headers.email;
  password = req.query.password;
  token = req.headers.token;
  let account = require("../accounts/" + email + ".json");

  if (token == account.token) {
    if (account.password == files.hash(password, account.salt).split(":")[1]) {
      fs.unlinkSync("accounts/" + email + ".json");

      res.status(200).send({ success: true });
    } else {
      res.status(400).send({ success: false, reason: "Incorrect password" });
    }
  } else {
    res.status(400).send({ success: false, reason: "Invalid token" });
  }
});

Router.post("/email/resetPassword/", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");

  let password = req.query.password;
  let email = req.query.email;
  let confirmPassword = req.query.confirmPassword;
  let last4 = req.query.last4;
  let account = require("../accounts/" + email + ".json");

  try {
    const creditId = await s.getCreditId(email);
    if (account.resetAttempts < 5) {
      if (creditId === last4 || config.enablePay === false) {
        if (password == confirmPassword) {
          if (password.length >= 7) {
            [salt, password] = files.hash(password).split(":");

            account.password = password;
            account.token = uuidv4();
            account.salt = salt;

            res.status(200).send({ success: true });
          } else {
            res
              .status(400)
              .send({ token: -1, reason: "Password is too short" });
          }
        } else {
          res.status(400).send({ token: -1, reason: "Passwords do not match" });
        }
      } else {
        account.resetAttempts++;
        res.status(400).send({
          success: false,
          reason: "Wrong last 4 digits",
          attempts: account.resetAttempts,
        });
      }
    } else {
      res.status(400).send({ success: false, reason: "Too many attempts" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ success: false, reason: "An error occurred" });
  }

  //write account file
  fs.writeFileSync(
    "accounts/" + email + ".json",
    JSON.stringify(account, null, 4),

    {
      encoding: "utf8",
    }
  );
});

//combined signin and signup for discord
Router.post("/discord/", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");

  let account = {};
  let emailExists = false;
  let token = req.query.token;  



  exec("curl -X GET https://discord.com/api/users/@me -H 'authorization: Bearer " + token + "'", (req, res) => {
    let email = res.email;
    if (fs.existsSync("accounts/" + email + ".json")) {
      emailExists = true;
    }
    //if account exists, so the user is signing in not up...
    if (emailExists) {
      let email = res.email;
      let account = require("../accounts/" + email + ".json");
      let response = {};
      account.ips = [];
      if (account.ips.indexOf(files.getIPID(req.ip)) == -1) {
        account.ips.push(files.getIPID(req.ip));
      }
      response = {
        token: account.token,
        accountId: account.accountId,
        email: email,
      };
  
      res.status(200).send(response);
    } else {
      let accountId = uuidv4();

      account.accountId = accountId;
      account.token = uuidv4();
      account.resetAttempts = 0;
if (req.ip != undefined) {
  account.ips = [];
  if (account.ips.indexOf(files.getIPID(req.ip)) == -1) {
  account.ips.push(files.getIPID(req.ip));
  }
}
      account.type = "discord";
      fs.writeFileSync(
        "accounts/" + email + ".json",
        JSON.stringify(accounts, null, 4),
        {
          encoding: "utf8",
        }
      );
      res.status(200).send({ token: account.token, accountId: accountId, email: email });
    }

  });

});





module.exports = Router;
