const express = require("express");
const router = express.Router();
const fs = require("fs");
const { readJSON } = require("../scripts/utils.js");

router.get("/", (req, res) => {
    const memory = {};
    
    // Docker container memory (format: "bytes:port")
    const dockerStats = exec("docker stats --no-stream --format '{{.Container}}:{{.MemUsage}}'");
    memory.dockerContainers = dockerStats.stdout.trim().split('\n')
      .filter(line => line.includes(':'))
      .map(line => {
        const [container, mem] = line.split(':');
        const bytes = parseInt(mem.replace(/[^\d]/g, '')) * 1024; // Convert from KiB to bytes
        const portOutput = execSync(`docker inspect ${container} --format '{{.NetworkSettings.Ports}}'`).toString();
        const port = (portOutput.match(/0.0.0.0:(\d+)/) || [])[1] || 'unknown';
        return `${bytes}:${port}`;
      });

    // Total Docker memory
    memory.totalDocker = memory.dockerContainers.reduce((sum, entry) => 
      sum + parseInt(entry.split(':')[0]), 0);

    // Node.js memory
    memory.nodeJs = process.memoryUsage().rss;

    // System memory (using /proc/meminfo)
    const memInfo = exec("grep -E 'MemTotal|MemAvailable' /proc/meminfo");
    const [total, available] = memInfo.stdout.match(/\d+/g).map(Number);
    memory.totalSystemUsed = (total - available) * 1024; // Convert KB to bytes
    memory.totalSystemMax = total * 1024;

    res.send(memory);
});

module.exports = router;