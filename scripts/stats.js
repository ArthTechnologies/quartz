const {execSync} = require('child_process')
const config = require('./utils.js').getConfig();
const fs = require('fs');
let servers = [];

let serverFolderItems = fs.readdirSync('./servers');
for (let i = 0; i < serverFolderItems.length; i++) {
    //if its a valid number
    if (!isNaN(serverFolderItems[i])) {
        servers.push(parseInt(serverFolderItems[i]));
    }
}
function getMemory(serverId) {
    try {
 
        exec(
          `docker ps --filter "publish=${config.portOffset + serverId}" --format "{{.ID}}"`,
          (error, stdout, stderr) => {
        
            let pid = stdout.trim();
         
           
            exec(
              `docker stats ${pid} --no-stream --format "{{.MemUsage}}"
      `,
              (err, stdout2, stderr) => {
              
            
                let used = stdout2.split("/")[0];
                let total = stdout2.split("/")[1];
  
                return {
                  used: used,
                    total: total,
                };
  
               
  
                 
               
            
              }
            );
          }
        );
      } catch (e) {
        res.status(500).json({ success: false, data: e });
      }
    

}

const stats = {};
//create a key for every server
for (let i = 0; i < servers.length; i++) {
    stats["server_"+servers[i]] = [];
}
function cycle() {
    for (let i = 0; i < servers.length; i++) {
        let object = {memory: getMemory(servers[i]), timestamp: Date.now()};
        //remove the oldest object if there are more than 60
        if (stats["server_"+servers[i]].length > 60) {
            stats["server_"+servers[i]].shift();
        }   
        stats["server_"+servers[i]].push(object);
    }
    
}

cycle();
setInterval(cycle, 1000 * 60);


function getLiveStats(serverId) {
    return stats["server_"+serverId];
}

module.exports = {getLiveStats}