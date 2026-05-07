(function ($) {
  'use strict';

  var KEY = 'fme.tweaks.v2';
  var DEFAULTS = { dark: false, font: 'sans', density: 'compact', layout: 'table', avatar: 'round' };

  var COLORS = [
    ['#7DD3FC','#0369A1'], ['#FCA5A5','#991B1B'], ['#A7F3D0','#065F46'],
    ['#FCD34D','#92400E'], ['#C4B5FD','#5B21B6'], ['#F9A8D4','#9D174D'],
    ['#FDBA74','#9A3412'], ['#86EFAC','#14532D'], ['#67E8F9','#155E75']
  ];

  var RO_MONTHS = { Ian:1, Feb:2, Mar:3, Apr:4, Mai:5, Iun:6, Iul:7, Aug:8, Sep:9, Oct:10, Noi:11, Dec:12 };

  var CATS = {
    c2: { num:'01', desc:'Anunțurile echipei, reguli generale și actualizări platformă.' },
    c1: { num:'02', desc:'Dezvoltare Web — HTML, CSS, JavaScript și template-uri Forumotion.' },
    c3: { num:'03', desc:'Prezintă tema ta, partajează snippet-uri și resurse.' },
    c4: { num:'04', desc:'Off-topic, prezentări și discuții libere.' }
  };

  function loadTweaks() {
    try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(KEY) || '{}')); }
    catch (e) { return Object.assign({}, DEFAULTS); }
  }

  function saveTweaks(t) {
    try { localStorage.setItem(KEY, JSON.stringify(t)); } catch (e) {}
  }

  function applyTweaks(t) {
    var b = document.body;
    if (!b) return;
    b.classList.toggle('fme-dark', !!t.dark);
    ['sans','mono'].forEach(function (v) { b.classList.toggle('fme-font-' + v, t.font === v); });
    ['compact','regular','comfy'].forEach(function (v) { b.classList.toggle('fme-density-' + v, t.density === v); });
    ['table','cards'].forEach(function (v) { b.classList.toggle('fme-layout-' + v, t.layout === v); });
    ['round','square','pixel'].forEach(function (v) { b.classList.toggle('fme-avatar-' + v, t.avatar === v); });
  }

  function _hash(str) {
    return (str || '?').split('').reduce(function (a, c) { return a + c.charCodeAt(0); }, 0);
  }

  function _initials(name) {
    return (name || '?').slice(0, 2).toUpperCase();
  }

  function _paint(name) {
    var pair = COLORS[_hash(name) % COLORS.length];
    return { bg: pair[0], fg: pair[1], text: _initials(name) };
  }

  function _shapeRadius() {
    var b = document.body;
    if (b.classList.contains('fme-avatar-pixel'))  return '0';
    if (b.classList.contains('fme-avatar-square')) return '12%';
    return '50%';
  }

  function _parseRoDate(str) {
    var m = str.match(/(\d+)\s+(\w+)\s+(\d{4})\s*-\s*(\d+):(\d+)/);
    if (!m) return null;
    return new Date(m[3], RO_MONTHS[m[2]] - 1, m[1], m[4], m[5]);
  }

  function _relativeTime(date) {
    var diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60)     return 'acum câteva secunde';
    if (diff < 3600)   return 'acum ' + Math.floor(diff / 60) + ' min';
    if (diff < 7200)   return 'acum o oră';
    if (diff < 86400)  return 'acum ' + Math.floor(diff / 3600) + ' ore';
    if (diff < 172800) return 'ieri';
    if (diff < 604800) return 'acum ' + Math.floor(diff / 86400) + ' zile';
    return date.getDate() + '.' + (date.getMonth() + 1) + '.' + date.getFullYear();
  }

  function FME() {
    this._vars   = null;
    this._online = null;
  }

  FME.prototype.avatar = function (selector, name) {
    var r = _paint(name || _userdata.username);
    var pixel = document.body.classList.contains('fme-avatar-pixel');
    return $(selector).css({
      background: r.bg, color: r.fg, 'border-radius': _shapeRadius(),
      'font-family': pixel ? "'JetBrains Mono', monospace" : 'inherit'
    }).text(r.text);
  };

  FME.prototype.username = function (selector) {
    return $(selector).text(_userdata.username);
  };

  FME.prototype.user = function (scope) {
    var root = scope ? $(scope) : $(document);
    this.avatar(root.find('[data-user-avatar]'));
    this.username(root.find('[data-user-name]'));
  };

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

  FME.prototype.data = function (key) {
    if (typeof _userdata !== 'undefined' && key in _userdata) return _userdata[key];
    if (typeof window.FME_STATS !== 'undefined' && key in window.FME_STATS) return window.FME_STATS[key];
    return null;
  };

  FME.prototype.set = function (selector, key) {
    var val = this.data(key);
    if (val !== null) return $(selector).text(val);
  };

  FME.prototype.replace = function (selector, search, rep) {
    return $(selector).each(function () {
      var el = $(this);
      el.text(el.text().replace(search, rep));
    });
  };

  FME.prototype.fetchVars = function (callback) {
    var self = this;
    if (self._vars) {
      if (typeof callback === 'function') callback(self._vars);
      return;
    }
    $.get('/popup_help.php?l=miscvars', function (html) {
      var vars = {};
      $(html).find('li[style]').each(function () {
        var $li = $(this), $strong = $li.find('strong');
        if (!$strong.length) return;
        var key = $strong.text().trim().slice(1, -1);
        if (!key) return;
        var match = $li[0].innerHTML.match(/<\/strong>([\s\S]*?)<span/);
        if (match) {
          vars[key] = $('<div>').html(match[1]).text()
            .replace(/ /g, '').replace(/^\s*:\s*/, '').trim();
        }
      });
      self._vars = vars;
      if (typeof callback === 'function') callback(vars);
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

  FME.prototype.pollOnline = function (interval) {
    var self = this;
    var ms = (interval || 5) * 60 * 1000;
    function fetch() {
      $.get('/viewonline', function (html) {
        var $rows = $('<div>').html(html.replace(/<script[\s\S]*?<\/script>/gi, '')).find('table.table1 tbody tr');
        var users = [], visitors = 0;
        $rows.each(function () {
          var $a = $(this).find('td').first().find('a[href^="/u"]');
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
        self._online = { users: users, members: users.length, visitors: visitors, total: $rows.length };
        $('[data-string="total_online"]').text($rows.length);
      });
    }
    fetch();
    return setInterval(fetch, ms);
  };

  FME.prototype.stopPoll = function (timer) {
    clearInterval(timer);
  };

  FME.prototype.indexBlocks = function () {
    var $blocks = $('.fme-index-wrap > .fme-cat-block');
    $blocks.each(function (i) {
      var $block = $(this);
      var $numEl = $block.find('[data-cat-num]');
      var cat = CATS[$numEl.attr('data-cat-num')];
      $numEl.text(cat ? cat.num : String(i + 1).padStart(2, '0'));
      var $h2 = $block.find('span.fme-cat-num + h2');
      if ($h2.length) {
        $h2.attr('class', 'fme-cat-name');
        if (cat && cat.desc) {
          $h2.after($('<span>').css({ flex: '1 1 0%', 'font-size': '13px', color: 'var(--fme-dim)', 'font-style': 'italic' }).text(cat.desc));
        }
      }
    });
    return $blocks.length;
  };

  FME.prototype.transformLastPost = function (scope) {
    var root = scope ? $(scope) : $(document);
    root.find('span.fme-lp-meta').each(function () {
      var $el      = $(this);
      var $parent  = $el.parent();
      var $titleEl = $parent.find('span.fme-lp-title');
      var $titleA  = $titleEl.find('a').first();
      var dateStr  = $el.contents().filter(function () { return this.nodeType === 3; }).text().trim();
      var $userLink = $el.find('a[href^="/u"]');
      var $userSpan = $userLink.length ? $userLink.find('span') : $el.find('span[style]');
      var date      = _parseRoDate(dateStr);
      var relTime   = date ? _relativeTime(date) : dateStr;
      var userName  = $userSpan.find('strong').text().trim() || 'Vizitator';
      var userHref  = $userLink.attr('href') || null;
      var postHref  = $el.find('a.last-post-icon').attr('href') || $titleA.attr('href');
      var postTitle = $titleA.text().trim() || 'Ultimul mesaj';

      $el.closest('.fme-forum-card-lastpost').find('span.fme-lp-avatar').each(function () {
        var $avEl = $('<div>').css({
          width: '28px', height: '28px', 'flex-shrink': '0', display: 'flex',
          'align-items': 'center', 'justify-content': 'center',
          'font-size': '10px', 'font-weight': '700', 'user-select': 'none'
        });
        if (userName !== 'Vizitator') {
          $.fme.avatar($avEl, userName);
        } else {
          $avEl.css({ background: '#aaa', color: '#fff', 'border-radius': _shapeRadius() }).text('?');
        }
        $(this).replaceWith($avEl);
      });

      $titleEl.remove();
      $el.replaceWith(
        $('<div>').css({ 'min-width': '0', flex: '1 1 0%' }).append(
          $('<div>').css({ 'font-size': '12px', color: 'var(--fme-text)', 'font-weight': '500', overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap' })
            .append($('<a>').attr('href', postHref).css('color', 'inherit').text(postTitle)),
          $('<div>').append(
            (userHref ? $('<a>').attr('href', userHref) : $('<span>')).css({ color: 'var(--fme-accent)', 'font-weight': '500' }).text(userName),
            $('<span>').css('color', 'var(--fme-dim)').text(' · ' + relTime)
          )
        )
      );
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
      if (!(key in map) || map[key] === null) return;
      if (key === 'lastuser' && s.newest.href)
        $el.html($('<a>').attr('href', s.newest.href).text(map[key]).css('color', s.newest.color || ''));
      else
        $el.text(map[key]);
    });
  };

  function detectPageClass() {
    var b = document.body;
    var full = (location.pathname || '') + (location.search || '');

    if (/^\/(\?|$)/.test(full) || /[\/=]index/i.test(full)) b.classList.add('page-index');
    if (/\/f\d+|viewforum/i.test(full))                      b.classList.add('page-viewforum');
    if (/\/t\d+|viewtopic/i.test(full))                      b.classList.add('page-viewtopic');
    if (/\/post|posting|mode=reply|mode=post/i.test(full))   b.classList.add('page-posting');
    if (/\/u\d+|profile/i.test(full))                        b.classList.add('page-profile');
    if (/memberlist/i.test(full))                            b.classList.add('page-memberlist');
    if (/search/i.test(full))                                b.classList.add('page-search');
    if (/login/i.test(full))                                 b.classList.add('page-login');

    if (!b.classList.contains('page-login')   && document.querySelector('input[name="password"]'))        b.classList.add('page-login');
    if (!b.classList.contains('page-posting') && document.querySelector('textarea[name="message"]'))      b.classList.add('page-posting');
    if (!b.classList.contains('page-search')  && document.querySelector('input[name="search_keywords"]')) b.classList.add('page-search');
  }

  function injectMasthead() {
    if (!document.body.classList.contains('page-index')) return;
    if (document.querySelector('.fme-masthead')) return;
    var content = document.querySelector('#page-body > .content, .page-body > .content, #page-body');
    if (!content) return;
    var s = window.FME_STATS || { members: '8.247', online: 142, posts: '184K' };
    var m = document.createElement('div');
    m.className = 'fme-masthead';
    m.innerHTML =
      '<div class="volume">— Vol. III · Numărul curent —</div>'
      + '<h1>Forumotion with passion for developers</h1>'
      + '<div class="motto">Dezvoltatori care construiesc împreună</div>'
      + '<div class="stats"><span>' + s.members + ' membri</span><span>·</span>'
      + '<span class="online">' + s.online + ' online</span><span>·</span>'
      + '<span>' + s.posts + ' contribuții</span></div>';
    content.insertBefore(m, content.firstChild);
  }

  function applyDropcap() {
    var firstPost = document.querySelector('.post:first-of-type, #p1, .post.op-post');
    if (!firstPost) return;
    firstPost.classList.add('op-post');
    var body = firstPost.querySelector('.postbody .content, .postbody .post-content');
    if (!body) return;
    var p = body.querySelector('p');
    if (!p || p.querySelector('.dropcap')) return;
    var txt = p.textContent || '';
    if (!txt.length) return;
    p.innerHTML = '<span class="dropcap">' + txt.charAt(0) + '</span>'
      + txt.slice(1).replace(/[<>&]/g, function (ch) {
        return ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : '&amp;';
      });
  }

  function applyStateBadges() {
    document.querySelectorAll('a.topictitle').forEach(function (a) {
      var li = a.closest('li.row, dl.row-item');
      if (!li || a.dataset.fmeBadged) return;
      a.dataset.fmeBadged = '1';
      var prefix = '';
      if (li.classList.contains('pinned') || /pinned|sticky/i.test(li.className))
        prefix += '<span class="fme-state-pinned">Fixat</span>';
      if (li.classList.contains('locked') || a.closest('.locked'))
        prefix += '<span class="fme-state-locked">Închis</span>';
      if (/\[REZOLVAT\]|\[SOLVED\]/i.test(a.textContent || '')) {
        prefix += '<span class="fme-state-solved">Rezolvat</span>';
        a.textContent = (a.textContent || '').replace(/\[REZOLVAT\]\s*|\[SOLVED\]\s*/gi, '');
      }
      if (prefix) a.insertAdjacentHTML('beforebegin', prefix);
    });
  }

  function mountTweaksWidget() {
    var mount = document.querySelector('.fme-tweaks-mount');
    if (!mount || mount.dataset.fmeMounted) return;
    mount.dataset.fmeMounted = '1';
    var t = loadTweaks();
    function group(key, opts, current) {
      return '<div class="group">' + opts.map(function (o) {
        return '<button class="' + (o[0] === current ? 'active' : '') + '" data-key="' + key + '" data-val="' + o[0] + '">' + o[1] + '</button>';
      }).join('') + '</div>';
    }
    mount.classList.add('fme-tweaks');
    mount.innerHTML = '<h3>Tweaks</h3>'
      + group('dark',    [['off','Light'],['on','Dark']],                             t.dark ? 'on' : 'off')
      + group('font',    [['sans','Sans'],['mono','Mono']],                           t.font)
      + group('density', [['compact','Compact'],['regular','Normal'],['comfy','Lejer']], t.density)
      + group('layout',  [['table','Tabel'],['cards','Carduri']],                     t.layout)
      + group('avatar',  [['round','Rotund'],['square','Pătrat'],['pixel','Pixel']],  t.avatar);
    mount.addEventListener('click', function (ev) {
      var btn = ev.target.closest('button[data-key]');
      if (!btn) return;
      var key = btn.dataset.key, val = btn.dataset.val;
      if (key === 'dark') t.dark = val === 'on'; else t[key] = val;
      saveTweaks(t);
      applyTweaks(t);
      mount.querySelectorAll('button[data-key="' + key + '"]').forEach(function (b) {
        b.classList.toggle('active', b.dataset.val === val);
      });
    });
  }

  applyTweaks(loadTweaks());

  if (typeof _userdata !== 'undefined') {
    $.fme = new FME();
  }

  function init() {
    applyTweaks(loadTweaks());
    detectPageClass();
    injectMasthead();
    applyDropcap();
    applyStateBadges();
    mountTweaksWidget();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}(jQuery));
