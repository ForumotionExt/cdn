(function ($) {
  'use strict';

  // ─── Utilitare private ───────────────────────────────────────────────────────

  var PALETTE = ['#b8946a','#7a9e7e','#6a8ab8','#a86ab8',
                 '#b87a6a','#6ab8b0','#8a7eb8','#b8a06a'];

  var RO_MONTHS = {
    Ian:1, Feb:2, Mar:3, Apr:4, Mai:5,  Iun:6,
    Iul:7, Aug:8, Sep:9, Oct:10, Noi:11, Dec:12
  };

  var CATS = {
    c2: { num:'01', desc:'Anunțurile echipei, reguli generale și actualizări platformă.' },
    c1: { num:'02', desc:'Dezvoltare Web — HTML, CSS, JavaScript și template-uri Forumotion.' },
    c3: { num:'03', desc:'Prezintă tema ta, partajează snippet-uri și resurse.' },
    c4: { num:'04', desc:'Off-topic, prezentări și discuții libere.' }
  };

  function _hash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++)
      h = (h * 31 + str.charCodeAt(i)) & 0xffff;
    return h;
  }

  function _initials(name) {
    return name.replace(/\./g, ' ').trim()
      .split(/\s+/).filter(Boolean)
      .map(function (w) { return w[0].toUpperCase(); })
      .join('').slice(0, 2);
  }

  function _paint(name) {
    return {
      bg:   PALETTE[_hash(name) % PALETTE.length],
      text: _initials(name)
    };
  }

  // ─── Clasa FME ───────────────────────────────────────────────────────────────

  function FME() {
    this._vars   = null;
    this._online = null;
  }

  // ── Avatar & utilizator ──────────────────────────────────────────────────────

  FME.prototype.avatar = function (selector, name) {
    var result = _paint(name || _userdata.username);
    return $(selector).css('background', result.bg).text(result.text);
  };

  FME.prototype.username = function (selector) {
    return $(selector).text(_userdata.username);
  };

  FME.prototype.user = function (scope) {
    var root = scope ? $(scope) : $(document);
    this.avatar(root.find('[data-user-avatar]'));
    this.username(root.find('[data-user-name]'));
  };

  // ── Profil & statistici ──────────────────────────────────────────────────────

  FME.prototype.profile = function () {
    return {
      username:   _userdata.username,
      userid:     _userdata.user_id,
      level:      _userdata.user_level,
      lang:       _userdata.user_lang,
      posts:      _userdata.user_posts,
      points:     _userdata.user_points,
      reputation: _userdata.point_reputation,
      messages:   _userdata.user_nb_privmsg,
      groupcolor: '#' + _userdata.groupcolor,
      avatar:     _userdata.avatar_link,
      logged:     _userdata.session_logged_in === 1
    };
  };

  FME.prototype.stats = function () {
    return window.FME_STATS || {};
  };

  FME.prototype.parseStats = function () {
    return {
      online:  $('[data-stat="online"] strong:eq(0)').text().trim(),
      record:  $('[data-stat="record"] strong:eq(0)').text().trim(),
      posts:   $('[data-stat="posts"] strong').text().trim(),
      members: $('[data-stat="members"] strong').text().trim(),

      newest: {
        name:  $('[data-stat="newest"] a span strong').text().trim(),
        color: $('[data-stat="newest"] a span').css('color'),
        href:  $('[data-stat="newest"] a').attr('href')
      },

      users_online: $('[data-stat="users_online"] a[href^="/u"]').map(function () {
        var $a = $(this), $span = $a.find('span');
        return {
          name:  ($span.length ? $span.find('strong').text() : $a.text()).trim(),
          color: $span.length ? $span.css('color')  : null,
          group: $span.length ? $span.attr('class') : null,
          href:  $a.attr('href')
        };
      }).get(),

      groups: $('[data-stat="groups"] a.usr_grp_clr').map(function () {
        var $a = $(this);
        return {
          name:  $a.clone().find('i').remove().end().text().trim(),
          color: $a.css('color'),
          href:  $a.attr('href'),
          title: $a.attr('title')
        };
      }).get()
    };
  };

  // ── Data & variabile ─────────────────────────────────────────────────────────

  FME.prototype.data = function (key) {
    if (typeof _userdata !== 'undefined' && key in _userdata)
      return _userdata[key];
    if (typeof window.FME_STATS !== 'undefined' && key in window.FME_STATS)
      return window.FME_STATS[key];
    return null;
  };

  FME.prototype.set = function (selector, key) {
    var val = this.data(key);
    if (val !== null) return $(selector).text(val);
    console.warn('[fme] Cheia "' + key + '" nu a fost găsită');
  };

  FME.prototype.replace = function (selector, search, rep) {
    return $(selector).each(function () {
      var el = $(this);
      el.text(el.text().replace(search, rep));
    });
  };

  // ── fetchVars / getVar / renderVars ──────────────────────────────────────────

  FME.prototype.fetchVars = function (callback) {
    var self = this;
    if (self._vars) {
      if (typeof callback === 'function') callback(self._vars);
      return;
    }

    $.get('/popup_help.php?l=miscvars', function (html) {
      var $doc = $(html);
      var vars = {};

      $doc.find('li[style]').each(function () {
        var $li = $(this), $strong = $li.find('strong');
        if (!$strong.length) return;

        var key = $strong.text().trim().slice(1, -1);
        if (!key) return;

        var raw   = $li[0].innerHTML;
        var match = raw.match(/<\/strong>([\s\S]*?)<span/);
        if (match) {
          vars[key] = $('<div>').html(match[1]).text()
            .replace(/\u00a0/g, '').replace(/^\s*:\s*/, '').trim();
        }
      });

      console.log('[fme] vars încărcate:', Object.keys(vars).length);
      self._vars = vars;
      if (typeof callback === 'function') callback(vars);
    }).fail(function () {
      console.warn('[fme] fetchVars: cererea a eșuat');
    });
  };

  FME.prototype.getVar = function (key, callback) {
    var self = this;
    if (self._vars) return self._vars[key] || null;
    self.fetchVars(function () {
      if (typeof callback === 'function') callback(self._vars[key] || null);
    });
  };

  FME.prototype.renderVars = function (scope) {
    var root = scope ? $(scope) : $(document);
    this.fetchVars(function (vars) {
      root.find('[data-var]').each(function () {
        var $el = $(this), key = $el.attr('data-var');
        if (key in vars) $el.text(vars[key]);
      });
    });
  };

  // ── Online polling ───────────────────────────────────────────────────────────

  FME.prototype.pollOnline = function (interval) {
    var self = this;
    var ms   = (interval || 5) * 60 * 1000;

    function fetch() {
      $.get('/viewonline', function (html) {
        var cleanHtml = html.replace(/<script[\s\S]*?<\/script>/gi, '');
        var $rows     = $('<div>').html(cleanHtml).find('table.table1 tbody tr');
        var users     = [];
        var visitors  = 0;

        $rows.each(function () {
          var $td = $(this).find('td').first();
          var $a  = $td.find('a[href^="/u"]');

          if ($a.length) {
            var $span = $a.find('span');
            users.push({
              name:  ($span.length ? $span.find('strong').text() : $a.text()).trim(),
              href:  $a.attr('href'),
              color: $span.length ? $span.css('color')  : null,
              group: $span.length ? $span.attr('class') : null
            });
          } else {
            visitors++;
          }
        });

        self._online = {
          users: users, members: users.length,
          visitors: visitors, total: $rows.length
        };

        $('[data-string="total_online"]').text($rows.length);
        console.log('[fme] online:', self._online);
      }).fail(function () {
        console.warn('[fme] pollOnline: cererea a eșuat');
      });
    }

    fetch();
    return setInterval(fetch, ms);
  };

  FME.prototype.stopPoll = function (timer) {
    clearInterval(timer);
  };

  // ── Date & timp relativ ──────────────────────────────────────────────────────

  FME.prototype._parseRoDate = function (str) {
    var m = str.match(/(\d+)\s+(\w+)\s+(\d{4})\s*-\s*(\d+):(\d+)/);
    if (!m) return null;
    return new Date(m[3], RO_MONTHS[m[2]] - 1, m[1], m[4], m[5]);
  };

  FME.prototype._relativeTime = function (date) {
    var diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60)     return 'acum câteva secunde';
    if (diff < 3600)   return 'acum ' + Math.floor(diff / 60)   + ' min';
    if (diff < 7200)   return 'acum o oră';
    if (diff < 86400)  return 'acum ' + Math.floor(diff / 3600) + ' ore';
    if (diff < 172800) return 'ieri';
    if (diff < 604800) return 'acum ' + Math.floor(diff / 86400) + ' zile';
    return date.getDate() + '.' + (date.getMonth() + 1) + '.' + date.getFullYear();
  };

  // ── Randare UI ───────────────────────────────────────────────────────────────

  FME.prototype.indexBlocks = function () {
    var $blocks = $('.fme-index-wrap > .fme-cat-block');

    $blocks.each(function (i) {
      var $block = $(this);
      var $numEl = $block.find('[data-cat-num]');
      var cat    = CATS[$numEl.attr('data-cat-num')];

      $numEl.text(cat ? cat.num : String(i + 1).padStart(2, '0'));

      var $h2 = $block.find('span.fme-cat-num + h2');
      if ($h2.length) {
        $h2.attr('class', 'fme-cat-name');
        if (cat && cat.desc) {
          $h2.after(
            $('<span>').css({
              flex: '1 1 0%', 'font-size': '13px',
              color: 'var(--fme-dim)', 'font-style': 'italic'
            }).text(cat.desc)
          );
        }
      }
    });

    return $blocks.length;
  };

  FME.prototype.transformLastPost = function (scope) {
    var self = scope ? $(scope) : $(document);

    self.find('span.fme-lp-meta').each(function () {
      var $el      = $(this);
      var $parent  = $el.parent();
      var $titleEl = $parent.find('span.fme-lp-title');
      var $titleA  = $titleEl.find('a').first();

      var dateStr = $el.contents().filter(function () {
        return this.nodeType === 3;
      }).text().trim();

      var $userLink = $el.find('a[href^="/u"]');
      var $userSpan = $userLink.length ? $userLink.find('span') : $el.find('span[style]');
      var $postLink = $el.find('a.last-post-icon');

      var date      = $.fme._parseRoDate(dateStr);
      var relTime   = date ? $.fme._relativeTime(date) : dateStr;
      var userName  = $userSpan.find('strong').text().trim() || 'Vizitator';
      var userHref  = $userLink.attr('href') || null;
      var postHref  = $postLink.attr('href') || $titleA.attr('href');
      var postTitle = $titleA.text().trim()  || 'Ultimul mesaj';

      $el.closest('.fme-forum-card-lastpost').find('span.fme-lp-avatar').each(function () {
        var av = userName !== 'Vizitator' ? _paint(userName) : { bg: '#aaa', text: '?' };
        $(this).replaceWith(
          $('<div>').css({
            width: '28px', height: '28px', 'border-radius': '4px',
            background: av.bg, 'flex-shrink': '0', display: 'flex',
            'align-items': 'center', 'justify-content': 'center',
            'font-size': '10px', 'font-weight': '700',
            color: '#fff', 'user-select': 'none'
          }).text(av.text)
        );
      });

      var $titleDiv = $('<div>').css({
        'font-size': '12px', color: 'var(--fme-text)', 'font-weight': '500',
        overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap'
      }).append($('<a>').attr('href', postHref).css('color', 'inherit').text(postTitle));

      var $userEl = (userHref ? $('<a>').attr('href', userHref) : $('<span>'))
        .css({ color: 'var(--fme-accent)', 'font-weight': '500' }).text(userName);

      var $metaDiv = $('<div>').append(
        $userEl,
        $('<span>').css('color', 'var(--fme-dim)').text(' · ' + relTime)
      );

      $titleEl.remove();
      $el.replaceWith($('<div>').css({ 'min-width': '0', flex: '1 1 0%' }).append($titleDiv, $metaDiv));
    });
  };

  FME.prototype.renderString = function (scope) {
    var s    = this.parseStats();
    var p    = this.profile();
    var root = scope ? $(scope) : $(document);

    var map = {
      total_topics:  window.FME_STATS ? window.FME_STATS.total_mesj2 : 0,
      total_posts:   s.posts,
      total_online:  s.online,
      total_members: s.members,
      record:        s.record,
      lastuser:      s.newest.name,
      username:      p.username,
      user_posts:    p.posts,
      user_points:   p.points,
      user_rep:      p.reputation,
      user_msgs:     p.messages
    };

    root.find('[data-string]').each(function () {
      var $el = $(this), key = $el.attr('data-string');
      if (key in map && map[key] !== null) {
        if (key === 'lastuser' && s.newest.href)
          $el.html($('<a>').attr('href', s.newest.href).text(map[key]).css('color', s.newest.color || ''));
        else
          $el.text(map[key]);
      }
    });
  };

  // ── Inițializare ─────────────────────────────────────────────────────────────

  if (typeof $ !== 'undefined' && typeof _userdata !== 'undefined') {
    $.fme = new FME();
    console.warn('[fme] FME System initializizat cu succes !');
  } else {
    console.warn('[fme] jQuery sau _userdata nu sunt disponibile');
  }
}(jQuery));
