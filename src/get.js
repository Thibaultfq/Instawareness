//use this file to fetch data and write it to a mockfile, so that then npm run mock can be used. folder mockFeeds does not exist on git, so create it if needed.
const fs = require("fs");
const path = require("path");
const _Instagram = require("instagram-nodejs-without-api");
const vdAssembler = require("./viewDataAssembler");

//get these from official login
const csrf = "";
const sessionid = "";

const instagram = new _Instagram();
instagram.csrfToken = csrf;
instagram.sessionId = sessionid;

vdAssembler.getAllViewData(instagram).then((data) => {
  try {
    fs.writeFileSync(path.join(__dirname, "/../mockFeeds/mockfeed.json"), JSON.stringify(data), "utf8");
    console.log("file written");
  } catch (err) {
    throw err;
  }
});
