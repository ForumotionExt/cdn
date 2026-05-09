(function ($) {
  'use strict';

  try {
    if (localStorage.getItem('fme.dark') === '1') {
      document.documentElement.classList.add('fme-dark');
      if (document.body) document.body.classList.add('fme-dark');
    }
  } catch(e) {}

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
    if (document.querySelector('.fme-masthead, [data-placeholder="forum-stats"]')) return;
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

  function injectLoginPage() {
    var b = document.body;
    if (!b.classList.contains('page-login')) return;
    if (b.classList.contains('fme-login-done')) return;
    b.classList.add('fme-login-done');

    var $pageBody = $('#page-body');
    var $form = $pageBody.find('form.loginbox, form[action*="login"]').first();
    if (!$form.length) return;

    var action      = $form.attr('action') || location.href;
    var method      = $form.attr('method') || 'post';
    var $hidden     = $form.find('input[type="hidden"]').clone();
    var userVal     = $form.find('input[name="username"]').val() || '';
    var forgotHref  = $('a[href*="sendpasswd"], a[href*="forgot"], a[href*="lostpw"]').first().attr('href') || '#';
    var regHref     = $('a[href*="/register"], a[href*="mode=register"]').first().attr('href') || '/register';

    var $new = $('<div id="login_form">').append(
      $('<div class="site-description">').text('FME'),
      $('<div class="welcome">').text('Bun venit înapoi în comunitate.'),
      $('<form class="loginbox panel">').attr({ action: action, method: method }).append(
        $hidden,
        $('<h2>').text('Autentificare'),
        $('<label>').attr('for', 'fme_user').text('Utilizator sau email'),
        $('<input type="text">').attr({ name: 'username', id: 'fme_user', tabindex: '1', value: userVal }),
        $('<label>').attr('for', 'fme_pass').text('Parolă'),
        $('<input type="password">').attr({ name: 'password', id: 'fme_pass', tabindex: '2' }),
        $('<div>').css({ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'margin-bottom': '18px', 'font-size': '12px' }).append(
          $('<label>').css({ display: 'flex', 'align-items': 'center', gap: '6px', color: 'var(--fme-dim)' }).append(
            $('<input type="checkbox">').attr({ name: 'autologin', tabindex: '4' }),
            document.createTextNode(' Ține-mă autentificat')
          ),
          $('<a>').attr('href', forgotHref).css({ color: 'var(--fme-accent)', 'font-style': 'italic' }).text('Parolă uitată?')
        ),
        $('<button type="submit">').attr({ name: 'login', tabindex: '6' }).text('Autentificare'),
        $('<div>').css({ 'font-size': '12px', color: 'var(--fme-faint)', 'text-align': 'center', 'margin-top': '16px' }).append(
          document.createTextNode('Nu ai cont? '),
          $('<a>').attr('href', regHref).css({ color: 'var(--fme-accent)', 'font-style': 'italic' }).text('Înregistrează-te aici')
        )
      )
    );

    $pageBody.empty().append($new);
  }

  function closeDropdowns() {
    $('.fme-dropdown').removeClass('open');
  }

  function initSearchDrop() {
    var $btn     = $('#fme-search-btn');
    var $drop    = $('#fme-search-drop');
    var $input   = $('#fme-search-input');
    var $results = $('#fme-search-results');
    if (!$btn.length) return;

    var debounce, currentXHR;

    $btn.on('click', function (e) {
      e.stopPropagation();
      var wasOpen = $drop.hasClass('open');
      closeDropdowns();
      if (!wasOpen) { $drop.addClass('open'); $input.focus(); }
    });

    $input.on('keydown', function (e) {
      if (e.which === 13) {
        var q = $(this).val().trim();
        if (q) window.location.href = '/search?search_keywords=' + encodeURIComponent(q);
      }
    });

    $input.on('input', function () {
      var q = $(this).val().trim();
      clearTimeout(debounce);
      if (q.length < 2) { $results.empty(); return; }
      debounce = setTimeout(function () {
        if (currentXHR) currentXHR.abort();
        $results.html('<div class="fme-search-status">Caut…</div>');
        currentXHR = $.get('/search?search_keywords=' + encodeURIComponent(q) + '&show_results=topics', function (html) {
          var $doc  = $('<div>').html(html.replace(/<script[\s\S]*?<\/script>/gi, ''));
          var items = [];
          $doc.find('a.topictitle').each(function () {
            if (items.length >= 6) return false;
            var $a   = $(this);
            var $row = $a.closest('dl, li, tr');
            var sub  = $row.find('.responsive-hide, .topic-poster').first().text().trim().slice(0, 60);
            items.push({ title: $a.text().trim(), href: $a.attr('href'), sub: sub });
          });
          if (!items.length) { $results.html('<div class="fme-search-status">Niciun rezultat.</div>'); return; }
          $results.html(items.map(function (it) {
            return '<a class="fme-search-item" href="' + it.href + '">'
              + '<div class="fme-search-item-title">' + it.title + '</div>'
              + (it.sub ? '<div class="fme-search-item-sub">' + it.sub + '</div>' : '')
              + '</a>';
          }).join(''));
        }).fail(function () { $results.html('<div class="fme-search-status">Eroare la căutare.</div>'); });
      }, 350);
    });

    $(document).on('click', function (e) {
      if (!$(e.target).closest('#fme-search-btn, #fme-search-drop').length) $drop.removeClass('open');
    });
  }

  function initNotifDrop() {
    var $btn   = $('#fme-notif-btn');
    var $drop  = $('#fme-notif-drop');
    var $badge = $('#fme-notif-badge');
    if (!$btn.length) return;

    var pm = (typeof _userdata !== 'undefined') ? (parseInt(_userdata.user_nb_privmsg) || 0) : 0;
    if (pm > 0) $badge.text(pm).show();

    $btn.on('click', function (e) {
      e.stopPropagation();
      var wasOpen = $drop.hasClass('open');
      closeDropdowns();
      if (!wasOpen) {
        if (!$drop.data('rendered')) {
          $drop.data('rendered', true).html(buildNotifPanel(pm));
        }
        $drop.addClass('open');
      }
    });

    $(document).on('click', function (e) {
      if (!$(e.target).closest('#fme-notif-btn, #fme-notif-drop').length) $drop.removeClass('open');
    });
  }

  function buildNotifPanel(pm) {
    var h = '<div class="fme-notif-header">Activitate</div>';
    if (pm > 0)
      h += '<a class="fme-notif-item fme-notif-unread" href="/privmsg?folder=inbox">'
        + pm + ' mesaj' + (pm !== 1 ? 'e' : '') + ' privat' + (pm !== 1 ? 'e' : '') + ' nou' + (pm !== 1 ? 'ă' : '')
        + '</a>';
    h += '<a class="fme-notif-item" href="/search?search_id=newposts">Subiecte noi de la ultima vizită</a>'
      + '<a class="fme-notif-item" href="/search?search_id=egosearch">Subiecte la care ai participat</a>'
      + '<a class="fme-notif-footer" href="/privmsg?folder=inbox">Inbox →</a>';
    return h;
  }

  function initDarkToggle() {
    var btn = document.getElementById('fme-dark-btn');
    if (!btn) return;
    var isDark = document.documentElement.classList.contains('fme-dark');
    btn.textContent = isDark ? '☀' : '☾';
    btn.addEventListener('click', function () {
      isDark = !isDark;
      document.documentElement.classList.toggle('fme-dark', isDark);
      document.body.classList.toggle('fme-dark', isDark);
      btn.textContent = isDark ? '☀' : '☾';
      try { localStorage.setItem('fme.dark', isDark ? '1' : '0'); } catch (e) {}
    });
  }

  function initHoverCard() {
    var CACHE = {};
    var $card = $('<div class="fme-hovercard">').hide().appendTo(document.body);
    var hideTimer;

    function show($anchor, d) {
      $card.html(
        '<div class="fme-hovercard-name">' + d.name + '</div>'
        + (d.rank   ? '<div class="fme-hovercard-rank">'  + d.rank  + '</div>' : '')
        + '<div class="fme-hovercard-stats">'
        + (d.posts  ? '<span>' + d.posts  + '</span>' : '')
        + (d.rep    ? '<span>' + d.rep    + '</span>' : '')
        + (d.joined ? '<span>' + d.joined + '</span>' : '')
        + '</div>'
      );
      var off = $anchor.offset();
      $card.css({ top: off.top + $anchor.outerHeight() + 6, left: off.left, position: 'absolute' }).show();
    }

    function fromPost($a) {
      var $post = $a.closest('.post');
      if (!$post.length) return null;
      var name = $a.text().trim();
      if (!name) return null;
      var rank = $post.find('[data-post-rank]').text().trim();
      var posts = null, rep = null, joined = null;
      $post.find('.postprofile').each(function () {
        var t = $(this).text().trim();
        if (/posturi/.test(t))  posts = t;
        if (/rep/.test(t))      rep   = t;
        if (/^din\s/.test(t))   joined = t;
      });
      return { name: name, rank: rank, posts: posts, rep: rep, joined: joined };
    }

    $(document)
      .on('mouseenter', '[data-string="username"] a', function () {
        var $a   = $(this);
        var name = $a.text().trim();
        clearTimeout(hideTimer);
        if (!CACHE[name]) CACHE[name] = fromPost($a);
        if (CACHE[name]) show($a, CACHE[name]);
      })
      .on('mouseleave', '[data-string="username"] a', function () {
        hideTimer = setTimeout(function () { $card.hide(); }, 250);
      });
  }

  function initBBCodeToolbar() {
    $(document).on('click', '.bbcode-btn[data-bbcode]', function (e) {
      e.preventDefault();
      var tag      = $(this).attr('data-bbcode');
      var targetId = $(this).attr('data-target');
      var $ta      = targetId ? $('#' + targetId) : $('textarea[name="message"]');
      if (!$ta.length) return;
      var ta    = $ta[0];
      var start = ta.selectionStart;
      var end   = ta.selectionEnd;
      var sel   = ta.value.substring(start, end);
      var open  = '[' + tag + ']';
      var close = '[/' + tag + ']';
      ta.value  = ta.value.substring(0, start) + open + sel + close + ta.value.substring(end);
      var cursor = start + open.length + sel.length;
      ta.setSelectionRange(sel ? cursor : start + open.length, sel ? cursor : start + open.length);
      $ta.trigger('input').focus();
    });
  }

  function initAutoResize() {
    $(document).on('input', 'textarea[name="message"], #fme-qr-text', function () {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight + 2) + 'px';
    });
  }

  function initQuickReply() {
    var $cta    = $('#fme-reply-cta');
    var $reply  = $('#fme-quick-reply');
    var $text   = $('#fme-qr-text');
    var $cancel = $('#fme-qr-cancel');
    var $submit = $('#fme-qr-submit');
    if (!$cta.length) return;

    $cta.on('click', function () {
      $cta.hide();
      $reply.show();
      $text.focus();
    });

    $cancel.on('click', function () {
      $reply.hide();
      $cta.show();
      $text.val('').css('height', '');
    });

    $submit.on('click', function () {
      var text = $text.val().trim();
      if (!text) return false;
      try {
        var m = location.pathname.match(/\/t(\d+)/i);
        sessionStorage.setItem('fme.qr.' + (m ? m[1] : '0'), text);
      } catch (e) {}
    });
  }

  function initQuickReplyRestore() {
    if (!document.body.classList.contains('page-posting')) return;
    var $ta = $('textarea[name="message"]');
    if (!$ta.length) return;
    try {
      for (var i = 0; i < sessionStorage.length; i++) {
        var k = sessionStorage.key(i);
        if (k && k.indexOf('fme.qr.') === 0) {
          var saved = sessionStorage.getItem(k);
          if (saved && !$ta.val().trim()) {
            $ta.val(saved).trigger('input');
            sessionStorage.removeItem(k);
          }
          break;
        }
      }
    } catch (e) {}
  }

  function initRelativeTimestamps() {
    document.querySelectorAll('[data-post-date]').forEach(function (el) {
      var d = _parseRoDate(el.textContent.trim());
      if (d) el.textContent = _relativeTime(d);
    });
  }

  function initCopyPostLink() {
    $(document).on('click', '[data-copy-link]', function () {
      var id  = $(this).attr('data-copy-link');
      var url = location.href.split('#')[0] + '#p' + id;
      var $el = $(this);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
      } else {
        var ta = document.createElement('textarea');
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      var orig = $el.text();
      $el.text('✓').css('color', 'var(--fme-accent)');
      setTimeout(function () { $el.text(orig).css('color', ''); }, 1500);
    });
  }

  // ── Reaction system ───────────────────────────────────────────────────────────
  var REACTIONS = [
    { key: 'love',  emoji: String.fromCodePoint(0x2764),  label: 'Apreciez' },
    { key: 'fire',  emoji: String.fromCodePoint(0x1F525), label: 'Tare' },
    { key: 'idea',  emoji: String.fromCodePoint(0x1F4A1), label: 'Util' },
    { key: 'clap',  emoji: String.fromCodePoint(0x1F44F), label: 'Bravo' },
    { key: 'think', emoji: String.fromCodePoint(0x1F914), label: 'Interesant' },
  ];
  var REACT_BY_KEY = {};
  REACTIONS.forEach(function(r) { REACT_BY_KEY[r.key] = r; });

  function _rEsc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // Close all pickers + dropdowns when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('[data-like-post]')) {
      document.querySelectorAll('.fme-react-picker.fme-picker-open').forEach(function(p) { p.classList.remove('fme-picker-open'); });
      document.querySelectorAll('.fme-react-dropdown').forEach(function(d) { d.remove(); });
    }
  });

  function _stackUsers(users) {
    var seen = [];
    REACTIONS.forEach(function(r) {
      (users[r.key] || []).forEach(function(u) { if (seen.indexOf(u) < 0) seen.push(u); });
    });
    return seen;
  }

  // Render avatar stack + per-reaction chips
  function _renderSummary(el, myVote, counts, users, onTabOpen) {
    var active = REACTIONS.filter(function(r) { return (counts[r.key] || 0) > 0; });
    var total  = active.reduce(function(a, r) { return a + counts[r.key]; }, 0);
    var stack  = _stackUsers(users);
    var $sum   = $(el).find('[data-react-summary]');
    var h      = '';

    if (total > 0) {
      h += '<button class="fme-react-total-chip" data-total-chip>';
      h += '<div class="fme-avatar-stack">';
      stack.slice(0, 3).forEach(function(u, i) {
        h += '<div class="fme-avatar-stack-item" style="margin-left:' + (i ? '-6px' : '0') + '" data-s-av="' + _rEsc(u) + '"></div>';
      });
      h += '</div><span class="fme-react-total-count">' + total + '</span></button>';

      active.forEach(function(r) {
        var mine = myVote === r.key;
        h += '<div class="fme-react-chip-wrap">'
          + '<button class="fme-react-chip' + (mine ? ' mine' : '') + '" data-chip="' + r.key + '">'
          + '<span style="font-size:13px;line-height:1">' + r.emoji + '</span>'
          + '<span style="font-size:12px;font-weight:600;color:' + (mine ? 'var(--fme-accent)' : 'var(--fme-text)') + '">' + counts[r.key] + '</span>'
          + '</button></div>';
      });
    }

    $sum.html(h);

    $sum.find('[data-s-av]').each(function() { $.fme.avatar($(this), $(this).attr('data-s-av')); });

    $sum.find('[data-total-chip]').on('click', function(e) { e.stopPropagation(); onTabOpen('all'); });

    $sum.find('[data-chip]').each(function() {
      var key  = $(this).attr('data-chip');
      var r    = REACT_BY_KEY[key];
      var $btn = $(this);
      var $tip = null;

      $btn.on('click', function(e) {
        e.stopPropagation();
        if ($tip) { $tip.remove(); $tip = null; }
        onTabOpen(key);
      });
      $btn.on('mouseenter', function() {
        var list = (users[key] || []).slice(0, 5);
        var more = (users[key] || []).length - list.length;
        $tip = $('<div class="fme-react-tooltip"><div class="fme-react-tooltip-label">' + r.label
          + '</div><div>' + list.map(_rEsc).join(', ') + (more > 0 ? ' și alți ' + more : '') + '</div></div>').appendTo($btn.parent());
      }).on('mouseleave', function() { if ($tip) { $tip.remove(); $tip = null; } });
    });
  }

  // Render dropdown panel (tabs + user list)
  function _showDropdown(el, myVote, counts, users, initTab, onTabChange) {
    $(el).find('.fme-react-dropdown').remove();
    var active = REACTIONS.filter(function(r) { return (counts[r.key] || 0) > 0; });
    var total  = active.reduce(function(a, r) { return a + counts[r.key]; }, 0);
    var tab    = initTab;
    var $drop  = $('<div class="fme-react-dropdown"></div>').appendTo(el);

    function redraw() {
      var h = '<div class="fme-react-dropdown-tabs">'
        + '<button class="fme-react-dropdown-tab' + (tab === 'all' ? ' active' : '') + '" data-dtab="all">Toate <span style="opacity:.6">' + total + '</span></button>';
      active.forEach(function(r) {
        h += '<button class="fme-react-dropdown-tab' + (tab === r.key ? ' active' : '') + '" data-dtab="' + r.key + '" title="' + r.label + '">'
          + '<span style="font-size:13px">' + r.emoji + '</span><span style="opacity:.7">' + counts[r.key] + '</span></button>';
      });
      h += '</div>';

      var rows = [];
      if (tab === 'all') {
        var seen = {};
        active.forEach(function(r) {
          (users[r.key] || []).forEach(function(u) {
            if (!seen[u]) seen[u] = [];
            seen[u].push(r);
          });
        });
        Object.keys(seen).forEach(function(u) { rows.push({ user: u, reactions: seen[u] }); });
      } else {
        var rx = REACT_BY_KEY[tab];
        if (rx) (users[tab] || []).forEach(function(u) { rows.push({ user: u, reactions: [rx] }); });
      }

      h += '<div class="fme-react-dropdown-list">';
      if (!rows.length) {
        h += '<div style="padding:16px;text-align:center;color:var(--fme-faint);font-size:12px;font-style:italic">Niciun utilizator încă.</div>';
      } else {
        rows.forEach(function(row) {
          h += '<div class="fme-react-dropdown-row">'
            + '<div class="fme-react-dropdown-avatar" data-d-av="' + _rEsc(row.user) + '"></div>'
            + '<div style="flex:1;min-width:0"><div class="fme-react-dropdown-name">' + _rEsc(row.user) + '</div>'
            + '<div class="fme-react-dropdown-subreact">' + row.reactions.map(function(r) { return r.label; }).join(' · ') + '</div></div>'
            + '<div style="font-size:14px;letter-spacing:1px">' + row.reactions.map(function(r) { return r.emoji; }).join('') + '</div>'
            + '</div>';
        });
      }
      h += '</div>';
      $drop.html(h);

      $drop.find('[data-d-av]').each(function() { $.fme.avatar($(this), $(this).attr('data-d-av')); });
      $drop.find('[data-dtab]').on('click', function(e) {
        e.stopPropagation();
        tab = $(this).attr('data-dtab');
        onTabChange(tab);
        redraw();
      });
      $drop.on('click', function(e) { e.stopPropagation(); });
    }

    redraw();
    return $drop;
  }

  // Wire "+" button + picker
  function _wirePicker(el, userId, myVoteGetter, onVote) {
    var picker = el.querySelector('[data-react-picker]');
    var $btn   = $(el).find('[data-react-add-btn]');
    if (!picker) return;

    $btn.on('click', function(e) {
      e.stopPropagation();
      $(el).find('.fme-react-dropdown').remove();
      picker.classList.toggle('fme-picker-open');
      $btn.toggleClass('active', picker.classList.contains('fme-picker-open'));
      // highlight current reaction in picker
      $(picker).find('[data-react]').each(function() {
        var key = ($(this).attr('data-react') || '').replace(/^"+|"+$/g, '');
        $(this).toggleClass('fme-opt-active', key === myVoteGetter());
      });
    });

    $(picker).find('[data-react]').on('click', function(e) {
      e.stopPropagation();
      picker.classList.remove('fme-picker-open');
      $btn.removeClass('active');
      if (userId) onVote(($(this).attr('data-react') || '').replace(/^"+|"+$/g, ''));
    });
  }

  function initLikes() {
    if (!document.body.classList.contains('page-viewtopic')) return;
    var apiUrl = window.FME_REACTIONS_URL || '';
    if (!apiUrl) { initLikesLocal(); return; }

    var userId   = (typeof _userdata !== 'undefined' && _userdata.user_id > 0) ? _userdata.user_id : null;
    var userName = (typeof _userdata !== 'undefined' && _userdata.username)    ? _userdata.username : null;
    var els = document.querySelectorAll('[data-like-post]');
    if (!els.length) return;

    function _pid(el) { return (el.getAttribute('data-like-post') || '').replace(/^"+|"+$/g, ''); }

    var ids = [];
    els.forEach(function(el) { var id = parseInt(_pid(el), 10); if (id > 0) ids.push(id); });

    $.getJSON(apiUrl + '?posts=' + ids.join(',') + (userId ? '&user_id=' + userId : ''), function(data) {
      els.forEach(function(el) {
        var postId = _pid(el);
        var d      = data[postId] || { counts: {}, users: {}, my_vote: null };
        var openTab = null;

        function redraw() {
          _renderSummary(el, d.my_vote, d.counts, d.users, function(tab) {
            if (openTab === tab) { openTab = null; $(el).find('.fme-react-dropdown').remove(); }
            else { openTab = tab; _showDropdown(el, d.my_vote, d.counts, d.users, tab, function(t) { openTab = t; }); }
          });
        }

        redraw();

        _wirePicker(el, userId, function() { return d.my_vote; }, function(action) {
          var prev = d.my_vote;
          action = (action === prev) ? null : action; // toggle off
          if (action) {
            d.counts[action] = (d.counts[action] || 0) + 1;
            if (prev) { d.counts[prev] = Math.max(0, (d.counts[prev] || 1) - 1); if (!d.counts[prev]) delete d.counts[prev]; }
            if (userName) {
              if (!d.users[action]) d.users[action] = [];
              if (d.users[action].indexOf(userName) < 0) d.users[action].push(userName);
              if (prev && d.users[prev]) d.users[prev] = d.users[prev].filter(function(u) { return u !== userName; });
            }
          } else if (prev) {
            d.counts[prev] = Math.max(0, (d.counts[prev] || 1) - 1);
            if (!d.counts[prev]) delete d.counts[prev];
            if (userName && d.users[prev]) d.users[prev] = d.users[prev].filter(function(u) { return u !== userName; });
          }
          d.my_vote = action; openTab = null; redraw();

          $.ajax({
            url: apiUrl, type: 'POST', contentType: 'application/json',
            data: JSON.stringify({ post_id: parseInt(postId, 10), user_id: userId, username: userName, action: action }),
            success: function(res) { d.counts = res.counts; d.users = res.users; d.my_vote = res.my_vote; openTab = null; redraw(); },
            error:   function()    { var orig = data[postId] || {}; d.counts = orig.counts || {}; d.users = orig.users || {}; d.my_vote = prev; openTab = null; redraw(); }
          });
        });
      });
    }).fail(function() { initLikesLocal(); });
  }

  function initLikesLocal() {
    var stored = {};
    try { stored = JSON.parse(localStorage.getItem('fme.reactions') || '{}'); } catch(e) {}
    function save() { try { localStorage.setItem('fme.reactions', JSON.stringify(stored)); } catch(e) {} }
    var userId = (typeof _userdata !== 'undefined' && _userdata.user_id > 0) ? String(_userdata.user_id) : null;

    document.querySelectorAll('[data-like-post]').forEach(function(el) {
      var postId = (el.getAttribute('data-like-post') || '').replace(/^"+|"+$/g, '');
      var myVote = (stored[postId] && userId && stored[postId][userId]) || null;
      var counts = {}, users = {}, openTab = null;
      if (stored[postId]) {
        Object.keys(stored[postId]).forEach(function(uid) {
          var r = stored[postId][uid];
          counts[r] = (counts[r] || 0) + 1;
        });
      }

      function redraw() {
        _renderSummary(el, myVote, counts, users, function(tab) {
          if (openTab === tab) { openTab = null; $(el).find('.fme-react-dropdown').remove(); }
          else { openTab = tab; _showDropdown(el, myVote, counts, users, tab, function(t) { openTab = t; }); }
        });
      }

      redraw();

      _wirePicker(el, userId, function() { return myVote; }, function(action) {
        if (!stored[postId]) stored[postId] = {};
        action = (action === myVote) ? null : action;
        if (action) stored[postId][userId] = action; else delete stored[postId][userId];
        if (!Object.keys(stored[postId]).length) delete stored[postId];
        save();
        counts = {};
        if (stored[postId]) Object.keys(stored[postId]).forEach(function(uid) { var r = stored[postId][uid]; counts[r] = (counts[r] || 0) + 1; });
        myVote = action; openTab = null; redraw();
      });
    });
  }

  function initCollapseQuotes() {
    document.querySelectorAll('.post blockquote').forEach(function (bq) {
      if (bq.scrollHeight <= 140) return;
      bq.classList.add('fme-quote-collapsed');
      var btn = document.createElement('button');
      btn.className = 'fme-quote-expand';
      btn.textContent = 'Arată tot ↓';
      btn.addEventListener('click', function () {
        bq.classList.remove('fme-quote-collapsed');
        btn.remove();
      });
      bq.parentNode.insertBefore(btn, bq.nextSibling);
    });
  }

  if (typeof _userdata !== 'undefined') {
    $.fme = new FME();
  }

  function init() {
    detectPageClass();
    initDarkToggle();
    initSearchDrop();
    initNotifDrop();
    injectMasthead();
    injectLoginPage();
    applyDropcap();
    applyStateBadges();
    initHoverCard();
    initBBCodeToolbar();
    initAutoResize();
    initLikes();
    initQuickReply();
    initQuickReplyRestore();
    initRelativeTimestamps();
    initCopyPostLink();
    initCollapseQuotes();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  console.log('updated');
}(jQuery));
