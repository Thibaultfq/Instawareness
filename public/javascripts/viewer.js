$(function() {
  // Instance the tour
  localStorage.clear();
  var tour = new Tour({
    steps: [
      {
        element: "#view2-tab",
        title: "Rank it tabblad",
        content: "Hier kan je zien hoe een post geranked is door het algoritme",
        onNext: function() {
          $("#view2-tab").tab("show");
          $("#view1").removeClass("active");
          $("#view2").addClass("active");
        },
        onShow: function(tour) {
          window.setTimeout(function() {
            $(".tour-backdrop").fadeOut(1000, function() {
              $(this).remove();
            });
          }, 1700);
        },
        backdrop: true
      },
      {
        element: "#view2 .chronolist",
        title: "Blauwe lijst",
        content: "De linkse kolom in het blauw is je feed zonder algoritme",
        onPrev: function() {
          $("#view1-tab").tab("show");
          $("#view2").removeClass("active");
          $("#view1").addClass("active");
        }
      }
    ]
  });

  // Initialize the tour
  tour.init();

  // Start the tour
  $("#startbtn").click(function() {
    tour.start(true);
  });
  //   function makeUnclickable(e) {
  //     if ($(this).hasClass("disabled")) {
  //       e.preventDefault();
  //       return false;
  //     }
  //   }
  //   $("body").on(
  //     "click",
  //     ".nav-tabs a[data-toggle=tab]:not(#view1-tab)",
  //     makeUnclickable
  //   );
  //   $("#startbtn").click(function() {
  //     $("body").off(
  //       "click",
  //       ".nav-tabs a[data-toggle=tab]:not(#view1-tab)",
  //       makeUnclickable
  //     );
  //     $(".nav-tabs a[data-toggle=tab]").click(function() {
  //       document.getElementById("nav-tabContent").scrollTo(0, 0);
  //     });
  //     $(".nav-tabs a[data-toggle=tab]:not(#view1-tab)").removeClass("disabled");
  //   });
});
