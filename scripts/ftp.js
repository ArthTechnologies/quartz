var ftpd = require('ftpd');
var fs = require('fs');
var path = require('path');
const { readJSON } = require('./utils');
const crypto = require('crypto');
const config = require('./utils').getConfig();
var server;
let users = [];
let accountsFolder = fs.readdirSync('./accounts');

for (let i = 0; i < accountsFolder.length; i++) {
    let account = accountsFolder[i];
    if (account.endsWith('.json')) {
        let data = readJSON(`./accounts/${account}`);
        if (data.servers != undefined && data.servers.length > 0) {
            let servers = data.servers;
        let tempToken = crypto.randomBytes(6).toString("hex");
        users.push(`${accountsFolder[i].split(".json")[0].split(":").join(".-.").replace("@",".-.")}:${tempToken}:/home/sysadmin/quartz/servers/${servers[0]}/:${servers[0]}`); 
        }
    }
}
console.log(users);
// User authentication array (username:password:directory)


// Convert users array into an object for easier lookup
var userMap = {};
users.forEach(entry => {
  let [username, password, directory] = entry.split(':');
  userMap[username] = { password, directory };
});
let port = 10000 + parseInt(config.idOffset) + 99;

let mountArray = [];
let usersArray = [];
try {
    for (let i = 0; i < users.length; i++) {
        mountArray.push(`-v "${users[i].split(":")[2]}:/home/username/server-${users[i].split(":")[3]}" `);
        usersArray.push(`"${users[i].split(":")[0]}:${users[i].split(":")[1]}:::server-${users[i].split(":")[3]}" `);
    }
} catch (e) {
    console.log(e);
}
console.log(mountArray);
function startFtpServer() {
    const { exec} = require('child_process');
    //stop any containers with the name sftp_server
    exec('docker stop sftp_server', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error stopping FTP server: ${error}`);
            return;
        }
        console.log(`FTP server stopped`);
    });
    setTimeout(() => {
        exec('docker rm sftp_server', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error removing FTP server: ${error}`);
                return;
            }
            console.log(`FTP server removed`);
        });
    }, 1000);
    console.log(`docker run -d --name sftp_server -p ${port}:22 ${mountArray.join(" ")}atmoz/sftp ${usersArray.join(" ")}`);
    setTimeout(() => {
        exec(`docker run -d --name sftp_server -p ${port}:22 ${mountArray.join(" ")}atmoz/sftp ${usersArray.join(" ")}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error starting FTP server: ${error}`);
                return;
            }
            console.log(`FTP server started on port ${port}`);
        });
    }, 2000);

}

function getTempToken(username) {
  return users.find(user => user.startsWith(username)).split(':')[1];
}

module.exports = {
  startFtpServer,
    getTempToken
};