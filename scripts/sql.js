var mysql = require('mysql2');
const utils = require('./utils.js');
var connection;
const fs = require('fs');
function start() {
     connection = mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',	
        password: 'password',
        database: 'drawsql',
        port: 8080
    });
    console.log('Connected to database');
    if (!fs.existsSync("accounts/migrated.txt")) {
        migrate();
    }

}

function migrate() {
    const accounts = fs.readdirSync("accounts");
    for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        if (account[0].split(".json")[1] != undefined) {
            convertAccountToSql(account[0]);
        }
    }
    fs.writeFileSync("accounts/migrated.txt", "");
}

function convertAccountToSql(filename) {
    const json = utils.readJSON("accounts/"+filename);
    let password = json.password;
    let salt = json.salt;
    if (salt == undefined) {
        salt = "null";
    }
    if (password == undefined) {
        password = "null";
    }
    let lastSignin = json.lastSignin;
    //convert lastSignin from unix to mysql
    lastSignin = convertUnixToMySQLTimestamp(lastSignin);
    let insterstring1 = "INSERT INTO `accounts`(`id`, `password`, `salt`, `token`, `resetAttempts`, `username`, `servers`, `freeServers`, `lastSignin`, `stripeServers`) VALUES"
    let interstring2 = `('${json.accountId}', '${password}', '${salt}', '${json.token}', ${json.resetAttempts}, '${filename.split(".json")[0]}', '${json.servers.toString()}', ${json.freeServers}, '${lastSignin}', -1);`
    connection.query(insterstring1 + interstring2, function (err, results) {
        if (err) {
            console.log(err);
        }
    });
}

function addAccount(json) {
    let insterstring1 = "INSERT INTO `accounts`(`id`, `password`, `salt`, `token`, `resetAttempts`, `username`, `servers`, `freeServers`, `lastSignin`, `stripeServers`) VALUES"
    let interstring2 = `('${json.accountId}', '${json.password}', '${json.salt}', '${json.token}', ${json.resetAttempts}, '${json.username}', '${json.servers.toString()}', ${json.freeServers}, '${json.lastSignin}', -1);`
    connection.query(insterstring1 + interstring2, function (err, results) {
        if (err) {
            console.log(err);
        }
    });
}

function convertUnixToMySQLTimestamp(unixTimestamp) {
    // Check if the timestamp is in milliseconds and convert to seconds if necessary
    if (unixTimestamp > 9999999999) {
        unixTimestamp = Math.floor(unixTimestamp / 1000);
    }

    const date = new Date(unixTimestamp * 1000); // Convert to milliseconds for JavaScript
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

module.exports = {start, convertAccountToSql, addAccount};