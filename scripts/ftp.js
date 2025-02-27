var ftpd = require('ftpd');
var fs = require('fs');
var path = require('path');
const { readJSON } = require('./utils');
const crypto = require('crypto');

var server;
let users = [];
let accountsFolder = fs.readdirSync('./accounts');

for (let i = 0; i < accountsFolder.length; i++) {
    let account = accountsFolder[i];
    if (account.endsWith('.json')) {
        let data = readJSON(`./accounts/${account}`);
        let servers = data.servers;
        let tempToken = crypto.randomBytes(6).toString("hex");
        users.push(`${accountsFolder[i].split(".json")[0]}:${tempToken}:./servers/${servers[0]}`);
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

function startFtpServer() {
  setTimeout(() => {
    var options = {
        host: process.env.IP || '127.0.0.1',
        port: 4002, // Change to port 4002
        tls: null, // Ensure TLS is null for FTP only
      };
    
      server = new ftpd.FtpServer(options.host, {
        getInitialCwd: function(connection) {
          return userMap[connection.username] ? userMap[connection.username].directory : '/';
        },
        getRoot: function(connection) {
          return userMap[connection.username] ? userMap[connection.username].directory : process.cwd();
        },
        pasvPortRangeStart: 1025,
        pasvPortRangeEnd: 1050,
        tlsOptions: options.tls, // This will remain null
        allowUnauthorizedTls: true,
        useWriteFile: false,
        useReadFile: false,
        uploadMaxSlurpSize: 7000, // N/A unless 'useWriteFile' is true.
      });
    
      server.on('error', function(error) {
        console.log('FTP Server error:', error);
      });
    
      server.on('client:connected', function(connection) {
        console.log('Client connected: ' + connection.remoteAddress);
    
        connection.on('command:user', function(user, success, failure) {
          if (userMap[user]) {
            connection.username = user;
            success();
          } else {
            failure();
          }
        });
    
        connection.on('command:pass', function(pass, success, failure) {
          if (connection.username && userMap[connection.username].password === pass) {
            success(connection.username);
          } else {
            failure();
          }
        });
      });
    
      server.debugging = 4;
      server.listen(options.port);
    
      console.log('FTP Server listening on port ' + options.port);
    }, 2000);
}

function getTempToken(username) {
  return users.find(user => user.startsWith(username)).split(':')[1];
}

module.exports = {
  startFtpServer,
    getTempToken
};