"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Plus,
  Search,
  PanelLeftClose,
  PanelLeft,
  MapPin,
  Ship,
  ChevronDown,
  Crosshair,
  Settings,
  Trash2,
  MoreVertical,
  Pin,
  PinOff,
  Edit3,
  Check,
  X,
} from "lucide-react";
import { useApp, COASTAL_PORTS } from "@/lib/app-context";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    theme,
    chats,
    activeChatId,
    setActiveChatId,
    deleteChat,
    pinChat,
    renameChat,
    isSidebarCollapsed,
    toggleSidebar,
    userLocation,
    selectPort,
    requestLiveLocation,
    vesselType,
    setVesselType,
    userRole,
    setUserRole,
    setIsSettingsOpen,
    user,
  } = useApp();

  const isLight = theme === "light";
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // 3-dot dropdown menu & inline rename states
  const [menuOpenChatId, setMenuOpenChatId] = useState<string | null>(null);
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [renamingText, setRenamingText] = useState("");

  useEffect(() => {
    const handleOutsideClick = () => {
      setMenuOpenChatId(null);
    };
    if (menuOpenChatId) {
      window.addEventListener("click", handleOutsideClick);
    }
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [menuOpenChatId]);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatarUrl]);

  const filteredChats = searchQuery.trim()
    ? chats.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : chats;

  // Prioritize pinned chats at the top of the sidebar
  const sortedChats = [...filteredChats].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  const handleConfirmRename = (chatId: string) => {
    if (renamingText.trim()) {
      renameChat(chatId, renamingText.trim());
    }
    setRenamingChatId(null);
  };

  const handleNewChat = () => {
    router.push("/new");
  };

  if (isSidebarCollapsed) {
    return (
      <div className="fixed top-3 left-3 z-40">
        <button
          onClick={toggleSidebar}
          className={`p-2.5 rounded-2xl transition-all cursor-pointer ${
            isLight ? "neo-btn-light text-slate-700" : "neo-btn-dark text-slate-200"
          }`}
          title="Expand Sidebar"
          aria-label="Expand Sidebar"
        >
          <PanelLeft className="size-5" />
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Mobile backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden"
        onClick={toggleSidebar}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 md:static md:z-30 w-[280px] sm:w-[260px] h-[calc(100dvh-24px)] m-3 flex flex-col rounded-[28px] shrink-0 transition-all duration-300 select-none shadow-2xl md:shadow-none ${
          isLight ? "neo-card-light" : "neo-card-dark"
        }`}
      >
      {/* ── Logo + Collapse ── */}
      <div className="p-5 pb-3 flex items-center justify-between">
        <Link href="/app" className="flex items-center gap-2.5 group">
          <div className="relative size-8 flex items-center justify-center">
            {isLight ? (
              <img
                src="/images/orca-logo-light.png"
                alt="ORCA Logo"
                className="w-full h-full object-contain filter drop-shadow-sm transition-transform group-hover:scale-105"
              />
            ) : (
              <img
                src="/images/orca-logo-dark-transparent.png"
                alt="ORCA Logo"
                className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(6,182,212,0.5)] transition-transform group-hover:scale-105"
              />
            )}
          </div>
          <div>
            <span
              className={`text-xl font-bold tracking-tight font-serif block leading-tight ${
                isLight ? "text-slate-900" : "text-white"
              }`}
            >
              Orca
            </span>
            <span className="text-[9px] font-mono text-cyan-500 font-bold tracking-wider uppercase block">
              ISRO SIH26176
            </span>
          </div>
        </Link>

        <button
          onClick={toggleSidebar}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            isLight
              ? "text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose className="size-4" />
        </button>
      </div>

      {/* ── "+ New Marine Inquiry" Button ── */}
      <div className="px-4 py-2">
        <button
          onClick={handleNewChat}
          data-tour="sidebar-new-inquiry"
          className={`w-full py-2.5 px-4 rounded-2xl flex items-center gap-2.5 font-medium text-sm transition-all duration-200 cursor-pointer ${
            isLight
              ? "bg-[#e5eff9] text-sky-950 hover:bg-[#dce9f6] shadow-[-2px_-2px_6px_rgba(255,255,255,0.9),2px_2px_6px_rgba(180,195,215,0.4)] border border-white/60 active:scale-[0.98]"
              : "bg-gradient-to-r from-teal-950/60 to-cyan-950/40 text-teal-200 border border-teal-500/30 hover:border-teal-400/50 shadow-[0_0_15px_rgba(20,184,166,0.15)] active:scale-[0.98]"
          }`}
        >
          <Plus className="size-4 stroke-[2.5]" />
          <span>New Marine Inquiry</span>
        </button>
      </div>

      {/* ── "Recent" Header ── */}
      <div className="px-4 pt-4 pb-1.5 flex items-center justify-between">
        <span
          className={`text-[11px] font-semibold tracking-wide uppercase ${
            isLight ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Recent
        </span>
        <button
          onClick={() => setIsSearchOpen((prev) => !prev)}
          className={`p-1 rounded-md transition-colors cursor-pointer ${
            isLight ? "text-slate-400 hover:text-slate-600" : "text-slate-500 hover:text-slate-300"
          }`}
          title="Search conversations"
        >
          <Search className="size-3.5" />
        </button>
      </div>

      {/* Search Input if toggled */}
      {isSearchOpen && (
        <div className="px-3 pb-2">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full px-3 py-1.5 rounded-xl text-xs outline-none ${
              isLight ? "neo-inset-light text-slate-800" : "neo-inset-dark text-slate-100"
            }`}
          />
        </div>
      )}

      {/* ── Chat History List (Scrollable) ── */}
      <div data-tour="sidebar-chats" className="flex-1 overflow-y-auto px-2 space-y-0.5 auth-form-scrollbar pr-1">
        {sortedChats.map((chat) => {
          const isActive = pathname === `/chat/${chat.id}` || activeChatId === chat.id;
          const isMenuOpen = menuOpenChatId === chat.id;
          const isRenaming = renamingChatId === chat.id;

          if (isRenaming) {
            return (
              <div
                key={chat.id}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs ${
                  isLight
                    ? "bg-white/90 border border-cyan-400 shadow-sm"
                    : "bg-slate-900/90 border border-cyan-500/50 shadow-inner"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  autoFocus
                  value={renamingText}
                  onChange={(e) => setRenamingText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleConfirmRename(chat.id);
                    if (e.key === "Escape") setRenamingChatId(null);
                  }}
                  className={`flex-1 bg-transparent border-none outline-none text-xs font-medium min-w-0 ${
                    isLight ? "text-slate-900" : "text-slate-100"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => handleConfirmRename(chat.id)}
                  className="p-1 hover:text-emerald-400 text-slate-400 transition-colors cursor-pointer shrink-0"
                  title="Save title (Enter)"
                  aria-label="Save title"
                >
                  <Check className="size-3.5 text-emerald-400" />
                </button>
                <button
                  type="button"
                  onClick={() => setRenamingChatId(null)}
                  className="p-1 hover:text-rose-400 text-slate-400 transition-colors cursor-pointer shrink-0"
                  title="Cancel (Esc)"
                  aria-label="Cancel rename"
                >
                  <X className="size-3.5 text-rose-400" />
                </button>
              </div>
            );
          }

          return (
            <div key={chat.id} className="group/item relative flex items-center">
              <Link
                href={`/chat/${chat.id}`}
                onClick={() => setActiveChatId(chat.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all pr-8 ${
                  isActive
                    ? isLight
                      ? "bg-[#e2ebf5] text-slate-900 font-semibold shadow-[-2px_-2px_4px_rgba(255,255,255,0.8),2px_2px_5px_rgba(180,195,215,0.35)]"
                      : "bg-white/[0.08] text-teal-200 font-semibold shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-l-2 border-teal-400"
                    : isLight
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-200/40"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                }`}
              >
                <span
                  className={`size-2 rounded-full shrink-0 ${
                    chat.statusDotColor || "bg-cyan-400"
                  }`}
                />
                <span className="truncate flex-1">{chat.title}</span>
                {chat.isPinned && (
                  <span title="Pinned to top" className="shrink-0 flex items-center">
                    <Pin className="size-2.5 text-cyan-400 fill-cyan-400/40 rotate-45" />
                  </span>
                )}
              </Link>

              {/* 3-Dot Options Trigger */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuOpenChatId((prev) => (prev === chat.id ? null : chat.id));
                }}
                className={`absolute right-1.5 p-1 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all cursor-pointer ${
                  isMenuOpen
                    ? "opacity-100 text-cyan-400 bg-cyan-500/15"
                    : "opacity-0 group-hover/item:opacity-100"
                }`}
                title="Conversation options"
                aria-label="Conversation options"
              >
                <MoreVertical className="size-3.5" />
              </button>

              {/* Floating Context Menu */}
              {isMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute right-1 top-8 z-50 w-44 rounded-xl py-1 px-1 shadow-2xl border backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 ${
                    isLight
                      ? "bg-white/95 border-slate-200 text-slate-700 shadow-slate-300/50"
                      : "bg-slate-900/95 border-slate-850 text-slate-200 shadow-black/80"
                  }`}
                >
                  {/* Pin / Unpin */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      pinChat(chat.id);
                      setMenuOpenChatId(null);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      isLight ? "hover:bg-slate-100 text-slate-700" : "hover:bg-white/10 text-slate-200"
                    }`}
                  >
                    {chat.isPinned ? (
                      <>
                        <PinOff className="size-3.5 text-amber-400" />
                        <span>Unpin conversation</span>
                      </>
                    ) : (
                      <>
                        <Pin className="size-3.5 text-cyan-400" />
                        <span>Pin to top</span>
                      </>
                    )}
                  </button>

                  {/* Rename */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setRenamingChatId(chat.id);
                      setRenamingText(chat.title);
                      setMenuOpenChatId(null);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      isLight ? "hover:bg-slate-100 text-slate-700" : "hover:bg-white/10 text-slate-200"
                    }`}
                  >
                    <Edit3 className="size-3.5 text-teal-400" />
                    <span>Rename title</span>
                  </button>

                  {/* Delete Option */}
                  {chat.id !== "orca-walkthrough-tutorial" ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteChat(chat.id);
                        setMenuOpenChatId(null);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-rose-400 hover:bg-rose-500/15 hover:text-rose-300"
                    >
                      <Trash2 className="size-3.5 text-rose-500" />
                      <span>Delete conversation</span>
                    </button>
                  ) : (
                    <div className="px-2.5 py-1 text-[10px] text-slate-400 italic">
                      Tutorial chat is permanent
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Bottom Tray: Location + Vessel context + Profile ── */}
      <div
        className={`p-3 m-2 mt-auto rounded-2xl space-y-2 ${
          isLight
            ? "bg-[#e5eff9]/70 shadow-[-2px_-2px_6px_rgba(255,255,255,0.9),2px_2px_6px_rgba(180,195,215,0.35)] border border-white/70"
            : "bg-black/30 border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]"
        }`}
      >
        {/* Location & Vessel compact row */}
        <button
          onClick={() => setIsLocationOpen((prev) => !prev)}
          className={`w-full flex items-center gap-2 text-left rounded-xl px-2.5 py-2 transition-colors cursor-pointer ${
            isLight
              ? "text-slate-700 hover:bg-slate-200/50"
              : "text-slate-300 hover:bg-white/5"
          }`}
        >
          <MapPin className="size-3.5 text-cyan-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate leading-tight">
              {userLocation.name}
            </div>
            <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono leading-tight">
              {vesselType === "small" ? "<8m Craft" : vesselType === "medium" ? "8-15m Motorized" : ">15m Trawler"}
            </div>
          </div>
          <ChevronDown className={`size-3 opacity-50 transition-transform shrink-0 ${isLocationOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Expandable location/vessel picker */}
        {isLocationOpen && (
          <div className={`rounded-xl p-2 space-y-2 ${isLight ? "bg-white/60" : "bg-black/30"}`}>
            {/* GPS Auto button */}
            <button
              onClick={() => { requestLiveLocation(); setIsLocationOpen(false); }}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-500 hover:text-cyan-400 cursor-pointer px-1"
            >
              <Crosshair className="size-3" />
              <span>Auto-detect GPS</span>
            </button>

            {/* Port list */}
            <div className="space-y-0.5 max-h-32 overflow-y-auto auth-form-scrollbar">
              {COASTAL_PORTS.map((port) => (
                <button
                  key={port.id}
                  onClick={() => { selectPort(port.id); setIsLocationOpen(false); }}
                  className={`w-full text-left px-2 py-1 rounded-lg text-[11px] transition-colors cursor-pointer ${
                    userLocation.id === port.id
                      ? isLight ? "bg-teal-100 text-teal-900 font-semibold" : "bg-cyan-950/60 text-cyan-200 font-semibold"
                      : isLight ? "text-slate-600 hover:bg-slate-100" : "text-slate-400 hover:bg-white/5"
                  }`}
                >
                  {port.name}
                </button>
              ))}
            </div>

            {/* Vessel selector */}
            <div className="flex gap-1 pt-1 border-t border-black/5 dark:border-white/5">
              {([
                { id: "small", label: "<8m" },
                { id: "medium", label: "8-15m" },
                { id: "large", label: ">15m" },
              ] as const).map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVesselType(v.id)}
                  className={`flex-1 text-center py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
                    vesselType === v.id
                      ? "bg-cyan-500/15 text-cyan-500"
                      : isLight ? "text-slate-500 hover:bg-slate-100" : "text-slate-500 hover:bg-white/5"
                  }`}
                >
                  <Ship className="size-3 mx-auto mb-0.5" />
                  {v.label}
                </button>
              ))}
            </div>

            {/* Stakeholder Role Selector (SIH26176) */}
            <div data-tour="sidebar-roles" className="pt-1.5 border-t border-black/5 dark:border-white/5">
              <span className={`text-[9px] uppercase tracking-wider font-semibold block mb-1 px-1 ${
                isLight ? "text-slate-400" : "text-slate-500"
              }`}>
                Operational Role
              </span>
              <div className="grid grid-cols-2 gap-1">
                {([
                  { id: "fisher", label: "Fisher", icon: "🎣" },
                  { id: "coast_guard", label: "Coast Guard", icon: "🛡️" },
                  { id: "port_operator", label: "Port Ops", icon: "⚓" },
                  { id: "scientist", label: "Scientist", icon: "🔬" },
                ] as const).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setUserRole(r.id)}
                    className={`text-left px-2 py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                      userRole === r.id
                        ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-semibold"
                        : isLight ? "text-slate-600 hover:bg-slate-100" : "text-slate-400 hover:bg-white/5"
                    }`}
                  >
                    <span>{r.icon}</span>
                    <span className="truncate">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* User profile & Settings trigger row */}
        {(() => {
          const displayName = user?.displayName || (user?.email ? user.email.split("@")[0] : "Officer");
          const initial = displayName.charAt(0).toUpperCase();
          const subtitle = user?.email || `${userRole.replace("_", " ")} · Settings`;
          return (
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-2xl transition-all cursor-pointer group text-left ${
                isLight
                  ? "hover:bg-slate-200/60 active:scale-[0.99]"
                  : "hover:bg-white/[0.06] active:scale-[0.99]"
              }`}
              title="Open Settings & Operator Profile"
              aria-label="Open Settings & Operator Profile"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative size-7.5 rounded-full bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0 group-hover:ring-2 group-hover:ring-cyan-400/40 transition-all overflow-hidden">
                  {user?.avatarUrl && !avatarError ? (
                    <img
                      src={user.avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    initial
                  )}
                  <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-black z-10" />
                </div>
                <div className="min-w-0">
                  <span className={`text-xs font-semibold block truncate ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                    {displayName}
                  </span>
                  <span className="text-[10px] text-cyan-500 block truncate font-mono">
                    {subtitle}
                  </span>
                </div>
              </div>
              <Settings className={`size-3.5 shrink-0 transition-transform group-hover:rotate-45 ${isLight ? "text-slate-400 group-hover:text-slate-700" : "text-slate-500 group-hover:text-cyan-300"}`} />
            </button>
          );
        })()}
      </div>
    </aside>
    </>
  );
}
