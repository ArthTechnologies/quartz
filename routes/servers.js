const express = require("express");
const router = express.Router();
const fs = require("fs");
let email = "";
let names = [];
let softwares = [];
let versions = [];
var array = fs.readFileSync("servers.csv").toString().split("\n");
var amount = 0;
var arraylength = 0;
var guard = 0;

for (i in array) {
  arraylength++;
}

function checkServers(em) {
  amount = 0;
  console.log(array[2].indexOf(em));
  console.log(array[2]);
  var n = [];
  var s = [];
  var v = [];
  for (i = 0; i < arraylength; i++) {
    if (array[i].indexOf(em) > 0) {
      n.push(array[i].split(",")[0]);
      s.push(array[i].split(",")[1]);
      v.push(array[i].split(",")[2]);
    }

    v = v.filter(function (el) {
      return el != null;
    });
    s = s.filter(function (el) {
      return el != null;
    });
    n = n.filter(function (el) {
      return el != "";
    });

    console.log(" a " + n);

    if (array[i].indexOf(em) > 0) {
      amount++;
      console.log("amount is " + amount);
    }

    console.log(n, s, v, amount);
  }
  names = n;
  softwares = s;
  versions = v;
}
console.log("names2: " + names);

router.post(`/`, function (req, res) {
  //add cors header

  //if req.body.email is "noemail" return 404
  if (req.body.email == ("noemail" | "undefined")) {
    //res.status(404).json({ msg: `Invalid email.` });
  }
  //set email to the email in the request
  email = req.body.email;

  console.log("yyyy" + checkServers(email));
  //wait for checkServers to finish
  console.log("return" + email + names + amount + softwares);
  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  delay(0).then(() =>
    res.status(200).json({
      names: names,
      amount: amount,
      versions: versions,
      softwares: softwares,
    })
  );
  console.log("g" + guard);
});

module.exports = router;
