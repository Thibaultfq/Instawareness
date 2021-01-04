$(function () {
  $("#cookie-input").on("paste", function (e) {
    let pasteData = e.originalEvent.clipboardData.getData("text");
    if (isJson(pasteData)) {
      let icookies = JSON.parse(pasteData);
      if (icookies.some((co) => co.name === "csrftoken") && icookies.some((co) => co.name === "sessionid")) {
        let csrf = icookies.find((co) => co.name === "csrftoken");
        let sessionid = icookies.find((co) => co.name === "sessionid");

        Cookies.set("csrf", csrf.value, {
          expires: new Date(csrf.expirationDate * 1000),
        });
        Cookies.set("sessionid", sessionid.value, {
          expires: new Date(sessionid.expirationDate * 1000),
        });

        if (!!Cookies.get("csrf") && !!Cookies.get("sessionid")) {
          $("#cookie-feedback").addClass("cookies-ok").removeClass("cookies-nopaste cookies-nojson").text("Cookies are ok!");

          $(".login").prepend(
            '<div class="alert alert-success alert-fixed w-50 mx-auto" role="alert"><i class="fas fa-circle-notch fa-spin fa-lg"></i> We are currently calculating the metrics about the amount of curation due to Instagram\'s algortihm behind your feed. Once Instawareness is loaded, you stay logged in. This process of copying coockies was thus a one time thing. <strong>We aware, it can take up to a minute for our server to calculate and show the resulst.</strong>, so please be patient and do not reload the page in the meantime.</div >'
          );

          window.location.href = "/";
        }
      } else {
        alertWrongJSON();
      }
    } else {
      alertWrongJSON();
    }
  });

  function alertWrongJSON() {
    $("#cookie-feedback").addClass("cookies-nojson").removeClass("cookies-nopaste cookies-ok").text("Wrong text pasted!");
  }
});
function isJson(item) {
  item = typeof item !== "string" ? JSON.stringify(item) : item;

  try {
    item = JSON.parse(item);
  } catch (e) {
    return false;
  }

  if (typeof item === "object" && item !== null) {
    return true;
  }

  return false;
}
