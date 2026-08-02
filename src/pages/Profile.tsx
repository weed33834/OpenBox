import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useFilterStore } from "@/store/useFilterStore";
import { useToastStore } from "@/store/useToastStore";
import { sites as ALL_SITES, CATEGORY_META } from "@/data/sites";
import { deriveUserDisplay } from "@/hooks/useUserProfile";
import { formatDate } from "@/lib/date-utils";
import { useT, useI18n, translate } from "@/i18n/useI18n";
import DetailDrawer from "@/components/DetailDrawer";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  LogOut,
  Heart,
  ExternalLink,
  Star,
  Download,
} from "lucide-react";

// 稳定的空数组引用，避免 Zustand selector 每次返回新 [] 导致无限重渲染
const EMPTY_FAVORITES: string[] = [];

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const setSelectedId = useFilterStore((s) => s.setSelectedId);
  const favorites = useFavoritesStore((s) => {
    const uid = user?.id ?? "__anon__";
    return s.userFavorites[uid] ?? EMPTY_FAVORITES;
  });
  const toggleFavorite = useFavoritesStore((s) => s.toggle);
  const syncFavorites = useFavoritesStore((s) => s.syncFromDb);
  const toast = useToastStore();
  const t = useT();
  const lang = useI18n((s) => s.lang);

  // 登录后从数据库同步收藏
  useEffect(() => {
    if (user) {
      syncFavorites();
    }
  }, [user, syncFavorites]);

  if (!user) {
    return (
      <div className="container py-12 text-center">
        <p className="text-cyber-muted">{t("gate.title")}</p>
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            onClick={() => openAuthModal()}
            className="rounded-lg bg-cyber-cyan px-4 py-2 text-sm font-semibold text-cyber-bg transition-all hover:shadow-glow-cyan"
          >
            {t("gate.loginBtn")}
          </button>
          <button
            onClick={() => {
              window.location.hash = "#/home";
            }}
            className="font-mono text-sm text-cyber-cyan underline"
          >
            {t("profile.backToHome")}
          </button>
        </div>
      </div>
    );
  }

  // 统一从 Supabase User 提取展示信息（头像、邮箱、用户名、登录方式）
  const { avatarUrl, email, username, provider, isOAuth } = deriveUserDisplay(user);
  // GitHub OAuth UI 已移除，不再区分 github 分支：OAuth 显示 provider，否则邮箱登录
  const providerLabel = isOAuth ? provider : t("profile.emailLogin");
  const createdAt = formatDate(user.created_at, lang);

  // 用 Set 做 O(1) 查找，避免对每个站点线性扫描 favorites
  const favSet = new Set(favorites);
  const favoriteSites = ALL_SITES.filter((s) => favSet.has(s.id));

  // 导出收藏列表为 JSON 文件
  const handleExport = () => {
    if (favoriteSites.length === 0) {
      toast.warning(t("toast.export.empty"));
      return;
    }
    const data = {
      exportedAt: new Date().toISOString(),
      total: favoriteSites.length,
      favorites: favoriteSites.map((s) => ({
        id: s.id,
        name: s.name,
        url: s.url,
        category: s.category,
        type: s.type,
        apiBase: s.apiBase || null,
        models: s.models,
        billing: s.billing || null,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `freeapi-favorites-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("toast.export.success", { n: favoriteSites.length }));
  };

  return (
    <main className="container min-h-[100dvh] px-4 py-6 md:py-10">
      <button
        onClick={() => {
          window.location.hash = "#/home";
        }}
        className="mb-6 inline-flex items-center gap-2 rounded-lg border border-cyber-border bg-cyber-surface px-3 py-2 font-mono text-sm text-cyber-muted transition-colors hover:text-cyber-cyan"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("profile.backToHome")}
      </button>

      <h1 className="mb-8 font-display text-2xl font-bold text-cyber-text md:text-3xl">
        {t("profile.title")}
      </h1>

      {/* User Info */}
      <div className="mb-8 rounded-xl border border-cyber-border bg-cyber-surface/70 p-6">
        <div className="mb-4 flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-16 w-16 rounded-full ring-2 ring-cyber-cyan/30"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cyber-cyan/20 font-mono text-2xl font-bold text-cyber-cyan">
              <User className="h-7 w-7" />
            </span>
          )}
          <div>
            <h2 className="text-lg font-semibold text-cyber-text">
              {username}
            </h2>
            <span className="mt-1 inline-block rounded-full border border-cyber-border px-2 py-0.5 font-mono text-[11px] text-cyber-cyan">
              {providerLabel}
            </span>
          </div>
        </div>

        <div className="space-y-2 border-t border-cyber-border pt-4">
          <div className="flex items-center gap-2 text-sm text-cyber-muted">
            <Mail className="h-4 w-4 shrink-0" />
            <span className="font-mono">{email}</span>
          </div>
          {createdAt && (
            <div className="flex items-center gap-2 text-sm text-cyber-muted">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>
                {t("profile.joinDate")} {createdAt}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Favorites */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-cyber-text">
            <Star className="h-5 w-5 text-cyber-amber" />
            {t("profile.favorites")}
            {favorites.length > 0 && (
              <span className="rounded bg-cyber-elevated px-2 py-0.5 font-mono text-xs text-cyber-muted">
                {favorites.length}
              </span>
            )}
          </h2>
          {favoriteSites.length > 0 && (
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 rounded-lg border border-cyber-border bg-cyber-surface/60 px-3 py-1.5 font-mono text-xs text-cyber-muted transition-colors hover:border-cyber-cyan/40 hover:text-cyber-cyan"
              title={t("profile.exportDesc")}
            >
              <Download className="h-3.5 w-3.5" />
              {t("profile.export")}
            </button>
          )}
        </div>

        {favoriteSites.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-cyber-border bg-cyber-surface/40 py-12 text-center">
            <Heart className="h-10 w-10 text-cyber-muted/40" />
            <p className="text-cyber-muted">{t("profile.favoritesEmpty")}</p>
            <p className="text-xs text-cyber-muted/60">
              {t("profile.favoritesHint")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {favoriteSites.map((site) => {
              const catMeta = CATEGORY_META[site.category];
              const catLabel = translate(lang, `cat.${site.category}`);
              return (
                <div
                  key={site.id}
                  onClick={() => setSelectedId(site.id)}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-cyber-border bg-cyber-surface/60 px-4 py-3 transition-all hover:border-cyber-cyan/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-cyber-text group-hover:text-cyber-cyan transition-colors">
                        {site.name}
                      </p>
                      <span
                        className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase"
                        style={{
                          color: catMeta.color,
                          background: `${catMeta.color}1a`,
                          border: `1px solid ${catMeta.color}33`,
                        }}
                      >
                        {catLabel}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate font-mono text-xs text-cyber-muted">
                      {site.url}
                    </p>
                  </div>
                  <div className="ml-3 flex shrink-0 items-center gap-2">
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-lg border border-cyber-border p-1.5 text-cyber-muted transition-all hover:border-cyber-cyan/40 hover:text-cyber-cyan"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(site.id);
                      }}
                      className="rounded-lg p-1.5 text-cyber-dead transition-all hover:bg-cyber-dead/10"
                      aria-label={t("favorite.remove")}
                    >
                      <Heart className="h-4 w-4 fill-cyber-dead" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <button
        onClick={() => {
          signOut();
          window.location.hash = "#/home";
        }}
        className="inline-flex items-center gap-2 rounded-lg border border-cyber-dead/40 bg-cyber-dead/10 px-4 py-2.5 text-sm text-cyber-dead transition-all hover:bg-cyber-dead/20"
      >
        <LogOut className="h-4 w-4" />
        {t("profile.signOut")}
      </button>

      <DetailDrawer />
    </main>
  );
}
