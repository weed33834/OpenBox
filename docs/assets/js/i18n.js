/*!
 * FreeNode · 多语言切换层 (中/英/日)
 * - 三语字典集中维护,通过 data-i18n 属性批量应用
 * - localStorage 持久化用户选择,默认跟随浏览器语言
 * - 不依赖任何框架,纯原生 JS
 */
(function () {
  'use strict';

  var SUPPORTED = ['en', 'zh', 'ja'];
  var DEFAULT_LANG = 'en';
  var STORAGE_KEY = 'freenode-lang';

  var DICT = {
    en: {
      // 导航
      'nav.home': 'Home',
      'nav.nodes': 'Node Browser',
      'nav.sources': 'Sources',
      'nav.status': 'Status',
      'nav.guides': 'Guide',
      'nav.about': 'About',
      'nav.github': 'GitHub',

      // 移动端底部 Tab 栏 (短标签)
      'tab.home': 'Home',
      'tab.nodes': 'Nodes',
      'tab.sources': 'Sources',
      'tab.status': 'Status',
      'tab.more': 'More',

      'nav.search_placeholder': 'Search sources / protocols / clients…',
      'nav.search_aria': 'Search site',
      'nav.menu_aria': 'Menu',

      // 通用
      'common.view_all': 'View all →',
      'common.copy': 'Copy',
      'common.copy_link': 'Copy link',
      'common.open': 'Open',
      'common.docs': 'Docs',
      'common.qr': 'QR',
      'common.close': 'Close',
      'common.prev_page': 'Previous',
      'common.next_page': 'Next',
      'common.all': 'All',
      'common.active': 'Active',
      'common.observating': 'Observing',
      'common.disabled': 'Disabled',

      // 首页 hero
      'index.tagline': 'Community public nodes · Verified',
      'index.h1': 'Free Nodes · Aggregator',
      'index.subtitle': 'Crawls 80+ community public sources, parses, deduplicates and verifies, then outputs Clash / V2Ray / proxy list subscription formats. All data is owner-reviewed via PR before deploy.',
      'index.meta_sources': 'SOURCES',
      'index.meta_nodes': 'NODES',
      'index.meta_alive': 'ALIVE',
      'index.meta_data': 'DATA',

      // 首页 - 空状态
      'index.empty_nodes_title': 'No available nodes',
      'index.empty_nodes_desc': 'The current data snapshot has no alive nodes. Either all sources are temporarily down, or every node expired since the last sync. Please check back later, or open an Issue on the repo.',
      'index.open_issue': 'Open an Issue',
      'index.unverified_title': 'Unverified data',
      'index.unverified_desc': 'The current snapshot contains nodes, but they have not been connectivity-verified. Subscriptions will still work, but node availability is not guaranteed.',

      // 首页 sections
      'index.section.subscriptions': 'Subscription Links',
      'index.section.subscriptions_meta': '3 formats · one-click copy · mirror fallback',
      'index.section.snapshot': 'Data Snapshot',
      'index.section.snapshot_meta': 'Overview of the latest sync',
      'index.section.top_sources': 'Top 10 Reliable Sources',
      'index.section.top_sources_meta': 'sorted by 14-day reliability',
      'index.section.quick_start': 'Quick Start',
      'index.section.quick_start_meta': 'from subscription to connection · 8 steps',
      'index.section.proto_dist': 'Protocol distribution · ring visualization',

      // stat-card labels
      'index.stat.total_nodes': 'Total nodes',
      'index.stat.alive_nodes': 'Alive nodes',
      'index.stat.avg_latency': 'Avg latency',
      'index.stat.sources': 'Data sources',

      // 首页表格表头
      'index.th.name': 'Name',
      'index.th.type': 'Type',
      'index.th.reliability': 'Reliability',
      'index.th.protocols': 'Protocols',

      // Quick Start 步骤
      'index.step1.h': 'Pick a subscription',
      'index.step1.p': 'Choose Clash, V2Ray or proxy list format above and copy the link.',
      'index.step2.h': 'Install a client',
      'index.step2.p': 'Pick a client on the guide page for your OS.',
      'index.step3.h': 'Import the subscription',
      'index.step3.p': "Paste the subscription URL in the client's Profile / Subscription settings.",
      'index.step4.h': 'Update the subscription',
      'index.step4.p': 'The client auto-updates on a schedule, or you can trigger it manually.',
      'index.step5.h': 'Choose a node',
      'index.step5.p': 'Pick a low-latency node from the list and connect.',
      'index.step6.h': 'Enable proxy',
      'index.step6.p': 'Most clients have a system proxy toggle — turn it on.',
      'index.step7.h': 'Refresh regularly',
      'index.step7.p': 'Nodes expire fast; set the client to auto-update every few hours.',
      'index.step8.h': 'Subscription broken',
      'index.step8.p': 'Wait for the next sync, or open an Issue on the repo.',

      // sources.html
      'sources.h1': 'Data Sources',
      'sources.subtitle': 'sources · ranked by 14-day reliability · status auto-evaluated',
      'sources.filter': 'Filter:',
      'sources.footer': 'All sources come from community public channels. New sources enter observation mode; they must sustain reliability > 70% for 3 consecutive days to be promoted to active, and drop back to observing if below 30% for 7 days. Promotion log is in nodes/sources-report.json.',

      // nodes.html
      'nodes.h1': 'Node Browser',
      'nodes.subtitle': 'nodes · multi-protocol aggregation · real-time filter',
      'nodes.filter_protocol': 'Protocol:',
      'nodes.filter_region': 'Region filter',
      'nodes.all_regions': 'All regions',
      'nodes.search_placeholder': 'Search name / server…',
      'nodes.search_aria': 'Search nodes',
      'nodes.summary': 'nodes total',
      'nodes.th.protocol': 'Protocol',
      'nodes.th.name': 'Name',
      'nodes.th.server': 'Server',
      'nodes.th.port': 'Port',
      'nodes.th.region': 'Region',
      'nodes.th.status': 'Status',
      'nodes.empty': 'No matching nodes found',

      // status.html
      'status.h1': 'Status Dashboard',
      'status.subtitle': 'pipeline · trends · failure causes · regional distribution · source ranking',
      'status.section.pipeline': 'Pipeline Status',
      'status.section.pipeline_meta': 'crawl → parse → dedup → verify → format → archive',
      'status.last_update': 'Last updated:',
      'status.no_data': 'No pipeline data yet',
      'status.section.trend': 'Data Trends',
      'status.section.trend_meta': '7 days · total nodes / alive rate',
      'status.chart.total': 'Total nodes',
      'status.chart.alive': 'Alive rate',
      'status.trend_empty': 'Accumulating data — need at least 2 data points to draw the trend.',
      'status.section.failures': 'Failure Cause Distribution',
      'status.section.failures_meta': 'descending by count',
      'status.section.region': 'Regional Distribution',
      'status.section.region_meta': 'Top 10',
      'status.section.sources': 'Source Contribution Ranking',
      'status.section.sources_meta': 'top 10 by reliability',

      // guides.html
      'guides.h1': 'Protocols & Client Guide',
      'guides.subtitle': 'protocols · recommended clients',
      'guides.section.protocols': 'Protocols',
      'guides.section.clients': 'Recommended Clients',
      'guides.section.clients_meta': 'cross-platform / Windows / macOS / Linux / iOS / Android',
      'guides.th.client': 'Client',
      'guides.th.platform': 'Platform',
      'guides.th.protocols': 'Protocols',
      'guides.th.download': 'Download',
      'guides.download': 'Download',
      'guides.section.setup': 'Setup Steps',
      'guides.section.setup_meta': 'from subscription to connection · 8 steps',
      'guides.step1.h': 'Pick a subscription',
      'guides.step1.p': 'Choose Clash, V2Ray or proxy list format from the home page.',
      'guides.step2.h': 'Install a client',
      'guides.step2.p': 'Pick one of the recommended clients above for your OS.',
      'guides.step3.h': 'Add subscription',
      'guides.step3.p': "Paste the subscription URL into the client's Profile / Subscription settings.",
      'guides.step4.h': 'Update subscription',
      'guides.step4.p': 'The client auto-updates on a schedule, or you can trigger it manually.',
      'guides.step5.h': 'Choose a node',
      'guides.step5.p': 'Pick a low-latency node from the list and connect.',
      'guides.step6.h': 'Enable proxy',
      'guides.step6.p': 'Most clients have a system proxy toggle — turn it on.',
      'guides.step7.h': 'Refresh regularly',
      'guides.step7.p': 'Nodes expire fast; set the client to auto-update every few hours.',
      'guides.step8.h': 'Troubleshoot',
      'guides.step8.p': 'If a subscription breaks, wait for the next sync or open an Issue on the repo.',

      // about.md
      'about.h1': 'About FreeNode',
      'about.subtitle': 'Open source · Community-driven · MIT licensed',
      'about.intro': 'FreeNode is an open-source aggregator of free public proxy / node subscription sources. It crawls 80+ community channels, parses 6 protocols, deduplicates by fingerprint, verifies reachability via TCP + protocol handshake, and outputs ready-to-use subscription files in three formats.',
      'about.how': 'How it works',
      'about.how_desc': 'The data pipeline runs in GitHub Actions on manual trigger. When done, it opens a Pull Request — the owner reviews and merges, which triggers Pages redeploy:',
      'about.data_sources': 'Data sources',
      'about.data_sources_desc': 'All sources come from community public channels (GitHub raw files, subscription endpoints, Telegram channels). New sources enter observation mode and must sustain reliability > 70% for 3 consecutive days before being promoted to active. Sources below 30% for 7 days are demoted back to observation. See the live',
      'about.open_source': 'Open source',
      'about.open_source_desc': 'This repository is open source under the MIT license. Contributions of new data sources or bug fixes are welcome on',
      'about.disclaimer': 'Disclaimer',
      'about.disclaimer_desc': 'This project is for network protocol learning, security testing and privacy research only. All nodes come from third-party public sources; we do not own, operate or guarantee them. Do not use for banking, payments or any sensitive login. Follow your local laws.',

      // footer
      'footer.update_mode': 'Update mode:',
      'footer.view_repo': 'View repo',
      'footer.last_sync': 'Last sync:',
      'footer.disclaimer': 'Nodes are for network protocol learning, security testing and privacy research only. Do not use for banking, payments or any sensitive login. Follow your local laws.',
      'footer.copyright': 'FreeNode · MIT License · Built with Jekyll',

      // QR modal
      'qr.title': 'Subscription QR',
      'qr.subtitle': 'Scan to import into client',
      'qr.img_alt': 'QR Code',

      // sub-card
      'subcard.mirrors': 'Mirrors',
      'subcard.copy_link': 'Copy link',
      'subcard.open': 'Open',
      'subcard.docs': 'Docs',
      'subcard.qr': 'QR',

      // 语言切换器
      'lang.label': 'Language',
      'lang.en': 'English',
      'lang.zh': '中文',
      'lang.ja': '日本語'
    },

    zh: {
      'nav.home': '首页',
      'nav.nodes': '节点浏览器',
      'nav.sources': '数据源',
      'nav.status': '状态',
      'nav.guides': '指南',
      'nav.about': '关于',
      'nav.github': 'GitHub',

      // 移动端底部 Tab 栏 (短标签)
      'tab.home': '首页',
      'tab.nodes': '节点',
      'tab.sources': '数据源',
      'tab.status': '状态',
      'tab.more': '更多',

      'nav.search_placeholder': '搜索数据源 / 协议 / 客户端…',
      'nav.search_aria': '站内搜索',
      'nav.menu_aria': '菜单',

      'common.view_all': '查看全部 →',
      'common.copy': '复制',
      'common.copy_link': '复制链接',
      'common.open': '打开',
      'common.docs': '文档',
      'common.qr': '二维码',
      'common.close': '关闭',
      'common.prev_page': '上一页',
      'common.next_page': '下一页',
      'common.all': '全部',
      'common.active': '活跃',
      'common.observating': '观察中',
      'common.disabled': '已禁用',

      'index.tagline': '社区公开节点 · 已验证',
      'index.h1': '免费节点 · 聚合器',
      'index.subtitle': '从 80+ 个社区公开渠道抓取、解析、去重、验证,输出 Clash / V2Ray / 代理列表订阅格式。所有数据经 PR 人工审核后部署。',
      'index.meta_sources': '数据源',
      'index.meta_nodes': '节点',
      'index.meta_alive': '存活',
      'index.meta_data': '数据',

      'index.empty_nodes_title': '暂无可用节点',
      'index.empty_nodes_desc': '当前数据快照没有存活节点。可能所有源临时不可用,或上次同步以来全部节点已过期。请稍后回看,或在仓库开 Issue。',
      'index.open_issue': '📮 开个 Issue',
      'index.unverified_title': '未验证数据',
      'index.unverified_desc': '当前快照包含节点,但未做连通性验证。订阅仍可用,但不保证节点可用性。',

      'index.section.subscriptions': '订阅链接',
      'index.section.subscriptions_meta': '3 种格式 · 一键复制 · 镜像兜底',
      'index.section.snapshot': '数据快照',
      'index.section.snapshot_meta': '最近一次同步概览',
      'index.section.top_sources': 'Top 10 可靠数据源',
      'index.section.top_sources_meta': '按 14 天可靠性排序',
      'index.section.quick_start': '快速开始',
      'index.section.quick_start_meta': '从订阅到连接 · 8 步',
      'index.section.proto_dist': '协议分布 · 环形可视化',

      'index.stat.total_nodes': '节点总数',
      'index.stat.alive_nodes': '存活节点',
      'index.stat.avg_latency': '平均延迟',
      'index.stat.sources': '数据源',

      'index.th.name': '名称',
      'index.th.type': '类型',
      'index.th.reliability': '可靠性',
      'index.th.protocols': '协议',

      'index.step1.h': '选择订阅',
      'index.step1.p': '在上方选 Clash / V2Ray / 代理列表格式,复制链接。',
      'index.step2.h': '安装客户端',
      'index.step2.p': '在指南页选一个适合你系统的客户端。',
      'index.step3.h': '导入订阅',
      'index.step3.p': '在客户端的"配置 / 订阅"设置里粘贴订阅 URL。',
      'index.step4.h': '更新订阅',
      'index.step4.p': '客户端会按计划自动更新,也可手动触发。',
      'index.step5.h': '选择节点',
      'index.step5.p': '从列表里挑一个低延迟节点并连接。',
      'index.step6.h': '开启代理',
      'index.step6.p': '大部分客户端有系统代理开关 —— 打开它。',
      'index.step7.h': '定期刷新',
      'index.step7.p': '节点过期很快;把客户端设为每几小时自动更新一次。',
      'index.step8.h': '订阅失效',
      'index.step8.p': '等下一次同步,或在仓库开 Issue。',

      'sources.h1': '数据源',
      'sources.subtitle': '数据源 · 按 14 天可靠性排序 · 状态自动评估',
      'sources.filter': '筛选:',
      'sources.footer': '所有数据源来自社区公开渠道。新源进入观察模式;连续 3 天可靠性 > 70% 才能晋升为活跃;若 7 天低于 30% 则降回观察。晋升日志在 nodes/sources-report.json。',

      'nodes.h1': '节点浏览器',
      'nodes.subtitle': '节点 · 多协议聚合 · 实时筛选',
      'nodes.filter_protocol': '协议:',
      'nodes.filter_region': '地区筛选',
      'nodes.all_regions': '所有地区',
      'nodes.search_placeholder': '搜索名称 / 服务器…',
      'nodes.search_aria': '搜索节点',
      'nodes.summary': '个节点',
      'nodes.th.protocol': '协议',
      'nodes.th.name': '名称',
      'nodes.th.server': '服务器',
      'nodes.th.port': '端口',
      'nodes.th.region': '地区',
      'nodes.th.status': '状态',
      'nodes.empty': '未找到匹配的节点',

      'status.h1': '状态仪表盘',
      'status.subtitle': '流水线 · 趋势 · 失败原因 · 区域分布 · 数据源排行',
      'status.section.pipeline': '流水线状态',
      'status.section.pipeline_meta': '抓取 → 解析 → 去重 → 验证 → 格式化 → 归档',
      'status.last_update': '最后更新:',
      'status.no_data': '暂无流水线数据',
      'status.section.trend': '数据趋势',
      'status.section.trend_meta': '7 天 · 节点总数 / 存活率',
      'status.chart.total': '节点总数',
      'status.chart.alive': '存活率',
      'status.trend_empty': '数据积累中,至少需要 2 个数据点才能绘制趋势。',
      'status.section.failures': '失败原因分布',
      'status.section.failures_meta': '按数量降序',
      'status.section.region': '区域分布',
      'status.section.region_meta': 'Top 10',
      'status.section.sources': '数据源贡献排行',
      'status.section.sources_meta': '按可靠性排序前 10',

      'guides.h1': '协议与客户端指南',
      'guides.subtitle': '协议 · 推荐客户端',
      'guides.section.protocols': '协议',
      'guides.section.clients': '推荐客户端',
      'guides.section.clients_meta': '跨平台 / Windows / macOS / Linux / iOS / Android',
      'guides.th.client': '客户端',
      'guides.th.platform': '平台',
      'guides.th.protocols': '协议',
      'guides.th.download': '下载',
      'guides.download': '下载',
      'guides.section.setup': '设置步骤',
      'guides.section.setup_meta': '从订阅到连接 · 8 步',
      'guides.step1.h': '选择订阅',
      'guides.step1.p': '在首页选 Clash / V2Ray / 代理列表格式。',
      'guides.step2.h': '安装客户端',
      'guides.step2.p': '在上方推荐客户端里选一个适合你系统的。',
      'guides.step3.h': '添加订阅',
      'guides.step3.p': '在客户端的"配置 / 订阅"设置里粘贴订阅 URL。',
      'guides.step4.h': '更新订阅',
      'guides.step4.p': '客户端会按计划自动更新,也可手动触发。',
      'guides.step5.h': '选择节点',
      'guides.step5.p': '从列表里挑一个低延迟节点并连接。',
      'guides.step6.h': '开启代理',
      'guides.step6.p': '大部分客户端有系统代理开关 —— 打开它。',
      'guides.step7.h': '定期刷新',
      'guides.step7.p': '节点过期很快;把客户端设为每几小时自动更新一次。',
      'guides.step8.h': '故障排查',
      'guides.step8.p': '若订阅失效,等下一次同步或在仓库开 Issue。',

      'about.h1': '关于 FreeNode',
      'about.subtitle': '开源 · 社区驱动 · MIT 协议',
      'about.intro': 'FreeNode 是一个开源的免费公开代理 / 节点订阅源聚合器。它抓取 80+ 个社区渠道,解析 6 种协议,按指纹去重,通过 TCP + 协议握手验证可达性,输出三种格式即用订阅文件。',
      'about.how': '工作原理',
      'about.how_desc': '数据流水线在 GitHub Actions 手动触发运行。完成后开一个 Pull Request —— owner 审核合并后触发 Pages 重新部署:',
      'about.data_sources': '数据源',
      'about.data_sources_desc': '所有数据源来自社区公开渠道(GitHub raw 文件、订阅接口、Telegram 频道)。新源进入观察模式,需连续 3 天可靠性 > 70% 才能晋升为活跃;若 7 天低于 30% 则降回观察。查看实时',
      'about.open_source': '开源',
      'about.open_source_desc': '本仓库以 MIT 协议开源。欢迎在',
      'about.disclaimer': '免责声明',
      'about.disclaimer_desc': '本项目仅用于网络协议学习、安全测试和隐私研究。所有节点来自第三方公开来源,我们不拥有、运营或保证它们。请勿用于银行、支付或任何敏感登录。请遵守当地法律。',

      'footer.update_mode': '更新方式:',
      'footer.view_repo': '查看仓库',
      'footer.last_sync': '最近同步:',
      'footer.disclaimer': '节点仅用于网络协议学习、安全测试和隐私研究。请勿用于银行、支付或任何敏感登录。请遵守当地法律。',
      'footer.copyright': 'FreeNode · MIT 协议 · Jekyll 构建',

      'qr.title': '订阅二维码',
      'qr.subtitle': '扫码导入客户端',
      'qr.img_alt': '二维码',

      'subcard.mirrors': '镜像',
      'subcard.copy_link': '复制链接',
      'subcard.open': '打开',
      'subcard.docs': '文档',
      'subcard.qr': '二维码',

      'lang.label': '语言',
      'lang.en': 'English',
      'lang.zh': '中文',
      'lang.ja': '日本語'
    },

    ja: {
      'nav.home': 'ホーム',
      'nav.nodes': 'ノード',
      'nav.sources': 'ソース',
      'nav.status': 'ステータス',
      'nav.guides': 'ガイド',
      'nav.about': '概要',
      'nav.github': 'GitHub',

      // 移动端底部 Tab 栏 (短标签)
      'tab.home': 'ホーム',
      'tab.nodes': 'ノード',
      'tab.sources': 'ソース',
      'tab.status': 'ステータス',
      'tab.more': 'その他',

      'nav.search_placeholder': 'ソース / プロトコル / クライアントを検索…',
      'nav.search_aria': 'サイト内検索',
      'nav.menu_aria': 'メニュー',

      'common.view_all': 'すべて見る →',
      'common.copy': 'コピー',
      'common.copy_link': 'リンクをコピー',
      'common.open': '開く',
      'common.docs': 'ドキュメント',
      'common.qr': 'QR',
      'common.close': '閉じる',
      'common.prev_page': '前へ',
      'common.next_page': '次へ',
      'common.all': 'すべて',
      'common.active': 'アクティブ',
      'common.observating': '観察中',
      'common.disabled': '無効',

      'index.tagline': 'コミュニティ公開ノード · 検証済み',
      'index.h1': '無料ノード · アグリゲータ',
      'index.subtitle': '80 以上のコミュニティ公開ソースから取得・解析・重複排除・検証し、Clash / V2Ray / プロキシリストの購読形式を出力します。すべてのデータはデプロイ前に PR でオーナー確認されます。',
      'index.meta_sources': 'ソース',
      'index.meta_nodes': 'ノード',
      'index.meta_alive': '生存',
      'index.meta_data': 'データ',

      'index.empty_nodes_title': '利用可能なノードがありません',
      'index.empty_nodes_desc': '現在のデータスナップショットには生存ノードがありません。ソースが一時的にダウンしているか、前回同期以降にすべてのノードが期限切れになった可能性があります。後で再度確認するか、リポジトリで Issue を開いてください。',
      'index.open_issue': '📮 Issue を開く',
      'index.unverified_title': '未検証データ',
      'index.unverified_desc': '現在のスナップショットにはノードが含まれていますが、接続性検証が行われていません。購読は機能しますが、ノード可用性は保証されません。',

      'index.section.subscriptions': '購読リンク',
      'index.section.subscriptions_meta': '3 形式 · ワンクリックコピー · ミラー代替',
      'index.section.snapshot': 'データスナップショット',
      'index.section.snapshot_meta': '最新同期の概要',
      'index.section.top_sources': 'Top 10 信頼性ソース',
      'index.section.top_sources_meta': '14 日間の信頼性でソート',
      'index.section.quick_start': 'クイックスタート',
      'index.section.quick_start_meta': '購読から接続まで · 8 ステップ',
      'index.section.proto_dist': 'プロトコル分布 · リング可視化',

      'index.stat.total_nodes': 'ノード総数',
      'index.stat.alive_nodes': '生存ノード',
      'index.stat.avg_latency': '平均レイテンシ',
      'index.stat.sources': 'データソース',

      'index.th.name': '名前',
      'index.th.type': 'タイプ',
      'index.th.reliability': '信頼性',
      'index.th.protocols': 'プロトコル',

      'index.step1.h': '購読を選ぶ',
      'index.step1.p': '上の Clash / V2Ray / プロキシリスト形式を選び、リンクをコピー。',
      'index.step2.h': 'クライアントをインストール',
      'index.step2.p': 'ガイドページから OS に合うクライアントを選ぶ。',
      'index.step3.h': '購読をインポート',
      'index.step3.p': "クライアントのプロファイル / 購読設定に URL を貼り付け。",
      'index.step4.h': '購読を更新',
      'index.step4.p': 'クライアントは自動更新します、手動も可能。',
      'index.step5.h': 'ノードを選ぶ',
      'index.step5.p': 'リストから低レイテンシのノードを選び接続。',
      'index.step6.h': 'プロキシを有効化',
      'index.step6.p': '多くのクライアントにシステムプロキシ切替があります —— オンに。',
      'index.step7.h': '定期的に更新',
      'index.step7.p': 'ノードはすぐ期限切れ;数時間ごとの自動更新を設定。',
      'index.step8.h': '購読が壊れたら',
      'index.step8.p': '次の同期を待つか、リポジトリで Issue を開く。',

      'sources.h1': 'データソース',
      'sources.subtitle': 'ソース · 14 日間信頼性でソート · ステータス自動評価',
      'sources.filter': 'フィルタ:',
      'sources.footer': 'すべてのソースはコミュニティ公開チャネルからです。新ソースは観察モードに入り、3 日連続で信頼性 > 70% を維持するとアクティブに昇格、7 日間 30% 未満だと観察に戻ります。昇格ログは nodes/sources-report.json。',

      'nodes.h1': 'ノードブラウザ',
      'nodes.subtitle': 'ノード · マルチプロトコル集約 · リアルタイムフィルタ',
      'nodes.filter_protocol': 'プロトコル:',
      'nodes.filter_region': '地域フィルタ',
      'nodes.all_regions': 'すべての地域',
      'nodes.search_placeholder': '名前 / サーバーを検索…',
      'nodes.search_aria': 'ノードを検索',
      'nodes.summary': 'ノード',
      'nodes.th.protocol': 'プロトコル',
      'nodes.th.name': '名前',
      'nodes.th.server': 'サーバー',
      'nodes.th.port': 'ポート',
      'nodes.th.region': '地域',
      'nodes.th.status': 'ステータス',
      'nodes.empty': '一致するノードが見つかりません',

      'status.h1': 'ステータスダッシュボード',
      'status.subtitle': 'パイプライン · トレンド · 失敗原因 · 地域分布 · ソースランキング',
      'status.section.pipeline': 'パイプラインステータス',
      'status.section.pipeline_meta': '取得 → 解析 → 重複排除 → 検証 → フォーマット → アーカイブ',
      'status.last_update': '最終更新:',
      'status.no_data': 'パイプラインデータがまだありません',
      'status.section.trend': 'データトレンド',
      'status.section.trend_meta': '7 日間 · ノード総数 / 生存率',
      'status.chart.total': 'ノード総数',
      'status.chart.alive': '生存率',
      'status.trend_empty': 'データ蓄積中 — トレンド描画には 2 以上のデータポイントが必要です。',
      'status.section.failures': '失敗原因分布',
      'status.section.failures_meta': '件数降順',
      'status.section.region': '地域分布',
      'status.section.region_meta': 'Top 10',
      'status.section.sources': 'ソース貢献ランキング',
      'status.section.sources_meta': '信頼性上位 10',

      'guides.h1': 'プロトコル & クライアントガイド',
      'guides.subtitle': 'プロトコル · 推奨クライアント',
      'guides.section.protocols': 'プロトコル',
      'guides.section.clients': '推奨クライアント',
      'guides.section.clients_meta': 'クロスプラットフォーム / Windows / macOS / Linux / iOS / Android',
      'guides.th.client': 'クライアント',
      'guides.th.platform': 'プラットフォーム',
      'guides.th.protocols': 'プロトコル',
      'guides.th.download': 'ダウンロード',
      'guides.download': 'ダウンロード',
      'guides.section.setup': 'セットアップ手順',
      'guides.section.setup_meta': '購読から接続まで · 8 ステップ',
      'guides.step1.h': '購読を選ぶ',
      'guides.step1.p': 'ホームページから Clash / V2Ray / プロキシリスト形式を選ぶ。',
      'guides.step2.h': 'クライアントをインストール',
      'guides.step2.p': '上の推奨クライアントから OS に合うものを選ぶ。',
      'guides.step3.h': '購読を追加',
      'guides.step3.p': "クライアントのプロファイル / 購読設定に URL を貼り付け。",
      'guides.step4.h': '購読を更新',
      'guides.step4.p': 'クライアントは自動更新します、手動も可能。',
      'guides.step5.h': 'ノードを選ぶ',
      'guides.step5.p': 'リストから低レイテンシのノードを選び接続。',
      'guides.step6.h': 'プロキシを有効化',
      'guides.step6.p': '多くのクライアントにシステムプロキシ切替があります —— オンに。',
      'guides.step7.h': '定期的に更新',
      'guides.step7.p': 'ノードはすぐ期限切れ;数時間ごとの自動更新を設定。',
      'guides.step8.h': 'トラブルシュート',
      'guides.step8.p': '購読が壊れたら次の同期を待つか、リポジトリで Issue を開く。',

      'about.h1': 'FreeNode について',
      'about.subtitle': 'オープンソース · コミュニティ駆動 · MIT ライセンス',
      'about.intro': 'FreeNode は無料公開プロキシ / ノード購読ソースのオープンソースアグリゲータです。80 以上のコミュニティチャネルを取得し、6 プロトコルを解析、指紋で重複排除、TCP + プロトコルハンドシェイクで到達性を検証、3 形式の即利用可能な購読ファイルを出力します。',
      'about.how': '仕組み',
      'about.how_desc': 'データパイプラインは GitHub Actions で手動トリガー実行されます。完了すると Pull Request を開きます —— オーナーが確認してマージすると Pages が再デプロイされます:',
      'about.data_sources': 'データソース',
      'about.data_sources_desc': 'すべてのソースはコミュニティ公開チャネル(GitHub raw ファイル、購読エンドポイント、Telegram チャンネル)からです。新ソースは観察モードに入り、3 日連続で信頼性 > 70% を維持するとアクティブに昇格、7 日間 30% 未満だと観察に戻ります。ライブ',
      'about.open_source': 'オープンソース',
      'about.open_source_desc': '本リポジトリは MIT ライセンスでオープンソースです。新データソースやバグ修正の貢献を歓迎します:',
      'about.disclaimer': '免責事項',
      'about.disclaimer_desc': '本プロジェクトはネットワークプロトコル学習、セキュリティテスト、プライバシー研究のみを目的とします。すべてのノードは第三者公開ソース由来で、私たちは所有・運営・保証しません。銀行・決済・機密ログインには使用しないでください。現地の法律に従ってください。',

      'footer.update_mode': '更新モード:',
      'footer.view_repo': 'リポジトリを見る',
      'footer.last_sync': '最終同期:',
      'footer.disclaimer': 'ノードはネットワークプロトコル学習、セキュリティテスト、プライバシー研究のみを目的とします。銀行・決済・機密ログインには使用しないでください。現地の法律に従ってください。',
      'footer.copyright': 'FreeNode · MIT ライセンス · Jekyll で構築',

      'qr.title': '購読 QR',
      'qr.subtitle': 'スキャンしてクライアントにインポート',
      'qr.img_alt': 'QR コード',

      'subcard.mirrors': 'ミラー',
      'subcard.copy_link': 'リンクをコピー',
      'subcard.open': '開く',
      'subcard.docs': 'ドキュメント',
      'subcard.qr': 'QR',

      'lang.label': '言語',
      'lang.en': 'English',
      'lang.zh': '中文',
      'lang.ja': '日本語'
    }
  };

  // ============================================================
  // 语言检测与持久化
  // ============================================================
  function detectLang() {
    // 1. localStorage 已设
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
    } catch (e) {}
    // 2. 浏览器语言
    var nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (nav.indexOf('zh') === 0) return 'zh';
    if (nav.indexOf('ja') === 0) return 'ja';
    return DEFAULT_LANG;
  }

  function setLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) lang = DEFAULT_LANG;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    applyLang(lang);
  }

  // ============================================================
  // 应用翻译
  // ============================================================
  function applyLang(lang) {
    var dict = DICT[lang] || DICT[DEFAULT_LANG];
    document.documentElement.lang = lang;

    // 文本内容:data-i18n
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) el.textContent = dict[key];
    });
    // 属性:data-i18n-placeholder / data-i18n-aria / data-i18n-title
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (dict[key] !== undefined) el.setAttribute('placeholder', dict[key]);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      if (dict[key] !== undefined) el.setAttribute('aria-label', dict[key]);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-title');
      if (dict[key] !== undefined) el.setAttribute('title', dict[key]);
    });
    // <html lang> 已设
    // 更新切换器按钮高亮
    document.querySelectorAll('.lang-switcher button').forEach(function (btn) {
      var l = btn.getAttribute('data-lang');
      btn.classList.toggle('is-active', l === lang);
      btn.setAttribute('aria-pressed', l === lang ? 'true' : 'false');
    });
    // 通知其他脚本(如 nodes.js / status.js 重渲染表格表头)
    document.dispatchEvent(new CustomEvent('freenode:langchange', { detail: { lang: lang, dict: dict } }));
  }

  // 暴露 API 给其他脚本
  window.FREENODE_I18N = {
    supported: SUPPORTED,
    dict: DICT,
    current: DEFAULT_LANG,
    t: function (key, lang) {
      var d = DICT[lang || window.FREENODE_I18N.current] || DICT[DEFAULT_LANG];
      return d[key] !== undefined ? d[key] : key;
    },
    setLang: setLang,
    detectLang: detectLang
  };

  // ============================================================
  // 初始化
  // ============================================================
  function init() {
    var lang = detectLang();
    window.FREENODE_I18N.current = lang;
    applyLang(lang);

    // 绑定切换器
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.lang-switcher button[data-lang]');
      if (!btn) return;
      var l = btn.getAttribute('data-lang');
      window.FREENODE_I18N.current = l;
      setLang(l);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
