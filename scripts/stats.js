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

async function getMemory(serverId) {
    try {
        const port = 10000 + parseInt(serverId);
        const { stdout: containerId } = await execPromise(
            `docker ps --filter "publish=${port}" --format "{{.ID}}"`
        );

        const pid = containerId.trim();
        if (!pid) return {used:0, total:0}; // If no container is found, return null.

        const { stdout: memoryStats } = await execPromise(
            `docker stats ${pid} --no-stream --format "{{.MemUsage}}"`
        );

        let [used, total] = memoryStats.trim().split('/').map(s => s.trim());

        //convert MiB to bytes and GiB to bytes
        if (used.includes('MiB')) {
            used = parseFloat(used) * 1024 * 1024;
        }
        if (used.includes('GiB')) {
            used = parseFloat(used) * 1024 * 1024 * 1024;
        }
        if (total.includes('MiB')) {
            total = parseFloat(total) * 1024 * 1024;
        }
        if (total.includes('GiB')) {
            total = parseFloat(total) * 1024 * 1024 * 1024;
        }   

        return { used, total };
    } catch (error) {
        console.error(`Error fetching memory for server ${serverId}:`, error);
        return null;
    }
}

const stats = {};
for (let i = 0; i < servers.length; i++) {
    stats["server_" + servers[i]] = [];
}

async function cycle() {

    for (let i = 0; i < servers.length; i++) {
        
        const memoryData = await getMemory(servers[i]); // Await memory retrieval
        if (memoryData) {
            const object = { memory: memoryData, timestamp: Date.now() };
            
            const key = "server_" + servers[i];
            if (stats[key].length > 60) {
                stats[key].shift(); // Keep only the latest 60 entries
            }
            stats[key].push(object);
        }
    }
}

// Run immediately, then every 60 seconds
cycle();
setInterval(cycle, 1000 * 60);

function getLiveStats(serverId) {
    return stats["server_" + serverId] || [];
}

module.exports = { getLiveStats };
