function download(file,url) {
    exec(
        `curl -o ${file} -LO ${url}`
      )
}

module.exports = { download };