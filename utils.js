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

    escHtml: function (s) {
      return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    },

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
