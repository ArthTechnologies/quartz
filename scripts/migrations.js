const fs = require("fs");
const { readJSON } = require("./utils.js");
function accountsToTSV() {
    let accounts = fs.readdirSync("accounts");
    let columns = ["id","username","billingEmail","servers","stripeServers","freeServers","lastSignin","token","salt","password","resetAttempts"];
    let tsv = columns.join("\t") + "\n";
    for (let i in accounts) {
        if (accounts[i].includes(".json")) {
        let account = readJSON(`accounts/${accounts[i]}`);
        try {
        let row = [account.accountId, accounts[i].split(".json")[0], account.email, account.servers, 0, account.freeServers, account.lastSignin, account.token, account.salt, account.password, account.resetAttempts];
        tsv += row.join("\t") + "\n";
        } catch (e) {
        console.log("error", e);
        }
        }
    }
    fs.writeFileSync("accounts.tsv", tsv);
}

function serversToTSV() {
    let servers = fs.readdirSync("servers");
    let columns = ["id","owner","stage","name","software","version","productID","allowedAccounts","specialDatapacks","specialPlugins"];
    let tsv = columns.join("\t") + "\n";
    for (let i in servers) {
        if (fs.existsSync(`servers/${servers[i]}/server.json`)) {
        let server = readJSON(`servers/${servers[i]}/server.json`);
        try {
            let specialDatapacks = server.addons;
            let specialPlugins = [];
            if (server.webmap) specialPlugins.push("webmap");
            if (server.voicechat) specialPlugins.push("voicechat");
            if (server.chunky) specialPlugins.push("chunky");
            if (server.discordsrv) specialPlugins.push("discordsrv");

        let row = [server.id, server.accountId,"created",server.name, server.software, server.version, server.productID, "", specialDatapacks.join(","), specialPlugins.join(",")];	
        tsv += row.join("\t") + "\n";
        } catch (e) {
        console.log("error", e);
        }
        }
    }
    fs.writeFileSync("servers.tsv", tsv);
}

function specialPlugins() {
    let servers = fs.readdirSync("servers");
    for (let i in servers) {
        if (fs.existsSync(`servers/${servers[i]}/server.json`)) {
        let server = readJSON(`servers/${servers[i]}/server.json`);
        try {
            let specialDatapacks = [];
            if (typeof server.addons == "string") specialDatapacks = server.addons.split(",");
            else if (Array.isArray(server.addons)) specialDatapacks = server.addons;
            let specialPlugins = [];
            if (server.webmap) specialPlugins.push("dynmap");
            if (server.voicechat) specialPlugins.push("voicechat");
            if (server.chunky) specialPlugins.push("chunky");
            if (server.discordsrv) specialPlugins.push("discordsrv");

        console.log(server.id, specialDatapacks.join(","), specialPlugins.join(","));
            server.specialDatapacks = specialDatapacks.join(",");
            server.specialPlugins = specialPlugins.join(",");
            writeJSON(`servers/${servers[i]}/server.json`, server);
        } catch (e) {
        console.log("error", e);
        }
        }
    }
}

function migration1() {
    specialPlugins();
}
module.exports = {accountsToTSV, serversToTSV, migration1};