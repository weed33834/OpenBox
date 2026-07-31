import { create } from "zustand";
import type { User, Session } from "@supabase/supabase-js";
import { supabase, hasSupabase } from "@/lib/supabase";

interface AuthState {
  user: User | null;
  session: Session | null;
  showAuthModal: boolean;
  passwordRecovery: boolean;

  setSession: (session: Session | null) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  setPasswordRecovery: (v: boolean) => void;

  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  showAuthModal: false,
  passwordRecovery: false,

  setSession: (session) => set({ session, user: session?.user ?? null }),
  openAuthModal: () => set({ showAuthModal: true }),
  closeAuthModal: () => set({ showAuthModal: false, passwordRecovery: false }),
  setPasswordRecovery: (v) => set({ passwordRecovery: v, showAuthModal: v }),

  signOut: async () => {
    if (hasSupabase && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Supabase 调用失败，保留本地登录状态
        return;
      }
    }
    set({ user: null, session: null, showAuthModal: false, passwordRecovery: false });
  },
}));
