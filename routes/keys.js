const express = require("express");
const Router = express.Router();
const fs = require("fs");
const path = require("path");

Router.get("/", (req, res) => {
  if (!fs.existsSync("private.pem")) {
    res.status(404).send("This key has already been claimed.");
  } else {
    //send private.pem file
    res.sendFile(path.join(__dirname, "../private.pem"));

    //wait 10 seconds
    setTimeout(del, 10000);

    function del() {
      //delete private.pem file
      fs.unlinkSync("private.pem");
    }
  }
});

module.exports = Router;
