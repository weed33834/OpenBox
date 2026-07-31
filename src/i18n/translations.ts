// 轻量 i18n 翻译字典：zh / en / ja 三语言
// 只翻译 UI 框架文案；站点数据（name/desc/tagline）保持原文

export type Lang = "zh" | "en" | "ja";

export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: "zh", label: "中文", short: "中" },
  { code: "en", label: "English", short: "EN" },
  { code: "ja", label: "日本語", short: "日" },
];

// 翻译键 → 各语言文案
type Dict = Record<string, Partial<Record<Lang, string>>>;

export const translations: Dict = {
  // ===== LangSwitcher =====
  "lang.switcher": { zh: "语言切换", en: "Language Switcher", ja: "言語切替" },
  // ===== Hero =====
  "hero.badge": { zh: "系统在线 · 持续校验", en: "SYSTEM ONLINE · Verified", ja: "システム稼働中・検証済み" },
  "hero.title": { zh: "AI 导航", en: "AI Nav", ja: "AIナビ" },
  "hero.subtitle": {
    zh: "{total}+ 公益站 / 中转站 · 实时检测可用性",
    en: "{total}+ free / relay sites · live availability",
    ja: "{total}+ 無料/中継サイト・リアルタイム検証",
  },
  "hero.desc": {
    zh: "覆盖 LinuxDo 公益、免费对话、免费/付费 API 中转、海外官方免费层、国产大模型与开源框架，一键筛选直达。",
    en: "LinuxDo free, free chat, free/paid API relay, overseas official free tier, domestic LLMs and open-source frameworks — filter and go.",
    ja: "LinuxDo無料・無料チャット・無料/有料API中継・海外公式無料枠・国産LLM・OSSフレームワークを網羅、ワンクリック絞り込み。",
  },
  "hero.live": { zh: "实时检测", en: "Live check", ja: "リアルタイム検証" },
  "hero.recheck": { zh: "重测", en: "Recheck", ja: "再検証" },
  "hero.checked.justNow": { zh: "刚刚", en: "just now", ja: "たった今" },
  "hero.checked.minAgo": { zh: "{n} 分钟前", en: "{n}m ago", ja: "{n}分前" },
  "hero.checked.hourAgo": { zh: "{n} 小时前", en: "{n}h ago", ja: "{n}時間前" },
  "hero.checked.doneAt": { zh: "已于 {time} 完成检测", en: "checked {time}", ja: "{time}に検証完了" },
  "hero.checked.pending": { zh: "待检测", en: "pending", ja: "未検証" },

  // ===== 分类标签（覆盖 CATEGORY_META.label）=====
  "cat.all": { zh: "全部", en: "All", ja: "全て" },
  "cat.linuxdo": { zh: "社区公益站", en: "Community Free", ja: "コミュニティ無料" },
  "cat.freechat": { zh: "免费对话站", en: "Free Chat", ja: "無料チャット" },
  "cat.freerelay": { zh: "免费中转站", en: "Free Relay", ja: "無料中継" },
  "cat.paidrelay": { zh: "付费中转站", en: "Paid Relay", ja: "有料中継" },
  "cat.overseas": { zh: "海外官方免费层", en: "Overseas Free Tier", ja: "海外公式無料枠" },
  "cat.domestic": { zh: "国内官方平台", en: "Domestic Official", ja: "国産公式" },
  "cat.tool": { zh: "框架与导航", en: "Frameworks & Nav", ja: "フレームワーク・導航" },
  "cat.blacklist": { zh: "黑名单", en: "Blacklist", ja: "ブラックリスト" },

  // ===== 类型标签（覆盖 TYPE_META.label）=====
  "type.free": { zh: "免费", en: "Free", ja: "無料" },
  "type.freemium": { zh: "免费增值", en: "Freemium", ja: "部分無料" },
  "type.paid": { zh: "付费", en: "Paid", ja: "有料" },

  // ===== 状态标签（覆盖 STATUS_META.label）=====
  "status.ok": { zh: "可用", en: "OK", ja: "利用可" },
  "status.unstable": { zh: "不稳定", en: "Unstable", ja: "不安定" },
  "status.unknown": { zh: "未验证", en: "Unknown", ja: "未検証" },
  "status.dead": { zh: "已失效", en: "Dead", ja: "失効" },

  // ===== 实时状态 =====
  "live.checking": { zh: "检测中", en: "checking", ja: "検証中" },
  "live.up": { zh: "在线", en: "online", ja: "オンライン" },
  "live.down": { zh: "离线", en: "offline", ja: "オフライン" },
  "live.unknown": { zh: "未知", en: "unknown", ja: "不明" },
  "live.dataStatus": { zh: "数据状态", en: "Data", ja: "データ状態" },
  "live.realtime": { zh: "实时检测", en: "Live check", ja: "リアルタイム" },
  "live.lastCheck": { zh: "上次检测", en: "last", ja: "前回" },
  "live.endpointProbe": { zh: "API 端点探测", en: "endpoint probe", ja: "エンドポイント探索" },
  "live.serverProbe": { zh: "服务端探活", en: "server probe", ja: "サーバー探活" },

  // ===== Toolbar =====
  "tb.searchPlaceholder": {
    zh: "搜索名称 / URL / 描述 / 模型...",
    en: "Search name / URL / desc / model...",
    ja: "名称/URL/説明/モデルを検索...",
  },
  "tb.modelPlaceholder": { zh: "模型：GPT / Claude...", en: "Model: GPT / Claude...", ja: "モデル: GPT / Claude..." },
  "tb.results": { zh: "{n} 个结果", en: "{n} results", ja: "{n}件" },
  "tb.sortLabel": { zh: "排序方式", en: "Sort", ja: "並び順" },
  "tb.sort.default": { zh: "默认（分类）", en: "Default (category)", ja: "デフォルト(分類)" },
  "tb.sort.name": { zh: "名称 A-Z", en: "Name A-Z", ja: "名前 A-Z" },
  "tb.sort.status": { zh: "状态优先", en: "Status first", ja: "状態優先" },
  "tb.type": { zh: "类型", en: "Type", ja: "タイプ" },
  "tb.status": { zh: "状态", en: "Status", ja: "状態" },
  "tb.all": { zh: "全部", en: "All", ja: "全て" },
  "tb.onlyApi": { zh: "仅显示有 API 端点", en: "API endpoint only", ja: "API端点のみ" },
  "tb.clearFilter": { zh: "清空筛选", en: "Clear", ja: "クリア" },
  "tb.clearSearch": { zh: "清除搜索", en: "Clear search", ja: "検索クリア" },
  "tb.searchLabel": { zh: "搜索站点", en: "Search sites", ja: "サイト検索" },
  "tb.modelLabel": { zh: "模型关键词", en: "Model keyword", ja: "モデルキーワード" },
  "tb.filters": { zh: "筛选", en: "Filters", ja: "フィルター" },

  // ===== 导航栏 =====
  "nav.home": { zh: "首页", en: "Home", ja: "ホーム" },
  "nav.guide": { zh: "使用指南", en: "Guide", ja: "ガイド" },
  "nav.blacklist": { zh: "黑名单", en: "Blacklist", ja: "ブラックリスト" },
  "nav.favorites": { zh: "我的收藏", en: "Favorites", ja: "お気に入り" },
  "nav.menu": { zh: "菜单", en: "Menu", ja: "メニュー" },

  // ===== SiteGrid =====
  "grid.empty.title": { zh: "未匹配到任何站点", en: "No sites matched", ja: "該当サイトなし" },
  "grid.empty.desc": { zh: "尝试调整关键词、分类或状态筛选条件", en: "Try adjusting keywords, category or status filters", ja: "キーワード・分類・状態の絞り込みを調整してみてください" },
  "grid.empty.action": { zh: "清空全部筛选", en: "Clear all filters", ja: "全フィルタークリア" },
  "grid.matched": { zh: "{n} 个匹配", en: "{n} matched", ja: "{n}件マッチ" },

  // ===== SiteCard =====
  "card.detail": { zh: "详情", en: "Detail", ja: "詳細" },
  "card.api": { zh: "API", en: "API", ja: "API" },
  "card.visitAria": { zh: "在新标签页访问 {name}", en: "Open {name} in new tab", ja: "{name}を新規タブで開く" },
  "card.downHint": { zh: "站点疑似离线，点击仍会跳转", en: "Site may be offline, click to open anyway", ja: "サイトがオフラインの可能性、クリックで開く" },
  "card.ariaTemplate": {
    zh: "{name}，{cat}，实时状态{live}，查看详情",
    en: "{name}, {cat}, live {live}, view detail",
    ja: "{name}・{cat}・リアルタイム{live}・詳細表示",
  },

  // ===== DetailDrawer =====
  "drawer.close": { zh: "关闭详情", en: "Close detail", ja: "詳細を閉じる" },
  "drawer.desc": { zh: "描述", en: "Description", ja: "説明" },
  "drawer.visit": { zh: "访问站点", en: "Visit site", ja: "サイトを開く" },
  "drawer.visitForum": { zh: "查看论坛公告", en: "View forum post", ja: "フォーラム投稿を見る" },
  "drawer.visitGithub": { zh: "查看 GitHub 仓库", en: "View GitHub repo", ja: "GitHubリポジトリを見る" },
  "drawer.visitDown": { zh: "站点疑似离线，仍要访问", en: "Site may be offline, open anyway", ja: "オフラインの可能性、開く" },
  "drawer.models": { zh: "支持的模型", en: "Supported models", ja: "対応モデル" },
  "drawer.details": { zh: "详细信息", en: "Details", ja: "詳細情報" },
  "drawer.apiBase": { zh: "API 端点", en: "API endpoint", ja: "APIエンドポイント" },
  "drawer.billing": { zh: "计费方式", en: "Billing", ja: "課金方式" },
  "drawer.register": { zh: "注册方式", en: "Registration", ja: "登録方式" },
  "drawer.payment": { zh: "支付方式", en: "Payment", ja: "支払い方式" },
  "drawer.note": { zh: "备注", en: "Note", ja: "備考" },
  "drawer.copy": { zh: "复制", en: "Copy", ja: "コピー" },
  "drawer.copied": { zh: "已复制", en: "Copied", ja: "コピー済み" },
  "drawer.copyAria": { zh: "复制{label}", en: "Copy {label}", ja: "{label}をコピー" },
  "drawer.hintTitle": {
    zh: "实时检测仅判断域名可达性，不代表 API 业务可用。",
    en: "Live check only verifies domain reachability, not API availability.",
    ja: "リアルタイム検証はドメイン到達性のみを判定し、APIの利用可否を保証しません。",
  },
  "drawer.hintDown": {
    zh: "该站点域名无响应，可能已失效或需要科学上网。",
    en: "Domain unresponsive; may be dead or require VPN.",
    ja: "ドメインが無応答、失効またはVPNが必要な可能性。",
  },
  "drawer.hintUnknown": {
    zh: "该站点无法探测，建议直接访问确认。",
    en: "Cannot probe; visit directly to confirm.",
    ja: "探索不可、直接アクセスして確認してください。",
  },
  "drawer.hintAd": {
    zh: "若访问后看到广告/转卖页，说明域名已被他人注册。",
    en: "If you see ads/parking page, the domain was re-registered.",
    ja: "広告/駐車場ページが出る場合、ドメインが再登録されています。",
  },
  "drawer.footer": {
    zh: "ID: {id} · 数据采集于 2026-07 · 实时检测为域名可达性，不代表 API 业务可用，请以站点实际为准",
    en: "ID: {id} · Data collected 2026-07 · Live check = domain reachability, not API availability",
    ja: "ID: {id} ・ データ収集 2026-07 ・ リアルタイム検証=ドメイン到達性、API利用可否ではない",
  },

  // ===== Blacklist =====
  "bl.totalSites": { zh: "失效站点总数", en: "Total dead sites", ja: "失効サイト総数" },
  "bl.reasonGroups": { zh: "失效原因分类", en: "Reason groups", ja: "失効原因分類" },
  "bl.domainSale": { zh: "域名转卖/出售", en: "Domain for sale", ja: "ドメイン売却" },
  "bl.github404": { zh: "GitHub 仓库 404", en: "GitHub repo 404", ja: "GitHubリポジトリ404" },
  "bl.sitesCount": { zh: "{n} 个站点", en: "{n} sites", ja: "{n}サイト" },
  "bl.notice": {
    zh: "以下站点已确认失效，收录仅供参考。域名转卖、SSL 过期、服务关停等原因导致无法访问。若站点恢复，请反馈后重新上线。",
    en: "Sites below are confirmed dead, listed for reference only. Domain sale, SSL expiry, or service shutdown may cause inaccessibility. Report recovery to relist.",
    ja: "以下のサイトは失効が確認済み、参考用。ドメイン売却・SSL期限切れ・サービス停止等でアクセス不可。復旧時は報告してください。",
  },
  "bl.footer": {
    zh: "检测时间：2026-07 · 数据来源：沙箱环境 HTTP 检测 + 页面标题分析 · 部分站点因沙箱网络限制未能检测，实际状态请以浏览器访问为准",
    en: "Checked: 2026-07 · Source: sandbox HTTP probe + page title analysis · Some sites not probed due to sandbox network limits; verify in browser",
    ja: "検証日時: 2026-07 ・ 出典: サンドボックスHTTP検証+ページタイトル解析 ・ 一部サイトはサンドボックス制限で未検証、ブラウザで確認ください",
  },
  "bl.unknownReason": { zh: "未知原因", en: "Unknown reason", ja: "不明な原因" },
  "bl.free": { zh: "免费", en: "Free", ja: "無料" },
  "bl.paid": { zh: "付费", en: "Paid", ja: "有料" },
  "bl.back": { zh: "返回首页", en: "Back to home", ja: "ホームに戻る" },
  // 黑名单失效原因分类（结构化枚举）
  "bl.reason.domain-sale": { zh: "域名转卖/出售", en: "Domain for sale", ja: "ドメイン売却" },
  "bl.reason.http-error": { zh: "HTTP 服务端异常", en: "HTTP server error", ja: "HTTPサーバーエラー" },
  "bl.reason.not-found": { zh: "页面不存在 (404)", en: "Page not found (404)", ja: "ページが見つかりません (404)" },
  "bl.reason.repo-removed": { zh: "GitHub 仓库已删除", en: "GitHub repo removed", ja: "GitHubリポジトリ削除" },
  "bl.reason.service-stopped": { zh: "站点停止运行", en: "Service stopped", ja: "サービス停止" },
  "bl.reason.ssl-error": { zh: "SSL 证书错误", en: "SSL certificate error", ja: "SSL証明書エラー" },
  "bl.reason.timeout": { zh: "连接超时", en: "Connection timeout", ja: "接続タイムアウト" },
  "bl.reason.other": { zh: "其他原因", en: "Other", ja: "その他" },

  // ===== 认证相关 =====
  "auth.emailLabel": { zh: "邮箱", en: "Email", ja: "メールアドレス" },
  "auth.emailPlaceholder": { zh: "you@example.com", en: "you@example.com", ja: "you@example.com" },
  "auth.submitting": { zh: "处理中...", en: "Processing...", ja: "処理中..." },
  "auth.invalidEmail": { zh: "邮箱格式不正确", en: "Invalid email format", ja: "メール形式が正しくありません" },
  "auth.unexpectedError": { zh: "发生未知错误，请重试", en: "Unexpected error, please try again", ja: "予期せぬエラー、再試行してください" },
  "auth.rateLimited": { zh: "请求过于频繁，请 60 秒后再试", en: "Too many requests. Please retry in 60s.", ja: "リクエストが多すぎます。60秒後に再試行してください。" },
  "auth.networkError": { zh: "网络连接失败，请检查网络后重试", en: "Network error. Check connection and retry.", ja: "ネットワークエラー。接続を確認して再試行してください。" },
  "auth.slowHint": { zh: "响应较慢，请耐心等待…", en: "Response is slow, please wait…", ja: "応答が遅れています。しばらくお待ちください…" },
  "auth.user": { zh: "用户", en: "User", ja: "ユーザー" },
  "auth.userMenu": { zh: "用户菜单", en: "User menu", ja: "ユーザーメニュー" },
  "auth.signOut": { zh: "退出登录", en: "Sign out", ja: "ログアウト" },
  "auth.unavailable": { zh: "登录服务当前不可用", en: "Login service unavailable", ja: "ログインサービスは現在利用できません" },

  // ===== 账号密码注册/登录 =====
  "auth.loginTitle": { zh: "登录账号", en: "Sign In", ja: "ログイン" },
  "auth.registerTitle": { zh: "注册账号", en: "Create Account", ja: "アカウント登録" },
  "auth.loginDesc": { zh: "使用邮箱和密码登录", en: "Sign in with email and password", ja: "メールとパスワードでログイン" },
  "auth.registerDesc": { zh: "填写信息即可注册，无需邮箱验证", en: "Fill in to register — no email verification needed", ja: "情報を入力して登録・メール認証不要" },
  "auth.usernameLabel": { zh: "用户名", en: "Username", ja: "ユーザー名" },
  "auth.usernamePlaceholder": { zh: "你的昵称", en: "your nickname", ja: "ニックネーム" },
  "auth.passwordLabel": { zh: "密码", en: "Password", ja: "パスワード" },
  "auth.passwordPlaceholder": { zh: "至少 6 位", en: "At least 6 characters", ja: "6文字以上" },
  "auth.togglePassword": { zh: "切换密码可见性", en: "Toggle password visibility", ja: "パスワードの表示切替" },
  "auth.confirmPasswordLabel": { zh: "确认密码", en: "Confirm Password", ja: "パスワード確認" },
  "auth.confirmPasswordPlaceholder": { zh: "再次输入密码", en: "Re-enter password", ja: "パスワードを再入力" },
  "auth.loginBtn": { zh: "登录", en: "Sign In", ja: "ログイン" },
  "auth.registerBtn": { zh: "注册", en: "Register", ja: "登録" },
  "auth.switchToRegister": { zh: "没有账号？去注册", en: "No account? Register", ja: "アカウントがない？登録" },
  "auth.switchToLogin": { zh: "已有账号？去登录", en: "Have an account? Sign in", ja: "アカウントがある？ログイン" },
  "auth.invalidUsername": { zh: "用户名至少 2 个字符", en: "Username must be at least 2 characters", ja: "ユーザー名は2文字以上" },
  "auth.invalidPassword": { zh: "密码至少 6 位", en: "Password must be at least 6 characters", ja: "パスワードは6文字以上" },
  "auth.passwordMismatch": { zh: "两次输入的密码不一致", en: "Passwords do not match", ja: "パスワードが一致しません" },
  "auth.registerSuccess": { zh: "注册成功，已自动登录", en: "Registered! You are now signed in", ja: "登録完了・ログイン済み" },
  "auth.registerDoneLogin": { zh: "注册成功，请登录", en: "Registered! Please sign in", ja: "登録完了・ログインしてください" },
  "auth.emailExists": { zh: "该邮箱已被注册", en: "Email already registered", ja: "このメールは既に登録済み" },
  "auth.invalidCredentials": { zh: "邮箱或密码错误", en: "Invalid email or password", ja: "メールまたはパスワードが違います" },
  "auth.forgotPassword": { zh: "忘记密码？", en: "Forgot password?", ja: "パスワードを忘れた？" },
  "auth.resetPassword": { zh: "重置密码", en: "Reset Password", ja: "パスワードリセット" },
  "auth.resetSent": { zh: "重置链接已发送至邮箱", en: "Reset link sent to your email", ja: "リセットリンクをメールに送信しました" },
  "auth.updatePassword": { zh: "设置新密码", en: "Set New Password", ja: "新しいパスワードを設定" },
  "auth.updatePasswordDesc": { zh: "请输入新密码以完成密码重置", en: "Enter a new password to complete the reset", ja: "新しいパスワードを入力してリセットを完了" },
  "auth.newPasswordLabel": { zh: "新密码", en: "New Password", ja: "新しいパスワード" },
  "auth.confirmNewPasswordLabel": { zh: "确认新密码", en: "Confirm New Password", ja: "新しいパスワード確認" },
  "auth.updateBtn": { zh: "更新密码", en: "Update Password", ja: "パスワード更新" },
  "auth.passwordUpdated": { zh: "密码已更新，请重新登录", en: "Password updated, please sign in", ja: "パスワードが更新されました、ログインしてください" },

  // ===== 登录门控 =====
  "gate.title": { zh: "需要登录", en: "Login required", ja: "ログインが必要" },
  "gate.desc": { zh: "登录后可查看站点 API 端点、计费方式、注册方式等详细信息", en: "Login to view API endpoints, billing, registration details", ja: "ログインしてAPIエンドポイント、課金、登録方法を表示" },
  "gate.loginBtn": { zh: "登录 / 注册", en: "Login / Register", ja: "ログイン / 登録" },

  // ===== 特点标签（features）多语言映射 =====
  "feat.免费": { zh: "免费", en: "Free", ja: "無料" },
  "feat.签到": { zh: "签到", en: "Daily check", ja: "デイリー" },
  "feat.免费额度": { zh: "免费额度", en: "Free quota", ja: "無料枠" },
  "feat.国产": { zh: "国产", en: "Domestic", ja: "国産" },
  "feat.海外": { zh: "海外", en: "Overseas", ja: "海外" },
  "feat.公益": { zh: "公益", en: "Charity", ja: "公益" },
  "feat.低延迟": { zh: "低延迟", en: "Low latency", ja: "低遅延" },
  "feat.Linux.do": { zh: "Linux.do", en: "Linux.do", ja: "Linux.do" },
  "feat.付费": { zh: "付费", en: "Paid", ja: "有料" },
  "feat.无需注册": { zh: "无需注册", en: "No signup", ja: "登録不要" },
  "feat.企业级": { zh: "企业级", en: "Enterprise", ja: "エンタープライズ" },
  "feat.开源": { zh: "开源", en: "Open source", ja: "OSS" },
  "feat.多模型": { zh: "多模型", en: "Multi-model", ja: "マルチモデル" },
  "feat.邮箱注册": { zh: "邮箱注册", en: "Email signup", ja: "メール登録" },
  "feat.GitHub": { zh: "GitHub", en: "GitHub", ja: "GitHub" },
  "feat.导航": { zh: "导航", en: "Directory", ja: "導航" },
  "feat.社区": { zh: "社区", en: "Community", ja: "コミュニティ" },

  // ===== 个人中心 =====
  "profile.title": { zh: "个人中心", en: "Profile", ja: "プロフィール" },
  "profile.my": { zh: "个人中心", en: "Profile", ja: "プロフィール" },
  "profile.favorites": { zh: "我的收藏", en: "My Favorites", ja: "お気に入り" },
  "profile.favoritesEmpty": { zh: "暂无收藏的站点", en: "No favorited sites yet", ja: "お気に入りサイトはまだありません" },
  "profile.favoritesHint": { zh: "在站点卡片或详情页点击收藏按钮即可添加", en: "Click the heart icon on site cards or detail pages to add", ja: "サイトカードや詳細ページのハートアイコンをクリックして追加" },
  "profile.signOut": { zh: "退出登录", en: "Sign Out", ja: "ログアウト" },
  "profile.backToHome": { zh: "返回首页", en: "Back to Home", ja: "ホームに戻る" },
  "profile.github": { zh: "GitHub 登录", en: "GitHub Login", ja: "GitHubログイン" },
  "profile.emailLogin": { zh: "邮箱登录", en: "Email Login", ja: "メールログイン" },
  "profile.joinDate": { zh: "注册时间", en: "Joined", ja: "登録日" },
  "favorite.add": { zh: "收藏", en: "Favorite", ja: "お気に入り" },
  "favorite.remove": { zh: "取消收藏", en: "Unfavorite", ja: "お気に入り解除" },

  // ===== Home / Footer =====
  "home.backToTop": { zh: "返回顶部", en: "Back to top", ja: "トップへ戻る" },
  "footer.brand": { zh: "AI 导航", en: "AI Nav", ja: "AIナビ" },
  "footer.desc": {
    zh: "全网 AI 公益站与中转站目录 · 收录 {total} 个站点 · 实时检测域名可达性，数据采集于 2026-07，请以站点实际为准。",
    en: "Directory of free & relay AI sites · {total} sites indexed · Live domain reachability check, data collected 2026-07, subject to actual site status.",
    ja: "AI公益・中継サイトディレクトリ・{total}サイト収録・リアルタイムドメイン検証、データ収集2026-07、実際のサイト状況優先。",
  },
  "footer.copyright": {
    zh: "© 2026 AI 导航 · 数据基于公开调研整理",
    en: "© 2026 AI Nav · Data from public research",
    ja: "© 2026 AIナビ ・ 公開調査に基づくデータ",
  },
  "footer.builtWith": { zh: "构建技术", en: "BUILT WITH", ja: "構築技術" },

  // ===== 使用指南 Guide =====
  "guide.title": { zh: "使用指南", en: "User Guide", ja: "使い方ガイド" },
  "guide.back": { zh: "返回首页", en: "Back to home", ja: "ホームに戻る" },
  "guide.copy": { zh: "复制", en: "Copy", ja: "コピー" },
  "guide.copied": { zh: "已复制", en: "Copied", ja: "コピー済み" },
  "guide.section1.title": { zh: "如何使用本站", en: "How to use this site", ja: "サイトの使い方" },
  "guide.section1.p1": {
    zh: "本站收录了全网 AI 公益站、免费/付费 API 中转站、海外官方免费层与国产大模型平台，并提供实时可用性检测。",
    en: "This directory indexes community free sites, free/paid API relays, overseas official free tiers and domestic LLM platforms, with live availability checks.",
    ja: "本サイトはコミュニティ無料サイト、無料/有料API中継、海外公式無料枠、国産LLMプラットフォームを収録し、リアルタイム可用性検証を提供します。",
  },
  "guide.section1.p2": {
    zh: "顶部工具栏可按分类、类型、状态筛选，支持关键词搜索站点名称、URL、描述与模型，还可按模型关键词精确过滤。",
    en: "The toolbar filters by category, type and status. Search site name, URL, description and models by keyword, or filter precisely by model keyword.",
    ja: "上部ツールバーで分類・タイプ・状態で絞り込み可能。キーワードでサイト名・URL・説明・モデルを検索し、モデルキーワードで精密フィルターも可能。",
  },
  "guide.section1.p3": {
    zh: "每张站点卡片显示实时检测状态；点击卡片可打开详情抽屉，查看 API 端点、计费方式、注册方式等完整信息。",
    en: "Each card shows live status. Click a card to open the detail drawer for API endpoint, billing, registration and more.",
    ja: "各カードにリアルタイム状態を表示。カードをクリックすると詳細ドロワーが開き、APIエンドポイント・課金・登録方法などを確認できます。",
  },
  "guide.section1.p4": {
    zh: "登录后可收藏站点，在「个人中心」管理收藏列表；也可将筛选条件通过 URL 分享给他人。",
    en: "After signing in you can favorite sites and manage them in Profile. Share your filter state with others via the URL.",
    ja: "ログイン後にお気に入り登録が可能、プロフィールで管理できます。URL経由で絞り込み条件を共有することも可能。",
  },
  "guide.section1.kwTip": {
    zh: "快捷键：按 / 快速聚焦搜索框，按 Esc 一键清空全部筛选。",
    en: "Shortcuts: press / to focus the search box, press Esc to clear all filters.",
    ja: "ショートカット：/ で検索ボックスにフォーカス、Esc で全フィルターをクリア。",
  },
  "guide.section2.title": { zh: "免费对话站指南", en: "Free chat sites guide", ja: "無料チャットサイトガイド" },
  "guide.section2.p1": {
    zh: "免费对话站无需 API Key，打开网页即可与 GPT/Claude 等模型对话，适合临时体验或不具备开发能力的用户。",
    en: "Free chat sites need no API key — open the page and chat with GPT/Claude. Great for quick trials or non-developers.",
    ja: "無料チャットサイトはAPIキー不要、ページを開くだけでGPT/Claudeと対話できます。お試しや非開発者向け。",
  },
  "guide.section2.p2": {
    zh: "这类站点通常依赖公益捐赠或广告维持，高峰期可能排队或限速，建议错峰使用并优先选择标注「公益」的站点。",
    en: "These sites rely on donations or ads. Expect queues or rate limits at peak hours — use off-peak and prefer sites marked 'charity'.",
    ja: "こうしたサイトは寄付や広告で運営され、混雑時は待機や制限が発生します。空き時間の利用や「公益」表示サイトを優先しましょう。",
  },
  "guide.section2.p3": {
    zh: "对话内容可能被站点记录用于风控，请勿在其中输入敏感信息；如需稳定调用，请改用 API 中转站。",
    en: "Chats may be logged for risk control — never enter sensitive info. For stable programmatic access, use an API relay.",
    ja: "対話内容はリスク管理で記録される可能性があります。機密情報は入力しないでください。安定呼び出しにはAPI中継をご利用ください。",
  },
  "guide.section3.title": { zh: "免费 API 中转指南", en: "Free API relay guide", ja: "無料API中継ガイド" },
  "guide.section3.p1": {
    zh: "免费 API 中转站提供 OpenAI 兼容接口，注册后赠送免费额度，可直接接入 ChatGPT/Claude Code 等客户端。",
    en: "Free relays offer an OpenAI-compatible API. Sign up for free credit and connect ChatGPT/Claude Code and similar clients directly.",
    ja: "無料API中継はOpenAI互換APIを提供。登録で無料枠が付与され、ChatGPT/Claude Codeなどのクライアントに直接接続できます。",
  },
  "guide.section3.p2": {
    zh: "调用方式与官方 API 一致，只需将 base_url 替换为中转站地址，并使用站点下发的 sk-key。以下为 curl 调用示例：",
    en: "Calls match the official API — just swap base_url for the relay address and use the site-issued sk-key. curl example below:",
    ja: "呼び出しは公式APIと同じ、base_urlを中継アドレスに差し替え、サイト発行のsk-keyを使います。curlの例：",
  },
  "guide.section3.p3": {
    zh: "若使用官方 SDK，将 base_url 指向中转站即可，其余参数保持不变。以下为 Python (openai SDK) 示例：",
    en: "With the official SDK, point base_url at the relay and keep other params unchanged. Python (openai SDK) example below:",
    ja: "公式SDKを使う場合、base_urlを中継に向けるだけで他のパラメータはそのまま。Python (openai SDK) の例：",
  },
  "guide.section3.p4": {
    zh: "免费额度通常有限，建议配合签到/邀请任务获取更多；频繁超限可能被限速，请合理使用。",
    en: "Free credit is limited — earn more via daily check-in/invites. Exceeding limits may trigger rate limiting; use sensibly.",
    ja: "無料枠には上限があります。チェックイン/招待で増量可能。超過すると制限される場合があるため、適切にご利用ください。",
  },
  "guide.section3.curlLabel": { zh: "bash · curl", en: "bash · curl", ja: "bash · curl" },
  "guide.section3.pythonLabel": { zh: "python · openai", en: "python · openai", ja: "python · openai" },
  "guide.section4.title": { zh: "付费中转购买指南", en: "Paid relay buying guide", ja: "有料中継購入ガイド" },
  "guide.section4.p1": {
    zh: "付费中转站以折扣价转售 GPT/Claude 等模型，按量计费，适合有稳定用量需求的开发者。",
    en: "Paid relays resell GPT/Claude at a discount, billed by usage — ideal for developers with steady demand.",
    ja: "有料中継はGPT/Claudeを割引価格で再販、使用量課金。安定利用が必要な開発者向け。",
  },
  "guide.section4.p2": {
    zh: "选购前请关注倍率（相对官方价格）、支持的模型、支付方式与退款政策，优先选择口碑好、运营时间长的站点。",
    en: "Compare the markup vs official price, supported models, payment methods and refund policy. Prefer well-reviewed, long-running sites.",
    ja: "購入前に倍率（公式価格比）、対応モデル、支払い方法、返金ポリシーを確認。評判が良く長期間運営のサイトを優先。",
  },
  "guide.section4.p3": {
    zh: "充值建议从小额开始，确认稳定性后再追加；保留充值记录，遇到跑路风险及时止损。",
    en: "Start with a small top-up, add more once stable. Keep receipts and cut losses early if a site shows signs of absconding.",
    ja: "少額から充值し、安定性を確認してから追加。入金記録を保管し、逃亡の兆候があれば早めに損切り。",
  },
  "guide.section5.title": { zh: "站点分类指南", en: "Site category guide", ja: "サイト分類ガイド" },
  "guide.section5.p1": {
    zh: "社区公益站（LinuxDo）：由社区运营，通常需 Linux.do 账号注册，免费且稳定。",
    en: "Community free sites (LinuxDo): community-run, usually require a Linux.do account to register — free and stable.",
    ja: "コミュニティ無料サイト（LinuxDo）：コミュニティ運営、通常Linux.doアカウントで登録、無料で安定。",
  },
  "guide.section5.p2": {
    zh: "免费对话站：网页端直接对话，无需 Key，适合体验。",
    en: "Free chat sites: chat directly in-browser, no key needed — good for trying things out.",
    ja: "無料チャットサイト：ブラウザで直接対話、キー不要、体験向き。",
  },
  "guide.section5.p3": {
    zh: "免费/付费中转站：提供 API 接口，免费站赠送额度，付费站按量计费。",
    en: "Free/paid relays: expose an API. Free relays grant credit; paid relays bill by usage.",
    ja: "無料/有料中継：APIを提供。無料中継は枠を付与、有料中継は使用量課金。",
  },
  "guide.section5.p4": {
    zh: "海外官方免费层：OpenRouter/Groq/Gemini 等官方提供的免费额度，需海外网络。",
    en: "Overseas official free tier: free credit from OpenRouter/Groq/Gemini etc., requires overseas network.",
    ja: "海外公式無料枠：OpenRouter/Groq/Geminiなどの公式無料枠、海外ネットワークが必要。",
  },
  "guide.section5.p5": {
    zh: "国产官方平台：通义/智谱/DeepSeek 等国产大模型官方 API，国内直连低延迟。",
    en: "Domestic official platforms: official APIs for Tongyi/Zhipu/DeepSeek etc., direct domestic access with low latency.",
    ja: "国産公式プラットフォーム：通義/智譜/DeepSeekなどの公式API、国内直結で低遅延。",
  },
  "guide.liveCheck.title": { zh: "关于实时检测", en: "About Live Check", ja: "リアルタイム検証について" },
  "guide.liveCheck.desc": {
    zh: "本站的实时检测仅判断域名可达性（HTTP 探活），不代表 API 业务一定可用。部分站点因网络限制可能误判为离线，请以实际访问为准。检测每隔一段时间自动执行，也可点击「重测」手动触发。",
    en: "Live check only verifies domain reachability (HTTP probe), not guaranteed API availability. Some sites may be falsely flagged offline due to network limits — verify by visiting directly. Checks run automatically and can be triggered manually via Recheck.",
    ja: "リアルタイム検証はドメイン到達性（HTTP探活）のみを判定し、APIの利用可否を保証しません。ネットワーク制限で誤ってオフライン判定される場合があるため、実際のアクセスで確認してください。検証は自動実行され、「再検証」で手動触发も可能。",
  },

  // ===== 站点对比 Compare =====
  "compare.title": { zh: "站点对比", en: "Site Comparison", ja: "サイト比較" },
  "compare.close": { zh: "关闭对比", en: "Close compare", ja: "比較を閉じる" },
  "compare.clear": { zh: "清空对比", en: "Clear all", ja: "クリア" },
  "compare.max": { zh: "最多对比 {n} 个站点", en: "Compare up to {n} sites", ja: "最大{n}サイトまで比較" },
  "compare.selected": { zh: "已选 {n} 个站点", en: "{n} selected", ja: "{n}サイト選択中" },
  "compare.empty.title": { zh: "对比项不足", en: "Not enough to compare", ja: "比較対象が不足" },
  "compare.empty.desc": {
    zh: "至少选择 2 个站点才能进行对比",
    en: "Select at least 2 sites to compare",
    ja: "比較には2サイト以上選択してください",
  },
  "compare.siteName": { zh: "站点", en: "Site", ja: "サイト" },
  "compare.category": { zh: "分类", en: "Category", ja: "分類" },
  "compare.features": { zh: "特点", en: "Features", ja: "特徴" },
  "compare.liveStatus": { zh: "实时状态", en: "Live", ja: "リアルタイム" },
  "compare.na": { zh: "暂无", en: "N/A", ja: "なし" },
  "compare.open": { zh: "对比 ({n})", en: "Compare ({n})", ja: "比較 ({n})" },
  "compare.add": { zh: "加入对比", en: "Add to compare", ja: "比較に追加" },
  "compare.remove": { zh: "移出对比", en: "Remove from compare", ja: "比較から削除" },

  // ===== 主题切换 Theme =====
  "theme.toggle": { zh: "切换主题", en: "Toggle theme", ja: "テーマ切替" },
  "theme.light": { zh: "切换到亮色", en: "Switch to light", ja: "ライトに切替" },
  "theme.dark": { zh: "切换到暗色", en: "Switch to dark", ja: "ダークに切替" },

  // ===== 收藏导出 Export =====
  "profile.export": { zh: "导出", en: "Export", ja: "エクスポート" },
  "profile.exportDesc": { zh: "导出收藏列表为 JSON 文件", en: "Export favorites as JSON", ja: "お気に入りをJSONでエクスポート" },
  "profile.exportSuccess": { zh: "已导出 {n} 个收藏站点", en: "Exported {n} favorites", ja: "{n}件のお気に入りをエクスポートしました" },
  "profile.exportEmpty": { zh: "收藏列表为空，无法导出", en: "Favorites list is empty", ja: "お気に入りが空です" },

  // ===== 反馈系统 =====
  "gate.reportIssue": { zh: "报告问题", en: "Report Issue", ja: "問題を報告" },
  "report.title": { zh: "报告问题", en: "Report Issue", ja: "問題を報告" },
  "report.siteLabel": { zh: "站点", en: "Site", ja: "サイト" },
  "report.issueType": { zh: "问题类型", en: "Issue Type", ja: "問題の種類" },
  "report.description": { zh: "详细描述", en: "Description", ja: "詳細説明" },
  "report.contactLabel": { zh: "联系方式（选填）", en: "Contact (optional)", ja: "連絡先（任意）" },
  "report.submit": { zh: "提交反馈", en: "Submit Report", ja: "フィードバックを送信" },
  "report.success": { zh: "反馈已提交，感谢！", en: "Report submitted, thank you!", ja: "報告を送信しました、ありがとうございます！" },
  "report.tableMissing": { zh: "反馈功能暂不可用，请稍后再试", en: "Report feature is temporarily unavailable, please try again later", ja: "報告機能は一時的に利用できません、後でもう一度お試しください" },
  "report.issueTypes.down": { zh: "站点无法访问", en: "Site Down", ja: "サイトにアクセス不可" },
  "report.issueTypes.ssl": { zh: "SSL 证书问题", en: "SSL Certificate Issue", ja: "SSL証明書の問題" },
  "report.issueTypes.hijacked": { zh: "域名被劫持/转卖", en: "Domain Hijacked", ja: "ドメインが乗っ取られた" },
  "report.issueTypes.wrong_info": { zh: "信息有误", en: "Incorrect Info", ja: "情報が間違っている" },
  "report.issueTypes.other": { zh: "其他", en: "Other", ja: "その他" },
  "report.descPlaceholder": { zh: "请描述遇到的问题，例如：站点已无法访问、API 报错、信息过时等", en: "Describe the issue, e.g. site unreachable, API error, outdated info", ja: "問題を詳しく説明してください。例：サイトにアクセスできない、APIエラー、情報が古い" },

  // ===== 错误页 ErrorBoundary / 404 =====
  "error.title": { zh: "发生错误", en: "Something went wrong", ja: "エラーが発生しました" },
  "error.desc": { zh: "发生意外错误，请刷新页面重试", en: "An unexpected error occurred. Please refresh the page.", ja: "予期しないエラーが発生しました。ページをリロードしてください。" },
  "error.reload": { zh: "刷新页面", en: "Reload", ja: "リロード" },
  "error.notFound": { zh: "页面未找到", en: "Page not found", ja: "ページが見つかりません" },
  "error.backHome": { zh: "返回首页", en: "Back to Home", ja: "ホームに戻る" },
  "scrollToTop": { zh: "回到顶部", en: "Scroll to top", ja: "トップへ戻る" },

  // ===== Toast 通知 =====
  "toast.favorite.added": { zh: "已添加到收藏", en: "Added to favorites", ja: "お気に入りに追加しました" },
  "toast.favorite.removed": { zh: "已从收藏中移除", en: "Removed from favorites", ja: "お気に入りから削除しました" },
  "toast.favorite.error": { zh: "收藏操作失败，请重试", en: "Failed to update favorites", ja: "お気に入りの更新に失敗しました" },
  "toast.compare.added": { zh: "已添加到对比", en: "Added to comparison", ja: "比較に追加しました" },
  "toast.compare.removed": { zh: "已从对比中移除", en: "Removed from comparison", ja: "比較から削除しました" },
  "toast.compare.limit": { zh: "最多只能对比 4 个站点", en: "Maximum 4 sites can be compared", ja: "最大4つのサイトまで比較できます" },
  "toast.report.success": { zh: "反馈已提交，感谢您的帮助", en: "Report submitted, thank you", ja: "レポートを送信しました、ありがとうございます" },
  "toast.report.error": { zh: "提交失败，请稍后重试", en: "Submission failed, please retry", ja: "送信に失敗しました、後で再試行してください" },
  "toast.export.success": { zh: "已导出 {n} 个收藏站点", en: "Exported {n} favorites", ja: "{n}件のお気に入りをエクスポートしました" },
  "toast.export.empty": { zh: "收藏列表为空，无法导出", en: "Favorites list is empty", ja: "お気に入りが空です" },
  "toast.copy.success": { zh: "已复制到剪贴板", en: "Copied to clipboard", ja: "クリップボードにコピーしました" },
  "toast.copy.error": { zh: "复制失败，请手动复制", en: "Copy failed, please copy manually", ja: "コピーに失敗しました、手動でコピーしてください" },

  // ===== 深度健康检测 =====
  "health.checking": { zh: "正在深度检测...", en: "Deep checking...", ja: "深度検証中..." },
  "health.checkBtn": { zh: "深度检测", en: "Deep Check", ja: "深度検証" },
  "health.checkingBtn": { zh: "检测中...", en: "Checking...", ja: "検証中..." },
  "health.success": { zh: "API 端点可用（HTTP {code}）", en: "API endpoint working (HTTP {code})", ja: "APIエンドポイント正常（HTTP {code}）" },
  "health.failure": { zh: "API 端点不可用（HTTP {code}）", en: "API endpoint not working (HTTP {code})", ja: "APIエンドポイント異常（HTTP {code}）" },
  "health.timeout": { zh: "检测超时，站点可能不可用", en: "Check timed out, site may be unavailable", ja: "タイムアウト、サイトが利用不可の可能性" },
  "health.error": { zh: "检测失败：{msg}", en: "Check failed: {msg}", ja: "検査失敗：{msg}" },
  "health.noApiBase": { zh: "该站点无 API 端点，无法深度检测", en: "No API endpoint for this site", ja: "このサイトにはAPIエンドポイントがありません" },
  "health.networkError": { zh: "网络错误，可能需要科学上网或站点已失效", en: "Network error, may require VPN or site is dead", ja: "ネットワークエラー、VPNが必要かサイトが失効の可能性" },
  "health.corsNote": { zh: "注意：浏览器跨域限制可能影响检测结果，建议直接访问站点确认", en: "Note: Browser CORS may affect results, verify by visiting the site", ja: "注意：ブラウザのCORS制限が結果に影響する可能性、直接アクセスで確認してください" },

  // ===== 站点详情：优势/劣势 =====
  "drawer.pros": { zh: "优势", en: "Pros", ja: "メリット" },
  "drawer.cons": { zh: "劣势", en: "Cons", ja: "デメリット" },
  "drawer.tips": { zh: "使用建议", en: "Tips", ja: "使用のヒント" },

  // ===== 用户反馈入口 =====
  "feedback.title": { zh: "意见反馈", en: "Feedback", ja: "フィードバック" },
  "feedback.desc": { zh: "发现站点失效、信息有误或有改进建议？欢迎反馈！", en: "Found a dead site, incorrect info, or have suggestions? Let us know!", ja: "サイトの失効、情報の誤り、改善提案がありましたらお知らせください！" },
  "feedback.github": { zh: "在 GitHub 提 Issue", en: "Open a GitHub Issue", ja: "GitHubでIssueを立てる" },
  "feedback.report": { zh: "报告站点问题", en: "Report a site issue", ja: "サイトの問題を報告" },

  // ===== 支持项目（求 Star / Fork / Issue / 安装）=====
  "support.badge": { zh: "开源公益项目", en: "Open-source · Free", ja: "OSS・無料" },
  "support.title": { zh: "喜欢就点个 Star ⭐", en: "Like it? Drop a Star ⭐", ja: "気に入ったら Star ⭐" },
  "support.desc": {
    zh: "FreeAPI 是一个公益开源的 AI 导航，你的 Star、Fork 与 Issue 是我们持续维护更新的动力。",
    en: "FreeAPI is a free, open-source AI directory. Your Star, Fork and Issues keep us maintaining it.",
    ja: "FreeAPIは無料のOSSAIナビです。Star・Fork・Issueが私たちの継続的な維持を支えます。",
  },
  "support.star": { zh: "点个 Star", en: "Star", ja: "Star する" },
  "support.fork": { zh: "Fork 贡献", en: "Fork", ja: "Fork" },
  "support.issue": { zh: "提 Issue", en: "Issue", ja: "Issue" },
  "support.install": { zh: "安装到主屏", en: "Install App", ja: "ホームに追加" },
  "support.installedHint": {
    zh: "已支持 PWA，可安装到主屏离线使用",
    en: "Installable PWA — add to your home screen",
    ja: "PWA対応・ホーム画面に追加してオフライン利用可",
  },
  "support.installHint": {
    zh: "请使用浏览器菜单中的「添加到主屏幕」",
    en: "Use your browser menu → 'Add to Home Screen'",
    ja: "ブラウザのメニューから「ホームに追加」をご利用ください",
  },
  "footer.feedback": { zh: "意见反馈", en: "Feedback", ja: "フィードバック" },
  "footer.guide": { zh: "使用指南", en: "User Guide", ja: "使い方ガイド" },
  "footer.blacklist": { zh: "失效站点", en: "Dead Sites", ja: "失効サイト" },
};

/** 简单模板替换：{key} → value */
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
