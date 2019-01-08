var express = require("express");
var router = express.Router();
var Instagram = require("./../instagram-nodejs-without-api/instagram");
var vdAssembler = require("../src/viewDataAssembler");
var MobileDetect = require("mobile-detect");

/* GET home page. */
router.get("/", function(req, res, next) {
  let md = new MobileDetect(req.headers["user-agent"]);
  if (md.mobile() || md.userAgent() == "IE" || md.userAgent() == "Edge") {
    return res.render("mobile");
  }
  if (!(req.cookies.csrf || req.cookies.sessionid)) {
    //no previous session found, so render the login page completely with layout
    return res.render("login");
  }
  //render the feed immediately
  renderAll(
    {
      csrf: req.cookies.csrf,
      sessionid: req.cookies.sessionid
    },
    res
  );
});

/* GET login page. Here you can force to go to the login page, even if you do already are logged in. */
router.get("/login", function(req, res, next) {
  return res.render("login");
});

router.post("/login", function(req, res, next) {
  let csrf, sessionid;
  let instagram = new Instagram();

  instagram
    .getCsrfToken()
    .then(csrf_ => {
      if (!csrf_) {
        return Promise.reject("csrf is undefined:" + csrf_);
      }
      csrf = csrf_;
      instagram.csrfToken = csrf_;
    })
    .then(() => {
      return instagram
        .auth(req.body.username, req.body.password)
        .then(sessionId_ => {
          if (!sessionId_) {
            return Promise.reject(401);
          }
          sessionid = sessionId_;
          instagram.sessionId = sessionId_;
        });
    })
    .then(() => {
      res.cookie("csrf", csrf, {
        expires: new Date(Date.now() + 6912000000), //80 days from now
        secure: false,
        httpOnly: false
      });
      res.cookie("sessionid", sessionid, {
        expires: new Date(Date.now() + 6912000000), //80 days from now
        secure: false,
        httpOnly: false
      });
    })
    .then(() => {
      res.status(200).send({ redirect: "/", sessionid: sessionid, csrf: csrf });
    })
    .catch(error => {
      //res.status(401).send("Invalid login credentials");
      if (error == 401) {
        return res.status(401).send("Invalid Login credentials");
      } else return next();
    });
});

function renderAll(cookies, res, insta) {
  //mock it for testing
  //return res.render("feed", testfeed);

  let instagram;

  if (!insta) {
    instagram = new Instagram();
    instagram.csrfToken = cookies.csrf;
    instagram.sessionId = cookies.sessionid;
  } else {
    instagram = insta;
  }

  vdAssembler
    .getAllViewData(instagram)
    .then(data => {
      //return res.json(data);
      return res.render("allFeeds", data);
    })
    .catch(error => {
      console.log(error);
      if (error && error.status == 429) {
        return res.status(429).render("limit");
      } else return res.render("error");
    });
}

module.exports = router;
