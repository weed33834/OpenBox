import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import { supabase, hasSupabase } from "@/lib/supabase";

// persist 使用的 localStorage 键名，跨标签同步时用于匹配 storage 事件
const STORAGE_KEY = "freeapi-favorites";

interface FavoritesState {
  userFavorites: Record<string, string[]>;
  toggle: (siteId: string) => Promise<void>;
  isFavorite: (siteId: string) => boolean;
  syncFromDb: () => Promise<void>;
}

function getUserId(): string {
  return useAuthStore.getState().user?.id ?? "__anon__";
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      userFavorites: {},
      toggle: async (siteId) => {
        const uid = getUserId();
        const current = get().userFavorites[uid] ?? [];
        const isFav = current.includes(siteId);

        // 乐观更新 localStorage
        set({
          userFavorites: {
            ...get().userFavorites,
            [uid]: isFav
              ? current.filter((id) => id !== siteId)
              : [...current, siteId],
          },
        });

        // 已登录用户同步到数据库
        if (uid !== "__anon__" && hasSupabase && supabase) {
          try {
            if (isFav) {
              await supabase
                .from("user_favorites")
                .delete()
                .eq("user_id", uid)
                .eq("site_id", siteId);
            } else {
              await supabase
                .from("user_favorites")
                .insert({ user_id: uid, site_id: siteId });
            }
          } catch {
            // 数据库操作失败，回滚 localStorage：直接恢复操作前的快照（避免重复/漏删）
            set({
              userFavorites: {
                ...get().userFavorites,
                [uid]: current,
              },
            });
          }
        }
      },
      isFavorite: (siteId) => {
        const uid = getUserId();
        return (get().userFavorites[uid] ?? []).includes(siteId);
      },
      syncFromDb: async () => {
        const uid = getUserId();
        if (uid === "__anon__" || !hasSupabase || !supabase) return;
        try {
          const { data, error } = await supabase
            .from("user_favorites")
            .select("site_id")
            .eq("user_id", uid);
          if (!error && data) {
            const dbFavorites = data.map((r) => r.site_id);
            // 数据库为唯一真实来源：直接用 DB 收藏覆盖本地。
            // 本地-only 的收藏在 toggle 时已同步到 DB，因此直接替换是安全的。
            set({
              userFavorites: {
                ...get().userFavorites,
                [uid]: dbFavorites,
              },
            });
          }
        } catch {
          // 数据库不可用，继续使用 localStorage
        }
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      migrate: (persisted: unknown) => {
        const p = persisted as { favorites?: string[]; userFavorites?: Record<string, string[]> };
        if (Array.isArray(p?.favorites)) {
          return { userFavorites: { __anon__: p.favorites } };
        }
        return { userFavorites: p?.userFavorites ?? {} };
      },
    },
  ),
);

// ===== 跨标签同步：监听 storage 事件，其他标签修改收藏后重新水合本标签状态 =====
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      // persist 中间件提供的 rehydrate：从 localStorage 重新读取并合并
      useFavoritesStore.persist.rehydrate();
    }
  });
}
