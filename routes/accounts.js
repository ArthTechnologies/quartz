const express = require("express");
const Router = express.Router();
const fs = require("fs");
const path = require("path");
const {createHash, scryptSync, randomBytes} = require("crypto");
const {v4: uuidv4} = require("uuid");

function hash(input, salt) {


    if (salt == undefined) {
        salt = randomBytes(12).toString('hex');
  
    }
    console.log("salt = " + salt)

    console.log("h = " + scryptSync(input,salt,48).toString('hex'))
    return salt + ":" + scryptSync(input,salt,48).toString('hex');
}

Router.post("/email/signup/", (req, res) => {
console.log(req.query);

    res.header("Access-Control-Allow-Origin", "*");
    let accountId = uuidv4();

    let accounts = require("../accounts.json");

let password = req.query.password;
let email = req.query.email;
let confirmPassword = req.query.confirmPassword;

if (password == confirmPassword) {
  

    if (password.length > 6) {
        if (accounts[email] == undefined) {
            [salt, password] = hash(password).split(":");
          
            accounts[email] = {};
            accounts[email].password = password;
            accounts[email].accountId = accountId;
            accounts[email].token = uuidv4();
            accounts[email].salt = salt;


            res.status(200).send({token: accounts[email].token, accountId: accountId});
        } else {
res.status(400).send({token: -1, reason: "Email already exists"});
        }

    } else {
        res.status(400).send({token: -1, reason: "Password is too short"});
    }
} else {
    res.status(400).send({token: -1, reason: "Passwords do not match"});
}
//write accounts.json
fs.writeFileSync("accounts.json", JSON.stringify(accounts, null, 4), {
    encoding: "utf8",
});


});

Router.post("/email/signin/", (req, res) => {
    let accounts = require("../accounts.json");
    let password = req.query.password;
    let email = req.query.email;
    let salt = accounts[email].salt;

    if (accounts[email].password == hash(password,salt).split(":")[1]) {
        res.status(200).send({token: accounts[email].token});
    } else {
        res.status(200).send({token: -1});
    }
    
});

module.exports = Router;