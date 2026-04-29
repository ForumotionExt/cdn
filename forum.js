(function () {
  'use strict';

  var U = window.IpsUtils || {
    escHtml: function (s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); },
    escAttr: function (s) { return String(s || '').replace(/"/g, '&quot;'); },
  };

  /* Categorii cu last-post mascat (sincronizat cu LOCKS din lock.js) */
  var LOCKED_CATEGORIES = ['c1'];

  /* Forumuri cu ≤ N subiecte sunt considerate goale */
  var EMPTY_THRESHOLD = 0;

  /* SVG icons */
  var IC = {
    lock:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="9" y1="10" x2="15" y2="10"/></svg>',
    forum: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    topic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
  };

  /* ─────────────────────────────────────────
     enhanceSubforums
     Transformă lista de link-uri din .ips-forum-subs
     într-un grid de carduri vizuale.
     Stilurile vin din styles.css (.ips-subforum-grid, .ips-subforum-card, etc.)
  ───────────────────────────────────────── */
  function enhanceSubforums() {
    document.querySelectorAll('.ips-forum-subs').forEach(function (subsEl) {
      var links = subsEl.querySelectorAll('a[href]');
      if (!links.length) return;

      var grid = document.createElement('div');
      grid.className = 'ips-subforum-grid';

      links.forEach(function (a) {
        var href = a.getAttribute('href') || '#';
        var name = a.textContent.trim();
        if (!name) return;

        /* Extragem numere din title/alt dacă există */
        var title       = a.getAttribute('title') || '';
        var topicsMatch = title.match(/(\d+)\s*(topic|subiect)/i);
        var postsMatch  = title.match(/(\d+)\s*(post|mesaj)/i);
        var topics      = topicsMatch ? topicsMatch[1] : null;
        var posts       = postsMatch  ? postsMatch[1]  : null;

        /* Last post din sibling text dacă există */
        var lastText = '';
        var nextNode = a.nextSibling;
        if (nextNode && nextNode.nodeType === 3) {
          lastText = nextNode.textContent.trim().replace(/^[,\-\s]+/, '');
        }

        var card = document.createElement('a');
        card.href      = href;
        card.className = 'ips-subforum-card';

        var metaHTML = '';
        if (topics !== null || posts !== null) {
          metaHTML =
            '<div class="ips-sf-meta">' +
              (topics !== null
                ? '<span class="ips-sf-meta-item">' + IC.topic + topics + ' subiecte</span>'
                : '') +
              (posts !== null
                ? '<span class="ips-sf-meta-item">' + IC.forum + posts + ' mesaje</span>'
                : '') +
            '</div>';
        }

        var lastHTML = lastText
          ? '<div class="ips-sf-last">' + IC.clock +
              '<span class="ips-sf-last-text">' + U.escHtml(lastText) + '</span>' +
            '</div>'
          : '';

        card.innerHTML =
          '<div class="ips-sf-name">' + U.escHtml(name) + '</div>' +
          metaHTML +
          lastHTML;

        grid.appendChild(card);
      });

      /* Înlocuim lista text cu grid-ul */
      var label = document.createElement('div');
      label.className   = 'ips-subforum-label';
      label.textContent = 'Subforumuri';

      subsEl.innerHTML = '';
      subsEl.appendChild(label);
      subsEl.appendChild(grid);
    });
  }

  /* ─────────────────────────────────────────
     enhanceEmptyForums
     Adaugă empty state vizual când un forum nu are postări.
     Stilurile vin din styles.css (.ips-empty-state, etc.)
  ───────────────────────────────────────── */
  function enhanceEmptyForums() {
    document.querySelectorAll('.ips-forum-row').forEach(function (row) {
      var lastEl = row.querySelector('.ips-forum-last');
      if (!lastEl) return;

      /* Nu suprascriem dacă există deja empty state sau locked icon */
      if (lastEl.querySelector('.ips-empty-state, .ips-lastpost-locked')) return;

      /* Există last post real → skip */
      if (lastEl.querySelector('.ips-lastpost-info, .ips-lastpost-topic')) return;

      /* Verificăm topics — 0 sau NaN = forum gol */
      var statEls  = row.querySelectorAll('.ips-forum-stat');
      var topicsEl = statEls[0];
      var topics   = topicsEl ? parseInt((topicsEl.textContent || '').trim(), 10) : NaN;

      if (!isNaN(topics) && topics > EMPTY_THRESHOLD) return;

      lastEl.innerHTML =
        '<div class="ips-empty-state">' +
          IC.empty +
          '<span class="ips-empty-title">Nicio postare încă</span>' +
          '<span class="ips-empty-sub">Fii primul care postează!</span>' +
        '</div>';
    });
  }

  /* ─────────────────────────────────────────
     enhanceLockedCategories
     Maschează last-post din categoriile protejate cu parolă.
     Stilurile vin din styles.css (.ips-lastpost-locked)
  ───────────────────────────────────────── */
  function enhanceLockedCategories() {
    LOCKED_CATEGORIES.forEach(function (catId) {
      var bodyEl = document.getElementById(catId);
      if (!bodyEl) return;

      bodyEl.querySelectorAll('.ips-forum-last').forEach(function (lastEl) {
        var hasContent = lastEl.querySelector('.ips-lastpost-info, .ips-lastpost-av img');
        if (!hasContent) return;

        lastEl.innerHTML =
          '<div class="ips-lastpost-locked">' +
            IC.lock +
            '<span>Acces restricționat</span>' +
          '</div>';
      });
    });
  }

  /* ─────────────────────────────────────────
     init
  ───────────────────────────────────────── */
  function init() {
    enhanceSubforums();
    enhanceLockedCategories();
    enhanceEmptyForums();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
