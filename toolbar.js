(function () {
  'use strict';

  var U  = window.IpsUtils;
  var CU = window.ColorUtils;
  var USER = (typeof _userdata !== 'undefined' ? _userdata : {}) || {};

  /* ── Toate stilurile sunt în styles.css ── */

  var HIDE_NAV_LABELS = [
    'cautare', 'cautare avansata', 'grupuri', 'profil', 'mesagerie', 'deconectare',
  ];
  var HIDE_NAV_HREF_PATTERNS = ['/search', '/groups', '/profile', '/privmsg', 'logout', '/login', '/register'];
  var RENAME_NAV = { 'acasa': 'Forum', 'membri': 'Utilizatori', 'faq': 'Suport' };

  var IC = {
    bell:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    mail:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
    star:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    user:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    logout:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    caret:    '<svg class="tb-user-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    like:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>',
    mention:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>',
    eye:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    award:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>',
    friend:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>',
    trash:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>',
    bell_off: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
    topics:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    shield:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    rep:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>',
    search:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    sun:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    moon:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  };

  /* ── Culori grup — setate ca CSS variables, nu inline ── */
  var gc    = '#' + (USER.groupcolor || '1B6AA7');
  var gcL   = CU ? CU.lighten(USER.groupcolor ? '#' + USER.groupcolor : '#1B6AA7', 55) : '#7ec8ff';
  var gcDim = CU ? CU.alphaBg(USER.groupcolor ? '#' + USER.groupcolor : '#1B6AA7', .18) : 'rgba(27,106,167,.18)';

  /* ── Tipuri notificări — culorile sunt definite ca variabile CSS ── */
  var NOTIF_TYPES = {
    0:  { icon: IC.mail,    cssClass: 'notif-pm',      label: 'Mesaj privat'    },
    2:  { icon: IC.friend,  cssClass: 'notif-friend',  label: 'Cerere prieten'  },
    4:  { icon: IC.friend,  cssClass: 'notif-friend',  label: 'Prieten nou'      },
    5:  { icon: IC.user,    cssClass: 'notif-pm',      label: 'Mesaj pe profil' },
    7:  { icon: IC.eye,     cssClass: 'notif-watch',   label: 'Subiect urmărit' },
    8:  { icon: IC.mention, cssClass: 'notif-mention', label: 'Mențiune'         },
    11: { icon: IC.like,    cssClass: 'notif-like',    label: 'Like'             },
    14: { icon: IC.award,   cssClass: 'notif-award',   label: 'Premiu'           },
    15: { icon: IC.eye,     cssClass: 'notif-watch',   label: 'Topic nou'        },
    16: { icon: IC.eye,     cssClass: 'notif-watch',   label: 'Post nou'         },
  };

  function notifStyle(type) {
    return NOTIF_TYPES[type] || { icon: IC.bell, cssClass: 'notif-default', label: 'Notificare' };
  }

  var _searchTimer = null;
  var BASE = location.protocol + '//' + window.location.hostname;

  function doSearch(query, resultBoxId) {
    var box = document.getElementById(resultBoxId || 'tb-search-results');
    if (!box) return;
    if (!query || query.length < 2) { box.style.display = 'none'; return; }

    box.style.display = 'block';
    box.innerHTML = '<div class="tb-search-loading">Se caută...</div>';

    fetch(BASE + '/search?search_keywords=' + encodeURIComponent(query) + '&submit=true', {
      credentials: 'same-origin',
    })
    .then(function (r) { return r.text(); })
    .then(function (html) {
      var doc     = new DOMParser().parseFromString(html, 'text/html');
      var results = [];
      var seen    = {};

      doc.querySelectorAll('a.topictitle').forEach(function (a) {
        if (results.length >= 6) return;
        var href  = (a.getAttribute('href') || '').split('?')[0].split('#')[0];
        var label = a.textContent.trim();
        if (!href || !label || seen[href]) return;
        seen[href] = 1;
        results.push({ label: label, href: href });
      });

      if (results.length === 0) {
        box.innerHTML = '<div class="tb-search-empty">Niciun rezultat pentru <strong>' + U.escHtml(query) + '</strong></div>';
        return;
      }

      var allHref = BASE + '/search?search_keywords=' + encodeURIComponent(query) + '&submit=true';
      box.innerHTML = results.map(function (r) {
        return '<a href="' + U.escAttr(r.href) + '" class="tb-search-item">' +
          '<span class="tb-search-icon">' + IC.topics + '</span>' +
          '<span>' + U.escHtml(r.label) + '</span>' +
        '</a>';
      }).join('') +
      '<a href="' + U.escAttr(allHref) + '" class="tb-search-all">Vezi toate rezultatele →</a>';
    })
    .catch(function () {
      box.innerHTML = '<div class="tb-search-empty">Eroare la căutare</div>';
    });
  }

  var _darkMode = localStorage.getItem('ips-theme') !== 'light';

  function applyTheme(dark) {
    document.documentElement.setAttribute('data-ips-theme', dark ? 'dark' : 'light');
    localStorage.setItem('ips-theme', dark ? 'dark' : 'light');
    var btn = document.getElementById('tb-theme-btn');
    if (btn) {
      btn.innerHTML = dark ? IC.sun : IC.moon;
      btn.title     = dark ? 'Temă deschisă' : 'Temă închisă';
    }
  }

  function playNotifSound() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  }

  var Toolbar = {

    LIVE_NOTIF: 'tb-live-notif',

    compileNotif: function (data) {
      var t     = data.text || {};
      var from  = t.from   || {};
      var post  = t.post   || {};
      var forum = t.forum  || {};
      var award = t.award  || {};

      var who = from.name
        ? '<a href="/u' + from.id + '">' + U.escHtml(from.name) + '</a>'
        : 'Cineva';
      var topicTitle = post.topic_title || post.topic_name || '';
      var topicHref  = post.topic_id
        ? '/t' + post.topic_id + (post.start ? 'p' + post.start : '') + '-' + post.topic_name + '#' + post.post_id
        : '#';
      var topicLink  = topicTitle ? '<a href="' + topicHref + '">' + U.escHtml(topicTitle) + '</a>' : '';
      var forumTitle = forum.forum_title || forum.forum_name || '';
      var forumLink  = forum.forum_id
        ? '<a href="/' + forum.forum_name + '">' + U.escHtml(forumTitle) + '</a>'
        : U.escHtml(forumTitle);

      switch (t.type) {
        case 0:  return who + ' ți-a trimis un <a href="/privmsg?mode=view&p=' + t.msg_id + '">mesaj privat</a>';
        case 1:  return who + ' a raportat un mesaj';
        case 2:  return who + ' vrea să fie prieten cu tine';
        case 3:  return who + ' a cerut să intre în grupul <strong>' + U.escHtml((t.group || {}).name || '') + '</strong>';
        case 4:  return who + ' ți-a acceptat cererea de prietenie';
        case 5:  return who + ' a lăsat un mesaj pe ' + (t.self ? 'profilul tău' : 'profilul lui');
        case 6:  return 'Ai primit o avertizare de la moderatori';
        case 7:  return who + ' a postat în subiectul ' + topicLink;
        case 8:  return who + ' te-a menționat în ' + topicLink;
        case 9:  return who + ' a folosit hashtag-ul <strong>#' + U.escHtml(t.tag || '') + '</strong>';
        case 10: return 'Anunț nou în forumul tău';
        case 11: return who + ' a dat like mesajului tău în ' + topicLink;
        case 12: return who + ' a dat dislike mesajului tău în ' + topicLink;
        case 13: return who + ' a creat subiectul ' + topicLink + ' în ' + forumLink;
        case 14: return 'Ai primit premiul: ' + U.escHtml(award.award_notif || '');
        case 15: return who + ' a creat subiectul ' + topicLink + ' în ' + forumLink;
        case 16: return who + ' a postat în ' + topicLink;
        case 17: return who + ' ți-a trimis o donație';
        default: return notifStyle(t.type).label;
      }
    },

    _alignNotifications: function () {
      var list = document.getElementById('tb-notif-list');
      if (!list) return;
      if (list.querySelectorAll('.tb-notif-item').length === 0) {
        list.innerHTML =
          '<div class="tb-panel-empty">' + IC.bell_off + '<span>Nicio notificare nouă</span></div>';
      }
    },

    refresh: function (o) {
      o = o || {};
      var prevUnread = parseInt((document.getElementById('tb-badge-notif') || {}).textContent) || 0;

      if (typeof o.unread !== 'undefined') {
        Toolbar._setBadge('tb-badge-notif', o.unread);
        var clean = document.title.replace(/^\(\d+\)\s/, '');
        document.title = o.unread > 0 ? '(' + o.unread + ') ' + clean : clean;
        if (navigator.setAppBadge) navigator.setAppBadge(o.unread || 0);
        if (o.unread > prevUnread) playNotifSound();
      }

      if (o.map && o.map.length > 0) {
        var length = 0;
        for (var i in o.map) {
          if (typeof o.map[i] === 'function') continue;
          length++;
          var idx      = parseInt(i);
          var itemData = o.data && o.set ? o.data[o.set[idx]] : null;
          if (!itemData) continue;
          if (itemData.text && itemData.text.type === 0) continue;
          if (o.map[idx] === null) { Toolbar._addItem(idx + 1, itemData); }
          else if (itemData.read)  { Toolbar._readItem(idx); }
        }
        if (o.max) {
          for (var j = 0, surplus = length - o.max; j < surplus; j++) { Toolbar._delItem(j); }
        }
      } else if (o.map && o.map.length === 0) {
        Toolbar._alignNotifications();
      }

      if (o.data && o.set) Toolbar._renderPmList(o.data, o.set);
    },

    _renderPmList: function (store, order) {
      var list = document.getElementById('tb-msg-list');
      if (!list) return;

      var pms = [];
      for (var k = order.length - 1; k >= 0; k--) {
        var item = store[order[k]];
        if (item && item.text && item.text.type === 0) pms.push(item);
      }

      var unreadPms = pms.filter(function (m) { return !m.read; }).length;
      Toolbar._setBadge('tb-badge-msg', unreadPms);

      if (pms.length === 0) {
        list.innerHTML = '<div class="tb-panel-empty">' + IC.mail + '<span>Niciun mesaj nou</span></div>';
        return;
      }

      list.innerHTML = pms.map(function (item) {
        var t       = item.text || {};
        var from    = t.from   || {};
        var who     = from.name || 'Cineva';
        var href    = t.msg_id ? '/privmsg?mode=view&p=' + t.msg_id : '/privmsg?folder=inbox';
        var unread  = !item.read ? ' unread' : '';
        var timeStr = U.timeAgo(t.time || item.time || 0);
        var preview = U.escHtml(t.subject || t.topic_title || t.preview || 'Mesaj privat');

        return '<a href="' + U.escAttr(href) + '" class="tb-msg-item' + unread + '">' +
          '<div class="tb-msg-av">' + U.initials(who) + '</div>' +
          '<div class="tb-msg-body">' +
            '<div class="tb-msg-from">' + U.escHtml(who) + '</div>' +
            '<div class="tb-msg-preview">' + preview + '</div>' +
          '</div>' +
          '<div class="tb-msg-meta">' +
            '<span>' + timeStr + '</span>' +
            (unread ? '<div class="tb-msg-unread-dot"></div>' : '') +
          '</div>' +
        '</a>';
      }).join('');
    },

    _setBadge: function (id, count) {
      var el = document.getElementById(id);
      if (!el) return;
      var prev = parseInt(el.textContent) || 0;
      if (count > 0) {
        el.textContent   = count > 99 ? '99+' : count;
        el.style.display = 'flex';
        if (count > prev) {
          el.classList.remove('pulse');
          void el.offsetWidth;
          el.classList.add('pulse');
        }
      } else {
        el.style.display = 'none';
      }
    },

    _addItem: function (pos, data) {
      if (data.text && data.text.type === 0) return;
      var list = document.getElementById('tb-notif-list');
      if (!list) return;
      var empty = list.querySelector('.tb-panel-empty');
      if (empty) empty.remove();

      var t  = data.text || {};
      var ns = notifStyle(t.type);

      /* Iconiță cu culori din CSS variables */
      var iconStyle = 'background:var(--' + ns.cssClass + '-bg,var(--notif-default-bg));color:var(--' + ns.cssClass + '-col,var(--notif-default-col))';

      var el = document.createElement('a');
      el.href      = t.url || '#';
      el.className = 'tb-notif-item' + (data.read ? '' : ' unread');
      el.id        = 'tb-n' + t.id;
      el.setAttribute('data-id', t.id);
      el.innerHTML =
        '<div class="tb-notif-icon" style="' + iconStyle + '">' + ns.icon + '</div>' +
        '<div class="tb-notif-body">' +
          '<div class="tb-notif-text">' + Toolbar.compileNotif(data) + '</div>' +
          '<span class="tb-notif-time">' + U.timeAgo(t.time || data.time || 0) + '</span>' +
        '</div>' +
        '<button class="tb-notif-del" title="Șterge">' + IC.trash + '</button>';

      el.querySelector('.tb-notif-del').addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var items = list.querySelectorAll('.tb-notif-item');
        var idx   = Array.prototype.indexOf.call(items, el);
        if (window.FA && FA.Notification && typeof FA.Notification.delItem === 'function') {
          FA.Notification.delItem({ index: idx });
        }
      });

      var ref = list.querySelectorAll('.tb-notif-item')[pos - 1] || null;
      el.style.opacity = '0';
      list.insertBefore(el, ref);
      requestAnimationFrame(function () {
        el.style.transition = 'opacity .2s';
        el.style.opacity    = '1';
      });
    },

    _readItem: function (i) {
      var list = document.getElementById('tb-notif-list');
      if (!list) return;
      var items = list.querySelectorAll('.tb-notif-item');
      if (items[i]) items[i].classList.remove('unread');
    },

    _delItem: function (i) {
      var list = document.getElementById('tb-notif-list');
      if (!list) return;
      var el = list.querySelectorAll('.tb-notif-item')[i];
      if (!el) return;
      el.style.transition = 'opacity .2s';
      el.style.opacity    = '0';
      setTimeout(function () { el.remove(); Toolbar._alignNotifications(); }, 200);
    },
  };

  /* ── Patch global Toolbar object ── */
  var _patchMethods = [
    'LIVE_NOTIF', 'refresh', 'compileNotif',
    '_alignNotifications', '_setBadge',
    '_addItem', '_readItem', '_delItem', '_renderPmList',
  ];

  function _applyPatch() {
    if (window.Toolbar && window.Toolbar !== Toolbar) {
      _patchMethods.forEach(function (key) { window.Toolbar[key] = Toolbar[key]; });
    } else if (!window.Toolbar) {
      window.Toolbar = Toolbar;
    }
  }
  _applyPatch();
  window.addEventListener('load', _applyPatch);

  /* ══════════════════════════════════════════════════════════
     BUILD TOOLBAR
  ══════════════════════════════════════════════════════════ */
  function buildToolbar() {
    if (!document.body) return;

    /* Setare CSS variables pentru group color — singurele valori dinamice */
    document.documentElement.style.setProperty('--gc',       gc);
    document.documentElement.style.setProperty('--gc-light', gcL);
    document.documentElement.style.setProperty('--gc-dim',   gcDim);

    applyTheme(_darkMode);

    /* Navbar */
    var navItems = [];
    document.querySelectorAll('#submenu ul li a').forEach(function (a) {
      var label    = a.innerText.trim();
      var labelN   = U.norm(label);
      var href     = a.getAttribute('href') || '';
      if (HIDE_NAV_LABELS.indexOf(labelN) !== -1) return;
      if (HIDE_NAV_HREF_PATTERNS.some(function (p) { return href.indexOf(p) !== -1; })) return;
      navItems.push({ label: RENAME_NAV[labelN] || label, href: href });
    });

    var currentPath = window.location.pathname + window.location.search;
    var navHTML = navItems.map(function (item) {
      var active = currentPath === item.href ? ' class="active"' : '';
      return '<a href="' + U.escAttr(item.href) + '"' + active + '>' + U.escHtml(item.label) + '</a>';
    }).join('');

    function badge(id, n) {
      return '<span class="tb-badge" id="' + id + '"' + (n > 0 ? '' : ' style="display:none"') + '>' +
        (n > 99 ? '99+' : n) + '</span>';
    }

    var avContent = USER.avatar_link && !USER.avatar_link.includes('pp-blank-thumb')
      ? '<img src="' + U.escAttr(USER.avatar_link) + '" alt="">'
      : U.initials(USER.username);

    var forumAnchor = document.querySelector('#main-title a');
    var forumHref   = forumAnchor ? forumAnchor.getAttribute('href') : '/';
    var forumName   = forumAnchor ? forumAnchor.innerText.trim() : (USER.site_name || 'Forum');

    var tb = document.createElement('div');
    tb.id = 'ips-toolbar';
    tb.setAttribute('role', 'navigation');
    tb.setAttribute('aria-label', 'Bara principală');
    tb.innerHTML =
      '<a class="tb-logo" href="' + U.escAttr(forumHref) + '">' + U.escHtml(forumName) + '<span></span></a>' +
      '<div class="tb-divider"></div>' +
      '<nav class="tb-nav" aria-label="Navigare">' + navHTML + '</nav>' +
      '<div class="tb-search-wrap">' +
        '<div class="tb-search-inner">' +
          '<span class="tb-search-icon-svg">' + IC.search + '</span>' +
          '<input type="search" id="tb-search-input" placeholder="Caută..." autocomplete="new-password" aria-label="Căutare rapidă" spellcheck="false" />' +
        '</div>' +
        '<div id="tb-search-results" class="tb-search-results" style="display:none"></div>' +
      '</div>' +
      '<button class="tb-hamburger" id="tb-hamburger" aria-label="Meniu" aria-expanded="false" aria-controls="tb-mobile-menu">' +
        '<div class="tb-ham-icon"><span></span><span></span><span></span></div>' +
      '</button>' +
      '<div class="tb-right">' +
        '<button class="tb-icon-btn" id="tb-theme-btn" title="' + (_darkMode ? 'Temă deschisă' : 'Temă închisă') + '">' +
          (_darkMode ? IC.sun : IC.moon) +
        '</button>' +
        (USER.session_logged_in
          ? '<div class="tb-points">' + IC.star + '<strong>' + U.escHtml(String(USER.user_points || 0)) + '</strong><span>pts</span></div>' +
            '<button class="tb-icon-btn" id="tb-btn-notif" title="Notificări" aria-expanded="false">' +
              IC.bell + badge('tb-badge-notif', USER.notifications || 0) +
            '</button>' +
            '<button class="tb-icon-btn" id="tb-btn-msg" title="Mesaje private" aria-expanded="false">' +
              IC.mail + badge('tb-badge-msg', USER.user_nb_privmsg || 0) +
            '</button>' +
            '<div class="tb-divider"></div>' +
            '<div class="tb-user-wrap">' +
              '<div class="tb-user" id="tb-btn-user" role="button" tabindex="0" aria-expanded="false" aria-haspopup="true">' +
                '<div class="tb-user-av">' + avContent + '</div>' +
                '<span class="tb-user-name">' + U.escHtml(USER.username || '') + '</span>' +
                IC.caret +
              '</div>' +
            '</div>'
          : '<div class="tb-divider"></div>' +
            '<button class="tb-btn-login" id="tb-btn-login" aria-expanded="false">Autentificare</button>' +
            '<a class="tb-btn-register" href="' + BASE + '/register">Înregistrare</a>'
        ) +
      '</div>';

    document.body.prepend(tb);

    var cont = document.getElementById('container');
    if (cont) cont.style.paddingTop = '56px';

    /* Mobile menu */
    var mobileMenu = document.createElement('div');
    mobileMenu.id = 'tb-mobile-menu';
    mobileMenu.setAttribute('role', 'navigation');
    mobileMenu.setAttribute('aria-label', 'Meniu mobil');

    var mobileNavHTML = navItems.map(function (item) {
      var active = currentPath === item.href ? ' active' : '';
      return '<a href="' + U.escAttr(item.href) + '" class="' + active + '">' + U.escHtml(item.label) + '</a>';
    }).join('');

    var mobileUserLinks = USER.session_logged_in
      ? '<div class="tb-mobile-sep"></div>' +
        '<a href="' + BASE + '/u' + USER.user_id + '">Profilul meu</a>' +
        '<a href="' + BASE + '/privmsg?folder=inbox">Mesaje private</a>' +
        '<a href="' + BASE + '/profile?mode=editprofile&page_profil=preferences">Setări cont</a>' +
        '<a href="' + BASE + '/login?logout=1" style="color:var(--ips-danger-item)">Deconectare</a>'
      : '<div class="tb-mobile-sep"></div>' +
        '<a href="' + BASE + '/register">Înregistrare</a>';

    mobileMenu.innerHTML =
      '<div class="tb-mobile-search">' +
        '<div class="tb-search-inner">' +
          '<span class="tb-search-icon-svg">' + IC.search + '</span>' +
          '<input type="search" id="tb-search-input-mob" placeholder="Caută..." autocomplete="new-password" spellcheck="false" />' +
        '</div>' +
        '<div id="tb-search-results-mob" class="tb-search-results" style="display:none"></div>' +
      '</div>' +
      '<div class="tb-mobile-sep"></div>' +
      '<nav class="tb-mobile-nav">' + mobileNavHTML + mobileUserLinks + '</nav>';

    document.body.appendChild(mobileMenu);

    /* Hamburger */
    var hamBtn = document.getElementById('tb-hamburger');
    if (hamBtn) {
      hamBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = mobileMenu.classList.contains('open');
        if (isOpen) {
          mobileMenu.classList.remove('open');
          hamBtn.classList.remove('open');
          hamBtn.setAttribute('aria-expanded', 'false');
        } else {
          closeAll();
          mobileMenu.classList.add('open');
          hamBtn.classList.add('open');
          hamBtn.setAttribute('aria-expanded', 'true');
        }
      });
    }

    document.addEventListener('click', function (e) {
      if (!mobileMenu.contains(e.target) && e.target !== hamBtn && !hamBtn.contains(e.target)) {
        mobileMenu.classList.remove('open');
        if (hamBtn) { hamBtn.classList.remove('open'); hamBtn.setAttribute('aria-expanded','false'); }
      }
    });

    /* Mobile search */
    var searchMob    = document.getElementById('tb-search-input-mob');
    var searchBoxMob = document.getElementById('tb-search-results-mob');
    if (searchMob && searchBoxMob) {
      var _searchTimerMob = null;
      searchMob.addEventListener('input', function () {
        var q = searchMob.value.trim();
        clearTimeout(_searchTimerMob);
        if (q.length < 2) { searchBoxMob.style.display = 'none'; return; }
        _searchTimerMob = setTimeout(function () { doSearch(q, 'tb-search-results-mob'); }, 400);
      });
      searchMob.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { searchBoxMob.style.display = 'none'; searchMob.value = ''; }
        if (e.key === 'Enter') {
          e.preventDefault();
          window.location.href = BASE + '/search?search_keywords=' + encodeURIComponent(searchMob.value.trim()) + '&submit=true';
        }
      });
    }

    /* Login dropdown */
    if (!USER.session_logged_in) {
      var ddLogin = document.createElement('div');
      ddLogin.id        = 'tb-dd-login';
      ddLogin.className = 'tb-dropdown tb-login-panel';
      ddLogin.setAttribute('role', 'dialog');
      ddLogin.setAttribute('aria-label', 'Autentificare');
      ddLogin.innerHTML =
        '<div class="tb-panel-head"><h3>Autentificare</h3></div>' +
        '<form class="tb-login-form" method="post" action="' + BASE + '/login">' +
          '<div class="tb-login-field"><label for="tb-login-user">Utilizator</label>' +
            '<input type="text" id="tb-login-user" name="username" placeholder="Numele tău" autocomplete="username" required /></div>' +
          '<div class="tb-login-field"><label for="tb-login-pass">Parolă</label>' +
            '<input type="password" id="tb-login-pass" name="password" placeholder="••••••••" autocomplete="current-password" required /></div>' +
          '<div class="tb-login-options">' +
            '<label class="tb-login-check"><input type="checkbox" name="autologin" value="1" /> Ține-mă autentificat</label>' +
            '<a href="' + BASE + '/profile?mode=sendpassword" class="tb-login-forgot">Ai uitat parola?</a>' +
          '</div>' +
          '<input type="hidden" name="redirect" value="' + U.escAttr(window.location.href) + '" />' +
          '<input type="hidden" name="login" value="Autentificare" />' +
          '<button type="submit" class="tb-login-submit">Autentificare</button>' +
          '<p class="tb-login-register">Nu ai cont? <a href="' + BASE + '/register">Înregistrează-te</a></p>' +
        '</form>';
      document.body.appendChild(ddLogin);
    }

    /* Notif dropdown */
    var ddNotif = document.createElement('div');
    ddNotif.id        = 'tb-dd-notif';
    ddNotif.className = 'tb-dropdown tb-panel';
    ddNotif.setAttribute('role', 'region');
    ddNotif.setAttribute('aria-label', 'Notificări');
    ddNotif.innerHTML =
      '<div class="tb-panel-head"><h3>Notificări</h3><a href="#" id="tb-notif-mark-read">Marchează citite</a></div>' +
      '<div class="tb-panel-list" id="tb-notif-list">' +
        '<div class="tb-panel-empty">' + IC.bell_off + '<span>Se încarcă...</span></div>' +
      '</div>' +
      '<div class="tb-panel-footer"><a href="/forum/index.php?app=core&module=global&section=notifications">Vezi toate notificările</a></div>';
    document.body.appendChild(ddNotif);

    /* Msg dropdown */
    var ddMsg = document.createElement('div');
    ddMsg.id        = 'tb-dd-msg';
    ddMsg.className = 'tb-dropdown tb-panel';
    ddMsg.setAttribute('role', 'region');
    ddMsg.setAttribute('aria-label', 'Mesaje private');
    ddMsg.innerHTML =
      '<div class="tb-panel-head"><h3>Mesaje private</h3><a href="/privmsg?mode=compose">Mesaj nou</a></div>' +
      '<div class="tb-panel-list" id="tb-msg-list">' +
        '<div class="tb-panel-empty">' + IC.mail + '<span>Se încarcă...</span></div>' +
      '</div>' +
      '<div class="tb-panel-footer"><a href="/privmsg?folder=inbox">Vezi toate mesajele</a></div>';
    document.body.appendChild(ddMsg);

    /* User dropdown */
    if (USER.session_logged_in) {
      var isAdmin  = String(USER.user_level) === '1';
      var privmsgBadge = USER.user_nb_privmsg > 0
        ? ' <span style="margin-left:6px;font-size:10px;background:var(--gc);color:#fff;padding:1px 6px;border-radius:10px">' + USER.user_nb_privmsg + '</span>'
        : '';

      var ddUser = document.createElement('div');
      ddUser.id        = 'tb-user-dropdown';
      ddUser.className = 'tb-dropdown';
      ddUser.setAttribute('role', 'menu');
      ddUser.innerHTML =
        '<div class="tb-dd-header">' +
          '<div class="name">' + U.escHtml(USER.username || '') + '</div>' +
          '<div class="meta">' + U.escHtml(String(USER.user_posts || 0)) + ' mesaje · ' + U.escHtml(String(USER.user_points || 0)) + ' puncte</div>' +
        '</div>' +
        '<a href="' + BASE + '/u' + USER.user_id + '" class="tb-dd-item" role="menuitem">' + IC.user + '<span>Profilul meu</span></a>' +
        '<a href="' + BASE + '/privmsg?folder=inbox" class="tb-dd-item" role="menuitem">' + IC.mail + '<span>Mesaje private' + privmsgBadge + '</span></a>' +
        '<a href="' + BASE + '/sta/u' + USER.user_id + '" class="tb-dd-item" role="menuitem">' + IC.topics + '<span>Topicurile mele</span></a>' +
        '<a href="' + BASE + '/u' + USER.user_id + '?view=reputation" class="tb-dd-item" role="menuitem">' + IC.rep + '<span>Reputația mea</span></a>' +
        (isAdmin ? '<a href="' + BASE + '/admin" class="tb-dd-item" role="menuitem">' + IC.shield + '<span>Panou administrare</span></a>' : '') +
        '<a href="' + BASE + '/profile?mode=editprofile&page_profil=preferences" class="tb-dd-item" role="menuitem">' + IC.settings + '<span>Setări cont</span></a>' +
        '<div class="tb-dd-sep"></div>' +
        '<a href="' + BASE + '/login?logout=1" class="tb-dd-item danger" role="menuitem">' + IC.logout + '<span>Deconectare</span></a>';
      document.body.appendChild(ddUser);
    }

    /* Live notif container */
    var liveNotif = document.createElement('div');
    liveNotif.id = Toolbar.LIVE_NOTIF;
    document.body.appendChild(liveNotif);

    /* ── Logica dropdown-urilor ── */
    var panels = USER.session_logged_in
      ? { 'tb-btn-notif': 'tb-dd-notif', 'tb-btn-msg': 'tb-dd-msg', 'tb-btn-user': 'tb-user-dropdown' }
      : { 'tb-btn-login': 'tb-dd-login' };

    function positionDropdown(btnEl, ddEl) {
      var triggerEl = btnEl.id === 'tb-btn-user' ? (btnEl.closest('.tb-user') || btnEl) : btnEl;
      var rect  = triggerEl.getBoundingClientRect();
      var ddW   = ddEl.offsetWidth || 220;
      var scrollX = window.scrollX || window.pageXOffset || 0;
      var left = rect.right - ddW + scrollX;
      var maxLeft = window.innerWidth - ddW - 8 + scrollX;
      var minLeft = 8 + scrollX;
      if (left > maxLeft) left = maxLeft;
      if (left < minLeft) left = minLeft;
      ddEl.style.left = Math.round(left) + 'px';
    }

    function closeAll(except) {
      Object.keys(panels).forEach(function (btnId) {
        if (panels[btnId] === except) return;
        var dd  = document.getElementById(panels[btnId]);
        var btn = document.getElementById(btnId);
        if (dd)  dd.classList.remove('open');
        if (btn) { btn.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
        if (btnId === 'tb-btn-user') {
          var uw = btn && btn.closest('.tb-user');
          if (uw) uw.classList.remove('open');
        }
      });
    }

    function togglePanel(btnId) {
      var dd     = document.getElementById(panels[btnId]);
      var btn    = document.getElementById(btnId);
      if (!dd || !btn) return;
      var isOpen = dd.classList.contains('open');
      closeAll();
      if (!isOpen) {
        positionDropdown(btn, dd);
        dd.classList.add('open');
        btn.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        if (btnId === 'tb-btn-user') {
          var uw = btn.closest('.tb-user');
          if (uw) uw.classList.add('open');
        }
        if (btnId === 'tb-btn-notif' && window.FA && FA.Notification && typeof FA.Notification.markAsRead === 'function') {
          FA.Notification.markAsRead();
        }
      }
    }

    Object.keys(panels).forEach(function (btnId) {
      var btn = document.getElementById(btnId);
      if (!btn) return;
      var trigger = btnId === 'tb-btn-user' ? (btn.closest('.tb-user') || btn) : btn;
      trigger.addEventListener('click', function (e) { e.stopPropagation(); togglePanel(btnId); });
      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePanel(btnId); }
        if (e.key === 'Escape') closeAll();
      });
    });

    document.addEventListener('click', function (e) {
      var inside = Object.values(panels).some(function (id) {
        var el = document.getElementById(id);
        return el && el.contains(e.target);
      });
      if (!inside) closeAll();
    });

    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });

    window.addEventListener('resize', function () {
      Object.keys(panels).forEach(function (btnId) {
        var dd = document.getElementById(panels[btnId]);
        if (dd && dd.classList.contains('open')) positionDropdown(document.getElementById(btnId), dd);
      });
    });

    window.addEventListener('scroll', function () {
      Object.keys(panels).forEach(function (btnId) {
        var dd = document.getElementById(panels[btnId]);
        if (dd && dd.classList.contains('open')) positionDropdown(document.getElementById(btnId), dd);
      });
    }, { passive: true });

    /* Mark as read */
    var markReadBtn = document.getElementById('tb-notif-mark-read');
    if (markReadBtn) {
      markReadBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (window.FA && FA.Notification && typeof FA.Notification.markAsRead === 'function') {
          FA.Notification.markAsRead();
        }
        Toolbar._setBadge('tb-badge-notif', 0);
        document.querySelectorAll('#tb-notif-list .tb-notif-item.unread')
          .forEach(function (el) { el.classList.remove('unread'); });
      });
    }

    /* Tema */
    var themeBtn = document.getElementById('tb-theme-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        _darkMode = !_darkMode;
        applyTheme(_darkMode);
      });
    }

    /* Search desktop */
    var searchInput = document.getElementById('tb-search-input');
    var searchBox   = document.getElementById('tb-search-results');
    if (searchInput && searchBox) {
      searchInput.addEventListener('input', function () {
        var q = searchInput.value.trim();
        clearTimeout(_searchTimer);
        if (q.length < 2) { searchBox.style.display = 'none'; return; }
        _searchTimer = setTimeout(function () { doSearch(q); }, 400);
      });
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { searchBox.style.display = 'none'; searchInput.value = ''; }
        if (e.key === 'Enter') {
          e.preventDefault();
          window.location.href = BASE + '/search?search_keywords=' + encodeURIComponent(searchInput.value.trim()) + '&submit=true';
        }
      });
      document.addEventListener('click', function (e) {
        if (!searchInput.contains(e.target) && !searchBox.contains(e.target)) {
          searchBox.style.display = 'none';
        }
      });
    }

    /* Notificări FA */
    if (USER.activate_toolbar && USER.session_logged_in && USER.notifications) {
      var _startNotif = function () {
        if (!window.FA || !FA.Notification) return;
        if (typeof FA.Notification.register !== 'function') return;
        if (typeof FA.Notification.registered === 'function' && FA.Notification.registered()) return;
        FA.Notification.register();
      };
      if (window.FA && FA.Window && FA.Window.loaded) {
        _startNotif();
      } else {
        window.addEventListener('load', function () { setTimeout(_startNotif, 100); });
      }
    }
  }

  /* Ascunde toolbar-ul nativ Forumotion */
  window.addEventListener('load', function () {
    var fa       = document.getElementById('fa_toolbar');
    var faHidden = document.getElementById('fa_toolbar_hidden');
    if (fa)       fa.style.display = 'none';
    if (faHidden) faHidden.style.display = 'none';
    if (document.body) document.body.style.marginTop = '52px';
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildToolbar);
  } else {
    buildToolbar();
  }

})();
