'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Eye, X, Search, Zap, RotateCcw } from 'lucide-react';
import {
  CLOUDEE_23_ANIMATIONS,
  CLOUDEE_28_EXPRESSIONS,
  type TargetOverride,
} from './CloudeeAvatar';

/**
 * High-fidelity cute pink Cloudee SVG logo matching the concept images
 */
export function CuteCloudeeLogo({ className = 'w-10 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 75"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Soft 3D Bubblegum Gradient */}
        <radialGradient
          id="cloudeePinkBody"
          cx="42%"
          cy="32%"
          r="68%"
          fx="38%"
          fy="26%"
        >
          <stop offset="0%" stopColor="#ffb0cb" />
          <stop offset="40%" stopColor="#ff7ba5" />
          <stop offset="85%" stopColor="#f44f88" />
          <stop offset="100%" stopColor="#e13874" />
        </radialGradient>

        {/* Specular Top Highlight */}
        <linearGradient
          id="cloudeeTopSheen"
          x1="50"
          y1="4"
          x2="50"
          y2="36"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ffffff" stopOpacity="0.48" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Soft Shadow under cloud */}
        <filter id="cloudeeDropShadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow
            dx="0"
            dy="2.5"
            stdDeviation="2.2"
            floodColor="#b01650"
            floodOpacity="0.32"
          />
        </filter>
      </defs>

      {/* Cloud Body with 3 distinct puffy lobes and rounded base */}
      <path
        d="M 23 62 
           C 11.5 62 4.5 53 4.5 41.5 
           C 4.5 31 12.5 23 23 21.5 
           C 25.5 9.5 36 2 49 2 
           C 62 2 73 10.5 75.5 22.5 
           C 78 21.5 81 21 84 21 
           C 93.5 21 100 29 100 39.5 
           C 100 50.5 92.5 59.5 81.5 61 
           C 79 61.5 76 62 73 62 
           Z"
        fill="url(#cloudeePinkBody)"
        filter="url(#cloudeeDropShadow)"
      />

      {/* Glossy Top Sheen */}
      <path
        d="M 27 24 
           C 29 14 38 7 49 7 
           C 60 7 68.5 13.5 71.5 23 
           C 63 21 54 21 44 22 
           C 37 22.5 31 23 27 24 Z"
        fill="url(#cloudeeTopSheen)"
      />

      {/* Soft Rosy Cheeks */}
      <ellipse cx="32" cy="45" rx="4.5" ry="2.8" fill="#ff2675" opacity="0.3" />
      <ellipse cx="68" cy="45" rx="4.5" ry="2.8" fill="#ff2675" opacity="0.3" />

      {/* Cute Vertical Oval Black Eyes */}
      <rect x="42.5" y="32" width="4.5" height="11" rx="2.25" fill="#181520" />
      <rect x="56.5" y="32" width="4.5" height="11" rx="2.25" fill="#181520" />

      {/* Tiny Eye Sparkle Highlights */}
      <circle cx="44" cy="34.5" r="1.1" fill="#ffffff" opacity="0.9" />
      <circle cx="58" cy="34.5" r="1.1" fill="#ffffff" opacity="0.9" />
    </svg>
  );
}

interface CloudeeStudioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTarget: TargetOverride;
  onSelectTarget: (target: TargetOverride) => void;
  theme?: 'light' | 'dark';
}

export function CloudeeStudioDrawer({
  isOpen,
  onClose,
  currentTarget,
  onSelectTarget,
  theme = 'light',
}: CloudeeStudioDrawerProps) {
  const [activeTab, setActiveTab] = useState<'animations' | 'expressions'>('animations');
  const [searchQuery, setSearchQuery] = useState('');

  const isLight = theme === 'light';

  const filteredAnimations = useMemo(() => {
    if (!searchQuery.trim()) return CLOUDEE_23_ANIMATIONS;
    return CLOUDEE_23_ANIMATIONS.filter((key) =>
      key.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const filteredExpressions = useMemo(() => {
    if (!searchQuery.trim()) return CLOUDEE_28_EXPRESSIONS;
    return CLOUDEE_28_EXPRESSIONS.filter((key) =>
      key.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Neomorphic styling tokens matched 1:1 to the concept images
  const ds = {
    // Outer card container
    card: isLight
      ? 'bg-[#f3f7fb] text-[#111d2e] border border-white/80 shadow-[-12px_-12px_28px_rgba(255,255,255,0.95),14px_14px_32px_rgba(180,195,215,0.6)]'
      : 'bg-[#141b25] text-white border border-white/[0.05] shadow-[-12px_-12px_28px_rgba(255,255,255,0.03),14px_14px_35px_rgba(0,0,0,0.85)]',

    // Header logo circular well
    logoDish: isLight
      ? 'bg-[#e6edf4] shadow-[inset_3px_3px_6px_rgba(180,195,215,0.55),inset_-3px_-3px_6px_rgba(255,255,255,0.95)] border border-slate-200/40'
      : 'bg-[#0e141d] shadow-[inset_3px_3px_6px_rgba(0,0,0,0.8),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] border border-white/[0.04]',
    logoGlow: isLight ? 'bg-teal-400/20' : 'bg-cyan-500/20',

    // Circular close button
    closeBtn: isLight
      ? 'bg-[#f0f4f9] shadow-[-3px_-3px_7px_rgba(255,255,255,0.95),3px_3px_8px_rgba(180,195,215,0.5)] active:shadow-[inset_2px_2px_4px_rgba(180,195,215,0.6)] text-slate-500 hover:text-slate-900 border border-white/80'
      : 'bg-[#18202b] shadow-[-2px_-2px_6px_rgba(255,255,255,0.03),3px_3px_8px_rgba(0,0,0,0.6)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.7)] text-white/60 hover:text-white border border-white/[0.04]',

    // Current status
    statusLabel: isLight ? 'text-slate-400' : 'text-white/40',
    statusPill: isLight
      ? 'bg-[#d6f5ef] border border-teal-300/80 shadow-[0_2px_10px_rgba(20,184,166,0.18)]'
      : 'bg-[#0b222a] border border-teal-500/40 shadow-[0_0_14px_rgba(20,184,166,0.22)]',
    statusTextPrimary: isLight ? 'text-teal-950' : 'text-teal-300',
    statusTextSecondary: isLight ? 'text-teal-700' : 'text-teal-400/80',

    // Active tab
    activeTab: isLight
      ? 'bg-gradient-to-r from-teal-300 to-cyan-300 text-slate-900 font-bold shadow-[0_3px_12px_rgba(45,212,191,0.4)]'
      : 'bg-gradient-to-r from-cyan-400 to-[#2dd4bf] text-slate-950 font-bold shadow-[0_0_18px_rgba(6,182,212,0.45)]',

    // Inactive tab
    inactiveTab: isLight
      ? 'bg-[#edf3f9] shadow-[-2px_-2px_6px_rgba(255,255,255,0.9),2px_2px_6px_rgba(180,195,215,0.45)] border border-white/80 text-slate-600 hover:text-slate-900'
      : 'bg-[#161d28] shadow-[-2px_-2px_5px_rgba(255,255,255,0.03),3px_3px_7px_rgba(0,0,0,0.5)] border border-white/5 text-white/60 hover:text-white',

    // Search inset well
    searchWell: isLight
      ? 'bg-[#e6edf4] shadow-[inset_3px_3px_6px_rgba(180,195,215,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.95)] border border-slate-200/40 text-slate-800 placeholder:text-slate-400'
      : 'bg-[#0e141c] shadow-[inset_3px_3px_7px_rgba(0,0,0,0.7),inset_-2px_-2px_5px_rgba(255,255,255,0.03)] border border-white/[0.03] text-white placeholder:text-white/30',

    // Grid Item normal
    gridItem: isLight
      ? 'bg-[#f3f7fb] shadow-[-3px_-3px_7px_rgba(255,255,255,0.95),3px_3px_8px_rgba(180,195,215,0.5)] hover:shadow-[-2px_-2px_5px_rgba(255,255,255,0.9),2px_2px_6px_rgba(180,195,215,0.6)] border border-white/60 text-slate-700 hover:text-slate-950 active:shadow-[inset_2px_2px_4px_rgba(180,195,215,0.6)]'
      : 'bg-[#171e2a] shadow-[-2px_-2px_6px_rgba(255,255,255,0.03),3px_3px_8px_rgba(0,0,0,0.6)] hover:shadow-[-1px_-1px_3px_rgba(255,255,255,0.05),2px_2px_5px_rgba(0,0,0,0.8)] border border-white/[0.04] text-white/80 hover:text-white active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.7)]',

    // Grid Item active
    gridItemActive: isLight
      ? 'bg-[#dcf7f1] border border-teal-400 text-teal-950 font-bold shadow-[0_0_14px_rgba(20,184,166,0.35)]'
      : 'bg-[#0b242e] border border-cyan-400 text-cyan-200 font-bold shadow-[0_0_16px_rgba(6,182,212,0.35)]',

    // Grid Item right icon dish
    iconDish: isLight
      ? 'bg-[#ebf1f7] shadow-[inset_1px_1px_3px_rgba(180,195,215,0.5),inset_-1px_-1px_2px_rgba(255,255,255,0.9)] text-slate-500 group-hover:text-teal-600'
      : 'bg-[#111721] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.04)] text-white/50 group-hover:text-cyan-300',

    iconDishActive: isLight
      ? 'bg-teal-400 text-slate-950 shadow-[0_0_8px_rgba(20,184,166,0.5)]'
      : 'bg-cyan-400 text-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.6)]',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className={`absolute inset-0 z-40 flex flex-col rounded-[32px] p-7 sm:p-8 select-none overflow-hidden ${ds.card}`}
        >
          {/* Scoped CSS for glowing cyan/teal neomorphic scrollbar */}
          <style jsx global>{`
            .cloudee-studio-scrollbar::-webkit-scrollbar {
              width: 5px;
            }
            .cloudee-studio-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .cloudee-studio-scrollbar-dark::-webkit-scrollbar-thumb {
              background: #06b6d4;
              border-radius: 9999px;
              box-shadow: 0 0 10px #06b6d4;
            }
            .cloudee-studio-scrollbar-light::-webkit-scrollbar-thumb {
              background: #14b8a6;
              border-radius: 9999px;
              box-shadow: 0 0 8px rgba(20, 184, 166, 0.6);
            }
          `}</style>

          {/* ── 1. Top Header: Cute Cloudee Logo Dish + Title + Close Button ── */}
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-3.5">
              {/* Neomorphic circular well with cute pink Cloudee logo */}
              <div
                className={`size-13 sm:size-14 rounded-full flex items-center justify-center relative overflow-hidden shrink-0 ${ds.logoDish}`}
              >
                {/* Ambient backlight glow */}
                <div
                  className={`absolute inset-1.5 rounded-full filter blur-sm pointer-events-none ${ds.logoGlow}`}
                />
                <CuteCloudeeLogo className="w-10 h-8 sm:w-11 sm:h-9 relative z-10 drop-shadow-sm" />
              </div>

              <div>
                <h3
                  className={`text-base sm:text-[18px] font-bold tracking-tight leading-snug ${
                    isLight ? 'text-[#111d2e]' : 'text-white'
                  }`}
                >
                  Avatar Studio Explorer
                </h3>
                <p
                  className={`text-xs font-normal tracking-wide ${
                    isLight ? 'text-slate-400' : 'text-white/45'
                  }`}
                >
                  23 Animations · 28 Expressions
                </p>
              </div>
            </div>

            {/* Circular neomorphic close button */}
            <button
              type="button"
              onClick={onClose}
              className={`size-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ${ds.closeBtn}`}
              title="Close Avatar Studio Explorer"
            >
              <X className="size-4 shrink-0 stroke-[2.2]" />
            </button>
          </div>

          {/* ── 2. Controls Row: Current Status & Tab Switchers ── */}
          <div className="mt-5 mb-4 flex flex-wrap items-center justify-between gap-3">
            {/* Status Pill */}
            <div className="flex items-center gap-2.5">
              <span
                className={`text-[10px] font-mono font-semibold tracking-wider uppercase ${ds.statusLabel}`}
              >
                CURRENT STATUS:
              </span>

              {currentTarget ? (
                <button
                  type="button"
                  onClick={() => onSelectTarget(null)}
                  className={`px-3.5 py-1.5 rounded-2xl flex items-center gap-2 text-left cursor-pointer transition-all ${ds.statusPill}`}
                  title="Click to reset and resume Live Form Tracking"
                >
                  <RotateCcw className="size-3.5 text-cyan-400 shrink-0" />
                  <div className="leading-tight">
                    <span className={`block text-xs font-bold ${ds.statusTextPrimary}`}>
                      {currentTarget.kind === 'animation' ? '▶' : '✦'} {currentTarget.key}
                    </span>
                    <span
                      className={`block text-[10px] font-medium opacity-80 ${ds.statusTextSecondary}`}
                    >
                      Reset to Live Auto
                    </span>
                  </div>
                </button>
              ) : (
                <div
                  className={`px-3.5 py-1.5 rounded-2xl flex items-center gap-2 leading-tight ${ds.statusPill}`}
                >
                  <Zap className="size-3.5 text-amber-400 shrink-0 fill-amber-400 drop-shadow-sm" />
                  <div>
                    <span className={`block text-xs font-bold ${ds.statusTextPrimary}`}>
                      Live Form Tracking
                    </span>
                    <span className={`block text-[10px] font-medium ${ds.statusTextSecondary}`}>
                      Active
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Segmented Switcher Pills: Animations (23) vs Expressions (28) */}
            <div className="flex items-center gap-2">
              {/* Animations Tab */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('animations');
                  setSearchQuery('');
                }}
                className={`px-3.5 py-1.5 rounded-2xl flex items-center gap-2 cursor-pointer transition-all ${
                  activeTab === 'animations' ? ds.activeTab : ds.inactiveTab
                }`}
              >
                <div
                  className={`size-4 rounded-full flex items-center justify-center ${
                    activeTab === 'animations'
                      ? 'bg-slate-950/15 text-slate-950'
                      : isLight
                      ? 'text-slate-500'
                      : 'text-white/50'
                  }`}
                >
                  <Play className="size-2.5 fill-current ml-0.5" />
                </div>
                <div className="text-left leading-none">
                  <span className="block text-xs font-bold">Animations</span>
                  <span
                    className={`block text-[10px] ${
                      activeTab === 'animations' ? 'opacity-80' : 'opacity-60'
                    }`}
                  >
                    ({CLOUDEE_23_ANIMATIONS.length})
                  </span>
                </div>
              </button>

              {/* Expressions Tab */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('expressions');
                  setSearchQuery('');
                }}
                className={`px-3.5 py-1.5 rounded-2xl flex items-center gap-2 cursor-pointer transition-all ${
                  activeTab === 'expressions' ? ds.activeTab : ds.inactiveTab
                }`}
              >
                <Eye
                  className={`size-3.5 ${
                    activeTab === 'expressions'
                      ? 'text-slate-950'
                      : isLight
                      ? 'text-slate-500'
                      : 'text-white/50'
                  }`}
                />
                <div className="text-left leading-none">
                  <span className="block text-xs font-bold">Expressions</span>
                  <span
                    className={`block text-[10px] ${
                      activeTab === 'expressions' ? 'opacity-80' : 'opacity-60'
                    }`}
                  >
                    ({CLOUDEE_28_EXPRESSIONS.length})
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* ── 3. Search Filter Bar: Neomorphic Inset Well ── */}
          <div
            className={`relative mb-4 flex h-11 items-center rounded-2xl px-4 transition-all ${ds.searchWell}`}
          >
            <Search
              className={`size-4 mr-2.5 shrink-0 ${
                isLight ? 'text-slate-400' : 'text-white/35'
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Filter ${activeTab}...`}
              className="w-full bg-transparent text-xs sm:text-[13px] font-normal outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={`ml-2 text-xs font-semibold cursor-pointer ${
                  isLight ? 'text-slate-400 hover:text-slate-700' : 'text-white/40 hover:text-white'
                }`}
              >
                Clear
              </button>
            )}
          </div>

          {/* ── 4. Preset Buttons: Exactly 3-Column Grid matching concept images ── */}
          <div
            className={`flex-1 overflow-y-auto pr-1.5 cloudee-studio-scrollbar ${
              isLight ? 'cloudee-studio-scrollbar-light' : 'cloudee-studio-scrollbar-dark'
            }`}
          >
            {activeTab === 'animations' ? (
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3 pb-2">
                {filteredAnimations.map((animKey) => {
                  const isSelected =
                    currentTarget?.kind === 'animation' && currentTarget.key === animKey;
                  return (
                    <button
                      key={animKey}
                      type="button"
                      onClick={() => onSelectTarget({ kind: 'animation', key: animKey })}
                      className={`h-[44px] sm:h-[46px] rounded-2xl px-3.5 flex items-center justify-between text-left transition-all duration-150 cursor-pointer select-none group ${
                        isSelected ? ds.gridItemActive : ds.gridItem
                      }`}
                    >
                      <span className="text-xs sm:text-[13px] font-medium tracking-wide truncate mr-2">
                        {animKey}
                      </span>
                      <div
                        className={`size-5 sm:size-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                          isSelected ? ds.iconDishActive : ds.iconDish
                        }`}
                      >
                        <Play className="size-2 sm:size-2.5 fill-current ml-0.5" />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3 pb-2">
                {filteredExpressions.map((exprKey) => {
                  const isSelected =
                    currentTarget?.kind === 'expression' && currentTarget.key === exprKey;
                  return (
                    <button
                      key={exprKey}
                      type="button"
                      onClick={() => onSelectTarget({ kind: 'expression', key: exprKey })}
                      className={`h-[44px] sm:h-[46px] rounded-2xl px-3.5 flex items-center justify-between text-left transition-all duration-150 cursor-pointer select-none group ${
                        isSelected ? ds.gridItemActive : ds.gridItem
                      }`}
                    >
                      <span className="text-xs sm:text-[13px] font-medium tracking-wide truncate mr-2">
                        {exprKey}
                      </span>
                      <div
                        className={`size-5 sm:size-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                          isSelected ? ds.iconDishActive : ds.iconDish
                        }`}
                      >
                        <Eye className="size-2.5 sm:size-3" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === 'animations' && filteredAnimations.length === 0 && (
              <div className="py-12 text-center text-xs opacity-50">
                No animations found matching &quot;{searchQuery}&quot;
              </div>
            )}

            {activeTab === 'expressions' && filteredExpressions.length === 0 && (
              <div className="py-12 text-center text-xs opacity-50">
                No expressions found matching &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CloudeeStudioDrawer;
