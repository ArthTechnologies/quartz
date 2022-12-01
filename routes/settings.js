const express = require("express");
const router = express.Router();

//import settings.json
const settings = require("../settings.json");

//if environment variable WEB_PORT is set, set settings.webport to that
if (process.env.SERVERS_PER_USER) {
    settings.serversPerUser = process.env.WEB_PORT;
}
if (process.env.BROWSER_TITLE) {
    settings.browserTitle = process.env.WEB_PORT;
}

if (process.env.WEB_NAME) {
    settings.webName = process.env.WEB_PORT;
}
if (process.env.ENABLE_PAY) {
    settings.enablePay = process.env.WEB_PORT;
}
if (process.env.TRUSTED_DOMAINS) {
    settings.trustedDomains = process.env.WEB_PORT;
}

router.get(`/`, function (req, res) {
    //add cors header
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    //return settings.json
    res.json(settings);
});


router.post(`/set`, function (req, res) {
    //add cors header
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    
    //if req.body.email is "noemail" return 404
});

module.exports = router;