function download(file, url) {
  exec(`curl -o ${file} -LO ${url}`);
}

function extract(archive, dir) {
  exec(`tar -xvf ${archive} -C ${dir}`);
}

function write(file, content) {
  const fs = require("fs");
  const oldFile = fs.readFileSync(file, "utf8");
  fs.writeFileSync(`backup/${file}`, oldFile);

  fs.writeFileSync(file, content);
}
module.exports = { download, extract, write };
