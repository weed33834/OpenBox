import { useEffect } from "react";
import { useFilterStore } from "@/store/useFilterStore";

/** 判断当前是否首页路由：空 hash / #/ / #/?... 均视为首页 */
function isHomeRoute(): boolean {
  const hash = window.location.hash;
  return hash === "" || hash === "#/" || hash.startsWith("#/?");
}

/** 判断事件目标是否为可输入元素（输入框/文本域/下拉选择/富文本），这些场景下不应拦截快捷键 */
function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

/**
 * 全局键盘快捷键（仅首页生效）：
 * - `/`：聚焦搜索框（id="nav-search"）
 * - `Esc`：清空全部筛选
 * 在 input/textarea/select/contenteditable 内按键时不拦截
 */
export function useKeyboard() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isHomeRoute()) return;
      if (isTypingTarget(e.target)) return;

      if (e.key === "/") {
        e.preventDefault();
        const input = document.getElementById("nav-search");
        if (input instanceof HTMLElement) input.focus();
      } else if (e.key === "Escape") {
        useFilterStore.getState().reset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
