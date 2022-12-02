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


  
  var n = [];
  var s = [];
  var v = [];
  for (i = 0; i < arraylength; i++) {
    console.log("hi");
    if (array[i] != (undefined | '')) {
      if (array[i].indexOf(em) > 0) {
        n.push(array[i].split(",")[0]);
        s.push(array[i].split(",")[1]);
        v.push(array[i].split(",")[2]);
      }
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
  console.log(req.body.email)


  //if req.body.email is "noemail" return 404
  if (req.body.email == ("noemail" | "undefined")) {
    //res.status(404).json({ msg: `Invalid email.` });
  }
  //set email to the email in the request
  email = req.body.email;

  //if servers.csv isnt blank, run checkServers
    checkServers(email);
    console.log("return" + email + names + amount + softwares);
  //wait for checkServers to finish

  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  delay(1000).then(() =>
    res.status(200).json({
      names: names,
      amount: amount,
      versions: versions,
      softwares: softwares,
    })
  );

});

module.exports = router;
