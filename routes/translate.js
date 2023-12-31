const express = require("express");
const router = express.Router();
const fs = require("fs");
const config = require("../scripts/utils.js").getConfig();

router.get("/", (req, res) => {
  const exec = require("child_process").exec;
  exec(
    `curl -i -X POST 'https://api-free.deepl.com/v2/translate' \
  --header 'Authorization: DeepL-Auth-Key [${config.deeplKey}]' \
  --data-urlencode 'text=${req.query.text}!' \
  --data-urlencode 'target_lang=${req.query.target_lang}' `,
    (err, stdout, stderr) => {
      let statusCode = stdout.split("HTTP/2 ")[1].split("\n")[0];
      let res = stdout.split("\n")[stdout.split("\n").length - 1];
      if (statusCode == "200") {
        try {
          res.send({ text: JSON.parse(res).translations[0].text });
        } catch {
          res.send({ msg: "Error translating text" });
        }
      } else if (statusCode == "456") {
        res.send({
          msg: "Sorry, our DeepL translation access is at capacity.",
        });
      } else {
        res.send({ msg: "Error translating text" });
      }
    }
  );
});

module.exports = router;
