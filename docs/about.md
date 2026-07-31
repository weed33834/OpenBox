---
layout: default
title: About
description: FreeNode — open-source free public proxy / node subscription source aggregator. Learn how the pipeline crawls, parses, dedupes and verifies 80+ community sources.
keywords: freenode, about, open source, proxy aggregator, node subscription, github pages, clash, v2ray, vmess, vless, trojan, shadowsocks
---

<h1 class="page-title">ℹ️ <span data-i18n="about.h1">About FreeNode</span></h1>
<p class="page-subtitle">// <span data-i18n="about.subtitle">Open source · Community-driven · MIT licensed</span></p>

<div class="markdown-content">
  <p data-i18n="about.intro"><strong>FreeNode</strong> is an open-source aggregator of free public proxy /
     node subscription sources. It crawls 80+ community channels, parses 6 protocols,
     deduplicates by fingerprint, verifies reachability via TCP + protocol handshake,
     and outputs ready-to-use subscription files in three formats.</p>

  <h2 data-i18n="about.how">How it works</h2>
  <p data-i18n="about.how_desc">The data pipeline runs in GitHub Actions on manual trigger. When done, it opens
     a Pull Request — the owner reviews and merges, which triggers Pages redeploy:</p>
  <ol>
    <li><strong>crawler</strong> — concurrent fetch of all enabled sources (httpx +
        streaming <code>max_bytes</code> cap), reliability-tiered concurrency +
        exponential backoff retries + HTTP 429 Retry-After handling.</li>
    <li><strong>parser</strong> — extracts <code>vmess</code> / <code>vless</code> /
        <code>ss</code> / <code>trojan</code> / <code>hysteria2</code> / <code>tuic</code>
        protocol links from raw text.</li>
    <li><strong>dedup</strong> — fingerprint by <code>(protocol, server, port, auth_secret)</code>
        to eliminate duplicates across sources.</li>
    <li><strong>verifier</strong> — TCP connect + protocol handshake (TLS / SS probe)
        two-stage verification; flaky failures (timeout, network unreachable) retried.</li>
    <li><strong>formatter</strong> — outputs <code>clash.yaml</code> /
        <code>v2ray.txt</code> / <code>proxies.txt</code> + quality report
        (<code>quality.json</code>).</li>
    <li><strong>site_builder</strong> — composes the above into <code>_data/*.json</code>
        that this Jekyll site renders.</li>
  </ol>

  <h2 data-i18n="about.data_sources">Data sources</h2>
  <p data-i18n="about.data_sources_desc">All sources come from community public channels (GitHub raw files, subscription
     endpoints, Telegram channels). New sources enter observation mode and must sustain reliability > 70% for 3 consecutive days before being promoted to active. Sources below 30% for 7 days are demoted back to observation. See the live
     <a href="{{ '/sources.html' | relative_url }}">Sources Directory</a>.</p>

  <h2 data-i18n="about.open_source">Open source</h2>
  <p data-i18n="about.open_source_desc">This repository is open source under the MIT license. Contributions of new data
     sources or bug fixes are welcome on
     <a href="{{ site.data.site.repo_urls.github }}" target="_blank" rel="noopener">GitHub</a>
     via Issue or Pull Request. See <a href="{{ '/guides.html' | relative_url }}">the guide</a>
     for client setup help.</p>

  <h2 data-i18n="about.disclaimer">Disclaimer</h2>
  <p data-i18n="about.disclaimer_desc">This project is for network protocol learning, security testing and privacy
     research only. All nodes come from third-party public sources; we do not own,
     operate or guarantee them. Do not use for banking, payments or any sensitive
     login. Follow your local laws.</p>
</div>
