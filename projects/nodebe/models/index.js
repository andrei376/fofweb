const config = require("../config/db.config.js");
const PHPUnserialize = require('php-unserialize');
const empty = require('locutus/php/var/empty');
const implode = require('locutus/php/strings/implode');
const usort = require('locutus/php/array/usort');
const strtolower = require('locutus/php/strings/strtolower');
const isset = require('locutus/php/var/isset');
const htmlentities = require('locutus/php/strings/htmlentities');
const json_encode = require('locutus/php/json/json_encode');
const in_array = require('locutus/php/array/in_array');
const explode = require('locutus/php/strings/explode');
const is_numeric = require('locutus/php/var/is_numeric');
const strtoupper = require('locutus/php/strings/strtoupper');
const is_array = require('locutus/php/var/is_array');
const substr = require('locutus/php/strings/substr');
const time = require('locutus/php/datetime/time');
const intval = require("locutus/php/var/intval");


const Sequelize = require("sequelize");
const { QueryTypes } = require('sequelize');
const html_entity_decode = require("locutus/php/strings/html_entity_decode");
//const htmlspecialchars_decode = require("locutus/php/strings/htmlspecialchars_decode");
//import htmlspecialchars_decode from 'locutus/php/strings/htmlspecialchars_decode'; // Or a similar path

const sequelize = new Sequelize(
  config.DB,
  config.USER,
  config.PASSWORD,
  {
    logging: false,                        // Disables logging
    host: config.HOST,
    dialect: config.dialect,
    operatorsAliases: false,

    pool: {
      max: config.pool.max,
      min: config.pool.min,
      acquire: config.pool.acquire,
      idle: config.pool.idle
    }
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;



db.user = require("../models/user.model.js")(sequelize, Sequelize);
db.tag = require("../models/tag.model.js")(sequelize, Sequelize);

db.fof_db_prefs_get = async function(userid) {
  let prefs = await db.user.findByPk(userid);
  prefs = prefs.user_prefs;

  prefs = PHPUnserialize.unserialize(prefs);
  delete prefs['adv_autotag'];

  // console.log('prefs=', prefs);

  return prefs;
};

db.fof_db_get_tag_id_map = async function(tags = null, invalidate = null) {
  let tag_id_to_name = null;

  if (invalidate !== null) {
    tag_id_to_name = null;
    return null;
  }

  if (tag_id_to_name === null) {
    tag_id_to_name = {};
    let rows = await db.tag.findAll();

    rows.forEach(row => {
      tag_id_to_name[row['tag_id']] = row['tag_name'];
    });
  }

  if (tags === null) {
    return tag_id_to_name;
  }

  let r = [];
  tags.forEach(t => {
    r.push(tag_id_to_name[t]);
  });
  return r;
};

db.fof_db_subscription_feed_get = async function($user_id, $feed_id) {

  let $query = "SELECT f.*, s.subscription_prefs FROM fof_feed f, fof_subscription s WHERE s.user_id = :user_id AND s.feed_id = :feed_id AND s.feed_id = f.feed_id";

  let $result = await sequelize.query(
    $query,
    {
      replacements: {
        user_id: $user_id,
        feed_id: $feed_id
      },
      type: QueryTypes.SELECT
    }
  );

  // console.log('result1=', $result[0]);

  db.fof_db_subscription_feed_fix($result[0]);

  // console.log('result2=', $result[0]);

  return $result[0];
};

db.fof_db_get_tag_name_map = async function($tags) {
  const $FOF_TAG_TABLE = 'fof_tag';

  let $tag_name_to_id = {};

  let $query = "SELECT * FROM " + $FOF_TAG_TABLE;

  let rows = await sequelize.query(
    $query,
    {
      type: QueryTypes.SELECT
    }
  );

  rows.forEach(row => {
    $tag_name_to_id[row['tag_name']] = row['tag_id'];
  });

  let $r = [];

  $tags.forEach($t => {
    if (!empty($tag_name_to_id[$t])) {
      $r.push($tag_name_to_id[$t]);
    }
  });

  return $r;
};

db.fof_untag = async function($user_id, $tag) {
  let $tags = [];
  $tags.push($tag);

  let $tag_ids = await this.fof_db_get_tag_name_map($tags);

  if (empty($tag_ids)) {
    return false;
  }

  return this.fof_db_untag_user_all($user_id, $tag_ids);
};

db.fof_db_untag_user_all = async function($user_id, $tag_ids) {
  const $FOF_ITEM_TAG_TABLE = 'fof_item_tag';

  if (!is_array($tag_ids)) {
    $tag_ids = [$tag_ids];
  }

  if (empty($tag_ids)) {
    return false;
  }

  let $query = "DELETE FROM "+$FOF_ITEM_TAG_TABLE+" WHERE user_id = :user_id AND tag_id IN ("
    + ($tag_ids.length>0 ? implode(', ', $tag_ids) : "''")
    + ")";

  await sequelize.query(
    $query,
    {
      replacements: {
        user_id: $user_id,
      },
      type: QueryTypes.DELETE
    }
  );

  return true;
};

db.fof_db_subscription_feed_fix = function($f) {
  if ( ! empty($f['subscription_prefs'])) {
    $f['subscription_prefs'] = PHPUnserialize.unserialize($f['subscription_prefs']);
  }

  if (empty($f['subscription_prefs'])) {
    $f['subscription_prefs'] = {};
  }

  // console.log('prefs=', $f['subscription_prefs']);

  if (empty($f['subscription_prefs']['tags'])) {
    $f['subscription_prefs']['tags'] = {};
  }

  $f['alt_title'] = empty($f['subscription_prefs']['alt_title']) ? null : $f['subscription_prefs']['alt_title'];
  $f['alt_image'] = empty($f['subscription_prefs']['alt_image']) ? null : $f['subscription_prefs']['alt_image'];
  $f['display_title'] = ( ! empty($f['alt_title']) ) ? $f['alt_title'] : $f['feed_title'];
  $f['display_image'] = ( ! empty($f['alt_image']) ) ? $f['alt_image'] : $f['feed_image'];
};

db.fof_db_get_subscriptions = async function($user_id, $dueOnly = false) {
  let $query = "SELECT * FROM fof_feed f, fof_subscription s WHERE s.user_id = :user_id AND f.feed_id = s.feed_id";

  if ($dueOnly) {
    $query += " AND feed_cache_next_attempt < :now";
  }

  let timestamp = Math.floor(new Date().getTime() / 1000);

  let $result = await sequelize.query(
    $query,
    {
      replacements: {
        user_id: $user_id,
        now: timestamp
      },
      type: QueryTypes.SELECT
    }
  );

  // console.log('result=', $result);
  return $result;
};

db.fof_nice_time_stamp = function($age) {
  //let timestamp = Math.floor(new Date().getTime() / 1000);
  let timestamp = time();
  $age = timestamp - $age;

  if ($age === 0) {
    return [
      'never',
      '∞'
    ];
  }

  let $days = Math.floor($age / 60 / 60 / 24);
  if ($days > 365) {
    return [
      Math.floor($days / 365) +
    ' year' + (Math.floor($days / 365) === 1 ? '' : 's') +
    ' ago',
      Math.floor($days / 365) +
    'y'
    ];
  }
  else if ($days > 7) {
    return [
      Math.floor($days / 7) +
    ' week' + (Math.floor($days / 7) === 1 ? '' : 's') +
    ' ago',
      Math.floor($days / 7) +
    'w'
    ];
  }
  else if ($days > 1) {
    return [
      $days + ' day' + ($days === 1 ? '' : 's') + ' ago',
      $days + 'd'
    ];
  }

  let $hours = intval($age / 60 / 60 % 24);
  if ($hours > 1) {
    return [
      $hours + ' hour' + ($hours === 1 ? '' : 's') + ' ago',
      $hours + 'h'
    ];
  }

  let $minutes = intval($age / 60 % 60);
  if ($minutes > 1) {
    return [
      $minutes + ' minute' + ($minutes === 1 ? '' : 's') + ' ago',
      $minutes + 'm'
    ];
  }

  let $seconds = intval($age % 60);
  if ($seconds > 1) {
    return [
      $seconds + ' second' + ($seconds === 1 ? '' : 's') + ' ago',
      $seconds + 's'
    ];
  }

  return [
    'never',
    '∞'
  ];
};

db.fof_db_get_item_count = async function($user_id, $what = 'all', $feed_id = null, $search = null) {
  let $what_q = [];

  if ($what === null) {
    $what = 'unread';
  }

  if ($what === 'starred') {
    $what = 'star';
  }

  let exStr = ($what === 'tagged') ? 'unread star folded' : $what;

  exStr.split(' ').forEach($w => {
    $what_q.push('"' + $w + '"');
  });

  let $query = "";

  if ($what === 'all') {
    $query = "SELECT i.feed_id, i.item_id FROM fof_item i" +
    " JOIN fof_subscription s ON s.feed_id = i.feed_id" +
    " WHERE s.user_id = " + $user_id;
  } else {
    $query = "SELECT DISTINCT s.feed_id, i.item_id" +
    " FROM fof_subscription s" +
    " JOIN fof_item i ON i.feed_id = s.feed_id" +
    " JOIN fof_item_tag it ON it.item_id = i.item_id AND it.user_id = " + $user_id +
    " JOIN fof_tag t ON t.tag_id = it.tag_id" +
    " WHERE s.user_id = " + $user_id;
  }

  let $replacements = {};

  if ( ! empty($feed_id)) {
    $query += " AND i.feed_id = :feed_id";
    $replacements['feed_id'] = $feed_id;
  }

  if ( ! empty($search)) {
    $query += " AND (i.item_title LIKE :search OR i.item_content LIKE :search)";
    $replacements['search'] = '%' + $search + '%';
  }

  switch ($what) {
    case 'all':
      /* Every item. */
      break;

    case 'tagged':
      /* Item must be tagged, but not by any system tag. */
      $query += " AND t.tag_name NOT IN (" + implode(',', $what_q) + ") GROUP BY it.item_id";
      break;

    default:
      /* Item must have all tags. */
      if ( ! empty($what_q)) {
        $query += " AND t.tag_name IN (" + implode(',', $what_q) + ")";
        $query += " GROUP BY it.item_id HAVING count(it.item_id) = " + $what_q.length;
      }
  }

  /* Now tally the item results by feed_id. */
  let $count_query = 'SELECT feed_id, count(*) AS count FROM (' + $query + ') AS matched_items GROUP BY feed_id';

  let $result = await sequelize.query(
    $count_query,
    {
      replacements: $replacements,
      type: QueryTypes.SELECT
    }
  );

  // console.log('res=', $result);

  return $result;
};

db.fof_db_get_latest_item_age = async function($user_id = null, $feed_id = null) {
  let $where = '';
  let $replacements = {};

  if ($user_id || $feed_id) {
    $where = 'WHERE ';

    if ($user_id) {
      $where += 's.user_id = :user_id ';
      $replacements['user_id'] = $user_id;
    }
    if ($user_id && $feed_id) {
      $where += 'AND ';
    }
    if ($feed_id) {
      $where += 'i.feed_id = :feed_id ';
      $replacements['feed_id'] = $feed_id;
    }
  }

  let $query = "SELECT max(i.item_cached) AS max_date, i.feed_id " +
  "FROM fof_item i " +
  ($user_id ? "JOIN fof_subscription s ON i.feed_id = s.feed_id " : '') +
    $where +
  "GROUP BY i.feed_id";

  let $result = await sequelize.query(
    $query,
    {
      replacements: $replacements,
      type: QueryTypes.SELECT
    }
  );

  // console.log('res=', $result);

  return $result;
};

db.fof_multi_sort = function ($tab,$key,$rev) {
  let $compare = function($a, $b) {
    let $la = strtolower($a[$key]);
    let $lb = strtolower($b[$key]);

    if (in_array($key, ['feed_age', 'max_date', 'feed_unread'])) {
      $la = parseInt($la, 10);
      $lb = parseInt($lb, 10);
    }

    // console.log('key=', $key);
    // console.log('la=', $la);
    // console.log('lb=', $lb);

    if ($la == $lb) {
      return 0;
    }

    if ($rev) {
      if ($la > $lb) {
        return -1;
      }
    }

    if (!$rev) {
      if ($la < $lb) {
        return -1;
      }
    }

    return 1;
  };

  usort($tab, $compare);
  return $tab;
};


db.fof_get_feeds = async function($user_id, $order = 'feed_title', $direction = 'asc') {
  let $feeds = {};

  let $tagmap = await db.fof_db_get_tag_id_map();

  let $result = await db.fof_db_get_subscriptions($user_id);

  let $i = 0;
  let $feeds_index = {};

  for (let $row of $result) {
    /* remember where we are */
    $feeds_index[$row['feed_id']] = $i;

    /* fix user prefs */
    db.fof_db_subscription_feed_fix($row);

    /* initialize some values.. these will be populated later */
    $row['feed_items'] = 0;
    $row['feed_read'] = 0;
    $row['feed_unread'] = 0;
    $row['feed_starred'] = 0;
    $row['feed_tagged'] = 0;
    $row['max_date'] = 0;
    $row['lateststr'] = '';
    $row['lateststrabbr'] = '';

    /* we can set these now, though */
    $row['feed_age'] = $row['feed_cache_date'];
    [$row['agestr'], $row['agestrabbr']] = db.fof_nice_time_stamp($row['feed_cache_date']);



    $row['tags'] = [];
    for (const $tagid in $row['subscription_prefs']['tags']) {
      $row['tags'].push($tagmap[$row['subscription_prefs']['tags'][$tagid]]);
    }

    // console.log('row=', $row);

    $feeds[$i] = $row;

    $i++;
  }

  /* tally up all items */
  $result = await db.fof_db_get_item_count($user_id);

  $result.forEach($row => {
    $i = $feeds_index[$row['feed_id']];
    $feeds[$i]['feed_items'] += $row['count'];
    $feeds[$i]['feed_read'] += $row['count'];
  });

  $result = await db.fof_db_get_item_count($user_id, 'unread');

  $result.forEach($row => {
    $i = $feeds_index[$row['feed_id']];
    $feeds[$i]['feed_unread'] += $row['count'];
    $feeds[$i]['feed_read'] -= $row['count'];
  });

  $result = await db.fof_db_get_item_count($user_id, 'starred');

  $result.forEach($row => {
    $i = $feeds_index[$row['feed_id']];
    $feeds[$i]['feed_starred'] += $row['count'];
  });

  $result = await db.fof_db_get_item_count($user_id, 'tagged');

  $result.forEach($row => {
    $i = $feeds_index[$row['feed_id']];
    $feeds[$i]['feed_tagged'] += $row['count'];
  });

  $result = await db.fof_db_get_latest_item_age($user_id);

  $result.forEach($row => {
    $i = $feeds_index[$row['feed_id']];
    $feeds[$i]['max_date'] = $row['max_date'];
    [$feeds[$i]['lateststr'], $feeds[$i]['lateststrabbr']] = db.fof_nice_time_stamp($row['max_date']);
  });

  if ($order == 'feed_title') {
    $order = 'display_title';
  }

  return db.fof_multi_sort($feeds, $order, $direction != 'asc');
};

db.fof_db_mark_read = async function($user_id, $items) {
  let $tag_id = await db.fof_db_get_tag_by_name('unread');
  return await db.fof_db_untag_items($user_id, $tag_id, $items);
};

db.fof_db_tag_items = async function($user_id, $tag_id, $items) {
  if (! $items) {
    return false;
  }

  if (! is_array($items)) {
    $items = [ $items ];
  }

  if (empty($items)) {
    return false;
  }

  let $items_q = [];

  $items.forEach($id => {
    $items_q.push('(' + $user_id + ', ' + $tag_id + ', ' + $id + ')');
  });

  // console.log($items_q);

  let $query = "INSERT IGNORE INTO fof_item_tag (user_id, tag_id, item_id) VALUES " + implode(', ', $items_q);

  // console.log($query);

  await sequelize.query(
    $query,
    {
      type: QueryTypes.INSERT
    }
  );

  return true;
};

db.fof_db_untag_items = async function($user_id, $tag_id, $items) {
  if (! $items) {
    return false;
  }

  if (! is_array($items)) {
    $items = [$items];
  }

  // console.log($items);

  let $items_q = [];

  $items.forEach($id => {
    $items_q.push('"' + $id + '"');
  });

  // console.log($items_q);

  let $replacements = {};

  let $query = "DELETE FROM fof_item_tag " +
    "WHERE user_id = :user_id AND " +
    "tag_id = :tag_id AND " +
    "item_id IN ( " + ($items_q.length ? implode(', ', $items_q) : "''") + " )";

  $replacements['user_id'] = $user_id;
  $replacements['tag_id'] = $tag_id;

  // console.log($query);

  await sequelize.query(
    $query,
    {
      replacements: $replacements,
      type: QueryTypes.DELETE
    }
  );

  return true;
}

db.fof_db_get_tag_by_name = async function($tags) {
  let $tags_q = [];
  let $replacements = {};
  let $return = [];

  $tags.split(' ').forEach($w => {
    $tags_q.push('"' + $w + '"');
  });

  let $query = "SELECT DISTINCT tag_id" +
  " FROM fof_tag" +
  " WHERE tag_name IN ( " + ($tags_q.length ? implode(', ', $tags_q) : "''") + " )";

  let $result = await sequelize.query(
    $query,
    {
      replacements: $replacements,
      type: QueryTypes.SELECT
    }
  );

  // console.log($result);

  $result.forEach($row => {
    $return.push($row['tag_id']);
  });

  if ($return.length) {
    return implode(',', $return);
  }

  return null;
};

db.fof_db_get_tag_unread = async function($user_id) {
  let $counts = {};
  let $replacements = {};

  let $query = "SELECT count(*) AS tag_count, it2.tag_id" +
  " FROM fof_item i, fof_item_tag it , fof_item_tag it2" +
  " WHERE it.item_id = it2.item_id" +
  " AND it.tag_id = 1" +
  " AND i.item_id = it.item_id" +
  " AND i.item_id = it2.item_id" +
  " AND it.user_id = :user_id" +
  " AND it2.user_id = :user_id" +
  " GROUP BY it2.tag_id";

  $replacements['user_id'] = $user_id;

  let $result = await sequelize.query(
    $query,
    {
      replacements: $replacements,
      type: QueryTypes.SELECT
    }
  );

  // console.log($result);

  $result.forEach($row => {
    $counts[$row['tag_id']] = $row['tag_count'];
  });

  return $counts;
};

db.fof_db_get_tags = async function($user_id) {
  let $replacements = {};

  let $query = "SELECT t.tag_id, t.tag_name, count( it.item_id ) AS count" +
  " FROM fof_tag t" +
  " LEFT JOIN fof_item_tag it ON t.tag_id = it.tag_id" +
  " WHERE it.user_id = :user_id" +
  " GROUP BY t.tag_id ORDER BY t.tag_name";

  $replacements['user_id'] = $user_id;

  let $result = await sequelize.query(
    $query,
    {
      replacements: $replacements,
      type: QueryTypes.SELECT
    }
  );

  // console.log($result);

  return $result;
};

db.fof_get_tags = async function($user_id) {
  let $tags = [];

  let $counts = await db.fof_db_get_tag_unread($user_id);

  // console.log($counts);

  let $statement = await db.fof_db_get_tags($user_id);

  $statement.forEach($row => {
    $row['unread'] = 0;
    if (isset($counts[$row['tag_id']])) {
      $row['unread'] = $counts[$row['tag_id']];
    }

    $tags.push($row);
  });

  return $tags;
};

db.fof_db_get_items = async function($user_id, $feed = null, $what = 'unread', $when = null, $start = null, $limit = null, $order = 'asc', $search = null) {
  let $all_items = {};

  let $prefs = db.fof_db_prefs_get($user_id);

  if ($what == null) {
    $what = 'unread';
  }

  if ($order != 'asc' && $order != 'desc') {
    $order = 'asc';
  }

  let $select = "SELECT i.*, f.*, s.subscription_prefs";
  let $from = " FROM fof_feed f, fof_item i, fof_subscription s";

  if ($what != 'all') {
    $from += ", fof_tag t, fof_item_tag it";
  }

  let $where = " WHERE s.user_id = " + $user_id + " AND s.feed_id = f.feed_id AND f.feed_id = i.feed_id";

  if (! empty($feed)) {
    $where += " AND f.feed_id = " + $feed;
  }

  let $tags_q = [];

  if ($what != 'all') {
    let whats = explode(' ', $what);

    for (let $i in whats) {
      let $tag = "'" + whats[$i] + "'";

      $tags_q.push($tag);
    }

    $where += " AND it.user_id = s.user_id AND it.tag_id = t.tag_id AND i.item_id = it.item_id AND t.tag_name IN (" + ($tags_q.length > 0 ? implode(', ', $tags_q) : "''") + ")";
  }

  let $group = "";
  if ($what == 'all') {
    //
  } else {
    $group = " GROUP BY i.item_id HAVING COUNT( i.item_id ) = " + $tags_q.length;
  }

  /*if (! empty($search)) {
    $search_q = $fof_connection->quote('%' . $search . '%');
    $where .= " AND (i.item_title LIKE $search_q OR i.item_content LIKE $search_q )";
  }*/

  /*if (! empty($when)) {
    $tzoffset = isset($prefs['tzoffset']) ? $prefs['tzoffset'] : 0;
    $whendate = explode('/', ($when == 'today') ? fof_todays_date() : $when);
    $when_begin = gmmktime(0, 0, 0, $whendate[1], $whendate[2], $whendate[0]) - ($tzoffset * 60 * 60);
    $when_end = $when_begin + (24 * 60 * 60);
    $where .= " AND i.item_published > " . $fof_connection->quote($when_begin) . " AND i.item_published < " . $fof_connection->quote($when_end);
  }*/

  let $order_by = " ORDER BY i.item_published " + strtoupper($order);
  if (is_numeric($start)) {
    $order_by += " LIMIT " + $start + ", " + ((is_numeric($limit)) ? $limit : $prefs['howmany']);
  }

  let $query = $select + $from + $where + $group + $order_by;

  // console.log('query=', $query);

  let $result = await sequelize.query(
    $query,
    {
      type: QueryTypes.SELECT
    }
  );

  let $item_ids_q = [];
  let $lookup = {}; /* remember item_id->all_rows mapping, for populating tags */
  let $idx = 0;

  $result.forEach($row => {
    // console.log('row=', $row);
    db.fof_db_subscription_feed_fix($row);
    // console.log($row['item_title']);
    // $row['item_title'] = htmlspecialchars_decode($row['item_title']);

    $item_ids_q.push($row['item_id']);
    $lookup[ $row['item_id'] ] = $idx;
    $all_items[$idx] = $row;
    $all_items[$idx]['tags'] = [];
    $idx += 1;
  });

  $all_items = db.fof_multi_sort($all_items, 'item_published', $order != "asc");

  $query = "SELECT t.tag_name, it.item_id" +
  " FROM fof_tag t, fof_item_tag it" +
  " WHERE t.tag_id = it.tag_id" +
  " AND it.item_id IN (" + ($item_ids_q.length > 0 ? implode(',', $item_ids_q) : "''") + ")" +
  " AND it.user_id = " + $user_id;

  // console.log(" second query: ", $query);

  $result = await sequelize.query(
    $query,
    {
      type: QueryTypes.SELECT
    }
  );

  $result.forEach($row => {
    $idx = $lookup[$row['item_id']];

    if (!isset($all_items[$idx])) {
      console.log('idx=', $idx);
      console.log('row=', $row);
      $all_items[$idx] = $row;
    }
    if (!isset($all_items[$idx]['tags'])) {
      $all_items[$idx]['tags'] = [];
    }
    $all_items[$idx]['tags'].push($row['tag_name']);
  });

  return $all_items;
};

db.fof_get_items = async function($user_id, $feed = null, $what="unread", $when = null, $start = null, $limit = null, $order = "desc", $search = null) {

  let resp = {
    user: $user_id,
    feed: $feed,
    what: $what,
    when: $when,
    start: $start,
    limit: $limit,
    order: $order,
    search: $search
  };

  // console.log(resp);

  let $items = await db.fof_db_get_items($user_id, $feed, $what, $when, $start, $limit, $order, $search);

  // console.log('items=', $items);


  /*$items = fof_db_get_items($user_id, $feed, $what, $when, $start, $limit, $order, $search);

  for($i=0; $i<count($items); $i++)
  {
    foreach($fof_item_filters as $filter)
    {
      $items[$i]['item_content'] = $filter($items[$i]['item_content']);
    }
  }*/

  return $items;
};

db.fof_tag_item = async function($user_id, $item_id, $tag) {
  let $tags = is_array($tag) ? $tag : [ $tag ];
  // let $tag_id;

  $tags.forEach(async ($tag) => {
    // remove tag, if it starts with '-'
    if ( $tag.charAt(0) == '-' ) {
      db.fof_untag_item($user_id, $item_id, substr($tag, 1));
    } else {
      let $tag_id = await db.fof_db_get_tag_by_name($tag);
      if ($tag_id === null) {
        //$tag_id = fof_db_create_tag($tag);
      } else {
        db.fof_db_tag_items($user_id, $tag_id, $item_id);
      }
    }
  });

  return true;
};

db.fof_untag_item = async function($user_id, $item_id, $tag) {
  let $tag_id = await db.fof_db_get_tag_by_name($tag);

  return db.fof_db_untag_items($user_id, $tag_id, $item_id);
};

db.fof_sidebar_tags_default = async function($user_id) {
  let $unread_id = await db.fof_db_get_tag_by_name('unread');
  let $star_id = await db.fof_db_get_tag_by_name('star');
  let $folded_id = await db.fof_db_get_tag_by_name('folded');

  let $tags = await db.fof_get_tags($user_id);

  // console.log($unread_id);
  // console.log($tags);

  let $taglines = [];
  let $json = [];
  let $n = 0;

  for (let $tag of $tags) {
    // console.log($tag);
    let $tag_id = $tag['tag_id'];
    if (
      $tag_id == $unread_id
      || $tag_id == $star_id
      || $tag_id == $folded_id
    ) {
      continue;
    }

    let $tagline = '';

    let $tag_name = $tag['tag_name'];
    let $tag_name_html = htmlentities($tag_name);
    let $tag_name_json = htmlentities(json_encode($tag_name), 'ENT_QUOTES');

    let $count = $tag['count'];
    let $unread = $tag['unread'];

    let $tag_classes = [];

    if (++$n % 2) {
      $tag_classes.push('odd-row');
    }

    $tag_classes = implode(' ', $tag_classes);
    if (!empty($tag_classes)) {
      $tag_classes = ' class="' + $tag_classes + '"';
    }

    $tagline += '    <tr' + $tag_classes + '>';

    $tagline += '<td class="unread">';

    if ($unread) {
      // $tagline += '<a class="unread" href="' . fof_url('.', array('what' => "$tag_name unread", 'how' => 'paged')) + "\">$unread</a>/";
      $tagline += '<a class="unread" >' + $unread + '</a>/';
    }

    //$tagline .= '<a href="' . fof_url('.', array('what' => $tag_name, 'how' => 'paged')) . "\">$count</a>";
    $tagline += '<a>' + $count + '</a>';

    $tagline += '</td>';

    // $tagline .= '<td class="title"><b><a href="' . fof_url('.', array('what' => $tag_name, 'how' => 'paged')). '">' . $tag_name_html . '</a></b></td>';
    $tagline += '<td class="title"><b><a>' + $tag_name_html + '</a></b></td>';

    //$tagline .= '<td class="controls"><a href="#" title="untag all items" onclick="return sb_del_tag_conf(' . $tag_name_json . ');">[x]</a></td>';
    $tagline += '<td class="controls"><a title="untag all items">[x]</a></td>';

    /*if ($sharing == 'all_tagged') {
      //$tagline .= '<td class="sharing"><a href="' . fof_url('./shared.php', array('user' => $fof_user_id, 'which' => $tag_name, 'how' => 'paged')) . '">[' . $tag_name_html . ']</a>';
      //skip
    }*/

    $tagline += '</tr>';

    $taglines.push($tagline);

    $json.push($tag);
  }

  /*let $content = "";

  if (!empty($taglines)) {
    $content += '<div id="tags">';

    $content += '<table id="taglist">';

    $content += '<thead>';

    $content += '<tr class="heading">';
    $content += '<td>';
    $content += '<span class="unread">#</span>';
    $content += '</td>';
    $content += '<td class="title">';
    $content += 'tag name';
    $content += '</td>';
    $content += '<td class="controls">';
    $content += 'untag';
    $content += '</td>';
    $content += '</tr>';

    $content += '</thead>';

    $content += '<tbody>';

    $content += implode("\n", $taglines);

    $content += '</tbody>';

    $content += '</table>';

    $content += '</div>';
  }*/

  return {
    tagsjson: $json
  };
};
module.exports = db;
