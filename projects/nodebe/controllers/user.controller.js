const db = require("../models");

exports.allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};

exports.userBoard = (req, res) => {
  res.status(200).send("User Content.");
};

exports.getFeeds = async (req, res) => {
  let prefs = await db.fof_db_prefs_get(req.userId);

  let $order = prefs['feed_order'];
  let $direction = prefs['feed_direction'];

  // console.log('order=', $order);

  let $feeds = await db.fof_get_feeds(req.userId, $order, $direction);

  let result = $feeds;
  // console.log('getFeeds result=', result);
  res.status(200).send(result);
};

exports.getTagsTable = async (req, res) => {
  let result = await db.fof_sidebar_tags_default(req.userId);

  console.log('getTagsTable result=', result);
  res.status(200).send(result);
};
