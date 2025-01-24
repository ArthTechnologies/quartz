const express = require("express");
const router = express.Router();
const fs = require("fs");
const { readJSON } = require("../scripts/utils.js");

router.get("/",  (req, res) => {

    const {  execSync } = require("child_process");
    const memory = {};
    
    // Docker container memory (format: "bytes:port")
    const dockerStats =  execSync("docker stats --no-stream --format '{{.MemUsage}}'");
    console.log(dockerStats.toString());
    memory.dockerContainers = dockerStats.toString().trim().split('\n').map(line => line.trim());
    memory.dockerContainers = memory.dockerContainers.map(entry => {
      const [used, total] = entry.split('/').map(mem => parseInt(mem.replace(/[^\d]/g, '')));
      return { used, total };
    });
    console.log(memory.dockerContainers);

    // Total Docker memory
    memory.totalDocker = memory.dockerContainers.reduce((sum, entry) => 
      sum + parseInt(entry.split(':')[0]), 0);

    // Node.js memory
    memory.nodeJs = process.memoryUsage().rss;

    // System memory (using /proc/meminfo)
    const memInfo =  execSync("grep -E 'MemTotal|MemAvailable' /proc/meminfo");
    const [total, available] = memInfo.stdout.match(/\d+/g).map(Number);
    memory.totalSystemUsed = (total - available) * 1024; // Convert KB to bytes
    memory.totalSystemMax = total * 1024;

    res.send(memory);
});

module.exports = router;