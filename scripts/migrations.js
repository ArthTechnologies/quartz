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

module.exports = {accountsToTSV};