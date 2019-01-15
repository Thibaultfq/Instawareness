var express = require("express");
var router = express.Router();
var Instagram = require("./../instagram-nodejs-without-api/instagram");
var vdAssembler = require("../src/viewDataAssembler");
var MobileDetect = require("mobile-detect");
var Client = require("./../instagram-private-api").V1;

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

router.post("/loginClient", function(req, res, next) {
  var storage = new Client.CookieMemoryStorage();
  var device = new Client.Device(req.body.username);

  loginClient(device, storage, req.body.username, req.body.password).then(
    session => {
      console.log(session);
    }
  );
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
      console.log(csrf);
      instagram.csrfToken = csrf_;
    })
    .then(() => {
      return instagram
        .auth(req.body.username, req.body.password)
        .then(sessionId_ => {
          console.log(sessionId_);
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

const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
function challengeMe(error, device, storage, user, password, proxy) {
  return Client.Web.Challenge.resolve(error, "phone")
    .then(function(challenge) {
      // challenge instanceof Client.Web.Challenge
      console.log(challenge.type);
      // can be phone or email
      // let's assume we got phone
      if (challenge.type !== "phone") return;
      //Let's check if we need to submit/change our phone number
      return challenge.phone("your phone number").then(function() {
        return challenge;
      });
    })
    .then(function(challenge) {
      if (!(challenge instanceof Client.Web.PhoneVerificationChallenge)) {
        return challenge;
      }

      // Ok we got to the next step, the response code expected by Instagram
      return new Promise((resolve, reject) => {
        rl.question("Code: ", code => {
          resolve(challenge.code(code));
        });
      });
    })
    .catch(Client.Exceptions.NoChallengeRequired, function(e) {
      // And we got the account confirmed!
      // so let's login again
      return loginClient(device, storage, user, password, proxy);
    });
}

async function loginClient(device, storage, user, password, proxy) {
  return Client.Session.create(device, storage, user, password, proxy)
    .then(function(session) {
      // Now you have a session, we can follow / unfollow, anything...
      // And we want to follow Instagram official profile
      console.log(session);
      return session;
    })
    .catch(Client.Exceptions.CheckpointError, function(error) {
      // Ok now we know that Instagram is asking us to
      // prove that we are real users
      //console.log(error);
      return challengeMe(error, device, storage, user, password);
    });
}
module.exports = router;
