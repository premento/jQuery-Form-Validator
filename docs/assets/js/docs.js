/**
 * jQuery Form Validator — documentation site behaviour.
 *
 * Dependency free on purpose. The pages are plain HTML and stay readable with
 * JavaScript turned off; everything here is enhancement — syntax colouring,
 * copy buttons, the table of contents, search and the theme toggle.
 */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- *
   * Theme
   * ---------------------------------------------------------------- */

  var STORAGE_KEY = 'jfv-docs-theme';

  function storedTheme() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (ignored) {
      // Private mode, or storage blocked entirely.
      return null;
    }
  }

  function applyTheme(theme) {
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    var btn = document.querySelector('.theme-toggle');
    if (btn) {
      var dark = theme === 'dark' ||
        (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
      // Which icon shows is decided in CSS; only the label changes here, so
      // the SVG markup is never rewritten.
      btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    }
  }

  function initTheme() {
    applyTheme(storedTheme());

    var btn = document.querySelector('.theme-toggle');
    if (!btn) { return; }

    btn.addEventListener('click', function () {
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
        (!document.documentElement.getAttribute('data-theme') &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);
      var next = isDark ? 'light' : 'dark';
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch (ignored) {
        // Remembering the choice is a convenience, not a requirement.
      }
      applyTheme(next);
    });
  }

  /* ---------------------------------------------------------------- *
   * Mobile navigation
   * ---------------------------------------------------------------- */

  function initNav() {
    var toggle = document.querySelector('.nav-toggle'),
      sidebar = document.querySelector('.sidebar'),
      backdrop = document.querySelector('.sidebar-backdrop');

    if (!toggle || !sidebar) { return; }

    function setOpen(open) {
      sidebar.classList.toggle('open', open);
      if (backdrop) { backdrop.classList.toggle('open', open); }
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    toggle.addEventListener('click', function () {
      setOpen(!sidebar.classList.contains('open'));
    });

    if (backdrop) {
      backdrop.addEventListener('click', function () { setOpen(false); });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { setOpen(false); }
    });

    // Following a link on a phone should reveal the page, not leave the
    // drawer covering it.
    sidebar.addEventListener('click', function (e) {
      if (e.target.closest('a')) { setOpen(false); }
    });
  }

  /* ---------------------------------------------------------------- *
   * Syntax highlighting
   *
   * Small on purpose: the samples on this site are HTML and JavaScript and
   * nothing else. Everything is escaped first, so a bad match can only ever
   * colour something oddly -- it can never change the code being shown.
   * ---------------------------------------------------------------- */

  function escapeHtml(str) {
    return str.replace(/[&<>]/g, function (c) {
      return c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;';
    });
  }

  function span(cls, text) {
    return '<span class="tok-' + cls + '">' + escapeHtml(text) + '</span>';
  }

  var JS_KEYWORDS = new RegExp(
    '\\b(?:var|let|const|function|return|if|else|for|while|do|new|this|typeof|' +
    'instanceof|true|false|null|undefined|import|export|from|default|class|' +
    'extends|try|catch|finally|throw|switch|case|break|continue|delete|in|of|' +
    'async|await|void|yield)\\b'
  );

  /**
   * Run an ordered list of [class, regex] rules over a string.
   * The first rule that matches at the earliest position wins.
   */
  function tokenize(src, rules, tagRenderer) {
    var out = '',
      pos = 0;

    while (pos < src.length) {
      var best = null,
        bestIndex = Infinity,
        bestRule = null,
        i;

      for (i = 0; i < rules.length; i++) {
        var re = new RegExp(rules[i][1].source, 'g');
        re.lastIndex = pos;
        var m = re.exec(src);
        if (m && m.index < bestIndex) {
          bestIndex = m.index;
          best = m;
          bestRule = rules[i][0];
        }
      }

      if (!best) {
        out += escapeHtml(src.slice(pos));
        break;
      }

      out += escapeHtml(src.slice(pos, bestIndex));
      out += bestRule === '__tag__' && tagRenderer
        ? tagRenderer(best[0])
        : span(bestRule, best[0]);
      pos = bestIndex + best[0].length;
    }

    return out;
  }

  function highlightJs(src) {
    return tokenize(src, [
      ['comment', /\/\*[\s\S]*?\*\/|\/\/[^\n]*/],
      ['string', /'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/],
      ['number', /\b\d+(?:\.\d+)?\b/],
      ['keyword', JS_KEYWORDS],
      ['fn', /\b[A-Za-z_$][\w$]*(?=\s*\()/]
    ]);
  }

  /** Colour the inside of a single <tag ...> block. */
  function renderTag(tag) {
    var out = '',
      pos = 0,
      re = /("(?:[^"]*)"|'(?:[^']*)')|([A-Za-z_:][-\w:.]*)(?==)|(^<\/?)([A-Za-z][-\w]*)/g,
      m;

    while ((m = re.exec(tag)) !== null) {
      out += escapeHtml(tag.slice(pos, m.index));
      if (m[1]) {
        out += span('string', m[1]);
      } else if (m[2]) {
        out += span('attr', m[2]);
      } else {
        out += escapeHtml(m[3]) + span('tag', m[4]);
      }
      pos = m.index + m[0].length;
    }

    out += escapeHtml(tag.slice(pos));
    return out;
  }

  function highlightHtml(src) {
    return tokenize(src, [
      ['comment', /<!--[\s\S]*?-->/],
      ['doctype', /<!DOCTYPE[^>]*>/i],
      ['__tag__', /<\/?[A-Za-z][^>]*>/]
    ], renderTag);
  }

  function initHighlight() {
    var blocks = document.querySelectorAll('pre > code[data-lang]');

    Array.prototype.forEach.call(blocks, function (code) {
      var lang = code.getAttribute('data-lang'),
        src = code.textContent;

      if (lang === 'js' || lang === 'javascript') {
        code.innerHTML = highlightJs(src);
      } else if (lang === 'html') {
        code.innerHTML = highlightHtml(src);
      }
      // Anything else (bash, json, text) is left as plain text.
    });
  }

  /* ---------------------------------------------------------------- *
   * Copy buttons
   * ---------------------------------------------------------------- */

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    // Older engines, and any page not served from a secure context.
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy') ? resolve() : reject(new Error('copy rejected'));
      } catch (err) {
        reject(err);
      } finally {
        document.body.removeChild(ta);
      }
    });
  }

  /**
   * A horizontally scrolling region has to be reachable by keyboard.
   * Only the code blocks that actually overflow get a tab stop, so pages
   * full of short samples do not collect pointless ones.
   */
  function syncScrollableCode() {
    Array.prototype.forEach.call(document.querySelectorAll('.code-block pre'), function (pre) {
      var scrolls = pre.scrollWidth > pre.clientWidth + 1;
      if (scrolls) {
        pre.setAttribute('tabindex', '0');
        pre.setAttribute('role', 'region');
        pre.setAttribute('aria-label', 'Code sample, scrollable');
      } else {
        pre.removeAttribute('tabindex');
        pre.removeAttribute('role');
        pre.removeAttribute('aria-label');
      }
    });
  }

  function initScrollableCode() {
    syncScrollableCode();

    // Run again once the webfonts land. The bundled mono is wider than the
    // fallback, so a block that fitted at first paint can start overflowing
    // when the real font swaps in -- and it would then scroll with no way to
    // reach it from the keyboard.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(syncScrollableCode);
    }

    var pending = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(pending);
      pending = window.setTimeout(syncScrollableCode, 150);
    });
  }

  function initCopy() {
    Array.prototype.forEach.call(document.querySelectorAll('.copy-btn'), function (btn) {
      btn.addEventListener('click', function () {
        var block = btn.closest('.code-block'),
          code = block && block.querySelector('pre code');
        if (!code) { return; }

        copyText(code.textContent).then(function () {
          var original = btn.textContent;
          btn.textContent = 'Copied';
          btn.classList.add('copied');
          window.setTimeout(function () {
            btn.textContent = original;
            btn.classList.remove('copied');
          }, 1600);
        }).catch(function () {
          btn.textContent = 'Press Ctrl+C';
          window.setTimeout(function () { btn.textContent = 'Copy'; }, 1600);
        });
      });
    });
  }

  /* ---------------------------------------------------------------- *
   * Heading anchors and table of contents
   * ---------------------------------------------------------------- */

  function initHeadings() {
    var headings = document.querySelectorAll('.content-inner h2[id], .content-inner h3[id]');

    Array.prototype.forEach.call(headings, function (h) {
      var a = document.createElement('a');
      a.className = 'anchor';
      a.href = '#' + h.id;
      a.textContent = '#';
      a.setAttribute('aria-label', 'Link to this section');
      h.appendChild(a);
    });

    var toc = document.querySelector('.toc-list');
    if (!toc) { return; }

    var items = [];
    Array.prototype.forEach.call(headings, function (h) {
      var li = document.createElement('li'),
        a = document.createElement('a');
      a.href = '#' + h.id;
      // Strip the anchor character the loop above appended.
      a.textContent = h.firstChild ? h.firstChild.textContent.trim() : h.id;
      if (h.tagName === 'H3') { a.className = 'toc-h3'; }
      li.appendChild(a);
      toc.appendChild(li);
      items.push({heading: h, link: a});
    });

    if (!items.length) {
      var wrap = document.querySelector('.toc');
      if (wrap) { wrap.style.display = 'none'; }
      return;
    }

    // Scrollspy. IntersectionObserver alone reports the wrong entry when
    // several headings share a viewport, so the closest heading above the
    // reading line is used instead.
    function sync() {
      var line = window.scrollY + 140,
        current = items[0];

      for (var i = 0; i < items.length; i++) {
        if (items[i].heading.offsetTop <= line) {
          current = items[i];
        } else {
          break;
        }
      }

      items.forEach(function (item) {
        item.link.classList.toggle('active', item === current);
      });
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) { return; }
      ticking = true;
      window.requestAnimationFrame(function () {
        sync();
        ticking = false;
      });
    }, {passive: true});

    sync();
  }

  /* ---------------------------------------------------------------- *
   * Search
   *
   * The index is a plain script (window.DOCS_SEARCH_INDEX) rather than JSON
   * fetched at runtime, so search still works when the site is opened from
   * the file system, where fetch() of a sibling file is blocked.
   * ---------------------------------------------------------------- */

  function initSearch() {
    var input = document.querySelector('.search input'),
      results = document.querySelector('.search-results'),
      index = window.DOCS_SEARCH_INDEX || [],
      base = document.body.getAttribute('data-base') || '';

    if (!input || !results) { return; }

    var active = -1,
      links = [];

    function close() {
      results.classList.remove('open');
      results.innerHTML = '';
      active = -1;
      links = [];
      input.setAttribute('aria-expanded', 'false');
    }

    function score(entry, terms) {
      var haystackTitle = entry.title.toLowerCase(),
        haystackBody = (entry.text || '').toLowerCase(),
        total = 0,
        i;

      for (i = 0; i < terms.length; i++) {
        var t = terms[i];
        if (haystackTitle.indexOf(t) === 0) {
          total += 12;
        } else if (haystackTitle.indexOf(t) > -1) {
          total += 7;
        } else if (haystackBody.indexOf(t) > -1) {
          total += 2;
        } else {
          return 0; // every term has to appear somewhere
        }
      }
      return total;
    }

    function run() {
      var q = input.value.trim().toLowerCase();

      if (q.length < 2) { return close(); }

      var terms = q.split(/\s+/),
        hits = [];

      index.forEach(function (entry) {
        var s = score(entry, terms);
        if (s > 0) { hits.push({entry: entry, score: s}); }
      });

      hits.sort(function (a, b) { return b.score - a.score; });
      hits = hits.slice(0, 12);

      if (!hits.length) {
        results.innerHTML = '<p class="search-empty">No matches for &ldquo;' +
          escapeHtml(input.value.trim()) + '&rdquo;</p>';
        results.classList.add('open');
        input.setAttribute('aria-expanded', 'true');
        links = [];
        return;
      }

      var ul = document.createElement('ul');
      hits.forEach(function (hit) {
        var li = document.createElement('li'),
          a = document.createElement('a');
        a.href = base + hit.entry.url;
        a.innerHTML = escapeHtml(hit.entry.title) +
          '<span class="r-page">' + escapeHtml(hit.entry.page) + '</span>';
        li.appendChild(a);
        ul.appendChild(li);
      });

      results.innerHTML = '';
      results.appendChild(ul);
      results.classList.add('open');
      input.setAttribute('aria-expanded', 'true');
      links = Array.prototype.slice.call(results.querySelectorAll('a'));
      active = -1;
    }

    function move(delta) {
      if (!links.length) { return; }
      if (active > -1) { links[active].classList.remove('active'); }
      active = (active + delta + links.length) % links.length;
      links[active].classList.add('active');
      links[active].scrollIntoView({block: 'nearest'});
    }

    input.addEventListener('input', run);
    input.addEventListener('focus', function () {
      if (input.value.trim().length >= 2) { run(); }
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        move(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        move(-1);
      } else if (e.key === 'Enter' && active > -1) {
        e.preventDefault();
        links[active].click();
      } else if (e.key === 'Escape') {
        close();
        input.blur();
      }
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.search')) { close(); }
    });

    // "/" focuses search, the way most documentation sites behave.
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
        e.preventDefault();
        input.focus();
      }
    });
  }

  /* ---------------------------------------------------------------- *
   * Reference filtering (validators page)
   * ---------------------------------------------------------------- */

  function initFilter() {
    var input = document.querySelector('.filter-bar input');
    if (!input) { return; }

    var items = Array.prototype.slice.call(document.querySelectorAll('[data-filter-item]')),
      count = document.querySelector('.filter-count'),
      empty = document.querySelector('.no-results');

    function apply() {
      var q = input.value.trim().toLowerCase(),
        shown = 0;

      items.forEach(function (item) {
        var hay = item.getAttribute('data-filter-item').toLowerCase(),
          match = !q || hay.indexOf(q) > -1;
        item.classList.toggle('is-hidden', !match);
        if (match) { shown++; }
      });

      // Section headings whose validators are all filtered out would otherwise
      // be left stranded above nothing.
      Array.prototype.forEach.call(document.querySelectorAll('[data-filter-group]'), function (group) {
        var any = group.querySelectorAll('[data-filter-item]:not(.is-hidden)').length;
        group.classList.toggle('is-hidden', any === 0);
      });

      if (count) {
        count.textContent = shown + ' of ' + items.length + ' shown';
      }
      if (empty) {
        empty.style.display = shown === 0 ? 'block' : 'none';
      }
    }

    input.addEventListener('input', apply);
    apply();
  }

  /* ---------------------------------------------------------------- *
   * Boot
   * ---------------------------------------------------------------- */

  function init() {
    initTheme();
    initNav();
    initHighlight();
    initScrollableCode();
    initCopy();
    initHeadings();
    initSearch();
    initFilter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
