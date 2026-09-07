"use client";

import React, { useEffect, useRef, useState, useId } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import mermaid from "mermaid";
import { Check, Copy, Terminal, Eye } from "lucide-react";
import { useApp } from "@/lib/app-context";

// Initialize mermaid once
if (typeof window !== "undefined") {
  mermaid.initialize({
    startOnLoad: false,
    suppressErrorRendering: true,
    theme: "dark",
    securityLevel: "loose",
    fontFamily: "var(--font-mono), monospace",
  });
}

function cleanupStrayMermaidNodes(id?: string) {
  if (typeof document === "undefined") return;
  const selectors = [
    'body > [id^="dmermaid"]',
    'body > [id^="mermaid-"]',
    'body > .error-icon',
    'body > div[id^="dmermaid"]',
    'svg[aria-roledescription="error"]',
    '.error-icon',
  ];
  if (id) {
    selectors.push(`#${id}`, `#d${id}`);
  }
  selectors.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => {
      try {
        if (el.parentNode === document.body || (el as HTMLElement).style.display === "none") {
          el.remove();
        }
      } catch {}
    });
  });
}

function sanitizeMermaidChart(raw: string): string {
  if (!raw) return "";
  const lines = raw.trim().split("\n");
  const processed = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("%%") || trimmed.startsWith("classDef") || trimmed.startsWith("class ")) {
      return line;
    }
    if (/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph)\b/i.test(trimmed)) {
      return line;
    }
    let res = line;
    // Fix unquoted stadium node: id([Label: with text]) -> id(["Label: with text"])
    res = res.replace(/(\b\w+)\s*\(\[\s*([^"\]\n]+?)\s*\]\)/g, '$1(["$2"])');
    // Fix unquoted square node: id[Label: with colons or ~ or &] -> id(["Label: with colons..."])
    res = res.replace(/(\b\w+)\s*\[\s*([^"\]\n]+?)\s*\]/g, (match, id, label) => {
      if (label.startsWith('"') && label.endsWith('"')) return match;
      const clean = label.replace(/"/g, "'").replace(/~/g, "-");
      return `${id}["${clean}"]`;
    });
    return res;
  });
  return processed.join("\n");
}

// ── Mermaid Diagram Renderer ──
function MermaidDiagram({ chart, isLight }: { chart: string; isLight: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const idRef = useRef<string>("");
  if (!idRef.current) {
    idRef.current = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
  }
  const uniqueId = idRef.current;

  useEffect(() => {
    let isMounted = true;
    cleanupStrayMermaidNodes(uniqueId);

    async function renderChart() {
      try {
        mermaid.initialize({
          startOnLoad: false,
          suppressErrorRendering: true,
          theme: isLight ? "neutral" : "dark",
          themeVariables: isLight
            ? {
                primaryColor: "#e0f2fe",
                primaryTextColor: "#0369a1",
                primaryBorderColor: "#38bdf8",
                lineColor: "#0284c7",
                secondaryColor: "#f0fdf4",
                tertiaryColor: "#f8fafc",
              }
            : {
                primaryColor: "#0c1e28",
                primaryTextColor: "#38e8cb",
                primaryBorderColor: "#00d2c4",
                lineColor: "#22d3ee",
                secondaryColor: "#08131d",
                tertiaryColor: "#03070d",
              },
          securityLevel: "loose",
          fontFamily: "inherit",
        });

        const cleanChart = sanitizeMermaidChart(chart);

        if (typeof (mermaid as any).parse === "function") {
          try {
            await (mermaid as any).parse(cleanChart);
          } catch (parseErr) {
            cleanupStrayMermaidNodes(uniqueId);
            if (isMounted) {
              setError("Parse error");
            }
            return;
          }
        }

        const { svg: renderedSvg } = await mermaid.render(uniqueId, cleanChart);
        cleanupStrayMermaidNodes(uniqueId);
        if (isMounted) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err: any) {
        cleanupStrayMermaidNodes(uniqueId);
        if (isMounted) {
          setError(err?.message || "Failed to render diagram");
        }
      }
    }

    renderChart();
    return () => {
      isMounted = false;
      cleanupStrayMermaidNodes(uniqueId);
    };
  }, [chart, isLight]);

  if (error) {
    return (
      <div
        className={`my-3 p-3.5 rounded-2xl border ${
          isLight
            ? "bg-slate-50 border-slate-200 text-slate-700"
            : "bg-[#090f18]/60 border-cyan-500/20 text-cyan-200"
        }`}
      >
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold opacity-75">
          <Terminal className="size-3.5 text-cyan-400" />
          <span>Multi-Agent Task Architecture</span>
        </div>
        <pre className="text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap auth-form-scrollbar opacity-90">
          {chart}
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div
        className={`p-4 my-3 rounded-2xl flex items-center justify-center gap-2.5 text-xs font-mono border transition-colors ${
          isLight
            ? "bg-[#eaf1f8] border-slate-200 text-slate-600 shadow-sm"
            : "bg-[#090f18]/60 border-cyan-500/20 text-cyan-300"
        }`}
      >
        <span className="size-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
        <span className="animate-pulse font-medium">Synthesizing Multi-Agent Flow...</span>
      </div>
    );
  }

  return (
    <div
      className={`my-4 p-4 rounded-2xl overflow-x-auto flex justify-center ${
        isLight
          ? "bg-[#f8fafc] border border-slate-200 shadow-sm"
          : "bg-[#090f18]/80 border border-cyan-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
      }`}
    >
      <div
        ref={containerRef}
        dangerouslySetInnerHTML={{ __html: svg }}
        className="max-w-full overflow-x-auto flex justify-center py-2"
      />
    </div>
  );
}

// ── Code Block with Copy & Header ──
function CodeBlock({
  language,
  value,
  isLight,
}: {
  language: string;
  value: string;
  isLight: boolean;
}) {
  const [copied, setCopied] = useState(false);

  // If language is mermaid, render diagram
  if (language === "mermaid") {
    return <MermaidDiagram chart={value} isLight={isLight} />;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`my-3.5 rounded-2xl overflow-hidden border ${
        isLight
          ? "border-slate-300/80 bg-[#1e293b] text-slate-100 shadow-sm"
          : "border-white/10 bg-[#080d14] text-cyan-100 shadow-lg"
      }`}
    >
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/[0.03] text-xs">
        <div className="flex items-center gap-2">
          <Terminal className="size-3.5 text-cyan-400" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-300 font-semibold">
            {language || "code"}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-xs"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed auth-form-scrollbar">
        <code>{value}</code>
      </pre>
    </div>
  );
}

// ── LaTeX Normalizer for Remark-Math / KaTeX ──
function normalizeMarkdownLatex(raw: string): string {
  if (!raw) return "";
  let processed = raw;

  // 1. Convert standard \[ ... \] block math to $$ ... $$
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `\n\n$$\n${math.trim()}\n$$\n\n`);

  // 2. Convert standard \( ... \) inline math to $ ... $
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`);

  // 3. Catch bracketed display blocks that lost backslash from markdown escaping:
  //    e.g. [ \text{Safety} = ... ] or [ \begin{aligned} ... \end{aligned} ]
  processed = processed.replace(
    /(?:^|\n)[ \t]*\[[ \t]*(\\?(?:text|begin|mathbf|frac|bigl|left|[a-zA-Z0-9_]+\s*=)[\s\S]*?\])(?=[ \t]*(?:\n|$))/g,
    (match, inner) => {
      let math = inner.trim();
      if (math.endsWith("]")) {
        math = math.slice(0, -1).trim();
      }
      // Fix broken single backslash row breaks before alignment ampersand: ' \ &=' -> ' \\ &='
      math = math.replace(/([^\\])\\\s*&/g, "$1 \\\\ &");
      return `\n\n$$\n${math}\n$$\n\n`;
    }
  );

  // 4. Wrap standalone \begin{aligned} ... \end{aligned} blocks not already enclosed in $$
  processed = processed.replace(
    /(?<!\$\$[\s\S]*?)(\\begin\{(?:aligned|equation|gather|matrix|bmatrix|pmatrix)\}[\s\S]*?\\end\{(?:aligned|equation|gather|matrix|bmatrix|pmatrix)\})(?![\s\S]*?\$\$)/g,
    "\n\n$$\n$1\n$$\n\n"
  );

  return processed;
}

// ── Master Markdown Renderer ──
interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const { theme } = useApp();
  const isLight = theme === "light";
  const normalizedContent = React.useMemo(() => normalizeMarkdownLatex(content), [content]);

  return (
    <div className="prose dark:prose-invert max-w-none text-inherit leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { output: "html", throwOnError: false, strict: false }]]}
        components={{
          // Code & Syntax
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");

            if (!inline && (match || codeString.includes("\n"))) {
              return (
                <CodeBlock
                  language={match ? match[1] : ""}
                  value={codeString}
                  isLight={isLight}
                />
              );
            }

            return (
              <code
                className={`px-1.5 py-0.5 rounded-md font-mono text-xs font-semibold ${
                  isLight
                    ? "bg-sky-100/70 text-sky-900 border border-sky-200/60"
                    : "bg-cyan-950/80 text-cyan-200 border border-cyan-500/30"
                }`}
                {...props}
              >
                {children}
              </code>
            );
          },

          // Tables
          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto rounded-2xl border border-slate-300 dark:border-white/10 shadow-sm auth-form-scrollbar">
                <table className="w-full text-left text-xs border-collapse divide-y divide-slate-200 dark:divide-white/10">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead
                className={`${
                  isLight ? "bg-slate-100 text-slate-800" : "bg-[#0b1420] text-cyan-300"
                } font-semibold uppercase tracking-wider text-[10px]`}
              >
                {children}
              </thead>
            );
          },
          tbody({ children }) {
            return (
              <tbody
                className={`divide-y ${
                  isLight
                    ? "divide-slate-200 bg-white text-slate-800"
                    : "divide-white/5 bg-[#060b12]/70 text-slate-200"
                }`}
              >
                {children}
              </tbody>
            );
          },
          tr({ children }) {
            return (
              <tr
                className={`transition-colors ${
                  isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.03]"
                }`}
              >
                {children}
              </tr>
            );
          },
          th({ children }) {
            return <th className="px-4 py-3 font-bold">{children}</th>;
          },
          td({ children }) {
            return <td className="px-4 py-2.5 whitespace-nowrap">{children}</td>;
          },

          // Blockquotes / Alerts
          blockquote({ children }) {
            return (
              <blockquote
                className={`my-3 pl-4 border-l-4 rounded-r-xl py-2 pr-3 text-sm italic ${
                  isLight
                    ? "border-sky-500 bg-sky-50/50 text-slate-700"
                    : "border-cyan-400 bg-cyan-950/20 text-slate-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                }`}
              >
                {children}
              </blockquote>
            );
          },

          // Headings
          h1({ children }) {
            return (
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-4 mb-2 font-serif">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-lg sm:text-xl font-bold tracking-tight mt-3 mb-1.5">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-sm sm:text-base font-bold tracking-tight mt-2.5 mb-1 text-cyan-500 dark:text-cyan-400">
                {children}
              </h3>
            );
          },

          // Paragraphs & Lists
          p({ children }) {
            return <p className="mb-2 leading-relaxed">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc list-inside space-y-1 my-2 pl-1">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal list-inside space-y-1 my-2 pl-1">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
          },

          // Links
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 dark:text-cyan-400 underline underline-offset-2 hover:opacity-80 transition-opacity font-medium"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}
