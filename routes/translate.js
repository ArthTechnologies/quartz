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
      let res2 = stdout.split("\n")[stdout.split("\n").length - 1];
      if (statusCode == "200") {
        try {
          res.status(200).json({ text: JSON.parse(res2).translations[0].text });
        } catch {
          res.status(400).json({ msg: "Error translating text" });
        }
      } else if (statusCode == "456") {
        res.status(400).json({
          msg: "Sorry, our DeepL translation access is at capacity.",
        });
      } else {
        res.status(400).json({ msg: "Error translating text" });
      }
    }
  );
});

module.exports = router;
