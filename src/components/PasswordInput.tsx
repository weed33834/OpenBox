import { useState, type Ref } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useT } from "@/i18n/useI18n";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  label?: string;
  ref?: Ref<HTMLInputElement>;
  /** 控制是否显示密码不匹配的红色边框 */
  mismatch?: boolean;
}

/**
 * 可复用的密码输入框：内置显示/隐藏切换、aria-label 国际化。
 * 消除 AuthModal 中 4 处重复的密码输入逻辑。
 */
export default function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete = "current-password",
  label,
  ref,
  mismatch = false,
}: Props) {
  const [show, setShow] = useState(false);
  const t = useT();

  return (
    <div>
      {label && (
        <label className="mb-1.5 block font-mono text-[11px] text-cyber-muted">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full rounded-lg border bg-cyber-bg px-3 py-2 pr-10 text-sm text-cyber-text placeholder:text-cyber-muted/50 focus:outline-none ${
            mismatch
              ? "border-cyber-dead/50"
              : "border-cyber-border focus:border-cyber-cyan/50"
          }`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cyber-muted transition-colors hover:text-cyber-text"
          tabIndex={-1}
          aria-label={t("auth.togglePassword")}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
