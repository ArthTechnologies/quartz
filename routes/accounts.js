const express = require("express");
const Router = express.Router();
const fs = require("fs");
const s = require("../scripts/stripe.js");

const { v4: uuidv4 } = require("uuid");
const files = require("../scripts/files.js");

Router.post("/email/signup/", (req, res) => {
  console.log("hi");
  res.header("Access-Control-Allow-Origin", "*");

  let accounts = require("../accounts.json");
  let emailExists = false;
  let password = req.query.password;
  let email = req.query.email;
  let confirmPassword = req.query.confirmPassword;

  for (i in accounts) {
    if (i == email) {
      emailExists = true;
    }
  }

  if (password == confirmPassword) {
    if (password.length >= 7) {
      if (!emailExists) {
        let accountId = uuidv4();
        [salt, password] = files.hash(password).split(":");

        accounts[email] = {};
        accounts[email].password = password;
        accounts[email].accountId = accountId;
        accounts[email].token = uuidv4();
        accounts[email].salt = salt;
        accounts[email].resetAttempts = 0;
        accounts[email].ips = [];
        accounts[email].ips.push(files.getIPID(req.ip));
        console.log("hi");

        res
          .status(200)
          .send({ token: accounts[email].token, accountId: accountId });
      } else {
        res.status(400).send({ token: -1, reason: "Email already exists" });
      }
    } else {
      res.status(400).send({ token: -1, reason: "Password is too short" });
    }
  } else {
    res.status(400).send({ token: -1, reason: "Passwords do not match" });
  }
  //write accounts.json
  fs.writeFileSync("accounts.json", JSON.stringify(accounts, null, 4), {
    encoding: "utf8",
  });
});

Router.post("/email/signin/", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");

  let accounts = require("../accounts.json");
  let password = req.query.password;
  let email = req.query.email;
  let response = {};

  let salt = accounts[email].salt;

  if (accounts[email].password == files.hash(password, salt).split(":")[1]) {
    console.log("ipid" + accounts[email].ips);
    /*
    if (accounts[email].ips.indexOf(files.getIPID(req.ip)) == -1) {
      accounts[email].ips.push(files.getIPID(req.ip));
    }*/
    response = {
      token: accounts[email].token,
      accountId: accounts[email].accountId,
    };
  } else {
    response = { token: -1, reason: "Incorrect email or password" };
  }

  res.status(200).send(response);
});

Router.delete("/email", (req, res) => {
  let accounts = require("../accounts.json");
  email = req.headers.email;
  password = req.query.password;
  token = req.headers.token;
  console.log(req.query);
  console.log(files.hash("password", accounts[email].salt).split(":")[1]);

  if (token == accounts[email].token) {
    if (
      accounts[email].password ==
      files.hash(password, accounts[email].salt).split(":")[1]
    ) {
      delete accounts[email];
      files.write("accounts.json", JSON.stringify(accounts));

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

  let accounts = require("../accounts.json");
  let settings = require("../stores/settings.json");
  let password = req.query.password;
  let email = req.query.email;
  let confirmPassword = req.query.confirmPassword;
  let last4 = req.query.last4;

  try {
    const creditId = await s.getCreditId(email);
    if (accounts[email].resetAttempts < 5) {
      if (creditId === last4 || settings.enablePay === false) {
        if (password == confirmPassword) {
          if (password.length >= 7) {
            [salt, password] = files.hash(password).split(":");

            accounts[email].password = password;
            accounts[email].token = uuidv4();
            accounts[email].salt = salt;

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
        accounts[email].resetAttempts++;
        res.status(400).send({
          success: false,
          reason: "Wrong last 4 digits",
          attempts: accounts[email].resetAttempts,
        });
      }
    } else {
      res.status(400).send({ success: false, reason: "Too many attempts" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ success: false, reason: "An error occurred" });
  }

  //write accounts.json
  fs.writeFileSync("accounts.json", JSON.stringify(accounts, null, 4), {
    encoding: "utf8",
  });
});

module.exports = Router;
