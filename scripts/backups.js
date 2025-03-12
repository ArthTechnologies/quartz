const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);
const fs = require('fs');

const servers = [];

let serverFolderItems = fs.readdirSync('./servers');
for (let i = 0; i < serverFolderItems.length; i++) {
    if (!isNaN(serverFolderItems[i])) {
        servers.push(parseInt(serverFolderItems[i]));
    }
}

let serverWorldsTotalSize = 0;
console.log("CYCLE");
exec("du -c servers/*/world --max-depth=0 | tail -n 1", (error, stdout, stderr) => {
    if (error) {
        console.error(`Error getting total world size: ${stderr}`);
        return;
    }
    serverWorldsTotalSize = parseInt(stdout.split("\t")[0]);
    console.log("SERVER WORLDS SIZE TOTAL" + serverWorldsTotalSize); 
});


 function cycle() {
    console.log("CYCLE");
    for (let i = 0; i < servers.length; i++) {
        
    }
}

// Run every 12 hours
setInterval(cycle, 1000 * 60 * 60 * 12);

function getLiveStats(serverId) {
    return stats["server_" + serverId] || [];
}

module.exports = {  };
