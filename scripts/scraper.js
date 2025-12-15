const jQuery = require("jquery");
const {JSDOM} = require("jsdom");
const fs = require("fs");
const path = require("path");
const $ = jQuery(new JSDOM().window);
const {exec} = require("child_process");
const files = require("./files.js");

let skipOldVersions = false;

let index = {};
let scraperLog = [];

// Helper function to download a jar and track it
async function downloadAndLogJar(filename, url) {
    try {
        const jarPath = path.join("assets/jars", filename);

        // Check if file already exists
        if (fs.existsSync(jarPath)) {
            index[filename] = url;
            scraperLog.push({
                filename: filename,
                url: url,
                success: true,
                timestamp: new Date().toISOString(),
                note: "File already exists"
            });
            return true;
        }

        // Download the jar
        const response = await fetch(url);
        if (!response.ok) {
            scraperLog.push({
                filename: filename,
                url: url,
                success: false,
                timestamp: new Date().toISOString(),
                error: `HTTP ${response.status}`
            });
            return false;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(jarPath, buffer);

        index[filename] = url;
        scraperLog.push({
            filename: filename,
            url: url,
            success: true,
            timestamp: new Date().toISOString(),
            fileSize: buffer.length
        });
        return true;
    } catch (err) {
        scraperLog.push({
            filename: filename,
            url: url,
            success: false,
            timestamp: new Date().toISOString(),
            error: err.message
        });
        return false;
    }
}

// Helper function to log jar URLs (for tracking without downloading)
function logJar(filename, url, success = true) {
    scraperLog.push({
        filename: filename,
        url: url,
        success: success,
        timestamp: new Date().toISOString()
    });
}

//paper
async function downloadPaperJars() {
    const response = await fetch("https://api.papermc.io/v2/projects/paper");
    const paperVersions = await response.json();
    for (let i in paperVersions.versions) {
        try {
            let version = paperVersions.versions[i];
            // Skip pre-release and release candidate versions
            if (version.includes("-pre") || version.includes("-rc")) {
                continue;
            }
        const response = await fetch(`https://api.papermc.io/v2/projects/paper/versions/${version}/builds`);
        const builds = await response.json();
        const build = builds.builds[builds.builds.length - 1].build;
        let channel = builds.builds[builds.builds.length - 1].channel;
        if (channel == "experimental") {
            channel = "beta";
        } else if (channel == "default") {
            channel = "release";
        }
        const link = `https://api.papermc.io/v2/projects/paper/versions/${version}/builds/${build}/downloads/paper-${version}-${build}.jar`;
        const filename = `paper-${version}-${channel}.jar`;

        if (!skipOldVersions || getMajorVersion(version, 1) >= 21) {
            await downloadAndLogJar(filename, link);
    }
    //if the channel is release and theres an existing beta jar, delete it
    if (channel == "release") {
        const betaFilename = `paper-${version}-beta.jar`;
        if (index[betaFilename]) {
            delete index[betaFilename];
        }
        if (fs.existsSync(`assets/jars/${betaFilename}`)) {
            fs.unlinkSync(`assets/jars/${betaFilename}`);
        }   
    }

        } catch (e) {
            //console.log(e);
        }
    

    }
}


//velocity
async function downloadVelocityJars() {
    //use papermc api
    const response = await fetch("https://api.papermc.io/v2/projects/velocity");
    const velocityVersions = await response.json();
    for (let i in velocityVersions.versions) {
        let version = velocityVersions.versions[i];
        const response = await fetch(`https://api.papermc.io/v2/projects/velocity/versions/${version}/builds`);
        const builds = await response.json();
        const build = builds.builds[builds.builds.length - 1].build;
        let channel = "release";
        if (version.includes("SNAPSHOT")) {
            channel = "beta";
        }

        const link = `https://api.papermc.io/v2/projects/velocity/versions/${version}/builds/${build}/downloads/velocity-${version}-${build}.jar`;
        version = version.split("-")[0];
        const filename = `velocity-${version}-${channel}.jar`;

        if (!skipOldVersions || getMajorVersion(version, 1) >= 21) {
            await downloadAndLogJar(filename, link);
    }

        //
    

    }
}

async function downloadForgeJars() {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const response = await fetch("https://files.minecraftforge.net/maven/net/minecraftforge/forge/index.html", {
            signal: controller.signal
        });
        clearTimeout(timeout);

    // Wait for the response text to resolve
    const minecraftVersionsHtml = $(await response.text());

    // section.sidebar-nav li.li-version-list > ul > li
    let minecraftVersions = minecraftVersionsHtml.find("section.sidebar-nav li.li-version-list > ul > li > a").toArray();
    let latest = minecraftVersionsHtml.find("section.sidebar-nav li.li-version-list > ul > li.elem-active").toArray()[0];
    minecraftVersions.push(latest);
    //console.log(minecraftVersions)
    for (let i in minecraftVersions) {
        let url = "https://files.minecraftforge.net/maven/net/minecraftforge/forge/index_"+minecraftVersions[i].textContent.trim()+".html";
        //console.log(url)
        const response2 = await fetch(url);
        let forgeVersionsHtml = $(await response2.text());

        let forgeVersionChannels = forgeVersionsHtml.find(".downloads > .download > .title").toArray();
        let forgeVersionLinks = forgeVersionsHtml.find(".downloads > .download > .links > .link-boosted > a").toArray();
        for (let j in forgeVersionLinks) {
            let channel = Array.from(forgeVersionChannels[j].childNodes)
            .filter(node => node.nodeType === 3)[1]
            .nodeValue.trim().split(" ")[1].toLowerCase();
            let link = forgeVersionLinks[j].href.split("&url=")[1];
            let components = link.split("/").pop().split("-");
            let filename = "forge-" + components[1] + "-" + channel + ".jar";
            if (!components[1].includes("1.7.10_pre4")) {
                if (!skipOldVersions || getMajorVersion(components[i], 1) >= 21) {
                    await downloadAndLogJar(filename, link);
            }
            }
        }


    }
    } catch (err) {
        console.error("Error downloading Forge jars (skipping):", err.message);
        scraperLog.push({
            filename: "forge-general",
            url: "https://files.minecraftforge.net/maven/net/minecraftforge/forge/index.html",
            success: false,
            timestamp: new Date().toISOString(),
            error: `${err.name}: ${err.message} (skipped, will retry next run)`
        });
    }

}

// neoforge
async function downloadNeoforgeJars() {
    try {
        const response = await fetch("https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge");
        let neoforgeVersions = await response.json();
        neoforgeVersions = neoforgeVersions.versions;

        const latestVersions = [];
        for (let i = neoforgeVersions.length - 1; i >= 0; i--) {
            let version = neoforgeVersions[i];

            // Skip invalid versions (like 0.25w14craftmine.*)
            if (!version.match(/^\d+\.\d+/)) {
                continue;
            }

            let minecraftVersion = version.split(".")[0] + "." + version.split(".")[1];

            let minecraftVersionAlreadyPresent = false;
            for (let j in latestVersions) {
                let version2 = latestVersions[j];

                if (version2.includes(minecraftVersion)) {
                    minecraftVersionAlreadyPresent = true;
                    break;
                }
            }

            if (!minecraftVersionAlreadyPresent) {
                latestVersions.push(version);
            }
        }

        for (let i in latestVersions) {
            let url = `https://maven.neoforged.net/releases/net/neoforged/neoforge/${latestVersions[i]}/neoforge-${latestVersions[i]}-installer.jar`;
            // Convert NeoForge version (e.g., 21.6.15) to Minecraft version (e.g., 1.21.6)
            let parts = latestVersions[i].split(".");
            let minecraftVersion = "1." + parts[0] + "." + parts[1];
            let channel = "release";
            if (latestVersions[i].includes("beta")) {
                channel = "beta";
            }
            let filename = `neoforge-${minecraftVersion}-${channel}.jar`;
            console.log(`NeoForge: Version=${latestVersions[i]}, MinecraftVersion=${minecraftVersion}, Filename=${filename}`);

            if (!skipOldVersions || getMajorVersion(minecraftVersion, 1) >= 20) {
                await downloadAndLogJar(filename, url);
            }
        }
    } catch (err) {
        scraperLog.push({
            filename: "neoforge-general",
            url: "https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge",
            success: false,
            timestamp: new Date().toISOString(),
            error: err.message
        });
    }
}

function getMajorVersion(version, i) {
    try {
        return parseInt(version.split(".")[i]);
    } catch (e) {
        return 0;
    }
}


async function downloadQuiltJars() {
    const url = "https://quiltmc.org/api/v1/download-latest-installer/java-universal";

    let filename = "quilt-installer.jar";

        await downloadAndLogJar(filename, url);

}

async function downloadFabricJars() {
    const response = await fetch("https://meta.fabricmc.net/v2/versions/game");
    const fabricVersions = await response.json();

    //get latest loader version
    const response2 = await fetch("https://meta.fabricmc.net/v2/versions/loader");
    const fabricLoaderVersions = await response2.json();
    const latestLoaderVersion = fabricLoaderVersions[0].version;

    //get latest installer version
    const response3 = await fetch("https://meta.fabricmc.net/v2/versions/installer");
    const fabricInstallerVersions = await response3.json();
    const latestInstallerVersion = fabricInstallerVersions[0].version;

    for (let i in fabricVersions) {
        if (fabricVersions[i].stable) {
            const url = `https://meta.fabricmc.net/v2/versions/loader/${fabricVersions[i].version}/${latestLoaderVersion}/${latestInstallerVersion}/server/jar`;
            const filename = `fabric-${fabricVersions[i].version}.jar`;

            if (!skipOldVersions || getMajorVersion(fabricVersions[i].version, 0) >= 21) {
                await downloadAndLogJar(filename, url);


        }

    }
}
}

async function downloadGeyserJars() {

        await downloadAndLogJar("geyser-spigot.jar", "https://download.geysermc.org/v2/projects/geyser/versions/latest/builds/latest/downloads/spigot");
        await downloadAndLogJar("floodgate-spigot.jar", "https://download.geysermc.org/v2/projects/floodgate/versions/latest/builds/latest/downloads/spigot");
}

async function downloadWorldgenMods() {
    let worldgenMods = ["terralith", "incendium", "nullscape", "structory"];
    for (let z in worldgenMods) {

        


    const response = await fetch(`https://api.modrinth.com/v2/project/${worldgenMods[z]}/version?loaders=[%22datapack%22]`);
    const versions = await response.json();

    let minecraftVersions = [];

    for (let i in versions) {
        if (worldgenMods[z] != undefined) {

        let url = versions[i].files[0].url;
        let channel = versions[i].version_type;
        for (let j in versions[i].game_versions) {
            let minecraftVersion = versions[i].game_versions[j];
            let minecraftVersionAlreadyPresent = false;
            for (let k in minecraftVersions) {
                if (minecraftVersions[k].split("*")[0] == minecraftVersion && minecraftVersions[k].split("*")[2] == channel) {
                    minecraftVersionAlreadyPresent = true;
                    break;
                }
            }
            if (!minecraftVersionAlreadyPresent) {
                minecraftVersions.push(minecraftVersion+"*"+url+"*"+channel);
            }
        }  
    } 
    }

    for (let i in minecraftVersions) {
        if (worldgenMods[z] != undefined) {
        let minecraftVersion = minecraftVersions[i].split("*")[0];
        let url = minecraftVersions[i].split("*")[1];
        let channel = minecraftVersions[i].split("*")[2];
        let filename = `${worldgenMods[z]}-${minecraftVersion}-${channel}.zip`;
        if (!skipOldVersions || getMajorVersion(minecraftVersion, 1) >= 21) {
            await downloadAndLogJar(filename, url);
    }
    }
}
    
}
}
function downloadSnapshotJars() {
    files.GET(
      "https://launchermeta.mojang.com/mc/game/version_manifest.json",
      (vdata) => {
        try {
          const json = JSON.parse(vdata);
          if (json.latest.snapshot == json.versions[0].id) {
            files.GET(json.versions[0].url, (data) => {
              try {
                const version = JSON.parse(data);
                if (version.downloads.server != undefined) {

  index["snapshot-" + json.versions[0].id + ".jar"] = version.downloads.server.url;
  logJar("snapshot-" + json.versions[0].id + ".jar", version.downloads.server.url);

                }
              } catch (e) {
                //console.log(e);
              }
            });
          }
        } catch (e) {
          //console.log(e);
        }
      }
    );
  }

  function downloadVanillaJars() {
    files.GET(
        "https://launchermeta.mojang.com/mc/game/version_manifest.json",
        (vdata) => {
            try {
                const json = JSON.parse(vdata);
                for (let i in json.versions) {
                    let version = json.versions[i];
                    if (version.type == "release") {
                        files.GET(version.url, (data) => {
                            try {
                                const version = JSON.parse(data);
                                if (version.downloads.server != undefined) {
                                    if (!skipOldVersions || getMajorVersion(version.id, 1) >= 21) {
                                    index["vanilla-" + version.id + ".jar"] = version.downloads.server.url;
                                    logJar("vanilla-" + version.id + ".jar", version.downloads.server.url);
                                    }
                                }
                            } catch (e) {
                                //console.log(e);
                            }
                        });
                    }
                }
            } catch (e) {
                //console.log(e);
            }

        }   
    );
}   


async function fullDownload() {
    skipOldVersions = false;
    scraperLog = [];
    try {
        await downloadPaperJars();
        await downloadVelocityJars();
        await downloadForgeJars();
        await downloadNeoforgeJars();
        await downloadQuiltJars();
        await downloadFabricJars();
        await downloadGeyserJars();
        await downloadWorldgenMods();
        downloadSnapshotJars();
        downloadVanillaJars();
        setTimeout(() => done(), 5000);
    } catch (e) {
        //console.log(e);
    }

}

function done() {
    const indexJson = JSON.stringify(index);
    fs.writeFileSync("assets/scraper.json", indexJson);

    // Write scraper log to logs folder
    const scraperLogJson = JSON.stringify(scraperLog, null, 2);
    fs.writeFileSync("logs/scraper.json", scraperLogJson);
    //console.log("Done running jars scraper");
}

async function partialDownload() {

    skipOldVersions = true;
    scraperLog = [];
    try {
        await downloadPaperJars();
        await downloadVelocityJars();
        await downloadForgeJars();
        await downloadNeoforgeJars();
        await downloadQuiltJars();
        await downloadFabricJars();
        await downloadGeyserJars();
        await downloadWorldgenMods();
        downloadSnapshotJars();
        downloadVanillaJars();
        setTimeout(() => done(), 5000);
    } catch (e) {
        //console.log(e);
    }

}

partialDownload();


module.exports = {fullDownload, partialDownload};
