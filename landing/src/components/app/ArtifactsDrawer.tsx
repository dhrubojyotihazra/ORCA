"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/app-context";
import { X, Copy, Check, Terminal, ExternalLink, Download } from "lucide-react";

export function ArtifactsDrawer() {
  const { activeArtifact, setActiveArtifact, theme } = useApp();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "meta">("content");
  const isLight = theme === "light";

  if (!activeArtifact) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeArtifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] lg:w-[540px] z-40 flex flex-col p-3 shadow-2xl transition-all duration-300">
      <div
        className={`h-full w-full rounded-[24px] flex flex-col overflow-hidden ${
          isLight ? "neo-card-light" : "neo-card-dark"
        }`}
      >
        {/* ── Top Drawer Header ── */}
        <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Terminal className="size-4" />
            </div>
            <div className="min-w-0">
              <h3 className={`text-sm font-bold truncate ${isLight ? "text-slate-900" : "text-white"}`}>
                {activeArtifact.title}
              </h3>
              {activeArtifact.subtitle && (
                <p className="text-[11px] text-slate-400 truncate">{activeArtifact.subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isLight ? "neo-btn-light text-slate-700" : "neo-btn-dark text-slate-300"
              }`}
              title="Copy code"
            >
              {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
            </button>

            <button
              onClick={() => setActiveArtifact(null)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close artifact"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* ── Code / Content Body ── */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs auth-form-scrollbar">
          <pre
            className={`p-4 rounded-2xl overflow-x-auto ${
              isLight
                ? "bg-slate-900 text-slate-100 shadow-inner"
                : "bg-black/50 text-cyan-100 border border-white/5"
            }`}
          >
            <code>{activeArtifact.content}</code>
          </pre>
        </div>

        {/* ── Drawer Footer ── */}
        <div className="p-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px] uppercase tracking-wider">
            {activeArtifact.language || activeArtifact.type} · Artifact
          </span>
          <button
            onClick={() => alert("Downloading artifact as file...")}
            className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            <Download className="size-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
}
