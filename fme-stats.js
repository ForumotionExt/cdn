function extractNumber(html) {
  var tmp = document.createElement('div');
  tmp.innerHTML = html;
  var strong = tmp.querySelector('strong');
  return strong ? strong.textContent.trim() : '0';
}

function setData(selector, value) {
  document.querySelectorAll('[data-string="' + selector + '"]')
    .forEach(function(el) { el.textContent = value; });
}

function applyStats(stats) {
  setData('total_topics', stats.FORUMCOUNTOPIC || '0');
  setData('total_posts',  stats.FORUMCOUNTPOST || '0');
  setData('total_users',  stats.FORUMCOUNTUSER || '0');
  setData('lastuser',     stats.FORUMLASTUSER  || '');
  setData('username',     stats.USERNAME        || 'Vizitator');
  var onlineHtml = '';
  if (window.FME_STATS && window.FME_STATS.online_text) {
    onlineHtml = window.FME_STATS.online_text;
  }
  setData('online_users', extractNumber(onlineHtml));
}

function parseStats(html) {
  var parser = new DOMParser();
  var doc = parser.parseFromString(html, 'text/html');
  var stats = new Object();
  var open  = String.fromCharCode(123);
  var close = String.fromCharCode(125);
  doc.querySelectorAll('li').forEach(function(li) {
    var text     = li.textContent.trim();
    var keyStart = text.indexOf(open) + 1;
    var keyEnd   = text.indexOf(close);
    var colon    = text.indexOf(' : ');
    if (keyStart <= 0 || keyEnd <= keyStart || colon === -1) return;
    var key   = text.substring(keyStart, keyEnd);
    var value = text.substring(colon + 3);
    var paren = value.indexOf(' (');
    if (paren > -1) value = value.substring(0, paren);
    if (key) stats[key] = value.trim();
  });
  return stats;
}

function runObserver(stats) {
  var options = new Object();
  options.childList = true;
  options.subtree   = true;
  var observer = new MutationObserver(function(mutations, obs) {
    var el = document.querySelector('[data-string="total_topics"]');
    if (el) {
      applyStats(stats);
      obs.disconnect();
    }
  });
  observer.observe(document.body, options);
}

fetch('/popup_help.php?l=miscvars&i=mes_txt')
  .then(function(res) { return res.text(); })
  .then(function(html) {
    var stats = parseStats(html);
    var el = document.querySelector('[data-string="total_topics"]');
    if (el) {
      applyStats(stats);
    } else {
      runObserver(stats);
    }
  })
  .catch(function(err) {
    console.error('FME Stats error:', err);
  });
