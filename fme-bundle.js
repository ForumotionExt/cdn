(function (w) {
  'use strict';

  var ColorUtils = {
    parseRGB: function (col) {
      if (!col) return null;
      col = col.trim();
      if (col.charAt(0) === '#') {
        var hex = col.slice(1);
        if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
        var n = parseInt(hex, 16);
        return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
      }
      var m = col.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      if (m) return { r: +m[1], g: +m[2], b: +m[3] };
      return null;
    },

    alphaBg: function (col, a) {
      var rgb = this.parseRGB(col);
      if (!rgb) return 'rgba(255,255,255,' + a + ')';
      return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + a + ')';
    },

    lighten: function (col, amt) {
      amt = (amt === undefined) ? 60 : amt;
      var rgb = this.parseRGB(col);
      if (!rgb) return '#ffffff';
      return '#' + [
        Math.min(255, rgb.r + amt),
        Math.min(255, rgb.g + amt),
        Math.min(255, rgb.b + amt),
      ].map(function (x) { return x.toString(16).padStart(2, '0'); }).join('');
    },
  };

  var IpsUtils = {
    initials: function (name) {
      return (name || '?').split(' ')
        .map(function (w) { return w[0] || ''; })
        .join('')
        .substring(0, 2)
        .toUpperCase() || '?';
    },

    /* Escape HTML pentru afișare sigură */
    escHtml: function (s) {
      return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    },

    /* Escape pentru valori de atribute HTML */
    escAttr: function (s) {
      return String(s || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },

    /* Normalizare text: diacritice → ASCII, lowercase, trim */
    norm: function (s) {
      return (s || '').toLowerCase()
        .replace(/[ăâ]/g, 'a')
        .replace(/î/g, 'i')
        .replace(/[șş]/g, 's')
        .replace(/[țţ]/g, 't')
        .trim();
    },

    /* Timp relativ în română */
    timeAgo: function (ts) {
      if (!ts || ts <= 0) return '';
      var diff = Math.floor((Date.now() - ts * 1000) / 1000);
      if (diff <= 0)      return 'acum';
      if (diff < 60)      return 'acum';
      if (diff < 3600)    return Math.floor(diff / 60) + ' min';
      if (diff < 86400)   return Math.floor(diff / 3600) + 'h';
      if (diff < 604800)  return Math.floor(diff / 86400) + 'z';
      if (diff < 2592000) return Math.floor(diff / 604800) + ' săpt.';
      return Math.floor(diff / 2592000) + ' luni';
    },

    /* Extrage primul număr dintr-un text folosind lista de regex-uri */
    matchNum: function (text, patterns) {
      for (var i = 0; i < patterns.length; i++) {
        var m = text.match(patterns[i]);
        if (m) return parseInt(m[1], 10) || 0;
      }
      return 0;
    },

    /* Detectare dispozitiv touch */
    isTouch: function () {
      return ('ontouchstart' in window) ||
             (navigator.maxTouchPoints > 0) ||
             window.matchMedia('(hover: none)').matches;
    },
  };

  w.ColorUtils = ColorUtils;
  w.IpsUtils   = IpsUtils;

})(window);

(function (w) {
  'use strict';

  /* ── Utilitare interne (fallback daca utils.js lipseste) ── */
  var CU = w.ColorUtils || {
    parseRGB: function (col) {
      if (!col) return null;
      col = col.trim();
      if (col.charAt(0) === '#') {
        var hex = col.slice(1);
        if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
        var n = parseInt(hex, 16);
        return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
      }
      var m = col.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      return m ? { r: +m[1], g: +m[2], b: +m[3] } : null;
    },
    alphaBg: function (col, a) {
      var rgb = this.parseRGB(col);
      if (!rgb) return 'rgba(255,255,255,' + a + ')';
      return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + a + ')';
    },
    lighten: function (col, amt) {
      amt = amt === undefined ? 60 : amt;
      var rgb = this.parseRGB(col);
      if (!rgb) return '#ffffff';
      return '#' + [
        Math.min(255, rgb.r + amt),
        Math.min(255, rgb.g + amt),
        Math.min(255, rgb.b + amt),
      ].map(function (x) { return x.toString(16).padStart(2, '0'); }).join('');
    },
  };

  var U = w.IpsUtils || {
    initials: function (name) {
      return (name || '?').split(' ').map(function (w) { return w[0] || ''; })
        .join('').substring(0, 2).toUpperCase() || '?';
    },
    escHtml: function (s) {
      return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    },
    escAttr: function (s) {
      return String(s || '').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    },
  };

  /* ── Debug vizual: adauga ?ips_debug=1 in URL ── */
  var DEBUG = /[?&]ips_debug=1/.test(w.location.search);

  /* ══════════════════════════════════════════════════════════
     IPS CORE
  ══════════════════════════════════════════════════════════ */
  var ips = {

    _data: {},

    /* Culori din CSS variables cu fallback solid */
    _C: function () {
      var s = getComputedStyle(document.documentElement);
      return {
        bg:     s.getPropertyValue('--f-surface').trim()  || '#242f3c',
        header: s.getPropertyValue('--f-elevated').trim() || '#303b48',
        card:   'rgba(255,255,255,.07)',
        border: 'rgba(255,255,255,.08)',
        sep:    'rgba(255,255,255,.07)',
        text:   '#ffffff',
        muted:  'rgba(255,255,255,.35)',
        label:  'rgba(255,255,255,.38)',
        accent: s.getPropertyValue('--gc-light').trim()   || '#7ec8ff',
      };
    },

    /* ─────────────────────────────────────────────────────────
       INIT
    ───────────────────────────────────────────────────────── */
    init: function () {
      ips._injectStyles();

      document.querySelectorAll('[data-core]').forEach(function (el) {
        var funcName = el.getAttribute('data-core').split('.').pop().trim();
        if (funcName && typeof ips[funcName] === 'function') {
          try {
            ips[funcName](el);
          } catch (err) {
            ips._renderError(el, funcName, err);
          }
        }
      });
    },

    /* ─────────────────────────────────────────────────────────
       FORUM STATS
       Template Forumotion — exact 4 <p> in ordine fixa:
         p[0] = {TOTAL_POSTS}   → "...au postat un numar de X mesaje"
         p[1] = {TOTAL_USERS}   → "Avem X membri inregistrati"
         p[2] = {NEWEST_USER}   → "Cel mai nou utilizator este: <a>Nume</a>"
         p[3] = {RECORD_USERS}  → "Recordul a fost de X, Data"
    ───────────────────────────────────────────────────────── */
    forum_stats_core: function (el) {
      var data = {
        total_mesaje:     null,
        total_membri:     null,
        record_online:    null,
        ultim_utilizator: null,
      };

      /* Extrage primul numar dintr-un nod */
      function num(node) {
        if (!node) return null;
        /* Strong/b au prioritate */
        var bolds = node.querySelectorAll('strong, b');
        for (var i = 0; i < bolds.length; i++) {
          var n = parseInt((bolds[i].textContent || '').replace(/[^0-9]/g, ''), 10);
          if (!isNaN(n) && n >= 0) return n;
        }
        /* Orice cifra din text */
        var m = (node.textContent || '').match(/(\d+)/);
        return m ? parseInt(m[1], 10) : null;
      }

      /* Extrage utilizator din paragraf */
      function extractUser(p) {
        if (!p) return null;
        var link = p.querySelector('a[href]');
        if (!link) return null;
        var clone = link.cloneNode(true);
        clone.querySelectorAll('i, img').forEach(function (x) { x.remove(); });
        return {
          nume:    clone.textContent.trim() || null,
          profil:  link.getAttribute('href') || null,
          culoare: (link.querySelector('span') && link.querySelector('span').style.color)
                   || link.style.color || null,
        };
      }

      var ps = el.querySelectorAll('p');

      if (ps.length >= 4) {
        /* Caz normal: exact 4 paragrafe in ordine */
        data.total_mesaje     = num(ps[0]);
        data.total_membri     = num(ps[1]);
        data.ultim_utilizator = extractUser(ps[2]);
        var rn = num(ps[3]);
        var rd = (ps[3].textContent || '').match(/(\w{3}\s+\d{1,2}\s+\w{3}\s+\d{4}|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/);
        data.record_online = { numar: rn !== null ? rn : 0, data: rd ? rd[1] : null };

      } else if (ps.length > 0) {
        /* Mai putine paragrafe — fallback pozitional */
        if (ps[0]) data.total_mesaje     = num(ps[0]);
        if (ps[1]) data.total_membri     = num(ps[1]);
        if (ps[2]) data.ultim_utilizator = extractUser(ps[2]);
        if (ps[3]) data.record_online    = { numar: num(ps[3]) || 0, data: null };

      } else {
        /* Zero <p> — citim direct numerele din textul brut */
        var nums = (el.textContent || '').match(/\d+/g) || [];
        data.total_mesaje = nums[0] ? parseInt(nums[0], 10) : null;
        data.total_membri = nums[1] ? parseInt(nums[1], 10) : null;
        var link = el.querySelector('a[href]');
        if (link) data.ultim_utilizator = extractUser(link.parentNode || el);
        if (nums[2]) data.record_online = { numar: parseInt(nums[2], 10), data: null };
      }

      if (DEBUG) ips._debugOverlay(el, 'forum_stats_core', data);

      ips._data.forum_stats = data;
      ips._render_forum_stats(el, data);
      return data;
    },

    _render_forum_stats: function (el, data) {
      var C = ips._C();
      var u = data.ultim_utilizator || {};
      var r = data.record_online    || {};

      var html =
        '<div style="background:' + C.bg + ';border:1px solid ' + C.border + ';' +
        'border-radius:8px;padding:1rem 1.25rem;margin-bottom:.75rem;' +
        'box-shadow:0 2px 8px rgba(0,0,0,.18)">' +
          ips._title(C, 'Statistici forum') +
          '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:.9rem">' +
            ips._sbox(C, 'Mesaje', data.total_mesaje !== null ? data.total_mesaje : '—') +
            ips._sbox(C, 'Membri', data.total_membri  !== null ? data.total_membri  : '—') +
            ips._sboxRecord(C, r.numar, r.data) +
          '</div>' +
          '<div style="' + ips._sep(C) + '"></div>' +
          '<div style="' + ips._sec(C) + '">Ultimul înregistrat</div>' +
          '<div style="margin-bottom:.8rem">' +
            ips._userChip(u.profil || '#', u.culoare, u.nume || '—', true) +
          '</div>' +
        '</div>';

      ips._replace(el, html);
    },

    /* ─────────────────────────────────────────────────────────
       WHO IS ONLINE
       Template: {TOTAL_USERS_ONLINE}, {LOGGED_IN_USER_LIST}, {GROUP_LEGEND}
       Parsam textul brut cu regex pentru cifre + link-uri pentru useri/grupuri
    ───────────────────────────────────────────────────────── */
    forum_whois_online_core: function (el) {
      var text = el.textContent || '';

      /* Helper regex cu fallback 0 */
      function rnum(patterns) {
        for (var i = 0; i < patterns.length; i++) {
          var m = text.match(patterns[i]);
          if (m) return parseInt(m[1], 10) || 0;
        }
        return 0;
      }

      var data = {
        total_online: rnum([
          /sunt\s+(\d+)\s+utilizatori/i,
          /(\d+)\s+utilizatori?\s+online/i,
          /total[:\s]+(\d+)/i,
          /in total sunt\s+(\d+)/i,
        ]),
        inregistrati: rnum([
          /:\s*(\d+)\s*[îi]nregistra/i,
          /(\d+)\s*[îi]nregistra/i,
          /(\d+)\s*member/i,
        ]),
        invizibili: rnum([
          /(\d+)\s*invizibil/i,
          /(\d+)\s*hidden/i,
        ]),
        vizitatori: rnum([
          /(\d+)\s*vizitator/i,
          /(\d+)\s*guest/i,
        ]),
        useri_online: [],
        grupuri:      [],
      };

      if (!data.total_online && (data.inregistrati || data.vizitatori)) {
        data.total_online = data.inregistrati + data.invizibili + data.vizitatori;
      }

      el.querySelectorAll('a[href]').forEach(function (a) {
        var href  = a.getAttribute('href') || '';
        var clone = a.cloneNode(true);
        clone.querySelectorAll('i, img').forEach(function (x) { x.remove(); });
        var culoare = a.style.color
                      || (a.querySelector('span') && a.querySelector('span').style.color)
                      || null;
        var entry = { nume: clone.textContent.trim(), culoare: culoare };
        if      (href.indexOf('/u') === 0) data.useri_online.push(Object.assign({}, entry, { profil: href }));
        else if (href.indexOf('/g') === 0) data.grupuri.push(Object.assign({}, entry, { link: href, titlu: a.getAttribute('title') || null }));
      });

      if (DEBUG) ips._debugOverlay(el, 'forum_whois_online_core', data);

      ips._data.whois_online = data;
      ips._render_whois_online(el, data);
      return data;
    },

    _render_whois_online: function (el, data) {
      var C = ips._C();

      var usersHTML = data.useri_online.length
        ? data.useri_online.map(function (u) { return ips._userChip(u.profil, u.culoare, u.nume, true); }).join('')
        : '<span style="font-size:12px;color:' + C.muted + '">Niciun utilizator conectat</span>';

      var groupsHTML = data.grupuri.length
        ? data.grupuri.map(function (g) {
            var col   = g.culoare || 'rgba(255,255,255,.6)';
            var bg    = CU.alphaBg(col, .12);
            var brd   = CU.alphaBg(col, .35);
            var light = CU.lighten(col);
            var cnt   = (g.titlu || '').match(/(\d+)$/);
            return '<a href="' + U.escAttr(g.link) + '" class="ips-group-chip" style="' +
              'display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;' +
              'border:1px solid ' + brd + ';background:' + bg + ';text-decoration:none;' +
              'font-size:12px;font-weight:500;color:' + light + ';transition:background .15s">' +
              U.escHtml(g.nume) +
              (cnt ? '<span style="font-size:10px;opacity:.45">(' + cnt[1] + ')</span>' : '') +
            '</a>';
          }).join('')
        : '<span style="font-size:12px;color:' + C.muted + '">—</span>';

      var html =
        '<div style="background:' + C.bg + ';border:1px solid ' + C.border + ';' +
        'border-radius:8px;padding:1rem 1.25rem;box-shadow:0 2px 8px rgba(0,0,0,.18)">' +
          ips._title(C, 'Online acum') +
          '<div style="display:grid;grid-template-columns:repeat(4,minmax(60px,1fr));gap:8px;margin-bottom:.9rem">' +
            ips._sbox(C, 'Total',  data.total_online  || 0) +
            ips._sbox(C, 'Înreg.', data.inregistrati  || 0) +
            ips._sbox(C, 'Inviz.', data.invizibili    || 0) +
            ips._sbox(C, 'Vizit.', data.vizitatori    || 0) +
          '</div>' +
          '<div style="' + ips._sep(C) + '"></div>' +
          '<div style="' + ips._sec(C) + '">Utilizatori</div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:.8rem">' + usersHTML + '</div>' +
          '<div style="' + ips._sep(C) + '"></div>' +
          '<div style="' + ips._sec(C) + '">Grupuri</div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:6px">' + groupsHTML + '</div>' +
        '</div>';

      ips._replace(el, html);
    },

    /* ─────────────────────────────────────────────────────────
       _replace — inlocuire sigura, nu lasa elementul gol niciodata
    ───────────────────────────────────────────────────────── */
    _replace: function (el, html) {
      try {
        var wrap = document.createElement('div');
        wrap.innerHTML = html;
        var child = wrap.firstElementChild;
        if (!child) throw new Error('firstElementChild null');
        if (el.parentNode) {
          el.parentNode.insertBefore(child, el);
          el.parentNode.removeChild(el);
        }
      } catch (e) {
        /* Ultimul resort: innerHTML direct pe parinte */
        try { el.innerHTML = html; } catch (_) {}
      }
    },

    _renderError: function (el, funcName, err) {
      var html = '<div style="padding:1rem 1.25rem;background:#2a1a1a;' +
        'border:1px solid rgba(239,68,68,.3);border-radius:8px;' +
        'font-size:12px;color:#f87171">' +
        '<strong>[IPS] ' + U.escHtml(funcName) + '</strong><br>' +
        U.escHtml(String(err)) + '</div>';
      ips._replace(el, html);
    },

    /* Debug overlay in pagina — ?ips_debug=1 */
    _debugOverlay: function (el, fname, data) {
      var box = document.createElement('div');
      box.style.cssText = 'position:relative;z-index:9999;margin:4px 0;' +
        'background:#0a0a0a;border:2px solid #f59e0b;border-radius:8px;' +
        'padding:10px 12px;font-size:11px;font-family:monospace;' +
        'color:#fcd34d;white-space:pre-wrap;word-break:break-all;max-height:260px;overflow:auto';
      box.textContent = '[' + fname + ']\n' + JSON.stringify(data, null, 2);
      if (el.parentNode) el.parentNode.insertBefore(box, el.nextSibling);
    },

    /* ─────────────────────────────────────────────────────────
       UI HELPERS
    ───────────────────────────────────────────────────────── */
    _title: function (C, label) {
      return '<div style="background:' + C.header + ';' +
        'border-bottom:1px solid ' + C.border + ';border-radius:5px 5px 0 0;' +
        'padding:10px 14px;margin:-16px -20px .9rem;' +
        'font-size:13px;font-weight:600;color:' + C.text + ';' +
        'letter-spacing:.1px;text-transform:uppercase;' +
        'display:flex;align-items:center;justify-content:space-between">' +
        U.escHtml(label) + '</div>';
    },

    _sec: function (C) {
      return 'font-size:10px;font-weight:600;color:' + C.muted +
        ';letter-spacing:.06em;text-transform:uppercase;margin-bottom:.5rem';
    },

    _sep: function (C) {
      return 'height:1px;background:' + C.sep + ';margin:.75rem 0';
    },

    _sbox: function (C, label, val) {
      return '<div style="padding:.6rem .75rem;border-radius:6px;' +
        'background:' + C.card + ';border:1px solid ' + C.border + '">' +
        '<div style="font-size:11px;color:' + C.label + ';margin-bottom:4px">' + U.escHtml(label) + '</div>' +
        '<div style="font-size:20px;font-weight:600;color:' + C.accent + ';line-height:1">' +
          U.escHtml(String(val)) + '</div>' +
        '</div>';
    },

    _sboxRecord: function (C, numar, data) {
      return '<div style="padding:.6rem .75rem;border-radius:6px;' +
        'background:' + C.card + ';border:1px solid ' + C.border + '">' +
        '<div style="font-size:11px;color:' + C.label + ';margin-bottom:4px">Record</div>' +
        '<div style="font-size:20px;font-weight:600;color:' + C.accent + ';line-height:1">' +
          U.escHtml(String(numar !== null && numar !== undefined ? numar : '—')) + '</div>' +
        (data ? '<div style="font-size:10px;color:' + C.muted + ';margin-top:5px;line-height:1.3">' +
          U.escHtml(data) + '</div>' : '') +
        '</div>';
    },

    _userChip: function (href, culoare, nume, withDataAttrs) {
      var C     = ips._C();
      var col   = culoare || 'rgba(255,255,255,.6)';
      var light = CU.lighten(col);
      var avBg  = CU.alphaBg(col, .22);
      var attrs = withDataAttrs
        ? ' class="ips-chip"' +
          ' data-user-name="'   + U.escAttr(nume  || '') + '"' +
          ' data-user-color="'  + U.escAttr(col) + '"' +
          ' data-user-profil="' + U.escAttr(href  || '') + '"'
        : '';
      return '<a href="' + U.escAttr(href || '#') + '"' + attrs +
        ' style="display:inline-flex;align-items:center;gap:7px;padding:5px 10px;border-radius:6px;' +
        'background:' + C.card + ';border:1px solid ' + C.border + ';text-decoration:none;' +
        'transition:background .15s,border-color .15s">' +
        '<div style="width:24px;height:24px;border-radius:50%;background:' + avBg + ';color:' + light + ';' +
          'display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;flex-shrink:0">' +
          U.initials(nume) + '</div>' +
        '<span style="font-size:12px;font-weight:500;color:#fff">' + U.escHtml(nume || '—') + '</span>' +
        '</a>';
    },

    _injectStyles: function () {
      if (document.getElementById('ips-styles')) return;
      var s = document.createElement('style');
      s.id  = 'ips-styles';
      s.textContent =
        'a.ips-chip{transition:background .15s,border-color .15s!important}' +
        'a.ips-chip:hover{background:rgba(255,255,255,.12)!important;border-color:rgba(255,255,255,.18)!important}' +
        'a.ips-group-chip:hover{filter:brightness(1.15)}' +
        '@media(max-width:400px){[data-core] div[style*="repeat(4"]{grid-template-columns:repeat(2,1fr)!important}}';
      document.head.appendChild(s);
    },
  };

  /* ── ENTRY POINT ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { ips.init(); });
  } else {
    ips.init();
  }

  w.ips = ips;

})(window);

(function () {
  'use strict';

  var U  = window.IpsUtils || {
    initials: function(n){ return (n||'?').split(' ').map(function(w){return w[0]||'';}).join('').substring(0,2).toUpperCase()||'?'; },
    escHtml:  function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); },
    escAttr:  function(s){ return String(s||'').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); },
    isTouch:  function(){ return ('ontouchstart' in window)||(navigator.maxTouchPoints>0)||window.matchMedia('(hover: none)').matches; },
  };
  var CU = window.ColorUtils || {
    parseRGB: function(col){
      if(!col)return null; col=col.trim();
      if(col.charAt(0)==='#'){var hex=col.slice(1);if(hex.length===3)hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];var n=parseInt(hex,16);return{r:(n>>16)&0xff,g:(n>>8)&0xff,b:n&0xff};}
      var m=col.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);return m?{r:+m[1],g:+m[2],b:+m[3]}:null;
    },
    alphaBg:  function(col,a){var rgb=this.parseRGB(col);return rgb?'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+a+')':'rgba(255,255,255,'+a+')';},
    lighten:  function(col,amt){amt=amt===undefined?60:amt;var rgb=this.parseRGB(col);if(!rgb)return'#ffffff';return'#'+[Math.min(255,rgb.r+amt),Math.min(255,rgb.g+amt),Math.min(255,rgb.b+amt)].map(function(x){return x.toString(16).padStart(2,'0');}).join('');},
  };

  var CACHE_TTL = 5 * 60 * 1000;

  var _cache      = {};
  var _pending    = {};
  var _card       = null;   /* hovercard desktop */
  var _sheet      = null;   /* bottom sheet mobile */
  var _hideTimer  = null;
  var _showTimer  = null;
  var _currentUid = null;
  var _anchor     = null;

  var BASE = location.protocol + '//' + window.location.hostname;

  /* ─────────────────────────────────────────
     Fetch + parse profil cu cache TTL
  ───────────────────────────────────────── */
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

    /* Avatar */
    var avEl = doc.querySelector('#profile-advanced-right .box-content img');
    data.avatar = avEl ? avEl.getAttribute('src') : null;
    if (data.avatar && (data.avatar.indexOf('pp-blank-thumb') !== -1 || data.avatar.indexOf('blank') !== -1)) {
      data.avatar = null;
    }

    /* Rang: tot ce ramane in .box-content.profile dupa ce scoatem img, follow, a */
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

    /* Fallback pe statsHtml daca nu sunt in pagina principala */
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
        '<button class="ihc-btn ihc-btn-follow' + followActive + '"' +
          ' data-uid="' + U.escAttr(data.uid) + '">' +
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

    /* Forumotion foloseste /ajax_follow.php cu JSON body */
    var payload = JSON.stringify({
      mid:    uid,
      follow: active ? 0 : 1,
      _:      +new Date(),
    });

    fetch(BASE + '/ajax_follow.php', {
      method:      'POST',
      credentials: 'same-origin',
      body:        payload,
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

  function createSheet() {
    /* Overlay */
    var overlay = document.createElement('div');
    overlay.id  = 'ihc-overlay';
    overlay.addEventListener('click', hideSheet);
    document.body.appendChild(overlay);

    /* Sheet */
    var el = document.createElement('div');
    el.id  = 'ihc-sheet';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.innerHTML =
      '<div class="ihc-sheet-handle"></div>' +
      '<div class="ihc-inner">' + buildLoadingHTML() + '</div>';
    document.body.appendChild(el);

    /* Swipe down pentru a închide */
    var startY = 0;
    el.addEventListener('touchstart', function (e) {
      startY = e.touches[0].clientY;
    }, { passive: true });
    el.addEventListener('touchend', function (e) {
      var dy = e.changedTouches[0].clientY - startY;
      if (dy > 60) hideSheet();
    }, { passive: true });

    return el;
  }

  function showSheet(uid) {
    if (!_sheet) _sheet = createSheet();

    _sheet.querySelector('.ihc-inner').innerHTML = buildLoadingHTML();

    /* Afișează overlay + sheet */
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

  function attachLink(a, isTouch) {
    if (isTouch) {
      /* Mobile: nu intercept linkul — adăugăm un buton "i" lângă el.
         Verificăm cu data-hc-btn pe link (nu pe buton) ca sa nu adaugam de 2x */
      if (a.dataset.hcBtn) return;
      a.dataset.hcBtn = '1';

      var uid = extractUid(a.getAttribute('href'));
      if (!uid) return;

      /* Evităm zone fără sens */
      if (a.closest('#ips-toolbar, #tb-mobile-menu, .tb-dropdown, #ihc-sheet')) return;

      var btn = document.createElement('button');
      btn.className   = 'ihc-info-btn';
      btn.setAttribute('aria-label', 'Info utilizator');
      btn.textContent = 'i';

      if (a.nextSibling) {
        a.parentNode.insertBefore(btn, a.nextSibling);
      } else {
        a.parentNode.appendChild(btn);
      }

      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        showSheet(uid);
      });

    } else {
      if (a.dataset.hcAttached) return;
      a.dataset.hcAttached = '1';
      /* Desktop: hover */
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
    } // end desktop
  }

  function scanLinks(root, isTouch) {
    var ctx = root || document;
    ctx.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (/^\/u\d/.test(href)) attachLink(a, isTouch);
    });
  }

  function injectStyles(isTouch) {
    if (document.getElementById('ihc-styles')) return;
    var s = document.createElement('style');
    s.id  = 'ihc-styles';

    var shared = [
      /* Shared card parts */
      '.ihc-inner{padding:14px}',
      '.ihc-loading{display:flex;align-items:center;justify-content:center;gap:6px;padding:24px 0}',
      '.ihc-loading span{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.3);animation:ihc-pulse 1.2s ease-in-out infinite}',
      '.ihc-loading span:nth-child(2){animation-delay:.2s}',
      '.ihc-loading span:nth-child(3){animation-delay:.4s}',
      '@keyframes ihc-pulse{0%,80%,100%{transform:scale(.7);opacity:.4}40%{transform:scale(1);opacity:1}}',
      '.ihc-top{display:flex;align-items:center;gap:12px;margin-bottom:12px}',
      '.ihc-avatar{width:46px;height:46px;border-radius:50%;overflow:hidden;flex-shrink:0;' +
        'background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center}',
      '.ihc-avatar img{width:100%;height:100%;object-fit:cover}',
      '.ihc-av-initials{font-size:16px;font-weight:700;color:rgba(255,255,255,.7)}',
      '.ihc-info{min-width:0;flex:1}',
      '.ihc-name{font-size:14px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.ihc-rank{font-size:11px;color:rgba(255,255,255,.45);margin-top:2px;display:block}',
      '.ihc-stats{display:flex;align-items:center;' +
        'background:rgba(255,255,255,.05);border-radius:7px;padding:10px 14px;margin-bottom:12px}',
      '.ihc-stat{flex:1;text-align:center}',
      '.ihc-stat-val{display:block;font-size:15px;font-weight:600;color:#fff}',
      '.ihc-stat-label{display:block;font-size:10px;color:rgba(255,255,255,.4);margin-top:2px;text-transform:uppercase;letter-spacing:.04em}',
      '.ihc-stat-sep{width:1px;height:28px;background:rgba(255,255,255,.1)}',
      '.ihc-joined{font-size:11px!important}',
      '.ihc-actions{display:flex;gap:6px}',
      '.ihc-btn{flex:1;padding:6px 10px;border-radius:6px;font-size:12px;font-weight:500;' +
        'text-align:center;text-decoration:none;cursor:pointer;border:none;' +
        'transition:background .15s;line-height:1.4;display:flex;align-items:center;justify-content:center}',
      '.ihc-btn-profile{background:rgba(255,255,255,.1);color:#fff}',
      '.ihc-btn-pm{background:rgba(126,200,255,.15);color:#7ec8ff}',
      '.ihc-btn-follow{background:rgba(255,255,255,.07);color:rgba(255,255,255,.55)}',
      '.ihc-btn-follow.active{background:rgba(74,222,128,.15);color:#4ade80}',
      '.ihc-btn-follow:disabled{opacity:.5;cursor:not-allowed}',
      '.ihc-error{text-align:center;padding:20px 0;font-size:12px;color:rgba(255,255,255,.4)}',
    ].join('');

    var desktopOnly = [
      '#ips-hovercard{position:absolute;z-index:99999;width:260px;' +
        'background:#1e2a35;border:1px solid rgba(255,255,255,.1);' +
        'border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.45);' +
        'display:none;opacity:0;transition:opacity .18s ease;pointer-events:auto}',
    ].join('');

    var mobileOnly = [
      /* Overlay semi-transparent */
      '#ihc-overlay{' +
        'display:none;position:fixed;inset:0;' +
        'background:rgba(0,0,0,.55);z-index:99998;' +
        'opacity:0;transition:opacity .25s ease}',
      '#ihc-overlay.open{display:block;opacity:1}',

      /* Bottom sheet */
      '#ihc-sheet{' +
        'position:fixed;bottom:0;left:0;right:0;z-index:99999;' +
        'background:#1e2a35;' +
        'border-radius:18px 18px 0 0;' +
        'border-top:1px solid rgba(255,255,255,.1);' +
        'box-shadow:0 -8px 40px rgba(0,0,0,.5);' +
        'transform:translateY(100%);' +
        'transition:transform .3s cubic-bezier(.32,1,.23,1);' +
        'padding-bottom:env(safe-area-inset-bottom,0px)}',
      '#ihc-sheet.open{transform:translateY(0)}',

      /* Handle drag */
      '.ihc-sheet-handle{' +
        'width:36px;height:4px;border-radius:2px;' +
        'background:rgba(255,255,255,.2);' +
        'margin:10px auto 2px;' +
        'flex-shrink:0}',

      /* Pe mobile butoanele sunt mai mari — touch target */
      '#ihc-sheet .ihc-btn{padding:10px 12px;font-size:13px}',

      /* Buton "i" lângă linkurile de user */
      '.ihc-info-btn{' +
        'display:inline-flex;align-items:center;justify-content:center;' +
        'width:16px;height:16px;margin-left:3px;' +
        'border-radius:50%;border:none;' +
        'background:rgba(126,200,255,.25);color:#7ec8ff;' +
        'font-size:9px;font-weight:700;font-style:italic;font-family:serif;' +
        'cursor:pointer;vertical-align:middle;flex-shrink:0;' +
        'line-height:1;' +
        'transition:background .15s;' +
      '}',
      '.ihc-info-btn:active{background:rgba(126,200,255,.45)}',
      '#ihc-sheet .ihc-inner{padding:8px 16px 20px}',
      '#ihc-sheet .ihc-avatar{width:52px;height:52px}',
      '#ihc-sheet .ihc-av-initials{font-size:18px}',
      '#ihc-sheet .ihc-name{font-size:15px}',
    ].join('');

    s.textContent = shared + (isTouch ? mobileOnly : desktopOnly);
    document.head.appendChild(s);
  }

  function init() {
    var touch = U.isTouch();

    injectStyles(touch);

    /* Scan imediat */
    scanLinks(null, touch);

    /* Scanuri intarziate — ips.js face replaceWith async,
       chipurile apar la ~100-300ms dupa DOMContentLoaded */
    setTimeout(function () { scanLinks(null, touch); }, 300);
    setTimeout(function () { scanLinks(null, touch); }, 800);
    setTimeout(function () { scanLinks(null, touch); }, 1500);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { hideNow(); hideSheet(); }
    });

    /* MutationObserver — orice nod nou adaugat */
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


(function () {
  'use strict';

  var U  = window.IpsUtils;
  var CU = window.ColorUtils;
  var USER = (typeof _userdata !== 'undefined' ? _userdata : {}) || {};
  var HIDE_NAV_LABELS = [
    'cautare', 'cautare avansata', 'cautare avansata',
    'grupuri', 'profil', 'mesagerie', 'deconectare',
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

  var gc    = '#' + (USER.groupcolor || '1B6AA7');
  var gcL   = CU.lighten(USER.groupcolor ? '#' + USER.groupcolor : '#1B6AA7', 55);
  var gcDim = CU.alphaBg(USER.groupcolor ? '#' + USER.groupcolor : '#1B6AA7', .18);

  var NOTIF_TYPES = {
    0:  { icon: IC.mail,    bg: CU.alphaBg('#1B6AA7', .18), col: gcL,       label: 'Mesaj privat'    },
    2:  { icon: IC.friend,  bg: 'rgba(34,197,94,.12)',      col: '#4ade80', label: 'Cerere prieten'  },
    4:  { icon: IC.friend,  bg: 'rgba(34,197,94,.12)',      col: '#4ade80', label: 'Prieten nou'      },
    5:  { icon: IC.user,    bg: CU.alphaBg('#1B6AA7', .18), col: gcL,       label: 'Mesaj pe profil' },
    7:  { icon: IC.eye,     bg: 'rgba(168,85,247,.12)',     col: '#c084fc', label: 'Subiect urmărit' },
    8:  { icon: IC.mention, bg: 'rgba(251,146,60,.12)',     col: '#fb923c', label: 'Mențiune'         },
    11: { icon: IC.like,    bg: 'rgba(239,68,68,.12)',      col: '#f87171', label: 'Like'             },
    14: { icon: IC.award,   bg: 'rgba(234,179,8,.12)',      col: '#facc15', label: 'Premiu'           },
    15: { icon: IC.eye,     bg: 'rgba(168,85,247,.12)',     col: '#c084fc', label: 'Topic nou'        },
    16: { icon: IC.eye,     bg: 'rgba(168,85,247,.12)',     col: '#c084fc', label: 'Post nou'         },
  };
  function notifStyle(type) {
    return NOTIF_TYPES[type] || { icon: IC.bell, bg: 'rgba(255,255,255,.07)', col: 'rgba(255,255,255,.5)', label: 'Notificare' };
  }

  var _searchTimer = null;
  var BASE = location.protocol + '//' + window.location.hostname;

  function doSearch(query) {
    var box = document.getElementById('tb-search-results');
    if (!box) return;
    if (!query || query.length < 2) { box.style.display = 'none'; return; }

    box.style.display = 'block';
    box.innerHTML = '<div class="tb-search-loading">Se caută...</div>';

    /* Un singur request: căutare standard FA */
    fetch(BASE + '/search?search_keywords=' + encodeURIComponent(query) + '&submit=true', {
      credentials: 'same-origin',
    })
    .then(function (r) { return r.text(); })
    .then(function (html) {
      var doc     = new DOMParser().parseFromString(html, 'text/html');
      var results = [];
      var seen    = {};

      /* Doar topicuri — deduplicate dupa href */
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
    } catch (e) { /* AudioContext indisponibil */ }
  }

  var Toolbar = {

    LIVE_NOTIF: 'tb-live-notif',

    /* ── compileNotif ── */
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

    /* ── _alignNotifications ── */
    _alignNotifications: function () {
      var list = document.getElementById('tb-notif-list');
      if (!list) return;
      if (list.querySelectorAll('.tb-notif-item').length === 0) {
        list.innerHTML =
          '<div class="tb-panel-empty">' + IC.bell_off + '<span>Nicio notificare nouă</span></div>';
      }
    },

    /* ── refresh — apelat de FA.Notification ── */
    refresh: function (o) {
      o = o || {};
      var prevUnread = parseInt((document.getElementById('tb-badge-notif') || {}).textContent) || 0;

      /* 1. Badge + titlu + PWA */
      if (typeof o.unread !== 'undefined') {
        Toolbar._setBadge('tb-badge-notif', o.unread);
        var clean = document.title.replace(/^\(\d+\)\s/, '');
        document.title = o.unread > 0 ? '(' + o.unread + ') ' + clean : clean;
        if (navigator.setAppBadge) navigator.setAppBadge(o.unread || 0);

        /* Sunet la notificare nouă */
        if (o.unread > prevUnread) playNotifSound();
      }

      /* 2. Actualizare incrementală notificări */
      if (o.map && o.map.length > 0) {
        var length = 0;
        for (var i in o.map) {
          if (typeof o.map[i] === 'function') continue;
          length++;
          var idx      = parseInt(i);
          var itemData = o.data && o.set ? o.data[o.set[idx]] : null;
          if (!itemData) continue;
          if (itemData.text && itemData.text.type === 0) continue; /* PM — separat */
          if (o.map[idx] === null) {
            Toolbar._addItem(idx + 1, itemData);
          } else if (itemData.read) {
            Toolbar._readItem(idx);
          }
        }
        if (o.max) {
          for (var j = 0, surplus = length - o.max; j < surplus; j++) {
            Toolbar._delItem(j);
          }
        }
      } else if (o.map && o.map.length === 0) {
        Toolbar._alignNotifications();
      }

      /* 3. Populare PM list */
      if (o.data && o.set) Toolbar._renderPmList(o.data, o.set);
    },

    /* ── _renderPmList ── */
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
        /* Preview real: subiect sau titlu topic dacă există */
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

    /* ── Badge ── */
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

    /* ── _addItem ── */
    _addItem: function (pos, data) {
      if (data.text && data.text.type === 0) return;
      var list = document.getElementById('tb-notif-list');
      if (!list) return;
      var empty = list.querySelector('.tb-panel-empty');
      if (empty) empty.remove();

      var t  = data.text || {};
      var ns = notifStyle(t.type);

      var el = document.createElement('a');
      el.href      = t.url || '#';
      el.className = 'tb-notif-item' + (data.read ? '' : ' unread');
      el.id        = 'tb-n' + t.id;
      el.setAttribute('data-id', t.id);
      el.innerHTML =
        '<div class="tb-notif-icon" style="background:' + ns.bg + ';color:' + ns.col + '">' + ns.icon + '</div>' +
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

  function injectStyles() {
    if (document.getElementById('ips-tb-styles')) return;
    var s = document.createElement('style');
    s.id  = 'ips-tb-styles';
    s.textContent = [

      /* ── Reset & base ── */
      '#ips-toolbar *{box-sizing:border-box;margin:0;padding:0}',

      /* ── Toolbar container ── */
      '#ips-toolbar{',
        'position:fixed;top:0;left:0;right:0;z-index:9999;',
        'height:52px;',
        'display:flex;align-items:center;gap:4px;',
        'padding:0 16px;',
        'background:var(--f-elevated,#2a3541);',
        'border-bottom:1px solid rgba(255,255,255,.07);',
        'box-shadow:0 2px 12px rgba(0,0,0,.28);',
        'font-family:inherit;font-size:13px;',
      '}',

      /* ── Logo ── */
      '.tb-logo{',
        'display:flex;align-items:center;gap:6px;',
        'font-size:15px;font-weight:700;color:#fff;',
        'text-decoration:none;white-space:nowrap;flex-shrink:0;',
        'letter-spacing:-.2px;',
      '}',
      '.tb-logo span{',
        'display:inline-block;width:6px;height:6px;',
        'border-radius:50%;background:var(--gc-light,#7ec8ff);',
        'flex-shrink:0;',
      '}',

      /* ── Divider ── */
      '.tb-divider{width:1px;height:20px;background:rgba(255,255,255,.1);flex-shrink:0;margin:0 4px}',

      /* ── Nav links ── */
      '.tb-nav{display:flex;align-items:center;gap:2px;overflow:hidden}',
      '.tb-nav a{',
        'padding:5px 10px;border-radius:6px;',
        'color:rgba(255,255,255,.65);font-size:13px;font-weight:500;',
        'text-decoration:none;white-space:nowrap;',
        'transition:background .15s,color .15s;',
      '}',
      '.tb-nav a:hover{background:rgba(255,255,255,.08);color:#fff}',
      '.tb-nav a.active{background:rgba(255,255,255,.1);color:#fff}',

      /* ══════════════════════════════════
         SEARCH
      ══════════════════════════════════ */
      '.tb-search-wrap{',
        'position:relative;',
        'flex:1;max-width:280px;min-width:120px;',
        'margin:0 8px;',
      '}',
      '.tb-search-inner{',
        'position:relative;',
        'display:flex;align-items:center;',
      '}',
      '.tb-search-icon-svg{',
        'position:absolute;left:9px;',
        'display:flex;align-items:center;',
        'color:rgba(255,255,255,.3);pointer-events:none;',
      '}',
      '.tb-search-icon-svg svg{width:14px;height:14px;stroke-width:2.2}',
      '#tb-search-input{',
        'width:100%;height:32px;',
        'padding:0 10px 0 32px;',
        'background:rgba(255,255,255,.07);',
        'border:1px solid rgba(255,255,255,.09);',
        'border-radius:8px;',
        'color:#fff;font-size:13px;font-family:inherit;',
        'outline:none;transition:background .15s,border-color .15s;',
        '-webkit-appearance:none;',
      '}',
      '#tb-search-input::placeholder{color:rgba(255,255,255,.3)}',
      '#tb-search-input:focus{',
        'background:rgba(255,255,255,.11);',
        'border-color:rgba(255,255,255,.22);',
      '}',
      /* Remove default "x" button in Chrome/Safari */
      '#tb-search-input::-webkit-search-cancel-button{-webkit-appearance:none}',

      /* ── Results dropdown ── */
      '.tb-search-results{',
        'position:absolute;top:calc(100% + 6px);left:0;right:0;',
        'background:#1e2a35;',
        'border:1px solid rgba(255,255,255,.1);',
        'border-radius:10px;',
        'box-shadow:0 8px 28px rgba(0,0,0,.4);',
        'z-index:10001;',
        'overflow:hidden;',
        'max-height:320px;overflow-y:auto;',
      '}',
      '.tb-search-item{',
        'display:flex;align-items:center;gap:9px;',
        'padding:9px 12px;',
        'color:rgba(255,255,255,.8);font-size:13px;',
        'text-decoration:none;',
        'transition:background .12s;',
        'border-bottom:1px solid rgba(255,255,255,.05);',
      '}',
      '.tb-search-item:last-of-type{border-bottom:none}',
      '.tb-search-item:hover{background:rgba(255,255,255,.07);color:#fff}',
      '.tb-search-icon{',
        'display:flex;align-items:center;flex-shrink:0;',
        'color:rgba(255,255,255,.3);',
      '}',
      '.tb-search-icon svg{width:14px;height:14px}',
      '.tb-search-all{',
        'display:block;padding:8px 12px;',
        'font-size:12px;color:var(--gc-light,#7ec8ff);',
        'text-decoration:none;text-align:center;',
        'border-top:1px solid rgba(255,255,255,.07);',
        'transition:background .12s;',
      '}',
      '.tb-search-all:hover{background:rgba(255,255,255,.05)}',
      '.tb-search-loading,.tb-search-empty{',
        'padding:14px 12px;',
        'font-size:12px;color:rgba(255,255,255,.4);',
        'text-align:center;',
      '}',

      /* ── Right section ── */
      '.tb-right{display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0}',

      /* ── Points ── */
      '.tb-points{',
        'display:flex;align-items:center;gap:5px;',
        'padding:4px 10px;border-radius:6px;',
        'background:rgba(255,255,255,.06);',
        'font-size:12px;color:rgba(255,255,255,.55);',
        'white-space:nowrap;',
      '}',
      '.tb-points svg{width:13px;height:13px;color:var(--gc-light,#facc15)}',
      '.tb-points strong{font-weight:600;color:#fff;font-size:13px}',

      /* ── Icon buttons (notif, msg, theme) ── */
      '.tb-icon-btn{',
        'position:relative;',
        'display:flex;align-items:center;justify-content:center;',
        'width:36px;height:36px;',
        'border-radius:8px;border:none;',
        'background:transparent;color:rgba(255,255,255,.6);',
        'cursor:pointer;transition:background .15s,color .15s;',
        'flex-shrink:0;',
      '}',
      '.tb-icon-btn svg{width:18px;height:18px}',
      '.tb-icon-btn:hover{background:rgba(255,255,255,.09);color:#fff}',
      '.tb-icon-btn.open{background:rgba(255,255,255,.1);color:#fff}',

      /* ── Badge ── */
      '.tb-badge{',
        'position:absolute;top:4px;right:4px;',
        'min-width:16px;height:16px;',
        'padding:0 4px;',
        'background:#ef4444;color:#fff;',
        'font-size:10px;font-weight:700;line-height:16px;',
        'border-radius:8px;',
        'display:flex;align-items:center;justify-content:center;',
        'pointer-events:none;',
      '}',
      '@keyframes tb-badge-pulse{0%{transform:scale(1)}50%{transform:scale(1.35)}100%{transform:scale(1)}}',
      '.tb-badge.pulse{animation:tb-badge-pulse .3s ease}',

      /* ── User chip ── */
      '.tb-user-wrap{display:flex;align-items:center}',
      '.tb-user{',
        'display:flex;align-items:center;gap:8px;',
        'padding:4px 8px 4px 4px;',
        'border-radius:8px;cursor:pointer;',
        'transition:background .15s;',
        'user-select:none;',
      '}',
      '.tb-user:hover,.tb-user.open{background:rgba(255,255,255,.09)}',
      '.tb-user-av{',
        'width:28px;height:28px;border-radius:50%;overflow:hidden;',
        'background:var(--gc-dim,rgba(27,106,167,.18));',
        'display:flex;align-items:center;justify-content:center;',
        'font-size:11px;font-weight:700;color:var(--gc-light,#7ec8ff);',
        'flex-shrink:0;',
      '}',
      '.tb-user-av img{width:100%;height:100%;object-fit:cover}',
      '.tb-user-name{font-size:13px;font-weight:500;color:#fff;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.tb-user-caret{width:14px;height:14px;color:rgba(255,255,255,.4);transition:transform .2s;flex-shrink:0}',
      '.tb-user.open .tb-user-caret{transform:rotate(180deg)}',

      /* ── Login / Register buttons (guest) ── */
      '.tb-btn-login{',
        'padding:6px 14px;border-radius:7px;',
        'background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);',
        'color:#fff;font-size:13px;font-weight:500;',
        'cursor:pointer;transition:background .15s;',
      '}',
      '.tb-btn-login:hover{background:rgba(255,255,255,.14)}',
      '.tb-btn-register{',
        'padding:6px 14px;border-radius:7px;',
        'background:var(--gc,#1B6AA7);color:#fff;',
        'font-size:13px;font-weight:600;',
        'text-decoration:none;white-space:nowrap;',
        'transition:filter .15s;',
      '}',
      '.tb-btn-register:hover{filter:brightness(1.12)}',

      /* ════════════════════════════════════
         DROPDOWNS
      ════════════════════════════════════ */
      '.tb-dropdown{',
        'position:fixed;top:58px;',
        'background:#1e2a35;',
        'border:1px solid rgba(255,255,255,.1);',
        'border-radius:12px;',
        'box-shadow:0 12px 40px rgba(0,0,0,.45);',
        'z-index:10000;',
        'display:none;opacity:0;',
        'transform:translateY(-6px);',
        'transition:opacity .18s ease,transform .18s ease;',
      '}',
      '.tb-dropdown.open{display:block;opacity:1;transform:translateY(0)}',

      /* Panel (notif + msg) */
      '.tb-panel{width:340px}',
      '.tb-panel-head{',
        'display:flex;align-items:center;justify-content:space-between;',
        'padding:12px 14px;',
        'border-bottom:1px solid rgba(255,255,255,.07);',
      '}',
      '.tb-panel-head h3{font-size:14px;font-weight:600;color:#fff}',
      '.tb-panel-head a{font-size:12px;color:var(--gc-light,#7ec8ff);text-decoration:none}',
      '.tb-panel-head a:hover{text-decoration:underline}',
      '.tb-panel-list{max-height:340px;overflow-y:auto;overflow-x:hidden}',
      '.tb-panel-footer{',
        'padding:10px 14px;text-align:center;',
        'border-top:1px solid rgba(255,255,255,.07);',
      '}',
      '.tb-panel-footer a{font-size:12px;color:rgba(255,255,255,.45);text-decoration:none}',
      '.tb-panel-footer a:hover{color:#fff}',
      '.tb-panel-empty{',
        'display:flex;flex-direction:column;align-items:center;',
        'gap:8px;padding:32px 16px;',
        'color:rgba(255,255,255,.3);font-size:13px;',
      '}',
      '.tb-panel-empty svg{width:28px;height:28px;opacity:.3}',

      /* Notif items */
      '.tb-notif-item{',
        'display:flex;align-items:flex-start;gap:10px;',
        'padding:10px 14px;',
        'text-decoration:none;',
        'border-bottom:1px solid rgba(255,255,255,.04);',
        'transition:background .12s;position:relative;',
      '}',
      '.tb-notif-item:hover{background:rgba(255,255,255,.05)}',
      '.tb-notif-item.unread{background:rgba(255,255,255,.035)}',
      '.tb-notif-item.unread::before{',
        'content:"";position:absolute;left:0;top:0;bottom:0;',
        'width:3px;background:var(--gc,#1B6AA7);border-radius:0 2px 2px 0;',
      '}',
      '.tb-notif-icon{',
        'width:32px;height:32px;border-radius:8px;',
        'display:flex;align-items:center;justify-content:center;',
        'flex-shrink:0;',
      '}',
      '.tb-notif-icon svg{width:15px;height:15px}',
      '.tb-notif-body{flex:1;min-width:0}',
      '.tb-notif-text{font-size:12.5px;color:rgba(255,255,255,.8);line-height:1.45;word-break:break-word}',
      '.tb-notif-text a{color:var(--gc-light,#7ec8ff);text-decoration:none}',
      '.tb-notif-text a:hover{text-decoration:underline}',
      '.tb-notif-time{font-size:11px;color:rgba(255,255,255,.3);margin-top:3px;display:block}',
      '.tb-notif-del{',
        'flex-shrink:0;',
        'display:flex;align-items:center;justify-content:center;',
        'width:24px;height:24px;',
        'border:none;background:transparent;',
        'color:rgba(255,255,255,.2);cursor:pointer;',
        'border-radius:5px;opacity:0;transition:opacity .15s,background .15s;',
      '}',
      '.tb-notif-del svg{width:13px;height:13px}',
      '.tb-notif-item:hover .tb-notif-del{opacity:1}',
      '.tb-notif-del:hover{background:rgba(239,68,68,.15);color:#f87171}',

      /* PM items */
      '.tb-msg-item{',
        'display:flex;align-items:center;gap:10px;',
        'padding:10px 14px;',
        'text-decoration:none;',
        'border-bottom:1px solid rgba(255,255,255,.04);',
        'transition:background .12s;',
      '}',
      '.tb-msg-item:hover{background:rgba(255,255,255,.05)}',
      '.tb-msg-item.unread .tb-msg-from{color:#fff;font-weight:600}',
      '.tb-msg-av{',
        'width:34px;height:34px;border-radius:50%;',
        'background:var(--gc-dim,rgba(27,106,167,.18));',
        'display:flex;align-items:center;justify-content:center;',
        'font-size:12px;font-weight:700;color:var(--gc-light,#7ec8ff);',
        'flex-shrink:0;',
      '}',
      '.tb-msg-body{flex:1;min-width:0}',
      '.tb-msg-from{font-size:13px;color:rgba(255,255,255,.75);font-weight:500}',
      '.tb-msg-preview{font-size:12px;color:rgba(255,255,255,.35);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}',
      '.tb-msg-meta{display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0}',
      '.tb-msg-meta span{font-size:11px;color:rgba(255,255,255,.3)}',
      '.tb-msg-unread-dot{width:7px;height:7px;border-radius:50%;background:var(--gc,#1B6AA7)}',

      /* User dropdown */
      '#tb-user-dropdown{width:220px;padding:6px}',
      '.tb-dd-header{padding:10px 8px 8px;border-bottom:1px solid rgba(255,255,255,.07);margin-bottom:4px}',
      '.tb-dd-header .name{font-size:14px;font-weight:600;color:#fff}',
      '.tb-dd-header .meta{font-size:11px;color:rgba(255,255,255,.35);margin-top:2px}',
      '.tb-dd-item{',
        'display:flex;align-items:center;gap:10px;',
        'padding:7px 8px;border-radius:7px;',
        'color:rgba(255,255,255,.7);font-size:13px;',
        'text-decoration:none;transition:background .12s,color .12s;',
      '}',
      '.tb-dd-item svg{width:15px;height:15px;flex-shrink:0;opacity:.7}',
      '.tb-dd-item:hover{background:rgba(255,255,255,.08);color:#fff}',
      '.tb-dd-item:hover svg{opacity:1}',
      '.tb-dd-item.danger{color:rgba(239,100,100,.8)}',
      '.tb-dd-item.danger:hover{background:rgba(239,68,68,.1);color:#f87171}',
      '.tb-dd-sep{height:1px;background:rgba(255,255,255,.07);margin:4px 0}',

      /* Login dropdown */
      '.tb-login-panel{width:300px;padding:0}',
      '.tb-login-form{padding:14px 16px 16px}',
      '.tb-login-field{margin-bottom:10px}',
      '.tb-login-field label{display:block;font-size:12px;color:rgba(255,255,255,.5);margin-bottom:4px}',
      '.tb-login-field input{',
        'width:100%;height:36px;',
        'padding:0 10px;',
        'background:rgba(255,255,255,.07);',
        'border:1px solid rgba(255,255,255,.1);',
        'border-radius:7px;color:#fff;',
        'font-size:13px;font-family:inherit;',
        'outline:none;transition:border-color .15s;',
      '}',
      '.tb-login-field input:focus{border-color:var(--gc,#1B6AA7)}',
      '.tb-login-options{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}',
      '.tb-login-check{font-size:12px;color:rgba(255,255,255,.5);display:flex;align-items:center;gap:5px;cursor:pointer}',
      '.tb-login-forgot{font-size:12px;color:var(--gc-light,#7ec8ff);text-decoration:none}',
      '.tb-login-submit{',
        'width:100%;height:36px;',
        'background:var(--gc,#1B6AA7);border:none;',
        'border-radius:7px;color:#fff;',
        'font-size:13px;font-weight:600;font-family:inherit;',
        'cursor:pointer;transition:filter .15s;',
      '}',
      '.tb-login-submit:hover{filter:brightness(1.1)}',
      '.tb-login-register{font-size:12px;color:rgba(255,255,255,.4);text-align:center;margin-top:10px}',
      '.tb-login-register a{color:var(--gc-light,#7ec8ff);text-decoration:none}',

      /* ── Scrollbar fin în liste ── */
      '.tb-panel-list::-webkit-scrollbar{width:4px}',
      '.tb-panel-list::-webkit-scrollbar-track{background:transparent}',
      '.tb-panel-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:4px}',
      '.tb-search-results::-webkit-scrollbar{width:4px}',
      '.tb-search-results::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:4px}',

      /* ── Hamburger button ── */
      '.tb-hamburger{',
        'display:none;',
        'align-items:center;justify-content:center;',
        'width:36px;height:36px;',
        'border-radius:8px;border:none;',
        'background:transparent;color:rgba(255,255,255,.7);',
        'cursor:pointer;flex-shrink:0;',
        'transition:background .15s;',
      '}',
      '.tb-hamburger:hover{background:rgba(255,255,255,.09);color:#fff}',
      '.tb-hamburger.open{background:rgba(255,255,255,.1);color:#fff}',
      /* Cele 3 linii SVG inline desenate cu CSS */
      '.tb-ham-icon{',
        'display:flex;flex-direction:column;gap:4px;',
        'width:16px;',
      '}',
      '.tb-ham-icon span{',
        'display:block;height:2px;border-radius:2px;',
        'background:currentColor;',
        'transition:transform .22s ease,opacity .22s ease,width .22s ease;',
        'transform-origin:center;',
      '}',
      '.tb-ham-icon span:nth-child(3){width:10px}',
      '.tb-hamburger.open .tb-ham-icon span:nth-child(1){transform:translateY(6px) rotate(45deg)}',
      '.tb-hamburger.open .tb-ham-icon span:nth-child(2){opacity:0;transform:scaleX(0)}',
      '.tb-hamburger.open .tb-ham-icon span:nth-child(3){width:16px;transform:translateY(-6px) rotate(-45deg)}',

      /* ── Mobile nav drawer ── */
      '#tb-mobile-menu{',
        'display:none;',
        'position:fixed;top:52px;left:0;right:0;',
        'background:#1e2a35;',
        'border-bottom:1px solid rgba(255,255,255,.08);',
        'box-shadow:0 8px 24px rgba(0,0,0,.35);',
        'z-index:9998;',
        'padding:8px 12px 12px;',
        'max-height:calc(100vh - 52px);overflow-y:auto;',
        'transform:translateY(-8px);opacity:0;',
        'transition:transform .22s ease,opacity .22s ease;',
      '}',
      '#tb-mobile-menu.open{display:block;transform:translateY(0);opacity:1}',
      '.tb-mobile-nav{display:flex;flex-direction:column;gap:2px;margin-bottom:8px}',
      '.tb-mobile-nav a{',
        'display:flex;align-items:center;',
        'padding:10px 12px;border-radius:8px;',
        'color:rgba(255,255,255,.75);font-size:14px;font-weight:500;',
        'text-decoration:none;transition:background .12s,color .12s;',
      '}',
      '.tb-mobile-nav a:hover,.tb-mobile-nav a.active{background:rgba(255,255,255,.08);color:#fff}',
      '.tb-mobile-sep{height:1px;background:rgba(255,255,255,.07);margin:6px 0}',
      /* Căutare în meniu mobile */
      '.tb-mobile-search{padding:4px 0 8px}',
      '.tb-mobile-search .tb-search-inner{position:relative;display:flex;align-items:center}',
      '#tb-search-input-mob{',
        'width:100%;height:38px;padding:0 10px 0 34px;',
        'background:rgba(255,255,255,.07);',
        'border:1px solid rgba(255,255,255,.1);border-radius:9px;',
        'color:#fff;font-size:14px;font-family:inherit;',
        'outline:none;-webkit-appearance:none;',
        'transition:border-color .15s;',
      '}',
      '#tb-search-input-mob::placeholder{color:rgba(255,255,255,.3)}',
      '#tb-search-input-mob:focus{border-color:rgba(255,255,255,.25)}',
      '.tb-mobile-search .tb-search-icon-svg{',
        'position:absolute;left:10px;',
        'display:flex;align-items:center;',
        'color:rgba(255,255,255,.3);pointer-events:none;',
      '}',
      '.tb-mobile-search .tb-search-icon-svg svg{width:15px;height:15px}',
      '#tb-search-results-mob{margin-top:6px;border-radius:9px}',

      /* ── Responsive ── */
      '@media(max-width:640px){',
        '.tb-nav{display:none}',
        '.tb-search-wrap{display:none}',   /* înlocuit de cel din drawer */
        '.tb-points{display:none}',
        '.tb-user-name{display:none}',
        '.tb-hamburger{display:flex}',
        '.tb-panel{width:calc(100vw - 24px);max-width:400px}',
      '}',

    ].join('');
    document.head.appendChild(s);
  }

  function buildToolbar() {
    if (!document.body) return;

    injectStyles();

    /* CSS variables pentru grup color */
    document.documentElement.style.setProperty('--gc',       gc);
    document.documentElement.style.setProperty('--gc-light', gcL);
    document.documentElement.style.setProperty('--gc-dim',   gcDim);

    /* Aplică tema salvată */
    applyTheme(_darkMode);

    /* ── NAVBAR: filtrare + redenumire ── */
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

    /* Badge helper */
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

    /* ── Construire HTML toolbar ── */
    var tb = document.createElement('div');
    tb.id = 'ips-toolbar';
    tb.setAttribute('role', 'navigation');
    tb.setAttribute('aria-label', 'Bara principală');
    tb.innerHTML =
      '<a class="tb-logo" href="' + U.escAttr(forumHref) + '">' + U.escHtml(forumName) + '<span></span></a>' +
      '<div class="tb-divider"></div>' +
      '<nav class="tb-nav" aria-label="Navigare">' + navHTML + '</nav>' +

      /* Search */
      '<div class="tb-search-wrap">' +
        '<div class="tb-search-inner">' +
          '<span class="tb-search-icon-svg">' + IC.search + '</span>' +
          '<input type="search" id="tb-search-input" placeholder="Caută..." autocomplete="new-password" aria-label="Căutare rapidă" spellcheck="false" />' +
        '</div>' +
        '<div id="tb-search-results" class="tb-search-results" style="display:none"></div>' +
      '</div>' +

      /* Hamburger — vizibil doar pe mobile via CSS */
      '<button class="tb-hamburger" id="tb-hamburger" aria-label="Meniu" aria-expanded="false" aria-controls="tb-mobile-menu">' +
        '<div class="tb-ham-icon"><span></span><span></span><span></span></div>' +
      '</button>' +

      '<div class="tb-right">' +
        /* Buton temă */
        '<button class="tb-icon-btn" id="tb-theme-btn" title="' + (_darkMode ? 'Temă deschisă' : 'Temă închisă') + '">' +
          (_darkMode ? IC.sun : IC.moon) +
        '</button>' +

        (USER.session_logged_in
          /* ── UTILIZATOR AUTENTIFICAT ── */
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

          /* ── VIZITATOR ── */
          : '<div class="tb-divider"></div>' +
            '<button class="tb-btn-login" id="tb-btn-login" aria-expanded="false">Autentificare</button>' +
            '<a class="tb-btn-register" href="' + BASE + '/register">Înregistrare</a>'
        ) +
      '</div>';

    document.body.prepend(tb);

    var cont = document.getElementById('container');
    if (cont) cont.style.paddingTop = '56px';

    var mobileMenu = document.createElement('div');
    mobileMenu.id = 'tb-mobile-menu';
    mobileMenu.setAttribute('role', 'navigation');
    mobileMenu.setAttribute('aria-label', 'Meniu mobil');

    /* Construiește link-urile de nav pentru drawer */
    var mobileNavHTML = navItems.map(function (item) {
      var active = currentPath === item.href ? ' active' : '';
      return '<a href="' + U.escAttr(item.href) + '" class="' + active + '">' + U.escHtml(item.label) + '</a>';
    }).join('');

    /* Dacă userul e logat, adaugă și link-uri profil în drawer */
    var mobileUserLinks = USER.session_logged_in
      ? '<div class="tb-mobile-sep"></div>' +
        '<a href="' + BASE + '/u' + USER.user_id + '">Profilul meu</a>' +
        '<a href="' + BASE + '/privmsg?folder=inbox">Mesaje private</a>' +
        '<a href="' + BASE + '/profile?mode=editprofile&page_profil=preferences">Setări cont</a>' +
        '<a href="' + BASE + '/login?logout=1" style="color:rgba(239,100,100,.8)">Deconectare</a>'
      : '<div class="tb-mobile-sep"></div>' +
        '<a href="' + BASE + '/register">Înregistrare</a>';

    mobileMenu.innerHTML =
      /* Căutare în drawer */
      '<div class="tb-mobile-search">' +
        '<div class="tb-search-inner">' +
          '<span class="tb-search-icon-svg">' + IC.search + '</span>' +
          '<input type="search" id="tb-search-input-mob" placeholder="Caută..." autocomplete="new-password" spellcheck="false" />' +
        '</div>' +
        '<div id="tb-search-results-mob" class="tb-search-results" style="display:none"></div>' +
      '</div>' +
      '<div class="tb-mobile-sep"></div>' +
      /* Nav links */
      '<nav class="tb-mobile-nav">' +
        mobileNavHTML +
        mobileUserLinks +
      '</nav>';

    document.body.appendChild(mobileMenu);

    /* ── Hamburger toggle ── */
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

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        mobileMenu.classList.remove('open');
        if (hamBtn) { hamBtn.classList.remove('open'); hamBtn.setAttribute('aria-expanded','false'); }
      }
    });

    var searchMob = document.getElementById('tb-search-input-mob');
    var searchBoxMob = document.getElementById('tb-search-results-mob');
    if (searchMob && searchBoxMob) {
      var _searchTimerMob = null;
      searchMob.addEventListener('input', function () {
        var q = searchMob.value.trim();
        clearTimeout(_searchTimerMob);
        if (q.length < 2) { searchBoxMob.style.display = 'none'; return; }
        _searchTimerMob = setTimeout(function () {
          /* Refolosim doSearch dar afișăm în alt container */
          var origBox = document.getElementById('tb-search-results');
          /* Temporar redirectăm rezultatele */
          searchBoxMob.style.display = 'block';
          searchBoxMob.innerHTML = '<div class="tb-search-loading">Se caută...</div>';
          fetch(BASE + '/search?search_keywords=' + encodeURIComponent(q) + '&submit=true', { credentials: 'same-origin' })
            .then(function (r) { return r.text(); })
            .then(function (html) {
              var doc  = new DOMParser().parseFromString(html, 'text/html');
              var results = [];
              var seenM   = {};
              doc.querySelectorAll('a.topictitle').forEach(function (a) {
                if (results.length >= 6) return;
                var href  = (a.getAttribute('href') || '').split('?')[0].split('#')[0];
                var label = a.textContent.trim();
                if (!href || !label || seenM[href]) return;
                seenM[href] = 1;
                results.push({ label: label, href: href });
              });
              if (!results.length) { searchBoxMob.innerHTML = '<div class="tb-search-empty">Niciun rezultat</div>'; return; }
              var allH = BASE + '/search?search_keywords=' + encodeURIComponent(q) + '&submit=true';
              searchBoxMob.innerHTML = results.map(function (r) {
                return '<a href="' + U.escAttr(r.href) + '" class="tb-search-item">' +
                  '<span class="tb-search-icon">' + IC.topics + '</span>' +
                  '<span>' + U.escHtml(r.label) + '</span></a>';
              }).join('') +
              '<a href="' + U.escAttr(allH) + '" class="tb-search-all">Vezi toate →</a>';
            })
            .catch(function () { searchBoxMob.innerHTML = '<div class="tb-search-empty">Eroare</div>'; });
        }, 400);
      });
      searchMob.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { searchBoxMob.style.display = 'none'; searchMob.value = ''; }
        if (e.key === 'Enter') {
          e.preventDefault();
          window.location.href = BASE + '/search?search_keywords=' + encodeURIComponent(searchMob.value.trim()) + '&submit=true';
        }
      });
    }

    if (!USER.session_logged_in) {
      var ddLogin = document.createElement('div');
      ddLogin.id        = 'tb-dd-login';
      ddLogin.className = 'tb-dropdown tb-login-panel';
      ddLogin.setAttribute('role', 'dialog');
      ddLogin.setAttribute('aria-label', 'Autentificare');
      ddLogin.innerHTML =
        '<div class="tb-panel-head"><h3>Autentificare</h3></div>' +
        '<form class="tb-login-form" method="post" action="' + BASE + '/login">' +
          '<div class="tb-login-field">' +
            '<label for="tb-login-user">Utilizator</label>' +
            '<input type="text" id="tb-login-user" name="username" placeholder="Numele tău" autocomplete="username" required />' +
          '</div>' +
          '<div class="tb-login-field">' +
            '<label for="tb-login-pass">Parolă</label>' +
            '<input type="password" id="tb-login-pass" name="password" placeholder="••••••••" autocomplete="current-password" required />' +
          '</div>' +
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
    ddNotif.innerHTML =
      '<div class="tb-panel-head">' +
        '<h3>Notificări</h3>' +
        '<a href="#" id="tb-notif-mark-read">Marchează citite</a>' +
      '</div>' +
      '<div class="tb-panel-list" id="tb-notif-list">' +
        '<div class="tb-panel-empty">' + IC.bell_off + '<span>Se încarcă...</span></div>' +
      '</div>' +
      '<div class="tb-panel-footer">' +
        '<a href="/forum/index.php?app=core&module=global&section=notifications">Vezi toate notificările</a>' +
      '</div>';
    document.body.appendChild(ddNotif);

    var ddMsg = document.createElement('div');
    ddMsg.id        = 'tb-dd-msg';
    ddMsg.className = 'tb-dropdown tb-panel';
    ddMsg.setAttribute('role', 'region');
    ddMsg.setAttribute('aria-label', 'Mesaje private');
    ddMsg.innerHTML =
      '<div class="tb-panel-head">' +
        '<h3>Mesaje private</h3>' +
        '<a href="/privmsg?mode=compose">Mesaj nou</a>' +
      '</div>' +
      '<div class="tb-panel-list" id="tb-msg-list">' +
        '<div class="tb-panel-empty">' + IC.mail + '<span>Se încarcă...</span></div>' +
      '</div>' +
      '<div class="tb-panel-footer">' +
        '<a href="/privmsg?folder=inbox">Vezi toate mesajele</a>' +
      '</div>';
    document.body.appendChild(ddMsg);

    if (USER.session_logged_in) {
      var isAdmin  = String(USER.user_level) === '1';
      var privmsgBadge = USER.user_nb_privmsg > 0
        ? ' <span style="margin-left:6px;font-size:10px;background:var(--gc);color:#fff;padding:1px 6px;border-radius:10px">' + USER.user_nb_privmsg + '</span>'
        : '';

      var ddUser = document.createElement('div');
      ddUser.id        = 'tb-user-dropdown';
      ddUser.className = 'tb-dropdown';
      ddUser.style.cssText = 'padding:6px;width:220px';
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

    var liveNotif = document.createElement('div');
    liveNotif.id = Toolbar.LIVE_NOTIF;
    liveNotif.style.cssText = 'position:fixed;top:64px;right:16px;z-index:99999;width:330px;pointer-events:none';
    document.body.appendChild(liveNotif);

    var panels = USER.session_logged_in
      ? { 'tb-btn-notif': 'tb-dd-notif', 'tb-btn-msg': 'tb-dd-msg', 'tb-btn-user': 'tb-user-dropdown' }
      : { 'tb-btn-login': 'tb-dd-login' };

    /* Poziționare dropdown — scroll-aware, aliniat la dreapta butonului */
    function positionDropdown(btnEl, ddEl) {
      /* Folosim getBoundingClientRect pe elementul vizibil trigger */
      var triggerEl = btnEl;
      if (btnEl.id === 'tb-btn-user') {
        triggerEl = btnEl.closest('.tb-user') || btnEl;
      }
      var rect  = triggerEl.getBoundingClientRect();
      var ddW   = ddEl.offsetWidth || 220;
      var scrollX = window.scrollX || window.pageXOffset || 0;

      /* Aliniem dreapta dropdown-ului cu dreapta butonului */
      var left = rect.right - ddW + scrollX;

      /* Clamp sa nu iasa din viewport */
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
      /* Keyboard: Enter/Space */
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

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAll();
    });

    window.addEventListener('resize', function () {
      Object.keys(panels).forEach(function (btnId) {
        var dd = document.getElementById(panels[btnId]);
        if (dd && dd.classList.contains('open')) {
          positionDropdown(document.getElementById(btnId), dd);
        }
      });
    });

    /* Scroll: re-poziționează dropdownul deschis */
    window.addEventListener('scroll', function () {
      Object.keys(panels).forEach(function (btnId) {
        var dd = document.getElementById(panels[btnId]);
        if (dd && dd.classList.contains('open')) {
          positionDropdown(document.getElementById(btnId), dd);
        }
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

    /* Buton temă */
    var themeBtn = document.getElementById('tb-theme-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        _darkMode = !_darkMode;
        applyTheme(_darkMode);
      });
    }

    /* ── Search input ── */
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

  /* ── ENTRY POINT ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildToolbar);
  } else {
    buildToolbar();
  }

})();

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

  function sha256(str) {
    var data = new TextEncoder().encode(str);
    return crypto.subtle.digest('SHA-256', data).then(function (buf) {
      return Array.from(new Uint8Array(buf))
        .map(function (b) { return b.toString(16).padStart(2, '0'); })
        .join('');
    });
  }

  function injectStyles() {
    if (document.getElementById('ips-lock-styles')) return;
    var s = document.createElement('style');
    s.id  = 'ips-lock-styles';
    s.textContent = [

      /* Overlay care înlocuiește conținutul categoriei */
      '.ips-lock-overlay{',
        'display:flex;flex-direction:column;align-items:center;justify-content:center;',
        'padding:32px 20px;',
        'background:rgba(255,255,255,.03);',
        'border:1px solid rgba(255,255,255,.07);',
        'border-radius:10px;',
        'margin:0;',
        'text-align:center;',
        'gap:16px;',
      '}',

      /* Icon lacăt */
      '.ips-lock-icon{',
        'width:48px;height:48px;',
        'background:rgba(255,255,255,.06);',
        'border-radius:50%;',
        'display:flex;align-items:center;justify-content:center;',
        'flex-shrink:0;',
      '}',
      '.ips-lock-icon svg{width:22px;height:22px;stroke:rgba(255,255,255,.4)}',

      /* Titlu + subtitlu */
      '.ips-lock-title{',
        'font-size:15px;font-weight:600;color:rgba(255,255,255,.85);',
        'margin:0;',
      '}',
      '.ips-lock-sub{',
        'font-size:12px;color:rgba(255,255,255,.35);',
        'margin:0;',
      '}',

      /* Input + buton */
      '.ips-lock-form{',
        'display:flex;gap:8px;width:100%;max-width:320px;',
      '}',
      '.ips-lock-input{',
        'flex:1;height:38px;',
        'padding:0 12px;',
        'background:rgba(255,255,255,.07);',
        'border:1px solid rgba(255,255,255,.1);',
        'border-radius:8px;',
        'color:#fff;font-size:13px;font-family:inherit;',
        'outline:none;',
        'transition:border-color .15s,background .15s;',
      '}',
      '.ips-lock-input:focus{',
        'background:rgba(255,255,255,.1);',
        'border-color:rgba(255,255,255,.25);',
      '}',
      '.ips-lock-input::placeholder{color:rgba(255,255,255,.25)}',
      '.ips-lock-input.error{',
        'border-color:rgba(239,68,68,.6);',
        'animation:ips-lock-shake .3s ease;',
      '}',
      '.ips-lock-btn{',
        'height:38px;padding:0 16px;',
        'background:rgba(255,255,255,.12);',
        'border:1px solid rgba(255,255,255,.15);',
        'border-radius:8px;',
        'color:#fff;font-size:13px;font-weight:600;font-family:inherit;',
        'cursor:pointer;white-space:nowrap;',
        'transition:background .15s;',
      '}',
      '.ips-lock-btn:hover{background:rgba(255,255,255,.2)}',
      '.ips-lock-btn:disabled{opacity:.5;cursor:not-allowed}',

      /* Mesaj eroare */
      '.ips-lock-error{',
        'font-size:12px;color:#f87171;',
        'display:none;',
      '}',
      '.ips-lock-error.visible{display:block}',

      /* Animatie shake la eroare */
      '@keyframes ips-lock-shake{',
        '0%,100%{transform:translateX(0)}',
        '20%,60%{transform:translateX(-6px)}',
        '40%,80%{transform:translateX(6px)}',
      '}',

      /* Animatie unlock */
      '@keyframes ips-lock-reveal{',
        'from{opacity:0;transform:translateY(8px)}',
        'to{opacity:1;transform:translateY(0)}',
      '}',
      '.ips-lock-revealed{',
        'animation:ips-lock-reveal .3s ease forwards;',
      '}',

    ].join('');
    document.head.appendChild(s);
  }

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
          /* Corect — salvăm în sessionStorage și revelăm conținutul */
          sessionStorage.setItem(SS_KEY + categoryId, '1');
          revealCategory(categoryId, bodyEl, overlay);
        } else {
          /* Greșit */
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

  function buildPageOverlay(categoryId) {
    /* Wrapper care acoperă tot conținutul paginii */
    var wrap = document.createElement('div');
    wrap.id = 'ips-page-lock';
    wrap.style.cssText = [
      'position:fixed;inset:0;z-index:99990;',
      'background:var(--f-surface,#1a2330);',
      'display:flex;align-items:center;justify-content:center;',
      'padding:20px;',
    ].join('');

    var box = document.createElement('div');
    box.className = 'ips-lock-overlay';
    box.style.cssText = 'max-width:380px;width:100%';

    /* Titlul paginii ca hint */
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

    /* Focus automat pe input */
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
          /* Fade out overlay și afișăm pagina */
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

  function revealCategory(categoryId, bodyEl, overlay) {
    overlay.style.transition = 'opacity .2s';
    overlay.style.opacity    = '0';
    setTimeout(function () {
      overlay.remove();
      /* Restaurăm toti fratii ascunsi */
      var parent = bodyEl.parentNode;
      var siblings = parent ? parent.children : [];
      for (var si = 0; si < siblings.length; si++) {
        var sib = siblings[si];
        if (sib.dataset && sib.dataset.ipsLockHidden) {
          sib.style.display = '';
          delete sib.dataset.ipsLockHidden;
        }
      }
      /* Afișăm conținutul real cu animație */
      bodyEl.style.display = '';
      bodyEl.classList.add('ips-lock-revealed');
    }, 200);
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function init() {
    /* Web Crypto nu e disponibil pe HTTP simplu */
    if (!window.crypto || !window.crypto.subtle) {
      console.warn('[IPS Lock] Web Crypto API indisponibil (necesită HTTPS)');
      return;
    }

    injectStyles();

    /* ── Verificare URL direct ── */
    var path = window.location.pathname;
    var matchedCatId = null;
    Object.keys(URL_LOCKS).forEach(function (urlPrefix) {
      if (path.indexOf(urlPrefix) === 0) {
        matchedCatId = URL_LOCKS[urlPrefix];
      }
    });

    if (matchedCatId && LOCKS[matchedCatId]) {
      /* URL protejat — verificăm dacă e deja deblocat */
      if (!sessionStorage.getItem(SS_KEY + matchedCatId)) {
        /* Blocăm imediat pagina înainte să se randeze conținutul */
        document.documentElement.style.overflow = 'hidden';
        buildPageOverlay(matchedCatId);
        /* Ascundem conținutul principal până la deblocare */
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

    Object.keys(LOCKS).forEach(function (categoryId) {
      /* Găsim body-ul categoriei după id */
      var bodyEl = document.getElementById(categoryId);
      if (!bodyEl) return;

      /* Dacă e deja deblocat în această sesiune — skip */
      if (sessionStorage.getItem(SS_KEY + categoryId)) return;

      /* Găsim titlul categoriei din header */
      var headerEl = bodyEl.previousElementSibling;
      var titleEl  = headerEl ? headerEl.querySelector('.ips-category-title') : null;
      var title    = titleEl ? titleEl.textContent.trim() : 'această categorie';

      bodyEl.style.display = 'none';

      var parent = bodyEl.parentNode;
      var siblings = parent ? parent.children : [];
      for (var si = 0; si < siblings.length; si++) {
        var sib = siblings[si];
        if (sib === bodyEl) continue;
        /* Pastram .ips-category-header (titlul cu lacatul) */
        if (sib.classList && sib.classList.contains('ips-category-header')) continue;
        /* Ascundem restul: .ips-forum-list-header, .ips-forum-row etc. */
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


(function () {
  'use strict';

  var U = window.IpsUtils || {
    escHtml: function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); },
    escAttr: function(s){ return String(s||'').replace(/"/g,'&quot;'); },
  };
  var LOCKED_CATEGORIES = ['c1'];
  var EMPTY_THRESHOLD = 0;
  var IC = {
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="9" y1="10" x2="15" y2="10"/></svg>',
    forum: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    topic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
  };

  function injectStyles() {
    if (document.getElementById('ips-fe-styles')) return;
    var s = document.createElement('style');
    s.id  = 'ips-fe-styles';
    s.textContent = [
      '.ips-subforum-grid{',
        'display:grid;',
        'grid-template-columns:repeat(auto-fill,minmax(200px,1fr));',
        'gap:8px;',
        'margin-top:8px;',
        'padding:0 0 4px;',
      '}',

      '.ips-subforum-card{',
        'display:flex;flex-direction:column;',
        'padding:10px 12px;',
        'background:rgba(255,255,255,.04);',
        'border:1px solid rgba(255,255,255,.07);',
        'border-radius:8px;',
        'text-decoration:none;',
        'transition:background .15s,border-color .15s,transform .15s;',
        'position:relative;overflow:hidden;',
      '}',
      '.ips-subforum-card:hover{',
        'background:rgba(255,255,255,.08);',
        'border-color:rgba(255,255,255,.14);',
        'transform:translateY(-1px);',
      '}',

      /* Accent bar stânga */
      '.ips-subforum-card::before{',
        'content:"";',
        'position:absolute;left:0;top:0;bottom:0;',
        'width:3px;',
        'background:var(--gc,#1B6AA7);',
        'opacity:.6;',
        'border-radius:8px 0 0 8px;',
      '}',

      '.ips-sf-name{',
        'font-size:13px;font-weight:600;',
        'color:rgba(255,255,255,.85);',
        'margin-bottom:6px;',
        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;',
      '}',

      '.ips-sf-meta{',
        'display:flex;align-items:center;gap:10px;',
        'font-size:11px;color:rgba(255,255,255,.35);',
        'margin-bottom:6px;',
      '}',
      '.ips-sf-meta-item{',
        'display:flex;align-items:center;gap:3px;',
      '}',
      '.ips-sf-meta-item svg{width:11px;height:11px;opacity:.6}',

      '.ips-sf-last{',
        'font-size:11px;',
        'color:rgba(255,255,255,.3);',
        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;',
        'border-top:1px solid rgba(255,255,255,.05);',
        'padding-top:6px;margin-top:auto;',
        'display:flex;align-items:center;gap:4px;',
      '}',
      '.ips-sf-last svg{width:11px;height:11px;flex-shrink:0;opacity:.4}',
      '.ips-sf-last-text{',
        'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;',
      '}',
      '.ips-sf-last a{',
        'color:rgba(255,255,255,.45);text-decoration:none;',
      '}',
      '.ips-sf-last a:hover{color:rgba(255,255,255,.75)}',

      /* Label "Subforumuri" */
      '.ips-subforum-label{',
        'font-size:10px;font-weight:600;',
        'color:rgba(255,255,255,.25);',
        'letter-spacing:.06em;text-transform:uppercase;',
        'margin-bottom:6px;margin-top:4px;',
      '}',

      /* ══════════════════════════════
         EMPTY STATE
      ══════════════════════════════ */
      '.ips-empty-state{',
        'display:flex;flex-direction:column;align-items:center;',
        'justify-content:center;',
        'padding:28px 16px;',
        'gap:8px;',
        'color:rgba(255,255,255,.2);',
        'text-align:center;',
      '}',
      '.ips-empty-state svg{',
        'width:32px;height:32px;',
        'opacity:.2;',
        'margin-bottom:4px;',
      '}',
      '.ips-empty-title{',
        'font-size:13px;font-weight:500;',
        'color:rgba(255,255,255,.25);',
      '}',
      '.ips-empty-sub{',
        'font-size:11px;',
        'color:rgba(255,255,255,.15);',
      '}',

      /* ══════════════════════════════
         LOCKED LAST POST
      ══════════════════════════════ */
      '.ips-lastpost-locked{',
        'display:flex;align-items:center;justify-content:center;',
        'gap:6px;',
        'color:rgba(255,255,255,.18);',
        'font-size:12px;',
      '}',
      '.ips-lastpost-locked svg{',
        'width:14px;height:14px;',
        'flex-shrink:0;',
      '}',

      /* Responsive grid */
      '@media(max-width:480px){',
        '.ips-subforum-grid{grid-template-columns:1fr 1fr}',
      '}',
      '@media(max-width:320px){',
        '.ips-subforum-grid{grid-template-columns:1fr}',
      '}',

    ].join('');
    document.head.appendChild(s);
  }

  function enhanceSubforums() {
    document.querySelectorAll('.ips-forum-subs').forEach(function (subsEl) {
      var links = subsEl.querySelectorAll('a[href]');
      if (!links.length) return;

      /* Construim carduri pentru fiecare subforum */
      var grid = document.createElement('div');
      grid.className = 'ips-subforum-grid';

      links.forEach(function (a) {
        var href  = a.getAttribute('href') || '#';
        var name  = a.textContent.trim();
        if (!name) return;

        /* Extragem numere din title/alt dacă există */
        var title = a.getAttribute('title') || '';
        var topicsMatch = title.match(/(\d+)\s*(topic|subiect)/i);
        var postsMatch  = title.match(/(\d+)\s*(post|mesaj)/i);
        var topics = topicsMatch ? topicsMatch[1] : null;
        var posts  = postsMatch  ? postsMatch[1]  : null;

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
          metaHTML = '<div class="ips-sf-meta">' +
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

      /* Forum gol: topics=0 sau NaN și niciun last-post */
      var isEmpty = (isNaN(topics) || topics <= EMPTY_THRESHOLD);
      if (!isEmpty) return;

      lastEl.innerHTML =
        '<div class="ips-empty-state">' +
          IC.empty +
          '<span class="ips-empty-title">Nicio postare încă</span>' +
          '<span class="ips-empty-sub">Fii primul care postează!</span>' +
        '</div>';
    });
  }

  function enhanceLockedCategories() {
    LOCKED_CATEGORIES.forEach(function (catId) {
      var bodyEl = document.getElementById(catId);
      if (!bodyEl) return;

      bodyEl.querySelectorAll('.ips-forum-last').forEach(function (lastEl) {
        /* Verificăm dacă are conținut real */
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

  function init() {
    injectStyles();
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
