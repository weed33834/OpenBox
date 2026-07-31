# Changelog

This project follows [Semantic Versioning](https://semver.org/).

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Website visual rebuild: cyberpunk theme + glass morphism + protocol ring SVG
- In-site search (fuzzy search + `/` shortcut)
- Data freshness indicator (fresh / stale / outdated)
- Pure-JS inline QR code generation (no third-party API dependency)
- Data snapshot archival (`nodes/archive/YYYY-MMDD/`, 30-day retention, for rollback)
- Flaky-failure verify retry (`FREENODE_VERIFY_RETRIES`, reduces false negatives)
- Pre-verify truncation cap (`FREENODE_VERIFY_CAP`, prevents node-spike time blowups)
- Subscription reachability probe (front-end HEAD check, auto-expands mirror on failure)
- SEO basics (Open Graph / Twitter Card / sitemap.xml / robots.txt)
- Jekyll include component system (section-title / stat-card / sub-card / meta-seo)
- Project brand LOGO (`docs/assets/img/logo.svg`, cyan+purple, 6-protocol node motif)
- Top-of-README clickable online address + repo link (EN/ZH/JA)
- Mobile-first independent design language (`mobile.css`, applies only ≤768px): fixed bottom Tab bar (safe-area aware), single-column touch cards, horizontal-scroll protocol rings, cardified Top-10 table, full-bleed node table
- In-drawer language switcher (EN / 中 / 日) so mobile users can switch language without leaving the drawer
- Mobile E2E suite (Playwright, 15 tests) covering tab bar, drawer, single-column layouts and i18n
- Open-source docs completeness pass: `README.md` (English-primary) rewritten with Features grid, Architecture + Verification/Quality-Gate Mermaid diagrams (ASCII fallback), pipeline-status badge, `mobile.css` in project structure; `README.zh.md` / `README.ja.md` brought to full parity (same sections + diagrams, fixed stale-PR wording)
- Enabled `.github/FUNDING.yml` (`github: weed33834`) for the repo Sponsor button
- Fixed `LICENSE` copyright holder (`badhope` → `FreeNode Contributors`) and `CONTRIBUTING.md` Python version (`3.13+` → `3.12+`) for accuracy

### Changed
- GitHub Actions switched to manual trigger + PR mode (no more scheduled cron)
- Workflow adds a jekyll build verification step (no PR created on failure)
- Workflow adds an auto-close step for stale PRs (prevents PR pile-up)
- Color palette consolidated: 3 main neon × 17 colors → cyan primary + purple accent + semantic colors
- Font loading made async with onerror fallback (avoids white-screen when Google Fonts is blocked)
- Sources directory switched to a card grid (mobile-friendly)
- Test suite expanded 171 → 216 passing tests
- Repository consolidated to GitHub only — removed all GitCode references
  (navigation, footer, README, i18n, SSRF host allowlist, env example)

### Fixed
- Crawler now backs off on HTTP 429 + Retry-After
- Copy/mechanism mismatch ("daily auto" → "manual trigger + PR")
- Mobile backdrop-filter full-screen caused lag
- prefers-reduced-motion JS degradation (CountUp/Tilt/Ripple)
- Baseurl sub-path 404: section-title links now resolve via `relative_url` filter
  (previous `link="{{ '/x.html' | relative_url }}"` inside include quotes was not
  evaluated by Liquid, output raw `{{ }}` to the live site)
- Site search result URLs and nav-active highlight failed under `/freenode` baseurl
  (hardcoded `/sources.html` etc. missed the prefix) — fixed via `window.SITE_BASEURL`
- Mobile touch target sizing (buttons now ≥ 44px) and tap-highlight cleanup
- Removed undocumented `FREENODE_SUSPICIOUS_NETS` from README (no code implementation)

## [1.0.0] - 2026-07-16

### Added
- Initial release: node-collection pipeline (crawler/parser/dedup/verifier/formatter)
- 6-protocol parsing (vmess/vless/ss/trojan/hysteria/hysteria2/tuic)
- Two-stage verification (TCP + protocol handshake)
- 84 community public data sources
- Clash / V2Ray / proxy list subscription output in three formats
- 14-day rolling data-source reliability report
- New-source gradual promotion (observing → active)
- GitHub Actions automation
- Jekyll site (home / sources directory / protocol guide / about)
- Full test suite (171 tests)
