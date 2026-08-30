'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Compass,
  AlertTriangle,
  Layers,
  Sparkles,
  Users,
  ChevronDown,
  ChevronUp,
  Check,
  User,
  LogIn,
} from 'lucide-react';
import {
  NotchLeftWing,
  NotchRightWing,
  type NotchItemData,
} from '@/components/ui/adaptive-notch-navigation-bar';
import { cn } from '@/lib/utils';

const NAV_ITEMS: NotchItemData[] = [
  { id: 'hero', label: 'Overview', icon: Compass },
  { id: 'problem', label: 'The Problem', icon: AlertTriangle },
  { id: 'how-it-works', label: 'Architecture', icon: Layers },
  { id: 'demo', label: 'Ocean Telemetry', icon: Sparkles },
  { id: 'team', label: 'Team DeTABIS', icon: Users },
];

export function Navbar() {
  const [activeId, setActiveId] = useState<string>('hero');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeItem = NAV_ITEMS.find((item) => item.id === activeId) || NAV_ITEMS[0];

  const handleSelect = useCallback((id: string) => {
    setActiveId(id);
    setIsDropdownOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleToggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  const handleSignIn = useCallback(() => {
    const demo = document.getElementById('demo');
    if (demo) {
      demo.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

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

  // Sync active notch item with page scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 250;
      const sections = ['team', 'demo', 'how-it-works', 'problem'];
      for (const s of sections) {
        const el = document.getElementById(s);
        if (el && el.offsetTop <= scrollPos) {
          setActiveId(s);
          return;
        }
      }
      setActiveId('hero');
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const ActiveIcon = activeItem?.icon || Compass;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none flex justify-center">
      {/* ── Top Center Adaptive Notch (Sleek Obsidian Black) ── */}
      <div
        ref={containerRef}
        className={cn(
          'pointer-events-auto relative flex flex-col bg-zinc-950 text-zinc-50 select-none shadow-[0_10px_35px_rgba(0,0,0,0.8)] border-b border-x border-white/10 transition-all duration-200',
          'rounded-b-[24px] px-3.5 pt-1.5 pb-2 min-w-[340px] sm:min-w-[440px] max-w-[94vw]'
        )}
      >
        {/* Notch Left & Right Wings in Black */}
        <NotchLeftWing position="top" className="text-zinc-950" />
        <NotchRightWing position="top" className="text-zinc-950" />

        {/* ── Top Horizontal Bar ── */}
        <div className="flex h-8.5 items-center justify-between gap-2.5 sm:gap-4 px-1">

          {/* 1. Left Logo Slot: Custom Logo + DeTABIS */}
          <Link
            href="/"
            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer hover:opacity-85 transition-opacity shrink-0"
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
          </Link>

          {/* 2. Center Dropdown Active Tab Pill */}
          <button
            type="button"
            aria-expanded={isDropdownOpen}
            aria-label="Toggle navigation menu"
            onClick={handleToggleDropdown}
            className={cn(
              'group flex h-8 items-center justify-center gap-1.5 rounded-full px-3 text-xs sm:text-sm font-semibold outline-none transition-colors cursor-pointer border border-white/10',
              isDropdownOpen
                ? 'bg-zinc-800 text-white'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200'
            )}
          >
            <ActiveIcon className="size-3.5 sm:size-4 shrink-0 text-teal-400" />
            <span className="leading-none">{activeItem?.label}</span>
            {isDropdownOpen ? (
              <ChevronUp className="size-3.5 text-zinc-400 transition-transform duration-200" />
            ) : (
              <ChevronDown className="size-3.5 text-zinc-400 transition-transform duration-200" />
            )}
          </button>

          {/* 3. Right Action Slot: 👤 Sign In → */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="flex size-7 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 border border-white/10">
              <User className="size-4" />
            </div>

            <button
              type="button"
              onClick={handleSignIn}
              aria-label="Sign in"
              className="cursor-pointer flex items-center gap-1 text-xs font-medium text-zinc-300 hover:text-white transition-colors outline-none"
            >
              <span className="hidden sm:inline font-medium">Sign in</span>
              <LogIn className="size-3.5" />
            </button>
          </div>

        </div>

        {/* ── Expandable Dropdown Drawer Menu (Customized for ORCA) ── */}
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
  );
}
