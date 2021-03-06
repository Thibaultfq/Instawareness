let consts = require("../src/const");

module.exports = {
  getAllViewData: async function (insta) {
    let topPostsAndCursor = await getFeedByCount(consts.topSubSetCount, insta);
    let topPosts = topPostsAndCursor.topPosts;
    let allPosts = await getFeedUntilDate(
      getLeastRecentDate(topPosts),
      insta,
      JSON.parse(JSON.stringify(topPosts)), //deepclone that
      topPostsAndCursor.cursor ? topPostsAndCursor.cursor : null
    );

    const viewTwo = await getViewTwo(topPosts, allPosts);
    const viewThree = await getViewThree(topPosts, allPosts);
    const viewFour = await getViewFour(topPosts, allPosts);

    return {
      topPostsCount: consts.topSubSetCount,
      view1Name: consts.view1Name,
      view2Name: consts.view2Name,
      view3Name: consts.view3Name,
      view4Name: consts.View4Name,
      viewTwo,
      viewThree,
      viewFour,
    };
  },
};

async function getViewFour(_topPosts, _allPosts) {
  let topPosts = [..._topPosts]; //make copy to work with.
  sortByMostRecent(topPosts);

  let allPosts = [..._allPosts]; //make copy to work with
  sortByMostRecent(allPosts);

  let topPostsIds = topPosts.map((n) => n.node.id); //map the id's to prevent reloops afterwards

  //Loop over allStories and trim them to the same TopStoriespost, and add metadata.
  let indexDifferentRankingStarts = -1;
  let indexLastItemTopPostsInAllPosts = allPosts.findIndex((n, index) => {
    n.node.meta = {}; //create meta object to store all rankings meta data to show
    //add metadata: hidden
    let indexNodeInTopPosts = topPostsIds.indexOf(n.node.id);

    n.node.meta.isExcludedFromTopStories = indexNodeInTopPosts > -1 ? false : true;

    //return index to indicate overlap
    if (
      (indexDifferentRankingStarts === -1 && n.node.id !== topPostsIds[index]) ||
      (indexDifferentRankingStarts === -1 && index == topPosts.length - 1)
    ) {
      indexDifferentRankingStarts = index;
    }

    //return index to trim to.
    return n.node.id === topPostsIds[topPostsIds.length - 1];
  });

  if (indexDifferentRankingStarts === topPosts.length - 1) {
    //everthing is overlap
    return {
      beginOverlap: { topPosts, allPosts },
      allOverlap: true,
      totalCountTopPosts: topPosts.length,
    };
  }

  allPosts = allPosts.slice(0, indexLastItemTopPostsInAllPosts + 1);
  const beginOverlap = {
    topPosts: topPosts.splice(0, indexDifferentRankingStarts), //the indexDifferentRankingStarts is the index where the lists start to differ. Until the previous post they can be collapsed. This index number thus gives the amount of (overlapping) posts before it in the array, since it's zero based.
    allPosts: allPosts.splice(0, indexDifferentRankingStarts),
  };
  //take the first n items that are in overlap

  return {
    beginOverlap,
    topPosts: topPosts,
    allPosts: allPosts,
    totalCountTopPosts: beginOverlap.topPosts.length + topPosts.length,
  };
}

async function getViewTwo(_topPosts, _allPosts) {
  let topPosts = [..._topPosts]; //make copy to work with.
  addRank(topPosts); //add rank to original order
  let AllPostsChrono = [..._allPosts];
  addRank(AllPostsChrono);
  sortByMostRecent(AllPostsChrono);
  let AllPostsChronoUntrimmed = [...AllPostsChrono];
  AllPostsChrono.length = topPosts.length; //trim uncurated posts to same size as curated posts list

  let AllPostsChronoIds = AllPostsChrono.map((n) => n.node.id);
  let maxHigherRanked = topPosts[0];
  let maxLowerRanked = topPosts[0];
  topPosts.forEach((n, index) => {
    let indexNodeInAllPostsChrono = AllPostsChronoIds.indexOf(n.node.id); //if this is -1, the post is lower in the non-algorithm list, thus it is higher ranked by the algorithm and therefore included in top posts

    n.node.meta = {}; //create meta object to store all rankings meta data to show
    if (index === 0) {
      maxLowerRanked.node.meta.howMuchLower = 0;
      maxHigherRanked.node.meta.howMuchHigher = 0;
    }

    if (indexNodeInAllPostsChrono === index) {
      n.node.meta.isSameRanked = true;
    }
    if (indexNodeInAllPostsChrono > index) {
      n.node.meta.isHigherRanked = true;
      n.node.meta.howMuchHigher = indexNodeInAllPostsChrono - index;
      if (n.node.meta.howMuchHigher > maxHigherRanked.node.meta.howMuchHigher) {
        maxHigherRanked = n;
      }
    }
    if (indexNodeInAllPostsChrono === -1) {
      n.node.meta.isHigherRanked = true;
      n.node.meta.howMuchHigher = AllPostsChronoUntrimmed.findIndex((an) => an.node.id == n.node.id) - index;
      if (n.node.meta.howMuchHigher > maxHigherRanked.node.meta.howMuchHigher) {
        maxHigherRanked = n;
      }
    }
    //higher index means 'lower' in the non-algorithm list, which counts for a lower index (higer rank) in the top post list. When its excluded from all posts, its in the toppost list because it was higher ranked by the algorithm.
    if (indexNodeInAllPostsChrono < index && indexNodeInAllPostsChrono > -1) {
      n.node.meta.isLowerRanked = true;
      n.node.meta.howMuchLower = indexNodeInAllPostsChrono - index;
      if (n.node.meta.howMuchLower < maxLowerRanked.node.meta.howMuchLower) {
        maxLowerRanked = n;
      }
    }
    //not -1 because then it would be not in the list, and thus higher ranked in top posts.
  });

  maxHigherRanked.node.meta.isHighestRanked = `data-highest="${maxHigherRanked.node.meta.howMuchHigher}"`;
  maxLowerRanked.node.meta.isLowestRanked = `data-lowest="${maxLowerRanked.node.meta.howMuchLower}"`;

  return {
    topPosts: topPosts,
    chronoPosts: AllPostsChrono,
  };
}

async function getViewThree(_topPosts, _allPosts) {
  let topPosts = [..._topPosts]; //make copy to work with.
  topPosts = topPosts.filter((n) => !!n.node.owner);
  let allPostschrono = [..._allPosts];
  allPostschrono = allPostschrono.filter((n) => !!n.node.owner);
  sortByMostRecent(allPostschrono);
  let AllPostsChronoIds = allPostschrono.map((n) => n.node.id);

  let oldestInTopPosts = topPosts.reduce((min, n) => (n.node.taken_at_timestamp < min.node.taken_at_timestamp ? n : min), topPosts[0]);

  allPostschrono = allPostschrono.slice(0, allPostschrono.findIndex((n) => n.node.id === oldestInTopPosts.node.id) + 1);

  let friends = {};
  topPosts.forEach((n, index) => {
    let friendId = n.node.owner.id;
    if (friends[friendId] == undefined) {
      friends[friendId] = {
        top: 0,
        equal: 0,
        below: 0,
        profile_pic_url: n.node.owner.profile_pic_url,
        username: n.node.owner.username,
      };
    }
    let indexNodeInAllPostsChrono = AllPostsChronoIds.indexOf(n.node.id); //if this is -1, the post is lower in the non-algorithm list, thus it is higher ranked by the algorithm and therefore included in top posts

    // if (indexNodeInAllPostsChrono === -1) {
    //   friends[friendId].below++; //actually hidden
    //   friends[friendId].below += index - indexNodeInAllPostsChrono;
    // } else if (indexNodeInAllPostsChrono < index) {
    //   friends[friendId].top++;
    // } else if (indexNodeInAllPostsChrono > index) {
    //   friends[friendId].below++;
    // } else {
    //   friends[friendId].equal++;
    // }

    /////////////$
    if (indexNodeInAllPostsChrono === index) {
      friends[friendId].equal++;
    }
    if (indexNodeInAllPostsChrono > index) {
      //higher ranked
      friends[friendId].top += indexNodeInAllPostsChrono - index;
    }
    //higher index means 'lower' in the non-algorithm list, which counts for a lower index (higer rank) in the top post list. When its excluded from all posts, its in the toppost list because it was higher ranked by the algorithm.
    if (indexNodeInAllPostsChrono < index) {
      //lower ranked
      friends[friendId].below += index - indexNodeInAllPostsChrono;
    }
    //not -1 because then it would be not in the list, and thus higher ranked in top posts.
  });

  let friendsRankings = {
    top: [],
    equal: [],
    below: [],
    unknows: [],
  };
  Object.values(friends).forEach((f) => {
    if (f.top / f.below <= 1.5 && f.top / f.below >= 0.66) {
      //both on top and below, so they are actually equal
      //do this first so that higher or lower ranked doesn't need to be rechecked
      friendsRankings.equal.push(f);
    } else if (f.top > f.below && f.top > f.equal) {
      friendsRankings.top.push(f);
    } else if (f.below > f.top && f.below > f.equal) {
      friendsRankings.below.push(f);
    } else if (f.equal > f.top && f.equal > f.below) {
      friendsRankings.equal.push(f);
    } else {
      friendsRankings.unknows.push(f);
    }
  });

  friendsRankings.top = friendsRankings.top.sort((a, b) => b.top - a.top).slice(0, consts.amountOfFriends);
  friendsRankings.equal = friendsRankings.equal.sort((a, b) => b.equal - a.equal).slice(0, consts.amountOfFriends);
  friendsRankings.below = friendsRankings.below.sort((a, b) => b.below - a.below).slice(0, consts.amountOfFriends);

  if (!!friendsRankings.top[0]) {
    friendsRankings.top[0].isHighestFollowee = "data-highest-followee";
  }
  if (!!friendsRankings.below[0]) {
    friendsRankings.below[0].isLowestFollowee = "data-lowest-followee";
  }
  return {
    friendsRankings,
  };
}

async function getFeedUntilDate(startDateRequestedInterval, insta, f = [], cursor = null) {
  return insta
    .getFeed(consts.maxItemQuery, cursor)
    .then((r) => {
      let newNodes = r.data.user.edge_web_feed_timeline.edges;
      //do not sort it here already because there is chance on concat afterwards, which would make sorting before that useless.
      //if all dates in the retrieved nodes are before the given date, we can assume no more content more recently than the given date will be fetched next time and we can stop fetching
      newNodes = removeGarabage(newNodes);
      let maxDateFetchedInterval = getMostRecentDate(newNodes);
      if (maxDateFetchedInterval >= startDateRequestedInterval) {
        //date range is still in interval we want to get all nodes from, so keep fetching
        f = f.concat(newNodes); //concat the nodes before recursion.
        return getFeedUntilDate(startDateRequestedInterval, insta, f, insta.getFeedNextPage(r));
      } else {
        //no concat needed because all fetched nodes are out of the interval we want to get all nodes from, so adding them would be unnecessary.
        return f;
      }
    })
    .catch(function (error) {
      if (f.length >= consts.topSubSetCount) {
        console.log(error);
        console.log("returned unncompleted allstores with length of: " + f.length);
        return Promise.resolve(f);
      } else {
        Promise.reject(error);
      }
    });
}

async function getFeedByCount(requestedPostCount, insta, f = [], cursor = null) {
  return insta
    .getFeed(
      consts.maxItemQuery < requestedPostCount - f.length
        ? consts.maxItemQuery //you're requesting more than we can get at once
        : requestedPostCount - f.length, //no need to request the max if you only need an additional few...
      cursor
    )
    .then((r) => {
      f = f.concat(r.data.user.edge_web_feed_timeline.edges);
      f = removeGarabage(f);
      if (f.length < requestedPostCount) {
        return getFeedByCount(requestedPostCount, insta, f, insta.getFeedNextPage(r));
      } else {
        return {
          topPosts: f,
          cursor: insta.getFeedNextPage(r),
        };
      }
    });
}

function removeGarabage(posts) {
  return posts.filter(
    (n) =>
      n.node &&
      typeof n.node.id !== "undefined" &&
      (n.node.__typename === "GraphImage" || n.node.__typename === "GraphSidecar" || n.node.__typename === "GraphVideo")
  );
}

function convertToCorrectDates(posts) {
  posts.forEach((n) => (n.node.taken_at_timestamp = n.node.taken_at_timestamp * 1000));
}

function addRank(posts) {
  posts.forEach((n, i) => (n.node.rank = i + 1));
}

function sortByMostRecent(posts) {
  posts.sort((a, b) => b.node.taken_at_timestamp - a.node.taken_at_timestamp);
}

function getMostRecentDate(nodes) {
  return nodes.reduce((max, n) => (n.node.taken_at_timestamp > max ? n.node.taken_at_timestamp : max), nodes[0].node.taken_at_timestamp);
}

function getLeastRecentDate(nodes) {
  return nodes.reduce((min, n) => (n.node.taken_at_timestamp < min ? n.node.taken_at_timestamp : min), nodes[0].node.taken_at_timestamp);
}
