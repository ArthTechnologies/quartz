const express = require("express");
const Router = express.Router();
const fs = require("fs");
const path = require("path");
const { createHash, scryptSync, randomBytes } = require("crypto");
const { v4: uuidv4 } = require("uuid");

function hash(input, salt) {
  if (salt == undefined) {
    salt = randomBytes(12).toString("hex");
  }

  return salt + ":" + scryptSync(input, salt, 48).toString("hex");
}

Router.post("/email/signup/", (req, res) => {
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
        [salt, password] = hash(password).split(":");

        accounts[email] = {};
        accounts[email].password = password;
        accounts[email].accountId = accountId;
        accounts[email].token = uuidv4();
        accounts[email].salt = salt;

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
  if (accounts[email].password == hash(password, salt).split(":")[1]) {
    response = {
      token: accounts[email].token,
      accountId: accounts[email].accountId,
    };
  } else {
    response = { token: -1, reason: "Incorrect email or password" };
  }

  res.status(200).send(response);
});

module.exports = Router;
