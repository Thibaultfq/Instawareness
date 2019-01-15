$(function() {
  if (!Cookies.get("csrf") || !Cookies.get("sessionid")) {
    const $form = $("#Login");
    $form.on("submit", submitHandler);
    $("#password").keyup(function(event) {
      if (event.keyCode === 13) {
        $form.submit();
      }
    });

    function submitHandler(e) {
      e.preventDefault();
      $("#loginAlert").remove();
      // $("#Login button")
      //   .prop("disabled", true)
      //   .prepend('<i class="fas fa-circle-notch fa-spin fa-lg"></i>&nbsp;');
      // $("#password").off("keyup");
      $.ajax({
        url: "/loginClient",
        type: "POST",
        data: $form.serialize(),
        dataType: "json",
        xhrFields: { withCredentials: true },
        success: function(data, textStatus, jqXHR) {
          if (typeof data.redirect == "string") {
            Cookies.set("csrf", data.csrf, { expires: 80 });

            Cookies.set("sessionid", data.sessionid, {
              expires: 80
            });
            console.log(Cookies.get("csrf"));
            console.log(Cookies.get("sessionid"));

            $(".login").prepend(
              '<div class="alert alert-success w-50 mx-auto" role="alert"><i class="fas fa-circle-notch fa-spin fa-lg"></i> Login successful! We are analyzing the algorithm behind your profile. <strong>This can take some time (up to 1 minute)</strong>, please wait and do not reload.</div >'
            );

            window.location.href = data.redirect;
          }
        },
        error: function(xhr, textStatus, errorThrown) {
          //console.error(textStatus);
          if (xhr.status == 401) {
            $(".login").prepend(
              '<div id="loginAlert" class="alert alert-warning alert-dismissible fade show w-50 mx-auto" role="alert"> <button type="button" class="close" data-dismiss="alert" aria-label="Close"> <span aria-hidden="true">&times;</span></button ><strong>Incorrect login credentials!</strong> Did you forget your login credentials? Most of the times, your Instagram password is the same as your Facebook one, because these platforms are often linked. <a href="https://www.instagram.com/accounts/password/reset/" class="alert-link">You can easily reset it here.</a></div >'
            );
            $("#Login button")
              .prop("disabled", false)
              .text("Login");
            $("#password").keyup(function(event) {
              if (event.keyCode === 13) {
                $form.submit();
              }
            });
          } else {
            // alert("Something went wrong, please let me know so i can fix it.");
          }
        }
      });
    }
  }
});

/**
 * Get csrf token
 * @return {Object} Promise
 */
async function getCsrfToken() {
  return window
    .fetch("https://www.instagram.com", {
      method: "get",
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q0.9,image/webp,image/apng,*.*;q=0.8",
        "accept-langauge": "en-US;q=0.9,en;q=0.8,es;q=0.7",

        origin: "https://www.instagram.com",

        referer: "https://www.instagram.com/",
        "upgrade-insecure-requests": "1",

        "user-agent": instagram.userAgent,

        cookie: "ig_cb=1"
      }
    })
    .then(t => {
      let cookies = t.headers.raw()["set-cookie"];

      var keys = Object.keys(instagram.essentialValues);

      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (!instagram.essentialValues[key])
          for (let c in cookies)
            if (cookies[c].includes(key) && !cookies[c].includes(key + '=""')) {
              var cookieValue = cookies[c].split(";")[0].replace(key + "=", "");
              instagram.essentialValues[key] = cookieValue;
              break;
            }
      }

      return t.text();
    })
    .then(html => {
      var subStr = html;

      var startStr = '<script type="text/javascript">window._sharedData = ';
      var start = subStr.indexOf(startStr) + startStr.length;
      subStr = subStr.substr(start, subStr.length);

      subStr = subStr.substr(0, subStr.indexOf("</script>") - 1);

      var json = JSON.parse(subStr);

      instagram.rollout_hash = json.rollout_hash;

      return json.config.csrf_token;
    })
    .catch(e => {
      console.log(e);
      console.log("Failed to get instagram csrf token");
    });
}

/**
 * Session id by usrname and password
 * @param {String} username
 * @param {String} password
 * @return {Object} Promise
 */

async function auth(username, password) {
  var formdata =
    "username=" + username + "&password=" + password + "&queryParams=%7B%7D";

  var options = {
    method: "POST",
    body: formdata,
    headers: {
      accept: "*/*",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "sv,en-US;q=0.9,en;q=0.8,es;q=0.7",
      "content-length": formdata.length,
      "content-type": "application/x-www-form-urlencoded",
      cookie: "ig_cb=" + instagram.essentialValues.ig_cb,
      origin: "https://www.instagram.com",
      referer: "https://www.instagram.com/",
      "user-agent": instagram.userAgent,
      "x-csrftoken": instagram.csrfToken,
      "x-instagram-ajax": instagram.rollout_hash,
      "x-requested-with": "XMLHttpRequest"
    }
  };

  return window
    .fetch("https://www.instagram.com/accounts/login/ajax/", options)
    .then(t => {
      let cookies = t.headers.raw()["set-cookie"];
      var keys = Object.keys(instagram.essentialValues);

      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (!instagram.essentialValues[key])
          for (let c in cookies) {
            if (cookies[c].includes(key) && !cookies[c].includes(key + '=""')) {
              var cookieValue = cookies[c].split(";")[0].replace(key + "=", "");
              instagram.essentialValues[key] = cookieValue;
              break;
            }
          }
      }
      console.log(instagram.essentialValues.sessionid);
      return instagram.essentialValues.sessionid;
    })
    .catch(e => {
      console.log(e);
      console.log("Instagram authentication failed (challenge required error)");
    });
}

var instagram = {
  csrfToken: undefined,
  sessionId: undefined,
  rollout_hash: undefined,
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
  essentialValues: {
    sessionid: undefined,
    ds_user_id: undefined,
    csrftoken: undefined,
    shbid: undefined,
    rur: undefined,
    mid: undefined,
    shbts: undefined,
    mcd: undefined,
    ig_cb: undefined
    //urlgen      : undefined //this needs to be filled in according to my RE
  }
};

function submitHandlerNewTest(e) {
  e.preventDefault();
  if (event.keyCode === 13) {
    getCsrfToken()
      .then(csrf_ => {
        if (!csrf_) {
          return Promise.reject("csrf is undefined:" + csrf_);
        }
        csrf = csrf_;
        console.log(csrf);
        instagram.csrfToken = csrf_;
      })
      .then(() => {
        let username = $("#username").val();
        let password = $("#password").val();
        return auth(username, password).then(sessionId_ => {
          console.log(sessionId_);
          if (!sessionId_) {
            return Promise.reject(401);
          }
          sessionid = sessionId_;
          instagram.sessionId = sessionId_;
        });
      });
  }
}
