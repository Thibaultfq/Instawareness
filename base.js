const admin = require("firebase-admin");

var serviceAccount = require("./private/instawareness-d788f-37fb654719cd.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

var db = admin.firestore();

module.exports = db;
