$(function() {
  if (!Cookies.get("csrf") || !Coockies.get("sessionid")) {
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
      $("#Login button")
        .prop("disabled", true)
        .prepend('<i class="fas fa-circle-notch fa-spin fa-lg"></i>&nbsp;');
      $("#password").off("keyup");
      $.ajax({
        url: "/login",
        type: "POST",
        data: $form.serialize(),
        dataType: "json",
        success: function(data, textStatus, jqXHR) {
          if (typeof data.redirect == "string")
            $(".login h1").after(
              '<div class="alert alert-success w-50 mx-auto" role="alert"><i class="fas fa-circle-notch fa-spin fa-lg"></i> Login successful! We are analyzing the algorithm behind your profile. <strong>This can take some time (up to 1 minute)</strong>, please wait and do not reload.</div >'
            );
          window.location.replace(data.redirect);
        },
        error: function(xhr, textStatus, errorThrown) {
          //console.error(textStatus);
          if (xhr.status == 401) {
            $(".login h1").after(
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
            alert("Something went wrong, please let me know so i can fix it.");
          }
        }
      });
    }
  }
});
