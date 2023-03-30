function download(file, url) {
  exec(`curl -o ${file} -LO ${url}`);
}

function extract(archive, dir) {
  exec(`tar -xvf ${archive} -C ${dir}`);
}

module.exports = { download, extract };
