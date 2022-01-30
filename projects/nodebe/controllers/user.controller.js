const db = require("../models");

exports.allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};

exports.userBoard = (req, res) => {
  res.status(200).send("User Content.");
};

exports.getFeeds = async (req, res) => {
  // let prefs = await db.fof_db_prefs_get(req.userId);

  // let $order = prefs['feed_order'];
  // let $direction = prefs['feed_direction'];

  let $order = req.body.order;
  let $direction = req.body.direction;

  // console.log('order=', $order);
  // console.log('dir=', $direction);

  let $feeds = await db.fof_get_feeds(req.userId, $order, $direction);

  let result = $feeds;
  // console.log('getFeeds result=', result);
  res.status(200).send(result);
};

exports.getTagsTable = async (req, res) => {
  let result = await db.fof_sidebar_tags_default(req.userId);

  // console.log('getTagsTable result=', result);
  res.status(200).send(result);
};

exports.getItemCount = async (req, res) => {
  let feed = req.body.feed;
  let what = req.body.what;

  let result = await db.fof_db_get_item_count(
    req.userId,
    what,
    feed
  );

  res.status(200).send(result);
};

exports.markRead = async (req, res) => {
  let id = req.body.id;

  let result = await db.fof_db_mark_read(
    req.userId,
    id
  );

  res.status(200).send(result);
};

exports.delTag = async (req, res) => {
  let tag = req.body.tag;

  let result = await db.fof_untag(
    req.userId,
    tag
  );

  res.status(200).send(result);
};

exports.getFeedName = async (req, res) => {
  let id = req.body.id;

  let result = await db.fof_db_subscription_feed_get(
    req.userId,
    id
  );

  res.status(200).send(result);
};

exports.toggleFav = async (req, res) => {
  let id = req.body.id;
  let remove = req.body.remove;

  let result;
  if (remove) {
    result = await db.fof_untag_item(req.userId, id, 'star');
  } else {
    result = await db.fof_tag_item(req.userId, id, 'star');
  }

  res.status(200).send(result);
};

exports.getItems = async (req, res) => {
  let feed = req.body.feed;
  let what = req.body.what;
  let when = req.body.when;
  let which = req.body.which;
  let howmany = req.body.howmany;
  let how = req.body.how;
  let order = req.body.order;
  let search = req.body.search;

  let result = await db.fof_get_items(
    req.userId,
    feed,
    what,
    when,
    which,
    howmany,
    how,
    order,
    search
  );

  res.status(200).send(result);
};
