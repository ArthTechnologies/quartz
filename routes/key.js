const express = require("express");
const router = express.Router();
const fs = require("fs");
const crypto = require("crypto");

//WIP
router.post("/test-pair", (req, res) => {
    //check if req.body.privateKey matches with public.pem
    const privateKey = req.headers.key;

    const publicKey = fs.readFileSync("public.pem").toString();
    console.log(privateKey + publicKey);
    const test = crypto.publicEncrypt(publicKey, Buffer.from("test"));
    const decrypted = crypto.privateDecrypt(privateKey, test);
    if (decrypted.toString() === "test") {
        res.send("true");
    }
    else {
        res.send("false");
    }

});

module.exports = router;