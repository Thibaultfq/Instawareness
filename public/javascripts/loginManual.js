$(function() {
  $("#cookie-input").on("paste", function(e) {
    let pasteData = e.originalEvent.clipboardData.getData("text");
    if (isJson(pasteData)) {
      let icookies = JSON.parse(pasteData);
      if (
        icookies.some(co => co.name === "csrftoken") &&
        icookies.some(co => co.name === "sessionid")
      ) {
        let csrf = icookies.find(co => co.name === "csrftoken");
        let sessionid = icookies.find(co => co.name === "sessionid");

        Cookies.set("csrf", csrf.value, {
          expires: new Date(csrf.expirationDate * 1000)
        });
        Cookies.set("sessionid", sessionid.value, {
          expires: new Date(sessionid.expirationDate * 1000)
        });

        if (!!Cookies.get("csrf") && !!Cookies.get("sessionid")) {
          $("#cookie-feedback")
            .addClass("cookies-ok")
            .removeClass("cookies-nopaste cookies-nojson")
            .text("In orde!");

          $("#cookie-reload").attr("disabled", false);
        }
      } else {
        alertWrongJSON();
      }
    } else {
      alertWrongJSON();
    }

    $("#cookie-reload").click(function() {
      $(".login").prepend(
        '<div class="alert alert-success alert-fixed w-50 mx-auto" role="alert"><i class="fas fa-circle-notch fa-spin fa-lg"></i> We analyzeren even het algoritme achter je tijdlijn! Eenmaal Instawareness geladen is, blijf je ingelogd (al deze stappen waren dus éénmalig)! <strong>Dit kan eventjes duren (tot 1 minuut)</strong>, heb aub even geduld en herlaad niet zelf de pagina.</div >'
      );

      window.location.href = "/";
    });
  });

  function alertWrongJSON() {
    $("#cookie-feedback")
      .addClass("cookies-nojson")
      .removeClass("cookies-nopaste cookies-ok")
      .text("Verkeerde tekst geplakt!");
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
