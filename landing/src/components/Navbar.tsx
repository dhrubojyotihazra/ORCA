'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Compass,
  AlertTriangle,
  Layers,
  Users,
  ChevronDown,
  ChevronUp,
  Check,
  User,
  LogIn,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useApp } from '@/lib/app-context';
import type { LucideIcon } from 'lucide-react';

export interface NotchItemData {
  id: string;
  label: string;
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  badge?: string;
}

function NotchLeftWing({ className }: { position?: 'top' | 'bottom'; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      shapeRendering="geometricPrecision"
      className={cn(
        'pointer-events-none absolute right-full size-2.5 md:size-4 overflow-visible select-none text-zinc-950 transition-colors duration-200 top-0',
        className
      )}
    >
      <path d="M 0 0 C 11.046 0 20 8.954 20 20 H 21 V -1 H 0 Z" fill="currentColor" />
    </svg>
  );
}

function NotchRightWing({ className }: { position?: 'top' | 'bottom'; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      shapeRendering="geometricPrecision"
      className={cn(
        'pointer-events-none absolute left-full size-2.5 md:size-4 overflow-visible select-none text-zinc-950 transition-colors duration-200 top-0',
        className
      )}
    >
      <path d="M 20 0 C 8.954 0 0 8.954 0 20 H -1 V -1 H 20 Z" fill="currentColor" />
    </svg>
  );
}

// Fixed & verified 4 primary sections in exact page order
const NAV_ITEMS: NotchItemData[] = [
  { id: 'hero', label: 'Overview', icon: Compass },
  { id: 'problem', label: 'Problem Context', icon: AlertTriangle },
  { id: 'how-it-works', label: 'System Architecture', icon: Layers },
  { id: 'team', label: 'Team DeTABIS', icon: Users },
];

export function Navbar() {
  const { user } = useApp();
  const [activeId, setActiveId] = useState<string>('hero');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingTo = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeItem = NAV_ITEMS.find((item) => item.id === activeId) || NAV_ITEMS[0];

  // Efficient & accurate click navigation with navbar offset compensation
  const handleSelect = useCallback((id: string) => {
    setActiveId(id);
    setIsDropdownOpen(false);
    isScrollingTo.current = true;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    if (id === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.getElementById(id);
      if (element) {
        // Sections already have generous top padding (py-16 sm:py-24 md:py-32),
        // so aligning flush to the section's top places the floating notch
        // comfortably within the padding zone without pushing the content way down.
        const targetY = element.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
      }
    }

    // Release scroll lock after smooth scrolling completes
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingTo.current = false;
    }, 750);
  }, []);

  const handleToggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  // Navigate to the full-screen login page or direct to app if already authenticated
  const handleSignIn = useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("orca_access_token") : null;
    const hasCookie = typeof document !== "undefined" && document.cookie.includes("orca_logged_in=true");
    if (token || hasCookie || user.isAuthenticated) {
      router.push('/app');
    } else {
      router.push('/login');
    }
    setIsDropdownOpen(false);
  }, [router, user.isAuthenticated]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // High-performance RAF scroll spy: calculates true viewport bounding boxes
  useEffect(() => {
    let rafId: number | null = null;

    const updateActiveSection = () => {
      if (isScrollingTo.current) return;

      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // 1. Top of page: always Overview
      if (scrollY < 120) {
        setActiveId('hero');
        return;
      }

      // 2. Bottom of page (within 100px of footer): always Team DeTABIS
      if (scrollY + viewportHeight >= documentHeight - 100) {
        setActiveId('team');
        return;
      }

      // 3. Reverse traversal of sections to find currently active zone
      const sectionIds = ['team', 'how-it-works', 'problem'];
      const triggerThreshold = 220; // Active line 220px below top of viewport

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= triggerThreshold && rect.bottom > 80) {
            setActiveId(id);
            return;
          }
        }
      }

      setActiveId('hero');
    };

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        updateActiveSection();
        rafId = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateActiveSection();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  const ActiveIcon = activeItem?.icon || Compass;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none flex justify-center">
        {/* ── Top Center Adaptive Notch (Sleek Obsidian Black) ── */}
        <div
          ref={containerRef}
          className={cn(
            'pointer-events-auto relative flex flex-col bg-zinc-950 text-zinc-50 select-none shadow-[0_10px_35px_rgba(0,0,0,0.8)] border-b border-x border-white/10 transition-all duration-200',
            'rounded-b-[24px] px-3 sm:px-3.5 pt-1.5 pb-2 min-w-[280px] sm:min-w-[420px] max-w-[96vw]'
          )}
        >
          {/* Notch Left & Right Wings in Black */}
          <NotchLeftWing position="top" className="text-zinc-950" />
          <NotchRightWing position="top" className="text-zinc-950" />

          {/* ── Top Horizontal Bar ── */}
          <div className="flex h-8.5 items-center justify-between gap-2.5 sm:gap-4 px-1">

            {/* 1. Left Logo Slot: Custom Logo + DeTABIS */}
            <button
              type="button"
              onClick={() => handleSelect('hero')}
              className="flex items-center gap-1.5 sm:gap-2 cursor-pointer hover:opacity-85 transition-opacity shrink-0 bg-transparent border-0 p-0 text-left"
              aria-label="Scroll to top overview"
            >
              <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-900 text-zinc-100 border border-white/10 overflow-hidden p-0.5">
                <Image
                  src="/icon.png"
                  alt="ORCA Logo"
                  width={22}
                  height={22}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <span className="text-xs sm:text-sm font-bold tracking-tight text-zinc-50">
                DeTABIS
              </span>
            </button>

            {/* 2. Center Dropdown Active Tab Pill */}
            <button
              type="button"
              aria-expanded={isDropdownOpen}
              aria-label="Toggle navigation menu"
              onClick={handleToggleDropdown}
              className={cn(
                'group flex h-8 items-center justify-center gap-1.5 rounded-full px-3 text-xs sm:text-sm font-semibold outline-none transition-colors cursor-pointer border border-white/10 max-w-[170px] sm:max-w-none',
                isDropdownOpen
                  ? 'bg-zinc-800 text-white'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200'
              )}
            >
              <ActiveIcon className="size-3.5 sm:size-4 shrink-0 text-teal-400" />
              <span className="leading-none truncate">{activeItem?.label}</span>
              {isDropdownOpen ? (
                <ChevronUp className="size-3.5 text-zinc-400 transition-transform duration-200 shrink-0" />
              ) : (
                <ChevronDown className="size-3.5 text-zinc-400 transition-transform duration-200 shrink-0" />
              )}
            </button>

            {/* 3. Right Action Slot: 👤 Sign In / Workspace */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {user.isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => router.push('/app')}
                  aria-label="Launch Workspace"
                  className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-950/80 hover:bg-teal-900/90 border border-teal-500/40 text-xs font-semibold text-teal-300 hover:text-teal-200 transition-all outline-none shadow-[0_0_12px_rgba(20,184,166,0.25)]"
                >
                  <span className="size-2 rounded-full bg-teal-400 animate-pulse" />
                  <span className="max-w-[70px] sm:max-w-[110px] truncate">{user.displayName || "Workspace"}</span>
                  <LogIn className="size-3 text-teal-400" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSignIn}
                  aria-label="Sign in"
                  className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-zinc-200 hover:text-white transition-all outline-none"
                >
                  <User className="size-3.5 text-teal-400" />
                  <span className="hidden sm:inline font-medium">Sign in</span>
                  <LogIn className="size-3 text-zinc-400" />
                </button>
              )}
            </div>

          </div>

          {/* ── Expandable Dropdown Drawer Menu ── */}
          <div
            role="listbox"
            aria-label="Navigation options"
            className={cn(
              'grid transition-[grid-template-rows,opacity] duration-200 ease-out w-full',
              isDropdownOpen
                ? 'grid-rows-[1fr] opacity-100 mt-2 border-t border-white/10 pt-1'
                : 'grid-rows-[0fr] opacity-0 pointer-events-none'
            )}
          >
            <div className="overflow-hidden">
              <div className="flex w-full flex-col gap-0.5 pt-1 pb-1">
                {NAV_ITEMS.map((item) => {
                  const ItemIcon = item.icon || Compass;
                  const isSelected = item.id === activeId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(item.id)}
                      className={cn(
                        'flex w-full cursor-pointer items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-left text-sm outline-none transition-colors select-none',
                        isSelected
                          ? 'bg-zinc-800 font-semibold text-white border border-white/10'
                          : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 active:bg-zinc-800'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <ItemIcon className={cn('size-4 shrink-0', isSelected ? 'text-teal-400' : 'text-zinc-400')} />
                        <span>{item.label}</span>
                      </div>

                      {isSelected && (
                        <Check className="size-3.5 text-teal-400 stroke-[2.5]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>

    </>
  );
}


