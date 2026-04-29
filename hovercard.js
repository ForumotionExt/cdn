(function () {
  'use strict';

  var USER = (typeof _userdata !== 'undefined' ? _userdata : {}) || {};

  var U = window.IpsUtils || {
    initials: function (n) {
      return (n || '?').split(' ').map(function (w) { return w[0] || ''; }).join('').substring(0, 2).toUpperCase() || '?';
    },
    escAttr: function (s) {
      return String(s || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },
    isTouch: function () {
      return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.matchMedia('(hover: none)').matches;
    },
  };

  var CACHE_TTL  = 5 * 60 * 1000;
  var _cache     = {};
  var _pending   = {};
  var _card      = null;
  var _sheet     = null;
  var _hideTimer = null;
  var _showTimer = null;
  var _currentUid = null;
  var _anchor     = null;
  var BASE = location.protocol + '//' + window.location.hostname;

  /* ─────────────────────────────────────────────
   *  Fetch & parse
   * ───────────────────────────────────────────── */
  function fetchProfile(uid) {
    var cached = _cache[uid];
    if (cached && (Date.now() - cached.ts) < CACHE_TTL) return Promise.resolve(cached.data);
    if (_pending[uid]) return _pending[uid];

    _pending[uid] = Promise.all([
      fetch(BASE + '/u' + uid, { credentials: 'same-origin' }).then(function (r) { return r.text(); }),
      fetch(BASE + '/u' + uid + 'stats', { credentials: 'same-origin' }).then(function (r) { return r.text(); }).catch(function () { return ''; }),
    ])
    .then(function (results) {
      var data = parseProfile(results[0], uid, results[1] || '');
      _cache[uid] = { data: data, ts: Date.now() };
      delete _pending[uid];
      return data;
    })
    .catch(function () {
      delete _pending[uid];
      return { uid: uid, username: '—', error: true };
    });

    return _pending[uid];
  }

  function parseProfile(html, uid, statsHtml) {
    var doc  = new DOMParser().parseFromString(html, 'text/html');
    var data = { uid: uid };

    /* ── Username ── */
    data.username = '—';
    var maintitle = doc.querySelector('#profile-advanced-right .maintitle h3');
    if (maintitle) {
      var uClone = maintitle.cloneNode(true);
      uClone.querySelectorAll('img, i').forEach(function (x) { x.remove(); });
      var uname = (uClone.querySelector('span') || {}).textContent || uClone.textContent;
      if (uname.trim()) data.username = uname.trim();
    }
    if (data.username === '—') {
      var navlis = doc.querySelectorAll('#navstrip li');
      if (navlis.length >= 3) data.username = navlis[navlis.length - 1].textContent.trim() || '—';
    }

    /* ── Avatar ── */
    var avEl = doc.querySelector('#profile-advanced-right .box-content img');
    data.avatar = avEl ? avEl.getAttribute('src') : null;
    if (data.avatar && (data.avatar.indexOf('pp-blank-thumb') !== -1 || data.avatar.indexOf('blank') !== -1)) {
      data.avatar = null;
    }

    /* ── Rang ── */
    var sidebar = doc.querySelector('#profile-advanced-right .box-content.profile');
    data.rank = '';
    if (sidebar) {
      var sClone = sidebar.cloneNode(true);
      sClone.querySelectorAll('img, .block-follow, br, a').forEach(function (x) { x.remove(); });
      var rankText = sClone.textContent.trim();
      if (rankText) data.rank = rankText;
    }

    /* ── Postări & Înregistrat ── */
    data.posts  = '—';
    data.joined = '—';
    var ddPosts  = doc.querySelector('dl[id="field_id-6"] dd');
    var ddJoined = doc.querySelector('dl[id="field_id-4"] dd');
    if (ddPosts  && ddPosts.textContent.trim())  data.posts  = ddPosts.textContent.trim();
    if (ddJoined && ddJoined.textContent.trim()) data.joined = ddJoined.textContent.trim();

    /* ── Reputație — field_id-14 ── */
    data.reputation = '—';
    var repEl = doc.querySelector('dl[id="field_id-14"] dd');
    if (repEl && repEl.textContent.trim()) data.reputation = repEl.textContent.trim();

    /* ── Topicuri create & Ultima activitate — din pagina de stats ── */
    data.topics     = '—';
    data.lastActive = null;

    /* ── Fallback din pagina de statistici ── */
    if (statsHtml) {
      try {
        var statDoc = new DOMParser().parseFromString(statsHtml, 'text/html');

        if (data.posts === '—') {
          var sd = statDoc.querySelector('dl[id="field_id-6"] dd.field_uneditable');
          if (sd && sd.textContent.trim()) data.posts = sd.textContent.trim();
        }
        if (data.joined === '—') {
          var jd = statDoc.querySelector('dl[id="field_id-4"] dd.field_uneditable');
          if (jd && jd.textContent.trim()) data.joined = jd.textContent.trim();
        }
        if (data.reputation === '—') {
          var repStat = statDoc.querySelector('dl[id="field_id-14"] dd');
          if (repStat && repStat.textContent.trim()) data.reputation = repStat.textContent.trim();
        }

        /* Topicuri: fieldset.stats-field.genmed cu legenda "Subiecte" → primul <li> → primul număr */
        if (data.topics === '—') {
          var fieldsets = statDoc.querySelectorAll('fieldset.stats-field.genmed');
          for (var fi = 0; fi < fieldsets.length; fi++) {
            var leg = fieldsets[fi].querySelector('legend');
            if (leg && /subiect/i.test(leg.textContent)) {
              var firstLi = fieldsets[fi].querySelector('ul li:first-child');
              if (firstLi) {
                var liClone = firstLi.cloneNode(true);
                liClone.querySelectorAll('label, a').forEach(function (x) { x.remove(); });
                var numMatch = liClone.textContent.trim().match(/^(\d[\d\s]*)/);
                if (numMatch) data.topics = numMatch[1].trim();
              }
              break;
            }
          }
        }

        /* Ultima activitate: fieldset.stats-field.genmed cu legenda "Subiecte" → al treilea <li> */
        if (!data.lastActive) {
          var fieldsets2 = statDoc.querySelectorAll('fieldset.stats-field.genmed');
          for (var fi2 = 0; fi2 < fieldsets2.length; fi2++) {
            var leg2 = fieldsets2[fi2].querySelector('legend');
            if (leg2 && /subiect/i.test(leg2.textContent)) {
              var thirdLi = fieldsets2[fi2].querySelectorAll('ul li')[2];
              if (thirdLi) {
                var laClone = thirdLi.cloneNode(true);
                laClone.querySelectorAll('label').forEach(function (x) { x.remove(); });
                var laTxt = laClone.textContent.trim();
                if (laTxt) data.lastActive = laTxt;
              }
              break;
            }
          }
        }
      } catch (e) {}
    }

    /* ── Follow state ── */
    var followBtn = doc.querySelector('.followBtn');
    data.isFollowing  = followBtn
      ? followBtn.classList.contains('following') || /unfollow|urmarit/i.test(followBtn.textContent)
      : false;
    data.followUserId = followBtn ? (followBtn.getAttribute('data-id') || uid) : uid;

    return data;
  }

  function extractUid(href) {
    if (!href) return null;
    var m = href.match(/\/u(\d+)/);
    return m ? m[1] : null;
  }

  /* ─────────────────────────────────────────────
   *  Card DOM builders (fără innerHTML pentru date utilizator)
   * ───────────────────────────────────────────── */

  function buildLoading() {
    var div = document.createElement('div');
    div.className = 'ihc-loading';
    for (var i = 0; i < 3; i++) div.appendChild(document.createElement('span'));
    return div;
  }

  function buildError() {
    var div = document.createElement('div');
    div.className   = 'ihc-error';
    div.textContent = 'Nu s-au putut încărca datele.';
    return div;
  }

  /**
   * Construiește conținutul cardului cu createElement.
   * Butoanele de mesaj și follow sunt ascunse pentru:
   *   - utilizatori neautentificați (guest)
   *   - profilul propriu al utilizatorului curent
   */
  function buildCard(data) {
    var frag = document.createDocumentFragment();

    var isOwnProfile = USER.user_id && String(data.uid) === String(USER.user_id);
    var isGuest      = !USER.session_logged_in;

    /* ── Top: avatar + info ── */
    var top = document.createElement('div');
    top.className = 'ihc-top';

    var avDiv = document.createElement('div');
    avDiv.className = 'ihc-avatar';
    if (data.avatar) {
      var img = document.createElement('img');
      img.src = data.avatar;
      img.alt = '';
      avDiv.appendChild(img);
    } else {
      var initDiv = document.createElement('div');
      initDiv.className   = 'ihc-av-initials';
      initDiv.textContent = U.initials(data.username);
      avDiv.appendChild(initDiv);
    }

    var infoDiv = document.createElement('div');
    infoDiv.className = 'ihc-info';

    var nameDiv = document.createElement('div');
    nameDiv.className   = 'ihc-name';
    nameDiv.textContent = data.username;
    infoDiv.appendChild(nameDiv);

    if (data.rank) {
      var rankSpan = document.createElement('span');
      rankSpan.className   = 'ihc-rank';
      rankSpan.textContent = data.rank;
      infoDiv.appendChild(rankSpan);
    }

    top.appendChild(avDiv);
    top.appendChild(infoDiv);
    frag.appendChild(top);

    /* ── Stats ── */
    var statsDiv = document.createElement('div');
    statsDiv.className = 'ihc-stats';

    function makeStat(val, label, extraClass) {
      var stat = document.createElement('div');
      stat.className = 'ihc-stat';
      var valSpan = document.createElement('span');
      valSpan.className   = 'ihc-stat-val' + (extraClass ? ' ' + extraClass : '');
      valSpan.textContent = val;
      var labelSpan = document.createElement('span');
      labelSpan.className   = 'ihc-stat-label';
      labelSpan.textContent = label;
      stat.appendChild(valSpan);
      stat.appendChild(labelSpan);
      return stat;
    }

    function makeSep() {
      var sep = document.createElement('div');
      sep.className = 'ihc-stat-sep';
      return sep;
    }

    /* Postări — mereu afișat */
    statsDiv.appendChild(makeStat(data.posts, 'Postări'));

    /* Topicuri — dacă există */
    if (data.topics && data.topics !== '—') {
      statsDiv.appendChild(makeSep());
      statsDiv.appendChild(makeStat(data.topics, 'Topicuri'));
    }

    /* Reputație — dacă există */
    if (data.reputation && data.reputation !== '—') {
      statsDiv.appendChild(makeSep());
      statsDiv.appendChild(makeStat(data.reputation, 'Reputație'));
    }

    /* Înregistrat — mereu afișat */
    statsDiv.appendChild(makeSep());
    statsDiv.appendChild(makeStat(data.joined, 'Înregistrat', 'ihc-joined'));

    frag.appendChild(statsDiv);

    /* ── Ultima activitate ── */
    if (data.lastActive) {
      var laDiv = document.createElement('div');
      laDiv.className = 'ihc-last-active';
      var laDot = document.createElement('span');
      laDot.className = 'ihc-la-dot';
      var laText = document.createElement('span');
      laText.textContent = 'Activ: ' + data.lastActive;
      laDiv.appendChild(laDot);
      laDiv.appendChild(laText);
      frag.appendChild(laDiv);
    }

    /* ── Acțiuni ── */
    var actions = document.createElement('div');
    actions.className = 'ihc-actions';

    /* Profil — mereu vizibil */
    var profileA = document.createElement('a');
    profileA.href        = BASE + '/u' + data.uid;
    profileA.className   = 'ihc-btn ihc-btn-profile';
    profileA.textContent = 'Profil';
    actions.appendChild(profileA);

    /* Mesaj & Follow — ascunse pentru guest și pe propriul profil */
    if (!isGuest && !isOwnProfile) {
      var pmA = document.createElement('a');
      pmA.href        = BASE + '/privmsg?mode=compose&u=' + data.uid;
      pmA.className   = 'ihc-btn ihc-btn-pm';
      pmA.textContent = 'Mesaj';
      actions.appendChild(pmA);

      var followBtn = document.createElement('button');
      followBtn.className    = 'ihc-btn ihc-btn-follow' + (data.isFollowing ? ' active' : '');
      followBtn.dataset.uid  = String(data.uid);
      followBtn.textContent  = data.isFollowing ? 'Urmărit ✓' : 'Urmărește';
      actions.appendChild(followBtn);
    }

    frag.appendChild(actions);
    return frag;
  }

  function renderInto(container, node) {
    container.textContent = '';
    container.appendChild(node);
  }

  function attachFollowHandler(container) {
    var btn = container.querySelector('.ihc-btn-follow');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      toggleFollow(btn);
    });
  }

  function toggleFollow(btn) {
    var uid    = btn.dataset.uid;
    var active = btn.classList.contains('active');
    btn.disabled = true;

    fetch(BASE + '/ajax_follow.php', {
      method: 'POST',
      credentials: 'same-origin',
      body: JSON.stringify({ mid: uid, follow: active ? 0 : 1, _: +new Date() }),
    })
    .then(function (r) {
      if (r.status === 200) {
        btn.classList.toggle('active');
        btn.textContent = btn.classList.contains('active') ? 'Urmărit ✓' : 'Urmărește';
        if (_cache[uid] && _cache[uid].data) {
          _cache[uid].data.isFollowing = btn.classList.contains('active');
        }
      }
    })
    .catch(function () {})
    .finally(function () { btn.disabled = false; });
  }

  function createCard() {
    var el = document.createElement('div');
    el.id  = 'ips-hovercard';
    el.setAttribute('role', 'tooltip');
    el.setAttribute('aria-live', 'polite');

    var inner = document.createElement('div');
    inner.className = 'ihc-inner';
    inner.appendChild(buildLoading());
    el.appendChild(inner);

    document.body.appendChild(el);
    el.addEventListener('mouseenter', function () { clearTimeout(_hideTimer); });
    el.addEventListener('mouseleave', scheduleHide);
    return el;
  }

  function positionCard(anchor) {
    _card.style.visibility = 'hidden';
    _card.style.opacity    = '0';
    _card.style.display    = 'block';

    requestAnimationFrame(function () {
      var rect    = anchor.getBoundingClientRect();
      var cw      = _card.offsetWidth  || 260;
      var ch      = _card.offsetHeight || 200;
      var gap     = 10;
      var scrollY = window.scrollY || window.pageYOffset;
      var scrollX = window.scrollX || window.pageXOffset;

      var top  = rect.bottom + gap + scrollY;
      var left = rect.left   + scrollX;

      if (left + cw > window.innerWidth - 8) left = window.innerWidth - cw - 8 + scrollX;
      if (left < 8) left = 8;
      if (rect.bottom + gap + ch > window.innerHeight) top = rect.top - ch - gap + scrollY;

      _card.style.top        = top  + 'px';
      _card.style.left       = left + 'px';
      _card.style.visibility = 'visible';
      _card.style.opacity    = '1';
    });
  }

  function showCard(anchor, uid) {
    clearTimeout(_hideTimer);
    clearTimeout(_showTimer);
    _currentUid = uid;
    _anchor     = anchor;

    if (!_card) _card = createCard();
    var inner = _card.querySelector('.ihc-inner');
    renderInto(inner, buildLoading());
    _card.style.display = 'block';
    positionCard(anchor);

    fetchProfile(uid).then(function (data) {
      if (_currentUid !== uid) return;
      renderInto(inner, data.error ? buildError() : buildCard(data));
      if (!data.error) attachFollowHandler(inner);
      positionCard(anchor);
    });
  }

  function scheduleHide() {
    _hideTimer = setTimeout(function () {
      if (_card) {
        _card.style.opacity = '0';
        setTimeout(function () { if (_card) _card.style.display = 'none'; }, 180);
      }
      _currentUid = null;
      _anchor     = null;
    }, 150);
  }

  function hideNow() {
    clearTimeout(_hideTimer);
    clearTimeout(_showTimer);
    if (_card) { _card.style.opacity = '0'; _card.style.display = 'none'; }
    _currentUid = null;
    _anchor     = null;
  }

  function createSheet() {
    var overlay = document.createElement('div');
    overlay.id  = 'ihc-overlay';
    overlay.addEventListener('click', hideSheet);
    document.body.appendChild(overlay);

    var el = document.createElement('div');
    el.id  = 'ihc-sheet';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');

    var handle = document.createElement('div');
    handle.className = 'ihc-sheet-handle';
    var inner = document.createElement('div');
    inner.className = 'ihc-inner';
    inner.appendChild(buildLoading());

    el.appendChild(handle);
    el.appendChild(inner);
    document.body.appendChild(el);

    var startY = 0;
    el.addEventListener('touchstart', function (e) { startY = e.touches[0].clientY; }, { passive: true });
    el.addEventListener('touchend', function (e) {
      if (e.changedTouches[0].clientY - startY > 60) hideSheet();
    }, { passive: true });

    return el;
  }

  function showSheet(uid) {
    if (!_sheet) _sheet = createSheet();
    var inner = _sheet.querySelector('.ihc-inner');
    renderInto(inner, buildLoading());

    var overlay = document.getElementById('ihc-overlay');
    if (overlay) overlay.classList.add('open');
    _sheet.classList.add('open');
    document.body.style.overflow = 'hidden';

    fetchProfile(uid).then(function (data) {
      if (!_sheet.classList.contains('open')) return;
      renderInto(inner, data.error ? buildError() : buildCard(data));
      if (!data.error) attachFollowHandler(inner);
    });
  }

  function hideSheet() {
    if (!_sheet) return;
    _sheet.classList.remove('open');
    var overlay = document.getElementById('ihc-overlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function attachLink(a, isTouch) {
    if (isTouch) {
      if (a.dataset.hcBtn) return;
      a.dataset.hcBtn = '1';
      var uid = extractUid(a.getAttribute('href'));
      if (!uid) return;
      if (a.closest('#ips-toolbar, #tb-mobile-menu, .tb-dropdown, #ihc-sheet')) return;

      var btn = document.createElement('button');
      btn.className = 'ihc-info-btn';
      btn.setAttribute('aria-label', 'Info utilizator');
      btn.textContent = 'i';
      if (a.nextSibling) { a.parentNode.insertBefore(btn, a.nextSibling); }
      else               { a.parentNode.appendChild(btn); }

      btn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        showSheet(uid);
      });
    } else {
      if (a.dataset.hcAttached) return;
      a.dataset.hcAttached = '1';

      a.addEventListener('mouseenter', function () {
        var uid = extractUid(a.getAttribute('href'));
        if (!uid) return;
        _showTimer = setTimeout(function () { showCard(a, uid); }, 250);
      });
      a.addEventListener('mouseleave', function () {
        clearTimeout(_showTimer);
        scheduleHide();
      });
      a.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') hideNow();
      });
    }
  }

  function scanLinks(root, isTouch) {
    var ctx = root || document;
    ctx.querySelectorAll('a[href]').forEach(function (a) {
      if (/^\/u\d/.test(a.getAttribute('href') || '')) attachLink(a, isTouch);
    });
  }

  function init() {
    if (['/c', '/t', '/u'].some(function (p) { return window.location.pathname.startsWith(p); })) {
      console.log('%c IPS Hovercard not registered (excluded path).', 'color: skyblue; font-size: 10px; font-family: monospace;');
      return;
    }
    console.log('%c IPS Hovercard has been registered.', 'color: skyblue; font-size: 10px; font-family: monospace;');

    var touch = U.isTouch();

    /* Scanare inițială — prinde linkurile deja în DOM */
    scanLinks(null, touch);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { hideNow(); hideSheet(); }
    });

    var observer = new MutationObserver(function (mutations) {
      if (touch) {
        scanLinks(null, touch);
      } else {
        mutations.forEach(function (m) {
          m.addedNodes.forEach(function (node) {
            if (node.nodeType === 1) scanLinks(node, touch);
          });
        });
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.IpsHovercard = {
    cache: _cache,
    flush: function () { _cache = {}; },
    hide:  function () { hideNow(); hideSheet(); },
  };

})();
