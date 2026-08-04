// 收藏仓库
// 设计：对外 API（ids / toggle / has / clear）保持不变，组件无需改动。
// - 未登录：纯本地（localStorage，key=ob_favorites），行为与重构前一致。
// - 已登录：本地状态仍为主，同时把每次变更镜像到 Supabase favorites 表（云端收藏）；
//   登录成功时自动把云端收藏合并进本地（并集，本地优先），实现跨设备同步且不丢本地已有项。
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, hasSupabase, AUTH_ENABLED } from '@/lib/supabase';
import { useAuthStore } from './useAuthStore';

const authOn = AUTH_ENABLED && hasSupabase;

interface FavoritesState {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  clear: () => void;
  /** 登录后从云端合并收藏（本地优先，并集） */
  syncFromCloud: () => Promise<void>;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const ids = get().ids;
        const added = !ids.includes(id);
        const next = added ? [...ids, id] : ids.filter((x) => x !== id);
        set({ ids: next });
        // 登录态：镜像到云端收藏表（匿名 key + 用户会话，受 RLS 约束只能改自己的行）
        const uid = useAuthStore.getState().user?.id;
        if (authOn && supabase && uid) {
          if (added) {
            void supabase.from('favorites').upsert({ user_id: uid, resource_id: id });
          } else {
            void supabase.from('favorites').delete().eq('user_id', uid).eq('resource_id', id);
          }
        }
      },
      has: (id) => get().ids.includes(id),
      clear: () => set({ ids: [] }),
      syncFromCloud: async () => {
        const uid = useAuthStore.getState().user?.id;
        if (!authOn || !supabase || !uid) return;
        const { data, error } = await supabase.from('favorites').select('resource_id').eq('user_id', uid);
        if (error || !data) return;
        const cloudIds = (data as { resource_id: string }[]).map((r) => r.resource_id);
        // 并集：本地已有项优先保留，云端补充
        const merged = Array.from(new Set([...get().ids, ...cloudIds]));
        set({ ids: merged });
      },
    }),
    { name: 'ob_favorites' },
  ),
);

// 登录成功后自动从云端合并收藏（单向并集，不覆盖本地已有）
if (authOn) {
  useAuthStore.subscribe((state, prev) => {
    if (state.user && !prev.user) {
      void useFavoritesStore.getState().syncFromCloud();
    }
  });
}
