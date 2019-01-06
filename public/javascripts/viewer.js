$(function() {
  // Instance the tour
  //localStorage.clear();
  var tour = new Tour({
    storage: false,
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
      },
      {
        element: "#view2 .algolist",
        title: "Gele lijst",
        content:
          "De gele kolom rechts toont jou het resultaat zoals je het zou zien in jouw app, mét algoritme dus"
      },
      {
        element: "[data-highest]",
        title: "Hoger gesorteerde posts",
        content: getContentHighestRank,
        placement: "bottom",
        onShow: function() {
          let $parentDiv = $("#nav-tabContent");
          let $innerListItem = $("[data-highest]");
          let $scrollTop =
            $parentDiv.scrollTop() +
            $innerListItem.position().top -
            $parentDiv.height() / 2 +
            $innerListItem.height() / 2 +
            100;

          $parentDiv.animate({ scrollTop: $scrollTop }, 1000);
        }
      },
      {
        element: "[data-lowest]",
        title: "Lager gesorteerde posts",
        content: getContentLowestRank,
        placement: "bottom",
        onShow: function() {
          let $parentDiv = $("#nav-tabContent");
          let $innerListItem = $("[data-lowest]");
          let $scrollTop =
            $parentDiv.scrollTop() +
            $innerListItem.position().top -
            $parentDiv.height() / 2 +
            $innerListItem.height() / 2 +
            100;

          $parentDiv.animate({ scrollTop: $scrollTop }, 1000);
        }
      },
      {
        element: "#view3-tab",
        title: "Vrienden tabblad",
        content:
          "Op deze Vrienden-pagina kan je zien <b>van welke mensen die je volgt, het algoritme deze hoger rangschikt in je feed</b>, welke gelijk en welke lager in je feed. Het algoritme schat hier eigenlijk in met welke vrienden je <b>meer of minder affiniteit</b> hebt.",
        onNext: function() {
          $("#view3-tab").tab("show");
          $("#view2").removeClass("active");
          $("#view3").addClass("active");
        }
      },
      {
        element: "[data-highest-followee]",
        title: "Hoger gesorteerde vrienden",
        content: getContentHighestFollowee,
        onPrev: function() {
          $("#view2-tab").tab("show");
          $("#view3").removeClass("active");
          $("#view2").addClass("active");
        }
      },
      {
        element: "[data-lowest-followee]",
        title: "Lager gesorteerde vrienden",
        content: getContentLowestFollowee,
        onNext: function(tour) {
          if (!$("#view4-tab").length) {
            tour.end();
          }
        }
      },
      {
        element: "#view4-tab",
        title: "Vrienden tabblad",
        content:
          "Op deze Vrienden-pagina kan je zien <b>van welke mensen die je volgt, het algoritme deze hoger rangschikt in je feed</b>, welke gelijk en welke lager in je feed. Het algoritme schat hier eigenlijk in met welke vrienden je <b>meer of minder affiniteit</b> hebt.",
        onNext: function() {
          $("#view4-tab").tab("show");
          $("#view3").removeClass("active");
          $("#view4").addClass("active");
        }
      },
      {
        element: "#view4 > .row:nth-child(3) [data-hidden]",
        title: "Verborgen vrienden",
        content: getContentHiddenFollowee,
        onNext: function(tour) {
          tour.end();
        },
        onPrev: function() {
          $("#view3-tab").tab("show");
          $("#view4").removeClass("active");
          $("#view3").addClass("active");
        },
        placement: "top"
      },
      {
        element: "html",
        title: "will never show",
        content: ""
      }
    ],
    onEnd: function(tour) {
      $("#view1-tab").tab("show");
      $("#view4,#view3").removeClass("active");
      $("#view1").addClass("active");
      $("#endTour").modal();
    },
    template: `<div class="popover" role="tooltip">
    <div class="arrow"></div>
    <h3 class="bg popover-header"></h3>
    <div class="popover-body"></div>
    <div class="popover-navigation">
        <div class="btn-group"> <button class="btn btn-sm btn-muted" data-role="prev">&laquo; vorige</button> <button
                class="btn btn-sm btn-success" data-role="next">volgende &raquo;</button> <button class="btn btn-sm btn-secondary"
                data-role="pause-resume" data-pause-text="Pause" data-resume-text="Resume">Pause</button> </div>
        <button class="btn btn-sm text-danger" data-role="end"><i class="fas fa-times-circle"></i></button>
    </div>
</div>`
  });

  // Initialize the tour
  tour.init();

  // Start the tour
  $("#startbtn").click(function() {
    tour.start(true);
  });
});

function getContentHighestRank() {
  let $highestTag = $("[data-highest]");
  let namesHighestTag = $highestTag.closest(".row").find(".instawrap .user");
  return `Het Instagram-algoritme toont de post van <b>${
    namesHighestTag[1].innerText
  } ${$highestTag.attr(
    "data-highest"
  )} plaatsen hoger</b> in je feed. Zonder de invloed van het algoritme zou je de foto van <b>${
    namesHighestTag[0].innerText
  }</b> zien. Vind je dat deze post inderdaad een <b>hogere</b> plaats verdient? Spreekt de content van ${
    namesHighestTag[1].innerText
  } jou dus meer aan? Waarom wel of waarom niet? Denk er even over na.`;
}

function getContentLowestRank() {
  let $lowestTag = $("[data-lowest]");
  let namesLowestTag = $lowestTag.closest(".row").find(".instawrap .user");
  return `De post van  <b>${
    namesLowestTag[1].innerText
  }</b> zie je <b>door het algoritme pas ${Math.abs(
    $lowestTag.attr("data-lowest")
  )} plaatsen lager</b> in je feed. Vind je dit oké, mag deze post dus lager staan? Denk je dat het algoritme jouw posts soms ook lager gerangschikt bij je volgers? Denk ook hier even over na.`;
}

function getContentHighestFollowee() {
  let $highestFollowee = $("[data-highest-followee]");
  return `<b>
  ${$highestFollowee
    .children(".user")
    .text()}</b> is <b>in totaal ${$highestFollowee
    .children(".badge")
    .text()} plaatsen hoger gerankt</b>. Wil je deze persoon ook echt vaker zien in jouw feed? Denk ook even na over het volgende: bij wie zou jij helemaal bovenaan in hun feed verschijnen?
  `;
}

function getContentLowestFollowee() {
  let $lowestFollowee = $("[data-lowest-followee]");
  return `<b>
  ${$lowestFollowee
    .children(".user")
    .text()}</b> is <b>in totaal ${$lowestFollowee
    .children(".badge")
    .text()} plaatsen lager gerankt</b>. Waarom denk je dat deze persoon lager gerangschikt staat in je feed? Interesseert hij/zij je minder? Ben je het eens met deze lagere rangschikking? Of heb je het gevoel dat je zo vaak posts mist?`;
}

function getContentHiddenFollowee() {
  let $hiddenFollowee = $($("[data-hidden]")[0]);
  let $namesHiddenFollowee = $hiddenFollowee
    .closest(".row")
    .find(".instawrap .user");
  return `
    Stel dat je Instagram opent en door de eerste ${$(
      "#totalTopPosts"
    ).text()} posts in jouw feed scrollt. Dat betekent dat je <b>de post van ${
    $namesHiddenFollowee[0].innerText
  }</b> zou missen. Heb je het gevoel dat je zo vaak belangrijke posts mist? Denk je dat het algoritme jouw posts ook voor vrienden verbergt?
  `;
}
