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
   

    // Node.js memory
    memory.nodeJs = process.memoryUsage().rss;

    // System memory (using /proc/meminfo)
    const memInfo =  execSync("grep -E 'MemTotal|MemAvailable' /proc/meminfo");
    const memInfoLines = memInfo.toString().trim().split('\n');
    const totalMem = parseInt(memInfoLines[0].match(/\d+/)[0]);
    const availableMem = parseInt(memInfoLines[1].match(/\d+/)[0]);
    memory.system = availableMem + ":" + totalMem;

    res.send(memory);
});

module.exports = router;