import { useEffect, useState, useCallback } from "react";

// beforeinstallprompt 事件在 TS DOM lib 中未内置，这里做最小类型声明
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * 捕获浏览器原生 PWA 安装事件（beforeinstallprompt），暴露 install() 触发"添加到主屏幕"。
 * 不可用时 canInstall=false，调用方应回退为提示用户手动添加。
 */
export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      // 阻止浏览器默认的小气泡，改为由我们自己的按钮触发
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return false;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    return outcome === "accepted";
  }, [deferred]);

  return { canInstall: !!deferred, install };
}
