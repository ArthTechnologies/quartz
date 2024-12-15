const jQuery = require("jquery");
const {JSDOM} = require("jsdom");
const $ = jQuery(new JSDOM().window);
async function downloadForgeJars() {
    const response = await fetch("https://files.minecraftforge.net/maven/net/minecraftforge/forge/index.html");

    // Wait for the response text to resolve
    const minecraftVersionsHtml = $(await response.text());

    // section.sidebar-nav li.li-version-list > ul > li
    let minecraftVersions = minecraftVersionsHtml.find("section.sidebar-nav li.li-version-list > ul > li > a").toArray();
    for (let i in minecraftVersions) {
        let innerText = minecraftVersions[i].textContent.trim();
        console.log("Found Version Forge "+innerText+"...");

    }



}

downloadForgeJars();
module.exports = { downloadForgeJars };
