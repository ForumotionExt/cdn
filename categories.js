(function () {
  'use strict';

  var LOCKS = {
    'c1': 'b2a18de2a9c8e34c02deae0de8b6abfdc62b4e82b48b3a4d16df82d4e3ab3b4f',

    /* Adaugă mai multe după același model:
    'c2': 'hash-sha256-aici', */
  };

  var URL_LOCKS = {
    '/f3': 'c1',

    /* Adaugă mai multe:
    '/f5': 'c2', */
  };

  var SS_KEY = 'ips_lock_';

  /* ─────────────────────────────────────────
     SHA-256 via Web Crypto API
  ───────────────────────────────────────── */
  function sha256(str) {
    var data = new TextEncoder().encode(str);
    return crypto.subtle.digest('SHA-256', data).then(function (buf) {
      return Array.from(new Uint8Array(buf))
        .map(function (b) { return b.toString(16).padStart(2, '0'); })
        .join('');
    });
  }

  /* ─────────────────────────────────────────
     Escape HTML simplu
  ───────────────────────────────────────── */
  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* ─────────────────────────────────────────
     buildOverlay — overlay în-categorie
     Stilurile vin din styles.css (.ips-lock-*)
  ───────────────────────────────────────── */
  function buildOverlay(categoryId, categoryTitle, bodyEl) {
    var overlay = document.createElement('div');
    overlay.className = 'ips-lock-overlay';
    overlay.id = 'ips-lock-' + categoryId;

    overlay.innerHTML =
      '<div class="ips-lock-icon">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>' +
          '<path d="M7 11V7a5 5 0 0 1 10 0v4"/>' +
        '</svg>' +
      '</div>' +
      '<div>' +
        '<p class="ips-lock-title">Acces restricționat</p>' +
        '<p class="ips-lock-sub">Introdu parola pentru a accesa <strong>' + escHtml(categoryTitle) + '</strong></p>' +
      '</div>' +
      '<div class="ips-lock-form">' +
        '<input type="password" class="ips-lock-input" placeholder="Parolă..." autocomplete="off" />' +
        '<button class="ips-lock-btn">Intră</button>' +
      '</div>' +
      '<span class="ips-lock-error">Parolă incorectă. Încearcă din nou.</span>';

    var input  = overlay.querySelector('.ips-lock-input');
    var btn    = overlay.querySelector('.ips-lock-btn');
    var errMsg = overlay.querySelector('.ips-lock-error');

    function attempt() {
      var val = input.value;
      if (!val) return;

      btn.disabled = true;
      input.classList.remove('error');
      errMsg.classList.remove('visible');

      sha256(val).then(function (hash) {
        if (hash === LOCKS[categoryId]) {
          sessionStorage.setItem(SS_KEY + categoryId, '1');
          revealCategory(categoryId, bodyEl, overlay);
        } else {
          input.classList.add('error');
          errMsg.classList.add('visible');
          input.value = '';
          setTimeout(function () { input.classList.remove('error'); }, 400);
          btn.disabled = false;
          input.focus();
        }
      });
    }

    btn.addEventListener('click', attempt);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') attempt();
    });

    return overlay;
  }

  /* ─────────────────────────────────────────
     buildPageOverlay — overlay full-screen
     Stilurile vin din styles.css (#ips-page-lock, .ips-lock-*)
  ───────────────────────────────────────── */
  function buildPageOverlay(categoryId) {
    var wrap = document.createElement('div');
    wrap.id = 'ips-page-lock';
    /* background + layout definite în styles.css via #ips-page-lock */

    var box = document.createElement('div');
    box.className = 'ips-lock-overlay ips-lock-overlay--page';

    var pageTitle = document.title.replace(/\s*[-–|].*$/, '').trim() || 'această pagină';

    box.innerHTML =
      '<div class="ips-lock-icon">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>' +
          '<path d="M7 11V7a5 5 0 0 1 10 0v4"/>' +
        '</svg>' +
      '</div>' +
      '<div>' +
        '<p class="ips-lock-title">Acces restricționat</p>' +
        '<p class="ips-lock-sub">Introdu parola pentru a accesa <strong>' + escHtml(pageTitle) + '</strong></p>' +
      '</div>' +
      '<div class="ips-lock-form">' +
        '<input type="password" class="ips-lock-input" placeholder="Parolă..." autocomplete="off" />' +
        '<button class="ips-lock-btn">Intră</button>' +
      '</div>' +
      '<span class="ips-lock-error">Parolă incorectă. Încearcă din nou.</span>';

    wrap.appendChild(box);
    document.body.appendChild(wrap);

    setTimeout(function () {
      var inp = box.querySelector('.ips-lock-input');
      if (inp) inp.focus();
    }, 100);

    var input  = box.querySelector('.ips-lock-input');
    var btn    = box.querySelector('.ips-lock-btn');
    var errMsg = box.querySelector('.ips-lock-error');

    function attempt() {
      var val = input.value;
      if (!val) return;
      btn.disabled = true;
      input.classList.remove('error');
      errMsg.classList.remove('visible');

      sha256(val).then(function (hash) {
        if (hash === LOCKS[categoryId]) {
          sessionStorage.setItem(SS_KEY + categoryId, '1');
          wrap.style.transition = 'opacity .25s';
          wrap.style.opacity    = '0';
          setTimeout(function () { wrap.remove(); }, 250);
        } else {
          input.classList.add('error');
          errMsg.classList.add('visible');
          input.value = '';
          setTimeout(function () { input.classList.remove('error'); }, 400);
          btn.disabled = false;
          input.focus();
        }
      });
    }

    btn.addEventListener('click', attempt);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') attempt();
    });
  }

  /* ─────────────────────────────────────────
     revealCategory — afișează conținut după unlock
  ───────────────────────────────────────── */
  function revealCategory(categoryId, bodyEl, overlay) {
    overlay.style.transition = 'opacity .2s';
    overlay.style.opacity    = '0';
    setTimeout(function () {
      overlay.remove();
      var parent   = bodyEl.parentNode;
      var siblings = parent ? parent.children : [];
      for (var si = 0; si < siblings.length; si++) {
        var sib = siblings[si];
        if (sib.dataset && sib.dataset.ipsLockHidden) {
          sib.style.display = '';
          delete sib.dataset.ipsLockHidden;
        }
      }
      bodyEl.style.display = '';
      bodyEl.classList.add('ips-lock-revealed');
    }, 200);
  }

  /* ─────────────────────────────────────────
     init
  ───────────────────────────────────────── */
  function init() {
    if (!window.crypto || !window.crypto.subtle) {
      console.warn('[IPS Lock] Web Crypto API indisponibil (necesită HTTPS)');
      return;
    }

    /* ── Verificare URL direct ── */
    var path         = window.location.pathname;
    var matchedCatId = null;
    Object.keys(URL_LOCKS).forEach(function (urlPrefix) {
      if (path.indexOf(urlPrefix) === 0) matchedCatId = URL_LOCKS[urlPrefix];
    });

    if (matchedCatId && LOCKS[matchedCatId]) {
      if (!sessionStorage.getItem(SS_KEY + matchedCatId)) {
        document.documentElement.style.overflow = 'hidden';
        buildPageOverlay(matchedCatId);

        var mainEl = document.getElementById('container') ||
                     document.getElementById('page') ||
                     document.body.children[0];
        if (mainEl) mainEl.style.visibility = 'hidden';

        var _obs = new MutationObserver(function () {
          if (!document.getElementById('ips-page-lock')) {
            document.documentElement.style.overflow = '';
            if (mainEl) mainEl.style.visibility = '';
            _obs.disconnect();
          }
        });
        _obs.observe(document.body, { childList: true });
      }
    }

    /* ── Overlay pe categorii ── */
    Object.keys(LOCKS).forEach(function (categoryId) {
      var bodyEl = document.getElementById(categoryId);
      if (!bodyEl) return;
      if (sessionStorage.getItem(SS_KEY + categoryId)) return;

      var headerEl = bodyEl.previousElementSibling;
      var titleEl  = headerEl ? headerEl.querySelector('.ips-category-title') : null;
      var title    = titleEl ? titleEl.textContent.trim() : 'această categorie';

      bodyEl.style.display = 'none';

      var parent   = bodyEl.parentNode;
      var siblings = parent ? parent.children : [];
      for (var si = 0; si < siblings.length; si++) {
        var sib = siblings[si];
        if (sib === bodyEl) continue;
        if (sib.classList && sib.classList.contains('ips-category-header')) continue;
        sib.dataset.ipsLockHidden = '1';
        sib.style.display = 'none';
      }

      var overlay = buildOverlay(categoryId, title, bodyEl);
      parent.insertBefore(overlay, bodyEl);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.IpsLock = {
    hash: sha256,
    reset: function (categoryId) {
      sessionStorage.removeItem(SS_KEY + categoryId);
      location.reload();
    },
    resetAll: function () {
      Object.keys(sessionStorage).forEach(function (k) {
        if (k.indexOf(SS_KEY) === 0) sessionStorage.removeItem(k);
      });
      location.reload();
    },
  };

})();
