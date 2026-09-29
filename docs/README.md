# Documentation site

The documentation for jQuery Form Validator, as a self-contained static site.

## Viewing it

Open `index.html` in a browser. That works straight from disk — there is no build
step, no bundler, and no server required.

Nothing here reaches the network: every asset path is relative, there are no
module scripts and no `fetch()` calls, and jQuery, the plugin and both webfonts
are vendored into `assets/`. The search index is a plain script rather than JSON
for exactly this reason — `fetch()` of a sibling file is blocked over `file://`.

One caveat: some browsers refuse `localStorage` on `file://`, so the theme
choice may not persist between reloads. Every access is wrapped, so the page
still works; it just falls back to your system preference.

To serve it instead:

```bash
npx grunt connect:server:keepalive
# then open http://localhost:8000/docs/
```

## Publishing it

Everything the site needs lives in this folder, so it can be deployed as-is:

- **GitHub Pages** — Settings → Pages → Source: `master` branch, `/docs` folder.
- **Any static host** — upload the folder.

There is no base-path configuration; every link is relative.

## What is here

```
docs/
├── index.html              Overview and feature summary
├── getting-started.html    Installation and a first form
├── examples.html           Live demos running the real plugin
├── validators.html         Every validation rule, filterable
├── modules.html            The module system, and each module
├── configuration.html      Every $.validate() option
├── api.html                $.formUtils, custom validators, events
├── accessibility.html      What the plugin emits for assistive technology
├── localization.html       Languages, message templates, Intl
├── migration.html          Upgrading from 2.x
└── assets/
    ├── css/docs.css        The whole stylesheet
    ├── js/docs.js          Theme, nav, search, TOC, highlighting
    ├── js/demos.js         Wiring for the live demos
    ├── js/search-index.js  Generated search index
    ├── fonts/              Inter + JetBrains Mono, self-hosted (SIL OFL)
    └── vendor/             jQuery and the built plugin, for the demos
```

## Editing

The pages are plain HTML. Edit them directly.

Two things are worth knowing:

- **The navigation is repeated in every page.** Adding a page means adding it to
  the sidebar `<nav>` in each of the others, and to `assets/js/search-index.js`.
- **`assets/vendor/` is generated.** Those are copies of the built plugin and of
  jQuery, so `examples.html` can run the real thing without reaching outside this
  folder. `grunt build` refreshes them, via the `docs-assets` task — do not edit
  them by hand.
- **`assets/fonts/` is vendored.** Inter and JetBrains Mono, latin subset, both
  SIL OFL 1.1. See `assets/fonts/LICENSE.md` for the refresh command.

## Keeping the demos honest

`examples.html` loads the plugin from `assets/vendor/`, so the demos exercise the
actual library rather than describing it. If the demos and the documentation ever
disagree, the demos are right.

Because those copies are refreshed as part of `grunt build`, a change to the
library shows up in the demos on the next build rather than silently going stale.
