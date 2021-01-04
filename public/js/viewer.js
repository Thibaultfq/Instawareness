$(function () {
  // Instance the tour
  //localStorage.clear();
  const tour = new Tour({
    storage: false,
    steps: [
      {
        element: "#view2-tab",
        title: "Rank it tab",
        content: "Here you can see how posts are <b>ranked</b> by the <b>algortihm</b>, since the first post is not always the most recent post.",
        onNext: function () {
          $("#view2-tab").tab("show");
          $("#view1").removeClass("active");
          $("#view2").addClass("active");
        },
        backdrop: true,
      },
      {
        element: "#view2 .chronolist",
        title: "Blue list",
        content: "The left column in blue presents your feed without algortihm, which is chronologically (new -> old) ranked or sorted.",
        onPrev: function () {
          $("#view1-tab").tab("show");
          $("#view2").removeClass("active");
          $("#view1").addClass("active");
        },
      },
      {
        element: "#view2 .algolist",
        title: "Yellow list",
        content: "The right column in yellow presents your feed as it would be presented to you in the App, thus ranked with an algorithm.",
      },
      {
        element: "[data-highest]",
        title: "Higher ranked posts",
        content: getContentHighestRank,
        placement: "bottom",
        onShow: function () {
          let $parentDiv = $("#nav-tabContent");
          let $innerListItem = $("[data-highest]");
          let $scrollTop = $parentDiv.scrollTop() + $innerListItem.position().top - $parentDiv.height() / 2 + $innerListItem.height() / 2 + 100;

          $parentDiv.animate({ scrollTop: $scrollTop }, 1000);
        },
        onPrev: function () {
          $("#nav-tabContent").animate({ scrollTop: 0 }, 750);
        },
      },
      {
        element: "[data-lowest]",
        title: "Lower ranked posts",
        content: getContentLowestRank,
        placement: "bottom",
        onShow: function () {
          let $parentDiv = $("#nav-tabContent");
          let $innerListItem = $("[data-lowest]");
          let $scrollTop = $parentDiv.scrollTop() + $innerListItem.position().top - $parentDiv.height() / 2 + $innerListItem.height() / 2 + 100;

          $parentDiv.animate({ scrollTop: $scrollTop }, 1000);
        },
      },
      {
        element: "#view3-tab",
        title: "Profiles tab",
        content:
          "This tab presents information about <b> which profiles are ranked higher, lower or equal </b> in your feed due to the ranking algorithm. Here, the algortihm actually estimates your <b>affinity</b> with the people you follow.",
        onNext: function () {
          $("#view3-tab").tab("show");
          $("#view2").removeClass("active");
          $("#view3").addClass("active");
        },
      },
      {
        element: "[data-highest-followee]",
        title: "Higher ranked followees",
        content: getContentHighestFollowee,
        onPrev: function () {
          $("#view2-tab").tab("show");
          $("#view3").removeClass("active");
          $("#view2").addClass("active");
        },
      },
      {
        element: "[data-lowest-followee]",
        title: "Lower ranked followees",
        content: getContentLowestFollowee,
        onNext: function (tour) {
          if (!$("#view4-tab").length) {
            tour.end();
          }
        },
      },
      {
        element: "#view4-tab",
        title: "Hidden followees tab",
        content: "Sometimes you might even <b>miss a post</b> because of the algorithm. Discover how!",
        onNext: function () {
          $("#view4-tab").tab("show");
          $("#view3").removeClass("active");
          $("#view4").addClass("active");
        },
      },
      {
        element: "#view4 > .row:nth-child(3) [data-hidden]",
        title: "Hidden followee",
        content: getContentHiddenFollowee,
        onNext: function (tour) {
          tour.end();
        },
        onPrev: function () {
          $("#view3-tab").tab("show");
          $("#view4").removeClass("active");
          $("#view3").addClass("active");
        },
        placement: "top",
      },
      {
        element: "html",
        title: "will never show",
        content: "",
      },
    ],
    onEnd: function (tour) {
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
</div>`,
  });

  // Initialize the tour
  tour.init();

  // Start the tour
  $("#startbtn").click(function () {
    tour.restart();
  });
});

function getContentHighestRank() {
  let $highestTag = $("[data-highest]");
  let namesHighestTag = $highestTag.closest(".row").find(".instawrap .user");
  return `The instagram algortihm shows the post of <b>${namesHighestTag[1].innerText} ${$highestTag.attr(
    "data-highest"
  )} places higher</b> in your feed. Without an algorithm behind your feed, you would see the post of <b>${
    namesHighestTag[0].innerText
  }</b>. <div class="cq">
    Do you agree with this <b>higher</b> ranking? Does the content of ${namesHighestTag[1].innerText} really appeal more to you?
  </div>`;
}

function getContentLowestRank() {
  let $lowestTag = $("[data-lowest]");
  let namesLowestTag = $lowestTag.closest(".row").find(".instawrap .user");
  return `The post of <b>${namesLowestTag[1].innerText}</b> is ranked <b> ${Math.abs(
    $lowestTag.attr("data-lowest")
  )} places lower</b> in your feed due to instagram's algortihm. <div class="cq">
    Do you mind this? Do you think that your own posts are also ranked lower by the algorithm for your followers?
  </div>`;
}

function getContentHighestFollowee() {
  let $highestFollowee = $("[data-highest-followee]");
  return `<b>
  ${$highestFollowee.children(".user").text()}</b> is <b> ranked ${$highestFollowee
    .children(".badge")
    .text()} places higher in total</b>. <div class="cq">
      Do you actually want to see ${$highestFollowee.children(".user").text()} more often? By whom would you appear higher in his or her feed?
    </div>
  `;
}

function getContentLowestFollowee() {
  let $lowestFollowee = $("[data-lowest-followee]");
  return `<b>
  ${$lowestFollowee.children(".user").text()}</b> is <b> ranked ${$lowestFollowee
    .children(".badge")
    .text()} places lower in total</b>. <div class="cq">
      Why do you think that ${$lowestFollowee
        .children(".user")
        .text()} has a lower estimated affinity with you by the algorithm? Does ${$lowestFollowee
    .children(".user")
    .text()} interest you less or is this incorrect? Do you mind the lower rankings or do you now have a fear of missing more posts?
    </div>`;
}

function getContentHiddenFollowee() {
  let $hiddenFollowee = $($("[data-hidden]")[0]);
  let $namesHiddenFollowee = $hiddenFollowee.closest(".row").find(".instawrap .user");
  return `
    Imagine you open instagram and scroll through the first ${$(
      "#totalTopPosts"
    ).text()} posts. This would mean that you would completely miss <b>de post from ${
    $namesHiddenFollowee[0].innerText
  }</b>, because this post is actually lower ranked (see previous tab) and therefore falls out of the first 50 posts you see. <div class="cq">
    Do you have the feeling of missing posts now and then? Do you think that the algorithm 'hides' your own posts to your followees?
  </div>
  `;
}
