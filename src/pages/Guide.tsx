import { useState } from "react";
import { ArrowLeft, BookOpen, ChevronRight, Terminal, Info } from "lucide-react";
import { useT, useI18n, translate } from "@/i18n/useI18n";
import type { Lang } from "@/i18n/translations";
import { cn, copyToClipboard } from "@/lib/utils";

interface GuideSection {
  id: string;
  titleKey: string;
  paragraphs: string[];
}

// 5 个折叠区块：titleKey + paragraphs（翻译键数组），渲染时按 section/id 注入特殊内容
const SECTIONS: GuideSection[] = [
  {
    id: "section1",
    titleKey: "guide.section1.title",
    paragraphs: ["guide.section1.p1", "guide.section1.p2", "guide.section1.p3", "guide.section1.p4"],
  },
  {
    id: "section2",
    titleKey: "guide.section2.title",
    paragraphs: ["guide.section2.p1", "guide.section2.p2", "guide.section2.p3"],
  },
  {
    id: "section3",
    titleKey: "guide.section3.title",
    paragraphs: ["guide.section3.p1", "guide.section3.p2", "guide.section3.p3", "guide.section3.p4"],
  },
  {
    id: "section4",
    titleKey: "guide.section4.title",
    paragraphs: ["guide.section4.p1", "guide.section4.p2", "guide.section4.p3"],
  },
  {
    id: "section5",
    titleKey: "guide.section5.title",
    paragraphs: [
      "guide.section5.p1",
      "guide.section5.p2",
      "guide.section5.p3",
      "guide.section5.p4",
      "guide.section5.p5",
    ],
  },
];

// 中转站调用示例（OpenAI 兼容接口）
const CURL_EXAMPLE = `curl https://your-relay-site.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk-your-key" \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`;

const PYTHON_EXAMPLE = `from openai import OpenAI

client = OpenAI(
    api_key="sk-your-key",
    base_url="https://your-relay-site.com/v1",
)

resp = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Hello!"}],
)
print(resp.choices[0].message.content)`;

/** 终端风格代码块：标题栏（终端图标 + 语言标签）+ 可复制代码区 */
function CodeBlock({ lang, label, code }: { lang: Lang; label: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-cyber-border bg-cyber-bg/80">
      <div className="flex items-center gap-2 border-b border-cyber-border bg-cyber-elevated/60 px-3 py-2">
        <Terminal className="h-3.5 w-3.5 shrink-0 text-cyber-cyan" />
        <span className="font-mono text-[11px] text-cyber-muted">{label}</span>
        <button
          onClick={handleCopy}
          className="ml-auto rounded px-1.5 py-0.5 font-mono text-[11px] text-cyber-cyan transition-colors hover:bg-cyber-surface"
        >
          {copied ? translate(lang, "guide.copied") : translate(lang, "guide.copy")}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[12px] leading-relaxed text-cyber-text/90">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function Guide() {
  const t = useT();
  const lang = useI18n((s) => s.lang);
  // 手风琴：同时只展开一个，默认展开第一个
  const [openId, setOpenId] = useState<string>(SECTIONS[0].id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      {/* 返回首页 */}
      <a
        href="#/home"
        className="mb-4 inline-flex items-center gap-1.5 font-mono text-xs text-cyber-muted transition-colors hover:text-cyber-cyan"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("guide.back")}
      </a>

      {/* 标题区 */}
      <div className="mb-6 flex items-center gap-3 sm:mb-8">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyber-cyan/15">
          <BookOpen className="h-5 w-5 text-cyber-cyan" />
        </div>
        <h1 className="font-display text-xl font-bold tracking-wider text-cyber-text sm:text-2xl">
          {translate(lang, "guide.title")}
        </h1>
      </div>

      {/* 折叠区块（手风琴） */}
      <div className="space-y-3">
        {SECTIONS.map((section) => {
          const isOpen = openId === section.id;
          return (
            <section
              key={section.id}
              className={cn(
                "overflow-hidden rounded-xl border bg-cyber-elevated/40 transition-colors",
                isOpen ? "border-cyber-cyan/40" : "border-cyber-border",
              )}
            >
              <button
                onClick={() => setOpenId(isOpen ? "" : section.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-cyber-surface/40 sm:px-5"
                aria-expanded={isOpen}
              >
                <ChevronRight
                  className={cn(
                    "h-4 w-4 shrink-0 text-cyber-muted transition-transform",
                    isOpen && "rotate-90 text-cyber-cyan",
                  )}
                />
                <span className="font-display text-sm font-semibold text-cyber-text sm:text-base">
                  {translate(lang, section.titleKey)}
                </span>
              </button>

              {isOpen && (
                <div className="space-y-3 border-t border-cyber-border/50 px-4 py-4 sm:px-5">
                  {section.paragraphs.map((pKey, idx) => (
                    <div key={pKey}>
                      <p className="text-sm leading-relaxed text-cyber-text/80">
                        {translate(lang, pKey)}
                      </p>
                      {/* section3：p2 后接 curl 示例，p3 后接 Python 示例 */}
                      {section.id === "section3" && idx === 1 && (
                        <CodeBlock
                          lang={lang}
                          label={translate(lang, "guide.section3.curlLabel")}
                          code={CURL_EXAMPLE}
                        />
                      )}
                      {section.id === "section3" && idx === 2 && (
                        <CodeBlock
                          lang={lang}
                          label={translate(lang, "guide.section3.pythonLabel")}
                          code={PYTHON_EXAMPLE}
                        />
                      )}
                    </div>
                  ))}

                  {/* section1 末尾：键盘快捷键提示框 */}
                  {section.id === "section1" && (
                    <div className="mt-2 flex items-start gap-2 rounded-lg border border-cyber-cyan/30 bg-cyber-cyan/5 p-3">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyber-cyan" />
                      <p className="font-mono text-xs leading-relaxed text-cyber-text/80">
                        {translate(lang, "guide.section1.kwTip")}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* 关于实时检测（琥珀色边框） */}
      <section className="mt-6 rounded-xl border border-cyber-amber/40 bg-cyber-amber/5 p-4 sm:mt-8 sm:p-5">
        <div className="mb-2 flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0 text-cyber-amber" />
          <h2 className="font-display text-sm font-semibold text-cyber-amber sm:text-base">
            {translate(lang, "guide.liveCheck.title")}
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-cyber-text/80">
          {translate(lang, "guide.liveCheck.desc")}
        </p>
      </section>
    </div>
  );
}
