const config = require("../config/db.config.js");
const PHPUnserialize = require('php-unserialize');
const empty = require('locutus/php/var/empty');
const implode = require('locutus/php/strings/implode');
const usort = require('locutus/php/array/usort');
const strtolower = require('locutus/php/strings/strtolower');

const Sequelize = require("sequelize");
const { QueryTypes } = require('sequelize');

const sequelize = new Sequelize(
  config.DB,
  config.USER,
  config.PASSWORD,
  {
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
  let timestamp = Math.floor(new Date().getTime() / 1000);

  $age = timestamp - $age;

  if ($age === 0) {
    return [
      'never',
      '&infin;'
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
  else if ($days) {
    return [
      $days + ' day' + ($days === 1 ? '' : 's') + ' ago',
      $days + 'd'
    ];
  }

  let $hours = $age / 60 / 60 % 24;
  if ($hours) {
    return [
      $hours + ' hour' + ($hours === 1 ? '' : 's') + ' ago',
      $hours + 'h'
    ];
  }

  let $minutes = $age / 60 % 60;
  if ($minutes) {
    return [
      $minutes + ' minute' + ($minutes === 1 ? '' : 's') + ' ago',
      $minutes + 'm'
    ];
  }

  let $seconds = $age % 60;
  if ($seconds) {
    return [
      $seconds + ' second' + ($seconds === 1 ? '' : 's') + ' ago',
      $seconds + 's'
    ];
  }

  return [
    'never',
    '&infin;'
  ];
};

db.fof_db_get_item_count = async function($user_id, $what = 'all', $feed_id = null, $search = null) {
  let $what_q = [];

  if ($what === 'starred') {
    $what = 'star';
  }

  let exStr = ($what === 'tagged') ? 'unread star folded' : $what;

  exStr.split(' ').forEach($w => {
    $what_q.push('"' + $w + '"');
  });

  // console.log('what_q=', $what_q);
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

  return db.fof_multi_sort($feeds, $order, $direction != 'asc');
};

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

db.fof_get_tags = async function($user_id) {
  let $tags = {};

  let $counts = await db.fof_db_get_tag_unread($user_id);

  console.log($counts);

  // let $statement = db.fof_db_get_tags($user_id);

  /*while ( ($row = fof_db_get_row($statement)) !== false )
  {
    if(isset($counts[$row['tag_id']]))
      $row['unread'] = $counts[$row['tag_id']];
    else
      $row['unread'] = 0;

    $tags[] = $row;
  }*/

  return $tags;
};

db.fof_sidebar_tags_default = async function($user_id) {
  $unread_id = await db.fof_db_get_tag_by_name('unread');
  $star_id = await db.fof_db_get_tag_by_name('star');
  $folded_id = await db.fof_db_get_tag_by_name('folded');

  $tags = db.fof_get_tags($user_id);

  console.log($unread_id);

  /*

  $taglines = array();
  $n = 0;
  foreach ($tags as $tag) {
    $tag_id = $tag['tag_id'];
    if ($tag_id == $unread_id
      ||  $tag_id == $star_id
      ||  $tag_id == $folded_id)
      continue;

    $tagline = '';

    $tag_name = $tag['tag_name'];
    $tag_name_html = htmlentities($tag_name);
    $tag_name_json = htmlentities(json_encode($tag_name), ENT_QUOTES);

    $count = $tag['count'];
    $unread = $tag['unread'];

    $tag_classes = array();
    if (++$n % 2)
      $tag_classes[] = 'odd-row';
    if (in_array($tag_name, $what_a))
      $tag_classes[] = 'current-view';
    $tag_classes = implode(' ', $tag_classes);
    if ( ! empty($tag_classes))
      $tag_classes = ' class="' . $tag_classes . '"';

    $tagline .= '    <tr' . $tag_classes . '>';

    $tagline .= '<td class="unread">';
    if ($unread)
      $tagline .= '<a class="unread" href="' . fof_url('.', array('what' => "$tag_name unread", 'how' => 'paged')) . "\">$unread</a>/";
    $tagline .= '<a href="' . fof_url('.', array('what' => $tag_name, 'how' => 'paged')) . "\">$count</a>";
    $tagline .= '</td>';

    $tagline .= '<td class="title"><b><a href="' . fof_url('.', array('what' => $tag_name, 'how' => 'paged')). '">' . $tag_name_html . '</a></b></td>';

    $tagline .= '<td class="controls"><a href="#" title="untag all items" onclick="return sb_del_tag_conf(' . $tag_name_json . ');">[x]</a></td>';

    if ($sharing == 'all_tagged')
      $tagline .= '<td class="sharing"><a href="' . fof_url('./shared.php', array('user' => $fof_user_id, 'which' => $tag_name, 'how' => 'paged')) . '">[' . $tag_name_html . ']</a>';

    $tagline .= '</tr>';

    $taglines[] = $tagline;
  }

  if ( ! empty($taglines)) { ?>
  <div id="tags">
      <table cellspacing="0" cellpadding="1" border="0" id="taglist">
      <tr class="heading"><td><span class="unread">#</span></td><td class="title">tag name</td><td class="controls">untag</td><?php if ($sharing == 'all_tagged') echo '<td class="sharing">shared page</td>'; ?></tr>
    <?php
    echo implode("\n", $taglines);
      ?>
  </table>
  </div>
    <!--tags end-->
    <?php
  }
    ?>*/
};
module.exports = db;
