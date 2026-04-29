(function () {
  'use strict';

  var U  = window.IpsUtils || {
    initials: function(n){ return (n||'?').split(' ').map(function(w){return w[0]||'';}).join('').substring(0,2).toUpperCase()||'?'; },
    escHtml:  function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); },
    escAttr:  function(s){ return String(s||'').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); },
    isTouch:  function(){ return ('ontouchstart' in window)||(navigator.maxTouchPoints>0)||window.matchMedia('(hover: none)').matches; },
  };

  var CACHE_TTL = 5 * 60 * 1000;
  var _cache      = {};
  var _pending    = {};
  var _card       = null;
  var _sheet      = null;
  var _hideTimer  = null;
  var _showTimer  = null;
  var _currentUid = null;
  var _anchor     = null;
  var BASE = location.protocol + '//' + window.location.hostname;

  function fetchProfile(uid) {
    var cached = _cache[uid];
    if (cached && (Date.now() - cached.ts) < CACHE_TTL) {
      return Promise.resolve(cached.data);
    }
    if (_pending[uid]) return _pending[uid];

    _pending[uid] = Promise.all([
      fetch(BASE + '/u' + uid, { credentials: 'same-origin' }).then(function(r){ return r.text(); }),
      fetch(BASE + '/u' + uid + 'stats', { credentials: 'same-origin' }).then(function(r){ return r.text(); }).catch(function(){ return ''; }),
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

    data.username = '—';
    var maintitle = doc.querySelector('#profile-advanced-right .maintitle h3');
    if (maintitle) {
      var uClone = maintitle.cloneNode(true);
      uClone.querySelectorAll('img, i').forEach(function(x){ x.remove(); });
      var uname = uClone?.querySelector('span')?.textContent.trim() || uClone.textContent.trim();
      if (uname) data.username = uname;
    }

    if (data.username === '—') {
      var navlis = doc.querySelectorAll('#navstrip li');
      if (navlis.length >= 3) {
        data.username = navlis[navlis.length - 1].textContent.trim() || '—';
      }
    }

    var avEl = doc.querySelector('#profile-advanced-right .box-content img');
    data.avatar = avEl ? avEl.getAttribute('src') : null;
    if (data.avatar && (data.avatar.indexOf('pp-blank-thumb') !== -1 || data.avatar.indexOf('blank') !== -1)) {
      data.avatar = null;
    }

    var sidebar = doc.querySelector('#profile-advanced-right .box-content.profile');
    data.rank = '';
    if (sidebar) {
      var sClone = sidebar.cloneNode(true);
      sClone.querySelectorAll('img, .block-follow, br, a').forEach(function(x){ x.remove(); });
      var rankText = sClone.textContent.trim();
      if (rankText) data.rank = rankText;
    }

    data.posts  = '—';
    data.joined = '—';

    var ddPosts  = doc.querySelector('dl[id="field_id-6"] dd');
    var ddJoined = doc.querySelector('dl[id="field_id-4"] dd');
    if (ddPosts  && ddPosts.textContent.trim())  data.posts  = ddPosts.textContent.trim();
    if (ddJoined && ddJoined.textContent.trim()) data.joined = ddJoined.textContent.trim();

    if ((data.posts === '—' || data.joined === '—') && statsHtml) {
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
      } catch(e) {}
    }

    var followBtn = doc.querySelector('.followBtn');
    data.isFollowing = followBtn
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

  function buildCardHTML(data) {
    var av = data.avatar
      ? '<img src="' + U.escAttr(data.avatar) + '" alt="" />'
      : '<div class="ihc-av-initials">' + U.initials(data.username) + '</div>';

    var rankHtml = data.rank
      ? '<span class="ihc-rank">' + U.escHtml(data.rank) + '</span>'
      : '';

    var followLabel  = data.isFollowing ? 'Urmărit ✓' : 'Urmărește';
    var followActive = data.isFollowing ? ' active' : '';

    return '<div class="ihc-top">' +
        '<div class="ihc-avatar">' + av + '</div>' +
        '<div class="ihc-info">' +
          '<div class="ihc-name">' + U.escHtml(data.username) + '</div>' +
          rankHtml +
        '</div>' +
      '</div>' +
      '<div class="ihc-stats">' +
        '<div class="ihc-stat">' +
          '<span class="ihc-stat-val">' + U.escHtml(data.posts) + '</span>' +
          '<span class="ihc-stat-label">Postări</span>' +
        '</div>' +
        '<div class="ihc-stat-sep"></div>' +
        '<div class="ihc-stat">' +
          '<span class="ihc-stat-val ihc-joined">' + U.escHtml(data.joined) + '</span>' +
          '<span class="ihc-stat-label">Înregistrat</span>' +
        '</div>' +
      '</div>' +
      '<div class="ihc-actions">' +
        '<a href="' + BASE + '/u' + data.uid + '" class="ihc-btn ihc-btn-profile">Profil</a>' +
        '<a href="' + BASE + '/privmsg?mode=compose&u=' + data.uid + '" class="ihc-btn ihc-btn-pm">Mesaj</a>' +
        '<button class="ihc-btn ihc-btn-follow' + followActive + '" data-uid="' + U.escAttr(data.uid) + '">' +
          followLabel +
        '</button>' +
      '</div>';
  }

  function buildLoadingHTML() {
    return '<div class="ihc-loading"><span></span><span></span><span></span></div>';
  }

  function buildErrorHTML() {
    return '<div class="ihc-error">Nu s-au putut încărca datele.</div>';
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

    var payload = JSON.stringify({ mid: uid, follow: active ? 0 : 1, _: +new Date() });

    fetch(BASE + '/ajax_follow.php', {
      method: 'POST', credentials: 'same-origin', body: payload,
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
    el.innerHTML = '<div class="ihc-inner">' + buildLoadingHTML() + '</div>';
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
    _card.querySelector('.ihc-inner').innerHTML = buildLoadingHTML();
    _card.style.display = 'block';
    positionCard(anchor);

    fetchProfile(uid).then(function (data) {
      if (_currentUid !== uid) return;
      if (data.error) { _card.querySelector('.ihc-inner').innerHTML = buildErrorHTML(); return; }
      _card.querySelector('.ihc-inner').innerHTML = buildCardHTML(data);
      attachFollowHandler(_card);
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

  /* ── Mobile sheet ── */
  function createSheet() {
    var overlay = document.createElement('div');
    overlay.id  = 'ihc-overlay';
    overlay.addEventListener('click', hideSheet);
    document.body.appendChild(overlay);

    var el = document.createElement('div');
    el.id  = 'ihc-sheet';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.innerHTML =
      '<div class="ihc-sheet-handle"></div>' +
      '<div class="ihc-inner">' + buildLoadingHTML() + '</div>';
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
    _sheet.querySelector('.ihc-inner').innerHTML = buildLoadingHTML();

    var overlay = document.getElementById('ihc-overlay');
    if (overlay) overlay.classList.add('open');
    _sheet.classList.add('open');
    document.body.style.overflow = 'hidden';

    fetchProfile(uid).then(function (data) {
      if (!_sheet.classList.contains('open')) return;
      if (data.error) { _sheet.querySelector('.ihc-inner').innerHTML = buildErrorHTML(); return; }
      _sheet.querySelector('.ihc-inner').innerHTML = buildCardHTML(data);
      attachFollowHandler(_sheet);
    });
  }

  function hideSheet() {
    if (!_sheet) return;
    _sheet.classList.remove('open');
    var overlay = document.getElementById('ihc-overlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ── Link attachment ── */
  function attachLink(a, isTouch) {
    if (isTouch) {
      if (a.dataset.hcBtn) return;
      a.dataset.hcBtn = '1';
      var uid = extractUid(a.getAttribute('href'));
      if (!uid) return;
      if (a.closest('#ips-toolbar, #tb-mobile-menu, .tb-dropdown, #ihc-sheet')) return;

      var btn = document.createElement('button');
      btn.className   = 'ihc-info-btn';
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
    if (['/c', '/t', '/u'].some(path => window.location.pathname.startsWith(path))) {
      console.log('%c IPS Hovercard not been registred.', 'color: skyblue;font-size:10px;font-family: monospace;');
      return;
    }
    console.log('%c IPS Hovercard has been registred.', 'color: skyblue;font-size:10px;font-family: monospace;');
    var touch = U.isTouch();

    scanLinks(null, touch);
    setTimeout(function () { scanLinks(null, touch); }, 300);
    setTimeout(function () { scanLinks(null, touch); }, 800);
    setTimeout(function () { scanLinks(null, touch); }, 1500);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { hideNow(); hideSheet(); }
    });

    var observer = new MutationObserver(function (mutations) {
      if (!touch) {
        mutations.forEach(function (m) {
          m.addedNodes.forEach(function (node) {
            if (node.nodeType === 1) scanLinks(node, touch);
          });
        });
      } else {
        scanLinks(null, touch);
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
