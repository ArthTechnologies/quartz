const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);
const fs = require('fs');

const servers = [];

if (!fs.existsSync('./backups')) {
    fs.mkdirSync('./backups');
}
let serverFolderItems = fs.readdirSync('./servers');
for (let i = 0; i < serverFolderItems.length; i++) {
    if (!isNaN(serverFolderItems[i])) {
        servers.push(parseInt(serverFolderItems[i]));
    }
}

let serverWorldsTotalSize = 0;

exec("du -c servers/*/world --max-depth=0 | tail -n 1", (error, stdout, stderr) => {
    if (error) {
        console.error(`Error getting total world size: ${stderr}`);
        return;
    }
    serverWorldsTotalSize = parseInt(stdout.split("\t")[0])*1024;
  
});

let spaceAvailableOnSystem = 0;
exec("df --output=avail / | tail -n 1", (error, stdout, stderr) => {
    if (error) {
        console.error(`Error getting available space: ${stderr}`);
        return;
    }
    spaceAvailableOnSystem = parseInt(stdout)*1024;
   
});

let backupsFolderSize = 0;  

    exec("du -c backups | tail -n 1", (error, stdout, stderr) => {
        if (error) {
            console.error(`Error getting total backups size: ${stderr}`);
            return;
        }
        backupsFolderSize = parseInt(stdout.split("\t")[0]);
       
    });

let backupSlots = 0;
setTimeout(() => {
     backupSlots = ((spaceAvailableOnSystem - 10*1024*1024*1024 + backupsFolderSize) / serverWorldsTotalSize).toFixed(0);
    console.log("BACKUP SLOTS" + backupSlots);
}, 1000);


 function cycle() {
    console.log("Running backup cycle...");
    for (let i = 0; i < servers.length; i++) {
        if (!fs.existsSync(`./backups/${servers[i]}`)) {
            fs.mkdirSync(`./backups/${servers[i]}`);
        }
        let backupFolder = fs.readdirSync(`./backups/${servers[i]}`);
        if (backupFolder.length >= backupSlots) {
            let amountToDelete = backupFolder.length - backupSlots;
            for (let j = 0; j < amountToDelete; j++) {
                fs.rmSync(`./backup/${servers[i]}/${backupFolder[j]}`, { recursive: true });
            }
        }

        //backup by zipping the world folder
        exec(`zip -r ./backups/${servers[i]}/${Date.now().toString()}.zip ./servers/${servers[i]}/world`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error zipping world folder: ${stderr}`);
                return;
            }
            console.log(`Successfully backed up server ${servers[i]}`);
        });

    }
}

setTimeout(cycle, 1000 * 5); 
// Run every 12 hours
setInterval(cycle, 1000 * 60 * 60 * 12);

function getLiveStats(serverId) {
    return stats["server_" + serverId] || [];
}

module.exports = {  };
