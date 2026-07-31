// 统一品牌标识：复用 favicon 的 </> 赛博图标，保证导航栏 / 页脚 / 弹层视觉一致
import { memo } from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** 尺寸（px），默认 32 */
  size?: number;
  className?: string;
  /** 是否显示青色辉光 */
  glow?: boolean;
}

function Logo({ size = 32, className, glow = true }: LogoProps) {
  const c = size / 64; // favicon viewBox 为 64
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(glow && "drop-shadow-[0_0_6px_rgba(0,229,255,0.45)]", className)}
      aria-hidden
    >
      <rect width="64" height="64" rx="14" fill="#0a0e14" />
      <rect
        x="0.5"
        y="0.5"
        width="63"
        height="63"
        rx="13.5"
        stroke="#1f2937"
        strokeOpacity="0.6"
      />
      <circle cx="32" cy="32" r="20" fill="#00e5ff" fillOpacity="0.06" />
      <path
        d="M26 20 L16 32 L26 44"
        stroke="#00e5ff"
        strokeWidth={3 * c > 0 ? 3 : 3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M38 20 L48 32 L38 44"
        stroke="#00e5ff"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="36"
        y1="18"
        x2="28"
        y2="46"
        stroke="#ff2e88"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <circle cx="50" cy="16" r="3" fill="#34d399" />
      <circle cx="50" cy="16" r="5" fill="#34d399" fillOpacity="0.2" />
    </svg>
  );
}

export default memo(Logo);
