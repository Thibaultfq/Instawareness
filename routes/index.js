const express = require("express");
const router = express.Router();
const _Instagram = require("instagram-nodejs-without-api");
const vdAssembler = require("../src/viewDataAssembler");
const MobileDetect = require("mobile-detect");
const fs = require("fs");
const path = require("path");
const mock = process.env["MOCK"] || false;

/* GET home page. */
router.get("/", function (req, res, next) {
  let md = new MobileDetect(req.headers["user-agent"]);
  if (md.mobile() || md.userAgent() == "IE" || md.userAgent() == "Edge") {
    return res.render("nosupport");
  }
  if (!(req.cookies.csrf || req.cookies.sessionid)) {
    //no previous session found, so render the login page completely with layout
    return res.render("loginManual");
  }
  //render the feed immediately
  return renderAll(
    {
      csrf: req.cookies.csrf,
      sessionid: req.cookies.sessionid,
    },
    res
  );
});

/* GET login page. Here you can force to go to the login page, even if you do already are logged in. */
router.get("/login", function (req, res, next) {
  return res.render("loginManual");
});

function renderAll(cookies, res, insta) {
  if (mock) {
    // dev develop use npm run mock, don't hit the insta servers too much (see also get.js to create this mock)
    try {
      const testfeed = JSON.parse(fs.readFileSync(path.join(__dirname, "/../mockFeeds/mockfeed.json")));
      return res.render("allFeeds", testfeed);
    } catch (err) {
      if (err.code === "ENOENT") {
        console.log("File not found!");
      } else {
        throw err;
      }
    }
  } else {
    let instagram;

    if (!insta) {
      instagram = new _Instagram();
      instagram.csrfToken = cookies.csrf;
      instagram.sessionId = cookies.sessionid;
    } else {
      instagram = insta;
    }

    vdAssembler
      .getAllViewData(instagram)
      .then((data) => {
        //return res.json(data);
        return res.render("allFeeds", data);
      })
      .catch((error) => {
        console.log("logging error before handling error routing response");
        console.log(error);
        if (error && (error.status == 429 || error.status == 502)) {
          return res.status(429).render("limit");
        } else return res.render("error", { errorstr: JSON.stringify(error) });
      });
  }
}

module.exports = router;
