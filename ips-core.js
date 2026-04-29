(function (w) {
  'use strict';
  
  var CU = w.ColorUtils || {
    parseRGB: function (col) {
      if (!col) return null; col = col.trim();
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
      return rgb ? 'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+a+')' : 'rgba(255,255,255,'+a+')';
    },
    lighten: function (col, amt) {
      amt = amt === undefined ? 60 : amt;
      var rgb = this.parseRGB(col);
      if (!rgb) return '#ffffff';
      return '#' + [Math.min(255,rgb.r+amt),Math.min(255,rgb.g+amt),Math.min(255,rgb.b+amt)]
        .map(function(x){ return x.toString(16).padStart(2,'0'); }).join('');
    },
  };

  var U = w.IpsUtils || {
    initials: function(n){ return (n||'?').split(' ').map(function(w){return w[0]||'';}).join('').substring(0,2).toUpperCase()||'?'; },
    escHtml:  function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); },
    escAttr:  function(s){ return String(s||'').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); },
  };

  /* ── Debug vizual: adaugă ?ips_debug=1 în URL ── */
  var DEBUG = /[?&]ips_debug=1/.test(w.location.search);

  var ips = {
    _data: {},
    
    init: function () {
      console.log('%c IPS Core has been registred.', 'color: skyblue;font-size:10px;font-family: monospace;');
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
    
    forum_stats_core: function (el) {
      var data = {
        total_mesaje:     null,
        total_membri:     null,
        record_online:    null,
        ultim_utilizator: null,
      };

      function num(node) {
        if (!node) return null;
        var bolds = node.querySelectorAll('strong, b');
        for (var i = 0; i < bolds.length; i++) {
          var n = parseInt((bolds[i].textContent || '').replace(/[^0-9]/g, ''), 10);
          if (!isNaN(n) && n >= 0) return n;
        }
        var m = (node.textContent || '').match(/(\d+)/);
        return m ? parseInt(m[1], 10) : null;
      }

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
        data.total_mesaje     = num(ps[0]);
        data.total_membri     = num(ps[1]);
        data.ultim_utilizator = extractUser(ps[2]);
        var rn = num(ps[3]);
        var rd = (ps[3].textContent || '').match(/(\w{3}\s+\d{1,2}\s+\w{3}\s+\d{4}|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/);
        data.record_online = { numar: rn !== null ? rn : 0, data: rd ? rd[1] : null };
      } else if (ps.length > 0) {
        if (ps[0]) data.total_mesaje     = num(ps[0]);
        if (ps[1]) data.total_membri     = num(ps[1]);
        if (ps[2]) data.ultim_utilizator = extractUser(ps[2]);
        if (ps[3]) data.record_online    = { numar: num(ps[3]) || 0, data: null };
      } else {
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
      var u = data.ultim_utilizator || {};
      var r = data.record_online    || {};

      var html =
        '<div class="ips-block">' +
          ips._title('Statistici forum') +
          '<div class="ips-stats-grid">' +
            ips._sbox('Mesaje', data.total_mesaje !== null ? data.total_mesaje : '—') +
            ips._sbox('Membri', data.total_membri  !== null ? data.total_membri  : '—') +
            ips._sboxRecord(r.numar, r.data) +
          '</div>' +
          '<div class="ips-separator"></div>' +
          '<div class="ips-section-label">Ultimul înregistrat</div>' +
          '<div class="ips-chips-wrap">' +
            ips._userChip(u.profil || '#', u.culoare, u.nume || '—', true) +
          '</div>' +
        '</div>';

      ips._replace(el, html);
    },
    
    forum_whois_online_core: function (el) {
      var text = el.textContent || '';

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
      /* Culori utilizatori — rămân dinamice (group color per user) */
      var usersHTML = data.useri_online.length
        ? data.useri_online.map(function (u) {
            return ips._userChip(u.profil, u.culoare, u.nume, true);
          }).join('')
        : '<span class="ips-no-users">Niciun utilizator conectat</span>';

      /* Culori grupuri — rămân dinamice (fiecare grup are propria culoare) */
      var groupsHTML = data.grupuri.length
        ? data.grupuri.map(function (g) {
            var col   = g.culoare || 'rgba(255,255,255,.6)';
            var bg    = CU.alphaBg(col, .12);
            var brd   = CU.alphaBg(col, .35);
            var light = CU.lighten(col);
            var cnt   = (g.titlu || '').match(/(\d+)$/);
            return '<a href="' + U.escAttr(g.link) + '" class="ips-group-chip" style="' +
              'border:1px solid ' + brd + ';background:' + bg + ';color:' + light + '">' +
              U.escHtml(g.nume) +
              (cnt ? '<span class="ips-group-chip-count">(' + cnt[1] + ')</span>' : '') +
            '</a>';
          }).join('')
        : '<span class="ips-no-users">—</span>';

      var html =
        '<div class="ips-block">' +
          ips._title('Online acum') +
          '<div class="ips-online-grid">' +
            ips._sbox('Total',  data.total_online  || 0) +
            ips._sbox('Înreg.', data.inregistrati  || 0) +
            ips._sbox('Inviz.', data.invizibili    || 0) +
            ips._sbox('Vizit.', data.vizitatori    || 0) +
          '</div>' +
          '<div class="ips-separator"></div>' +
          '<div class="ips-section-label">Conectati</div>' +
          '<div class="ips-chips-wrap">' + usersHTML + '</div>' +
          '<div class="ips-separator"></div>' +
          '<div class="ips-section-label"></div>' +
          '<div class="ips-chips-wrap">' + groupsHTML + '</div>' +
        '</div>';

      ips._replace(el, html);
    },

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
        try { el.innerHTML = html; } catch (_) {}
      }
    },

    _renderError: function (el, funcName, err) {
      var html = '<div class="ips-render-error">' +
        '<strong>[IPS] ' + U.escHtml(funcName) + '</strong><br>' +
        U.escHtml(String(err)) + '</div>';
      ips._replace(el, html);
    },

    _debugOverlay: function (el, fname, data) {
      var box = document.createElement('div');
      box.style.cssText = 'position:relative;z-index:9999;margin:4px 0;' +
        'background:#0a0a0a;border:2px solid #f59e0b;border-radius:8px;' +
        'padding:10px 12px;font-size:11px;font-family:monospace;' +
        'color:#fcd34d;white-space:pre-wrap;word-break:break-all;max-height:260px;overflow:auto';
      box.textContent = '[' + fname + ']\n' + JSON.stringify(data, null, 2);
      if (el.parentNode) el.parentNode.insertBefore(box, el.nextSibling);
    },
    
    _title: function (label) {
      return '<div class="ips-block-title">' + U.escHtml(label) + '</div>';
    },

    _sbox: function (label, val) {
      return '<div class="ips-stat-box">' +
        '<div class="ips-stat-box-label">' + U.escHtml(label) + '</div>' +
        '<div class="ips-stat-box-value">' + U.escHtml(String(val)) + '</div>' +
      '</div>';
    },

    _sboxRecord: function (numar, data) {
      return '<div class="ips-stat-box">' +
        '<div class="ips-stat-box-label">Record</div>' +
        '<div class="ips-stat-box-value">' +
          U.escHtml(String(numar !== null && numar !== undefined ? numar : '—')) +
        '</div>' +
        (data ? '<div class="ips-stat-box-date">' + U.escHtml(data) + '</div>' : '') +
      '</div>';
    },

    /* User chip — culoarea avatarului rămâne dinamică (group color per user) */
    _userChip: function (href, culoare, nume, withDataAttrs) {
      var col   = culoare || null;
      /* Stiluri inline DOAR pentru culorile dinamice ale avatarului */
      var avStyle = col
        ? 'background:' + CU.alphaBg(col, .22) + ';color:' + CU.lighten(col) + ';'
        : '';
      var attrs = withDataAttrs
        ? ' data-user-name="'   + U.escAttr(nume  || '') + '"' +
          ' data-user-color="'  + U.escAttr(col || '') + '"' +
          ' data-user-profil="' + U.escAttr(href  || '') + '"'
        : '';
      return '<a href="' + U.escAttr(href || '#') + '" class="ips-chip"' + attrs + '>' +
        '<div class="ips-chip-av" style="' + avStyle + '">' + U.initials(nume) + '</div>' +
        '<span class="ips-chip-name">' + U.escHtml(nume || '—') + '</span>' +
      '</a>';
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { ips.init(); });
  } else {
    ips.init();
  }

  w.ips = ips;

})(window);
