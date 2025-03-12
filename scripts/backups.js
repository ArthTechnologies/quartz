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
    serverWorldsTotalSize = parseInt(stdout.split("\t")[0])*1024;
    console.log("SERVER WORLDS SIZE TOTAL" + serverWorldsTotalSize); 
});

let spaceAvailableOnSystem = 0;
exec("df --output=avail / | tail -n 1", (error, stdout, stderr) => {
    if (error) {
        console.error(`Error getting available space: ${stderr}`);
        return;
    }
    spaceAvailableOnSystem = parseInt(stdout)*1024;
    console.log("SPACE AVAILABLE ON SYSTEM" + spaceAvailableOnSystem);
});

let backupsFolderSize = 0;  
try {
    exec("du -c backups | tail -n 1", (error, stdout, stderr) => {
        if (error) {
            console.error(`Error getting total backups size: ${stderr}`);
            return;
        }
        backupsFolderSize = parseInt(stdout.split("\t")[0]);
        console.log("BACKUPS FOLDER SIZE" + backupsFolderSize); 
    });
} catch {
    console.log("Error getting backups folder size");
}

setTimeout(() => {
    let backupSlots = ((spaceAvailableOnSystem - 10*1024*1024*1024 + backupsFolderSize) / serverWorldsTotalSize).toFixed(0);
    console.log("BACKUP SLOTS" + backupSlots);
}, 1000);


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
