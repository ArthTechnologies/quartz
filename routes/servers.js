const express = require("express");
const router = express.Router();
const fs = require("fs");
let email = "";
let names = [];
let softwares = [];
let versions = [];
var array = fs.readFileSync("servers.csv").toString().split("\n");
var amount = 0;
let ids = [];



function checkServers(em) {
  
  amount = 0;

  fs.readFile('servers.csv', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
  console.log(data.split('\n'));  
    // split the file data by '\n' and assign it to the 'array' variable
   a = data.split('\n');
  
    // do something with the array
  });
  
  var n = [];
  var s = [];
  var v = [];

  for (i in a) {

    if (a[i] != (undefined | '')) {
      if (a[i].indexOf(em) > 0) {
        n.push(a[i].split(",")[0]);
        s.push(a[i].split(",")[1]);
        v.push(a[i].split(",")[2]);
        
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



    if (a[i].indexOf(em) > 0) {
      amount++;
      ids.push(i);
    }


  }
  names = n;
  softwares = s;
  versions = v;

  return {      names: names,
    amount: amount,
    versions: versions,
    softwares: softwares,
    ids: ids,};

}


router.post(`/`, function (req, res) {
  //use fs.watchFile to watch for changes in servers.csv without causing node:7093


  
  
  


  //if req.body.email is "noemail" return 404
  if (req.body.email == ("noemail" | "undefined")) {
    //res.status(404).json({ msg: `Invalid email.` });
  }
  //set email to the email in the request
  email = req.body.email;

  //if servers.csv isnt blank, run checkServers
    
    
  //wait for checkServers to finish

  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }


  var r = checkServers(email);

  delay(0).then(() =>
    res.status(200).json(r)
  );

});

module.exports = router;
