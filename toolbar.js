(function () {
  'use strict';

  var U  = window.IpsUtils;
  var CU = window.ColorUtils;
  var USER = (typeof _userdata !== 'undefined' ? _userdata : {}) || {};
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

  /* ── Culori grup ── */
  var gc    = '#' + (USER.groupcolor || '1B6AA7');
  var gcL   = CU ? CU.lighten(USER.groupcolor ? '#' + USER.groupcolor : '#1B6AA7', 55) : '#7ec8ff';
  var gcDim = CU ? CU.alphaBg(USER.groupcolor ? '#' + USER.groupcolor : '#1B6AA7', .18) : 'rgba(27,106,167,.18)';

  /* ── Tipuri notificări ── */
  var NOTIF_TYPES = {
    0:  { icon: IC.mail,    cssClass: 'notif-pm',      label: 'Mesaj privat'    },
    2:  { icon: IC.friend,  cssClass: 'notif-friend',  label: 'Cerere prieten'  },
    4:  { icon: IC.friend,  cssClass: 'notif-friend',  label: 'Prieten nou'     },
    5:  { icon: IC.user,    cssClass: 'notif-pm',      label: 'Mesaj pe profil' },
    7:  { icon: IC.eye,     cssClass: 'notif-watch',   label: 'Subiect urmărit' },
    8:  { icon: IC.mention, cssClass: 'notif-mention', label: 'Mențiune'        },
    11: { icon: IC.like,    cssClass: 'notif-like',    label: 'Like'            },
    14: { icon: IC.award,   cssClass: 'notif-award',   label: 'Premiu'          },
    15: { icon: IC.eye,     cssClass: 'notif-watch',   label: 'Topic nou'       },
    16: { icon: IC.eye,     cssClass: 'notif-watch',   label: 'Post nou'        },
  };

  function notifStyle(type) {
    return NOTIF_TYPES[type] || { icon: IC.bell, cssClass: 'notif-default', label: 'Notificare' };
  }

  /* ─────────────────────────────────────────────
   *  NOTIFICĂRI — helpers DOM (fără innerHTML)
   * ───────────────────────────────────────────── */

  /** Creează un <a> cu href și text, fără risc de XSS. */
  function createLink(href, text) {
    var a = document.createElement('a');
    a.href        = href;
    a.textContent = text;
    return a;
  }

  function compileNotifData(data) {
    var t     = data.text || {};
    var from  = t.from   || {};
    var post  = t.post   || {};
    var forum = t.forum  || {};
    var award = t.award  || {};

    return {
      type:  t.type,
      user:  from.name ? { id: from.id, name: from.name } : null,
      topic: post.topic_id ? {
        id:     post.topic_id,
        title:  post.topic_title || post.topic_name || '',
        slug:   post.topic_name  || '',
        postId: post.post_id,
        start:  post.start,
      } : null,
      forum: forum.forum_id ? {
        id:    forum.forum_id,
        name:  forum.forum_name,
        title: forum.forum_title || forum.forum_name,
      } : null,
      award: award.award_notif || '',
      msgId: t.msg_id,
      url:   t.url || '#',
      group: t.group || {},
      tag:   t.tag   || '',
      self:  t.self  || false,
    };
  }

  function buildNotifContent(data) {
    var d    = compileNotifData(data);
    var frag = document.createDocumentFragment();

    function txt(s) { frag.appendChild(document.createTextNode(s)); }

    function appendUser() {
      if (d.user) { frag.appendChild(createLink('/u' + d.user.id, d.user.name)); }
      else { txt('Cineva'); }
    }

    function appendTopic() {
      if (!d.topic) return;
      var href = '/t' + d.topic.id +
        (d.topic.start ? 'p' + d.topic.start : '') +
        '-' + (d.topic.slug || '') + '#' + d.topic.postId;
      frag.appendChild(createLink(href, d.topic.title));
    }

    function appendForum() {
      if (!d.forum) return;
      frag.appendChild(createLink('/' + encodeURIComponent(d.forum.name), d.forum.title));
    }

    function strong(text) {
      var s = document.createElement('strong');
      s.textContent = text;
      frag.appendChild(s);
    }

    switch (d.type) {
      case 0:  appendUser(); txt(' ți-a trimis un '); frag.appendChild(createLink('/privmsg?mode=view&p=' + d.msgId, 'mesaj privat')); break;
      case 1:  appendUser(); txt(' a raportat un mesaj'); break;
      case 2:  appendUser(); txt(' vrea să fie prieten cu tine'); break;
      case 3:  appendUser(); txt(' a cerut să intre în grupul '); strong(d.group.name || ''); break;
      case 4:  appendUser(); txt(' ți-a acceptat cererea de prietenie'); break;
      case 5:  appendUser(); txt(' a lăsat un mesaj pe ' + (d.self ? 'profilul tău' : 'profilul lui')); break;
      case 6:  txt('Ai primit o avertizare de la moderatori'); break;
      case 7:  appendUser(); txt(' a postat în subiectul '); appendTopic(); break;
      case 8:  appendUser(); txt(' te-a menționat în '); appendTopic(); break;
      case 9:  appendUser(); txt(' a folosit hashtag-ul '); strong('#' + d.tag); break;
      case 10: txt('Anunț nou în forumul tău'); break;
      case 11: appendUser(); txt(' a dat like mesajului tău în '); appendTopic(); break;
      case 12: appendUser(); txt(' a dat dislike mesajului tău în '); appendTopic(); break;
      case 13: appendUser(); txt(' a creat subiectul '); appendTopic(); txt(' în '); appendForum(); break;
      case 14: txt('Ai primit premiul: '); strong(d.award); break;
      case 15: appendUser(); txt(' a creat subiectul '); appendTopic(); txt(' în '); appendForum(); break;
      case 16: appendUser(); txt(' a postat în '); appendTopic(); break;
      case 17: appendUser(); txt(' ți-a trimis o donație'); break;
      default: txt(notifStyle(d.type).label);
    }

    return frag;
  }

  /* ─────────────────────────────────────────────
   *  Search
   * ───────────────────────────────────────────── */
  var _searchTimer = null;
  var BASE = location.protocol + '//' + window.location.hostname;

  function doSearch(query, resultBoxId) {
    var box = document.getElementById(resultBoxId || 'tb-search-results');
    if (!box) return;
    if (!query || query.length < 2) { box.style.display = 'none'; return; }

    box.style.display = 'block';
    box.textContent   = '';
    var loading = document.createElement('div');
    loading.className   = 'tb-search-loading';
    loading.textContent = 'Se caută...';
    box.appendChild(loading);

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

      box.textContent = '';

      if (results.length === 0) {
        var empty = document.createElement('div');
        empty.className = 'tb-search-empty';
        empty.textContent = 'Niciun rezultat pentru ';
        var em = document.createElement('strong');
        em.textContent = query;
        empty.appendChild(em);
        box.appendChild(empty);
        return;
      }

      var frag = document.createDocumentFragment();
      results.forEach(function (r) {
        var a = document.createElement('a');
        a.href      = r.href;
        a.className = 'tb-search-item';

        var iconWrap = document.createElement('span');
        iconWrap.className = 'tb-search-icon';
        iconWrap.innerHTML = IC.topics; // SVG constant — safe

        var labelSpan = document.createElement('span');
        labelSpan.textContent = r.label;

        a.appendChild(iconWrap);
        a.appendChild(labelSpan);
        frag.appendChild(a);
      });

      var seeAll = document.createElement('a');
      seeAll.href        = BASE + '/search?search_keywords=' + encodeURIComponent(query) + '&submit=true';
      seeAll.className   = 'tb-search-all';
      seeAll.textContent = 'Vezi toate rezultatele →';
      frag.appendChild(seeAll);

      box.appendChild(frag);
    })
    .catch(function () {
      box.textContent = '';
      var err = document.createElement('div');
      err.className   = 'tb-search-empty';
      err.textContent = 'Eroare la căutare';
      box.appendChild(err);
    });
  }

  /* ─────────────────────────────────────────────
   *  Temă
   * ───────────────────────────────────────────── */
  var _darkMode = localStorage.getItem('ips-theme') !== 'light';

  function applyTheme(dark) {
    document.documentElement.setAttribute('data-ips-theme', dark ? 'dark' : 'light');
    localStorage.setItem('ips-theme', dark ? 'dark' : 'light');
    var btn = document.getElementById('tb-theme-btn');
    if (btn) {
      btn.innerHTML = dark ? IC.sun : IC.moon; // SVG constants — safe
      btn.title     = dark ? 'Temă deschisă' : 'Temă închisă';
    }
  }

  /* ─────────────────────────────────────────────
   *  Sunet notificare
   * ───────────────────────────────────────────── */
  function playNotifSound() {
    try {
      var ctx  = new (window.AudioContext || window.webkitAudioContext)();
      var osc  = ctx.createOscillator();
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
    LIVE_NOTIF:    'tb-live-notif',
    NOTIF_LIST:    'tb-notif-list',
    NOTIF_UNREAD:  'tb-badge-msg',

    compileNotif: function (data) {
      var tmp = document.createElement('div');
      tmp.appendChild(buildNotifContent(data));
      return tmp.innerHTML;
    },

    _alignNotifications: function () {
      var list = document.getElementById('tb-notif-list');
      if (!list) return;
      if (list.querySelectorAll('.tb-notif-item').length === 0) {
        list.textContent = '';
        var wrap = document.createElement('div');
        wrap.className = 'tb-panel-empty';
        wrap.innerHTML = IC.bell_off; // SVG constant — safe
        var span = document.createElement('span');
        span.textContent = 'Nicio notificare nouă';
        wrap.appendChild(span);
        list.appendChild(wrap);
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

      list.textContent = '';

      if (pms.length === 0) {
        var emptyWrap = document.createElement('div');
        emptyWrap.className = 'tb-panel-empty';
        emptyWrap.innerHTML = IC.mail; // SVG constant — safe
        var emptySpan = document.createElement('span');
        emptySpan.textContent = 'Niciun mesaj nou';
        emptyWrap.appendChild(emptySpan);
        list.appendChild(emptyWrap);
        return;
      }

      var frag = document.createDocumentFragment();
      pms.forEach(function (item) {
        var t      = item.text || {};
        var from   = t.from   || {};
        var who    = from.name || 'Cineva';
        var href   = t.msg_id ? '/privmsg?mode=view&p=' + t.msg_id : '/privmsg?folder=inbox';
        var unread = !item.read;

        var a = document.createElement('a');
        a.href      = href;
        a.className = 'tb-msg-item' + (unread ? ' unread' : '');

        var av = document.createElement('div');
        av.className   = 'tb-msg-av';
        av.textContent = U.initials(who);

        var body = document.createElement('div');
        body.className = 'tb-msg-body';

        var fromEl = document.createElement('div');
        fromEl.className   = 'tb-msg-from';
        fromEl.textContent = who;

        var preview = document.createElement('div');
        preview.className   = 'tb-msg-preview';
        preview.textContent = t.subject || t.topic_title || t.preview || 'Mesaj privat';

        body.appendChild(fromEl);
        body.appendChild(preview);

        var meta = document.createElement('div');
        meta.className = 'tb-msg-meta';

        var timeSpan = document.createElement('span');
        timeSpan.textContent = U.timeAgo(t.time || item.time || 0);
        meta.appendChild(timeSpan);

        if (unread) {
          var dot = document.createElement('div');
          dot.className = 'tb-msg-unread-dot';
          meta.appendChild(dot);
        }

        a.appendChild(av);
        a.appendChild(body);
        a.appendChild(meta);
        frag.appendChild(a);
      });

      list.appendChild(frag);
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

    /**
     * Adaugă un item de notificare în listă.
     * Construit complet cu createElement — fără innerHTML pentru date utilizator.
     */
    _addItem: function (pos, data) {
      if (data.text && data.text.type === 0) return;

      var list = document.getElementById('tb-notif-list');
      if (!list) return;

      var empty = list.querySelector('.tb-panel-empty');
      if (empty) empty.remove();

      var t  = data.text || {};
      var ns = notifStyle(t.type);

      /* Container: <div role="button"> în loc de <a> pentru a evita <a> în <a> */
      var el = document.createElement('div');
      el.className = 'tb-notif-item' + (data.read ? '' : ' unread');
      el.dataset.id = t.id;
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');

      el.addEventListener('click', function () { window.location.href = t.url || '#'; });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.location.href = t.url || '#'; }
      });

      /* Icon */
      var icon = document.createElement('div');
      icon.className        = 'tb-notif-icon';
      icon.style.background = 'var(--' + ns.cssClass + '-bg,var(--notif-default-bg))';
      icon.style.color      = 'var(--' + ns.cssClass + '-col,var(--notif-default-col))';
      icon.innerHTML        = ns.icon; // SVG constant — safe

      /* Body */
      var body = document.createElement('div');
      body.className = 'tb-notif-body';

      var textEl = document.createElement('div');
      textEl.className = 'tb-notif-text';
      textEl.appendChild(buildNotifContent(data)); // ✅ fără innerHTML

      var timeEl = document.createElement('span');
      timeEl.className   = 'tb-notif-time';
      timeEl.textContent = U.timeAgo(t.time || data.time || 0) || String(t.time || data.time || '');

      body.appendChild(textEl);
      body.appendChild(timeEl);

      /* Buton ștergere */
      var btn = document.createElement('button');
      btn.className = 'tb-notif-del';
      btn.title     = 'Șterge';
      btn.innerHTML = IC.trash; // SVG constant — safe

      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var items = list.querySelectorAll('.tb-notif-item');
        var idx   = Array.prototype.indexOf.call(items, el);
        if (window.FA && FA.Notification && typeof FA.Notification.delItem === 'function') {
          FA.Notification.delItem({ index: idx });
        }
      });

      el.appendChild(icon);
      el.appendChild(body);
      el.appendChild(btn);

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

  /* ── Patch pe window.Toolbar existent ── */
  var _patchMethods = [
    'LIVE_NOTIF', 'NOTIFICATIONS', 'NOTIF_LIST', 'NOTIF_UNREAD', 'refresh', 'compileNotif',
    '_alignNotifications', '_setBadge', '_addItem', '_readItem', '_delItem', '_renderPmList',
  ];

  function _applyPatch() {
    if (window.Toolbar && window.Toolbar !== Toolbar) {
      _patchMethods.forEach(function (key) { window.Toolbar[key] = Toolbar[key]; });
      console.log('%c Toolbar IPS has been patched successfully', 'color: orange; font-size: 10px; font-family: monospace;');
    } else if (!window.Toolbar) {
      window.Toolbar = Toolbar;
    }
  }
  _applyPatch();
  window.addEventListener('load', _applyPatch);

  function buildToolbar() {
    if (!document.body) return;
    console.log('%c IPS Toolbar has been registered.', 'color: skyblue; font-size: 10px; font-family: monospace;');

    document.documentElement.style.setProperty('--gc',       gc);
    document.documentElement.style.setProperty('--gc-light', gcL);
    document.documentElement.style.setProperty('--gc-dim',   gcDim);
    applyTheme(_darkMode);

    /* Navbar items */
    var navItems = [];
    document.querySelectorAll('#submenu ul li a').forEach(function (a) {
      var label  = a.innerText.trim();
      var labelN = U.norm(label);
      var href   = a.getAttribute('href') || '';
      if (HIDE_NAV_LABELS.indexOf(labelN) !== -1) return;
      if (HIDE_NAV_HREF_PATTERNS.some(function (p) { return href.indexOf(p) !== -1; })) return;
      navItems.push({ label: RENAME_NAV[labelN] || label, href: href });
    });

    var currentPath = window.location.pathname + window.location.search;

    function buildNavLinks(items) {
      var frag = document.createDocumentFragment();
      items.forEach(function (item) {
        var a = document.createElement('a');
        a.href        = item.href;
        a.textContent = item.label;
        if (currentPath === item.href) a.className = 'active';
        frag.appendChild(a);
      });
      return frag;
    }

    function makeBadge(id, n) {
      var span = document.createElement('span');
      span.className = 'tb-badge';
      span.id        = id;
      if (n > 0) { span.textContent = n > 99 ? '99+' : String(n); }
      else        { span.style.display = 'none'; }
      return span;
    }

    var avContent = USER.avatar_link && !USER.avatar_link.includes('pp-blank-thumb')
      ? '<img src="' + U.escAttr(USER.avatar_link) + '" alt="">'
      : U.initials(USER.username);

    var forumAnchor = document.querySelector('#main-title a');
    var forumHref   = forumAnchor ? forumAnchor.getAttribute('href') : '/';
    var forumName   = forumAnchor ? forumAnchor.innerText.trim() : (USER.site_name || 'Forum');

    /* ── Toolbar element ── */
    var tb = document.createElement('div');
    tb.id = 'ips-toolbar';
    tb.setAttribute('role', 'navigation');
    tb.setAttribute('aria-label', 'Bara principală');

    var logoA = document.createElement('a');
    logoA.className   = 'tb-logo';
    logoA.href        = forumHref;
    logoA.textContent = forumName;
    logoA.appendChild(document.createElement('span'));
    tb.appendChild(logoA);

    tb.appendChild(Object.assign(document.createElement('div'), { className: 'tb-divider' }));

    var nav = document.createElement('nav');
    nav.className = 'tb-nav';
    nav.setAttribute('aria-label', 'Navigare');
    nav.appendChild(buildNavLinks(navItems));
    tb.appendChild(nav);

    /* Search — vizibil pe desktop, ascuns pe mobil via CSS (.tb-search-wrap) */
    var searchWrap  = document.createElement('div');
    searchWrap.className = 'tb-search-wrap';
    var searchInner = document.createElement('div');
    searchInner.className = 'tb-search-inner';
    var searchIconSvg = document.createElement('span');
    searchIconSvg.className = 'tb-search-icon-svg';
    searchIconSvg.innerHTML = IC.search; // SVG constant — safe
    var searchInput = document.createElement('input');
    searchInput.type         = 'search';
    searchInput.id           = 'tb-search-input';
    searchInput.placeholder  = 'Caută...';
    searchInput.autocomplete = 'new-password';
    searchInput.setAttribute('aria-label', 'Căutare rapidă');
    searchInput.spellcheck   = false;
    var searchBox = document.createElement('div');
    searchBox.id            = 'tb-search-results';
    searchBox.className     = 'tb-search-results';
    searchBox.style.display = 'none';
    searchInner.appendChild(searchIconSvg);
    searchInner.appendChild(searchInput);
    searchWrap.appendChild(searchInner);
    searchWrap.appendChild(searchBox);
    tb.appendChild(searchWrap);

    /* Hamburger */
    var hamBtn = document.createElement('button');
    hamBtn.className = 'tb-hamburger';
    hamBtn.id        = 'tb-hamburger';
    hamBtn.setAttribute('aria-label', 'Meniu');
    hamBtn.setAttribute('aria-expanded', 'false');
    hamBtn.setAttribute('aria-controls', 'tb-mobile-menu');
    var hamIcon = document.createElement('div');
    hamIcon.className = 'tb-ham-icon';
    for (var h = 0; h < 3; h++) hamIcon.appendChild(document.createElement('span'));
    hamBtn.appendChild(hamIcon);
    tb.appendChild(hamBtn);

    /* Right */
    var right = document.createElement('div');
    right.className = 'tb-right';

    var themeBtn = document.createElement('button');
    themeBtn.className = 'tb-icon-btn';
    themeBtn.id        = 'tb-theme-btn';
    themeBtn.title     = _darkMode ? 'Temă deschisă' : 'Temă închisă';
    themeBtn.innerHTML = _darkMode ? IC.sun : IC.moon; // SVG constants — safe
    right.appendChild(themeBtn);

    if (USER.session_logged_in) {
      var pointsEl = document.createElement('div');
      pointsEl.className = 'tb-points';
      pointsEl.innerHTML = IC.star; // SVG constant — safe
      var pointsStrong = document.createElement('strong');
      pointsStrong.textContent = String(USER.user_points || 0);
      var pointsSpan = document.createElement('span');
      pointsSpan.textContent = 'pts';
      pointsEl.appendChild(pointsStrong);
      pointsEl.appendChild(pointsSpan);
      right.appendChild(pointsEl);

      var notifBtn = document.createElement('button');
      notifBtn.className = 'tb-icon-btn';
      notifBtn.id        = 'tb-btn-notif';
      notifBtn.title     = 'Notificări';
      notifBtn.setAttribute('aria-expanded', 'false');
      notifBtn.innerHTML = IC.bell; // SVG constant — safe
      notifBtn.appendChild(makeBadge('tb-badge-notif', 0));
      right.appendChild(notifBtn);

      var msgBtn = document.createElement('button');
      msgBtn.className = 'tb-icon-btn';
      msgBtn.id        = 'tb-btn-msg';
      msgBtn.title     = 'Mesaje private';
      msgBtn.setAttribute('aria-expanded', 'false');
      msgBtn.innerHTML = IC.mail; // SVG constant — safe
      // USER.user_nb_privmsg nu e un count de unread — badge-ul e populat de _renderPmList()
      msgBtn.appendChild(makeBadge('tb-badge-msg', 0));
      right.appendChild(msgBtn);

      right.appendChild(Object.assign(document.createElement('div'), { className: 'tb-divider' }));

      var userWrap = document.createElement('div');
      userWrap.className = 'tb-user-wrap';
      var userEl = document.createElement('div');
      userEl.className = 'tb-user';
      userEl.id        = 'tb-btn-user';
      userEl.setAttribute('role', 'button');
      userEl.setAttribute('tabindex', '0');
      userEl.setAttribute('aria-expanded', 'false');
      userEl.setAttribute('aria-haspopup', 'true');
      var userAv = document.createElement('div');
      userAv.className = 'tb-user-av';
      userAv.innerHTML = avContent; // controlled: either img tag or text initials
      var userNameSpan = document.createElement('span');
      userNameSpan.className   = 'tb-user-name';
      userNameSpan.textContent = USER.username || '';
      userEl.appendChild(userAv);
      userEl.appendChild(userNameSpan);
      userEl.innerHTML += IC.caret; // SVG constant appended last — safe
      userWrap.appendChild(userEl);
      right.appendChild(userWrap);
    } else {
      right.appendChild(Object.assign(document.createElement('div'), { className: 'tb-divider' }));
      var loginBtn = document.createElement('button');
      loginBtn.className   = 'tb-btn-login';
      loginBtn.id          = 'tb-btn-login';
      loginBtn.setAttribute('aria-expanded', 'false');
      loginBtn.textContent = 'Autentificare';
      right.appendChild(loginBtn);
      var regA = document.createElement('a');
      regA.className   = 'tb-btn-register';
      regA.href        = BASE + '/register';
      regA.textContent = 'Înregistrare';
      right.appendChild(regA);
    }

    tb.appendChild(right);
    document.body.prepend(tb);

    var cont = document.getElementById('container');
    if (cont) cont.style.paddingTop = '56px';

    /* ── Mobile menu ── */
    var mobileMenu = document.createElement('div');
    mobileMenu.id = 'tb-mobile-menu';
    mobileMenu.setAttribute('role', 'navigation');
    mobileMenu.setAttribute('aria-label', 'Meniu mobil');

    var mobSearchWrap  = document.createElement('div');
    mobSearchWrap.className = 'tb-mobile-search';
    var mobSearchInner = document.createElement('div');
    mobSearchInner.className = 'tb-search-inner';
    var mobSearchIcon = document.createElement('span');
    mobSearchIcon.className = 'tb-search-icon-svg';
    mobSearchIcon.innerHTML = IC.search; // SVG constant — safe
    var mobSearchInput = document.createElement('input');
    mobSearchInput.type         = 'search';
    mobSearchInput.id           = 'tb-search-input-mob';
    mobSearchInput.placeholder  = 'Caută...';
    mobSearchInput.autocomplete = 'new-password';
    mobSearchInput.spellcheck   = false;
    var mobSearchBox = document.createElement('div');
    mobSearchBox.id            = 'tb-search-results-mob';
    mobSearchBox.className     = 'tb-search-results';
    mobSearchBox.style.display = 'none';
    mobSearchInner.appendChild(mobSearchIcon);
    mobSearchInner.appendChild(mobSearchInput);
    mobSearchWrap.appendChild(mobSearchInner);
    mobSearchWrap.appendChild(mobSearchBox);
    mobileMenu.appendChild(mobSearchWrap);

    mobileMenu.appendChild(Object.assign(document.createElement('div'), { className: 'tb-mobile-sep' }));

    var mobileNav = document.createElement('nav');
    mobileNav.className = 'tb-mobile-nav';
    mobileNav.appendChild(buildNavLinks(navItems));
    mobileNav.appendChild(Object.assign(document.createElement('div'), { className: 'tb-mobile-sep' }));

    if (USER.session_logged_in) {
      [
        { href: BASE + '/u' + USER.user_id,                                  label: 'Profilul meu'   },
        { href: BASE + '/privmsg?folder=inbox',                              label: 'Mesaje private'  },
        { href: BASE + '/profile?mode=editprofile&page_profil=preferences',  label: 'Setări cont'    },
        { href: BASE + '/login?logout=1',                                    label: 'Deconectare', danger: true },
      ].forEach(function (item) {
        var a = document.createElement('a');
        a.href        = item.href;
        a.textContent = item.label;
        if (item.danger) a.style.color = 'var(--ips-danger-item)';
        mobileNav.appendChild(a);
      });
    } else {
      var regMob = document.createElement('a');
      regMob.href        = BASE + '/register';
      regMob.textContent = 'Înregistrare';
      mobileNav.appendChild(regMob);
    }

    mobileMenu.appendChild(mobileNav);
    document.body.appendChild(mobileMenu);

    /* Hamburger logic */
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

    document.addEventListener('click', function (e) {
      if (!mobileMenu.contains(e.target) && e.target !== hamBtn && !hamBtn.contains(e.target)) {
        mobileMenu.classList.remove('open');
        hamBtn.classList.remove('open');
        hamBtn.setAttribute('aria-expanded', 'false');
      }
    });

    /* Mobile search */
    var _searchTimerMob = null;
    mobSearchInput.addEventListener('input', function () {
      var q = mobSearchInput.value.trim();
      clearTimeout(_searchTimerMob);
      if (q.length < 2) { mobSearchBox.style.display = 'none'; return; }
      _searchTimerMob = setTimeout(function () { doSearch(q, 'tb-search-results-mob'); }, 400);
    });
    mobSearchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { mobSearchBox.style.display = 'none'; mobSearchInput.value = ''; }
      if (e.key === 'Enter') {
        e.preventDefault();
        window.location.href = BASE + '/search?search_keywords=' + encodeURIComponent(mobSearchInput.value.trim()) + '&submit=true';
      }
    });

    /* ── Login dropdown ── */
    if (!USER.session_logged_in) {
      /* Login form kept as innerHTML — no user data involved, only static URLs */
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

    var ddNotif = document.createElement('div');
    ddNotif.id        = 'tb-dd-notif';
    ddNotif.className = 'tb-dropdown tb-panel';
    ddNotif.setAttribute('role', 'region');
    ddNotif.setAttribute('aria-label', 'Notificări');

    var notifHead = document.createElement('div');
    notifHead.className = 'tb-panel-head';
    var notifH3 = document.createElement('h3');
    notifH3.textContent = 'Notificări';
    var notifMarkRead = document.createElement('a');
    notifMarkRead.href        = '#';
    notifMarkRead.id          = 'tb-notif-mark-read';
    notifMarkRead.textContent = 'Marchează citite';
    notifHead.appendChild(notifH3);
    notifHead.appendChild(notifMarkRead);

    var notifList = document.createElement('div');
    notifList.className = 'tb-panel-list';
    notifList.id        = 'tb-notif-list';
    var notifLoading = document.createElement('div');
    notifLoading.className = 'tb-panel-empty';
    notifLoading.innerHTML = IC.bell_off; // SVG constant — safe
    var notifLoadSpan = document.createElement('span');
    notifLoadSpan.textContent = 'Se încarcă...';
    notifLoading.appendChild(notifLoadSpan);
    notifList.appendChild(notifLoading);

    var notifFooter = document.createElement('div');
    notifFooter.className = 'tb-panel-footer';
    var notifAllA = document.createElement('a');
    notifAllA.href        = '/profile?mode=editprofile&page_profil=notifications';
    notifAllA.textContent = 'Vezi toate notificările';
    notifFooter.appendChild(notifAllA);

    ddNotif.appendChild(notifHead);
    ddNotif.appendChild(notifList);
    ddNotif.appendChild(notifFooter);
    document.body.appendChild(ddNotif);

    /* ── Msg dropdown ── */
    var ddMsg = document.createElement('div');
    ddMsg.id        = 'tb-dd-msg';
    ddMsg.className = 'tb-dropdown tb-panel';
    ddMsg.setAttribute('role', 'region');
    ddMsg.setAttribute('aria-label', 'Mesaje private');

    var msgHead = document.createElement('div');
    msgHead.className = 'tb-panel-head';
    var msgH3 = document.createElement('h3');
    msgH3.textContent = 'Mesaje private';
    var msgNewA = document.createElement('a');
    msgNewA.href        = '/privmsg?mode=post';
    msgNewA.textContent = 'Mesaj nou';
    msgHead.appendChild(msgH3);
    msgHead.appendChild(msgNewA);

    var msgList = document.createElement('div');
    msgList.className = 'tb-panel-list';
    msgList.id        = 'tb-msg-list';
    var msgLoading = document.createElement('div');
    msgLoading.className = 'tb-panel-empty';
    msgLoading.innerHTML = IC.mail; // SVG constant — safe
    var msgLoadSpan = document.createElement('span');
    msgLoadSpan.textContent = 'Se încarcă...';
    msgLoading.appendChild(msgLoadSpan);
    msgList.appendChild(msgLoading);

    var msgFooter = document.createElement('div');
    msgFooter.className = 'tb-panel-footer';
    var msgAllA = document.createElement('a');
    msgAllA.href        = '/privmsg?folder=inbox';
    msgAllA.textContent = 'Vezi toate mesajele';
    msgFooter.appendChild(msgAllA);

    ddMsg.appendChild(msgHead);
    ddMsg.appendChild(msgList);
    ddMsg.appendChild(msgFooter);
    document.body.appendChild(ddMsg);

    /* ── User dropdown ── */
    if (USER.session_logged_in) {
      var isAdmin = String(USER.user_level) === '1';

      var ddUser = document.createElement('div');
      ddUser.id        = 'tb-user-dropdown';
      ddUser.className = 'tb-dropdown';
      ddUser.setAttribute('role', 'menu');

      var ddHeader = document.createElement('div');
      ddHeader.className = 'tb-dd-header';
      var ddName = document.createElement('div');
      ddName.className   = 'name';
      ddName.textContent = USER.username || '';
      var ddMeta = document.createElement('div');
      ddMeta.className   = 'meta';
      ddMeta.textContent = String(USER.user_posts || 0) + ' mesaje · ' + String(USER.user_points || 0) + ' puncte';
      ddHeader.appendChild(ddName);
      ddHeader.appendChild(ddMeta);
      ddUser.appendChild(ddHeader);

      function menuItem(href, iconSvg, label, extraClass) {
        var a = document.createElement('a');
        a.href      = href;
        a.className = 'tb-dd-item' + (extraClass ? ' ' + extraClass : '');
        a.setAttribute('role', 'menuitem');
        a.innerHTML = iconSvg; // SVG constants — safe
        var span = document.createElement('span');
        span.textContent = label;
        a.appendChild(span);
        return a;
      }

      // USER.user_nb_privmsg nu e unread count — label simplu, fără număr
      var privmsgLabel = 'Mesaje private';

      ddUser.appendChild(menuItem(BASE + '/u' + USER.user_id,                                            IC.user,     'Profilul meu'));
      ddUser.appendChild(menuItem(BASE + '/privmsg?folder=inbox',                                        IC.mail,     privmsgLabel));
      ddUser.appendChild(menuItem(BASE + '/sta/u' + USER.user_id,                                        IC.topics,   'Topicurile mele'));
      ddUser.appendChild(menuItem(BASE + '/u' + USER.user_id + '?view=reputation',                      IC.rep,      'Reputația mea'));
      if (isAdmin) ddUser.appendChild(menuItem(BASE + '/admin',                                          IC.shield,   'Panou administrare'));
      ddUser.appendChild(menuItem(BASE + '/profile?mode=editprofile&page_profil=preferences',            IC.settings, 'Setări cont'));
      ddUser.appendChild(Object.assign(document.createElement('div'), { className: 'tb-dd-sep' }));
      ddUser.appendChild(menuItem(BASE + '/login?logout=1',                                              IC.logout,   'Deconectare', 'danger'));

      document.body.appendChild(ddUser);
    }

    /* ── Live notif container ── */
    var liveNotif = document.createElement('div');
    liveNotif.id = Toolbar.LIVE_NOTIF;
    document.body.appendChild(liveNotif);

    var panels = USER.session_logged_in
      ? { 'tb-btn-notif': 'tb-dd-notif', 'tb-btn-msg': 'tb-dd-msg', 'tb-btn-user': 'tb-user-dropdown' }
      : { 'tb-btn-login': 'tb-dd-login' };

    function positionDropdown(btnEl, ddEl) {
      var triggerEl = btnEl.id === 'tb-btn-user' ? (btnEl.closest('.tb-user') || btnEl) : btnEl;
      var rect    = triggerEl.getBoundingClientRect();
      var ddW     = ddEl.offsetWidth || 220;
      var scrollX = window.scrollX || window.pageXOffset || 0;
      var left    = rect.right - ddW + scrollX;
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
      var dd  = document.getElementById(panels[btnId]);
      var btn = document.getElementById(btnId);
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
    notifMarkRead.addEventListener('click', function (e) {
      e.preventDefault();
      if (window.FA && FA.Notification && typeof FA.Notification.markAsRead === 'function') {
        FA.Notification.markAsRead();
      }
      Toolbar._setBadge('tb-badge-notif', 0);
      document.querySelectorAll('#tb-notif-list .tb-notif-item.unread')
        .forEach(function (el) { el.classList.remove('unread'); });
    });

    /* Temă */
    themeBtn.addEventListener('click', function () {
      _darkMode = !_darkMode;
      applyTheme(_darkMode);
    });

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
