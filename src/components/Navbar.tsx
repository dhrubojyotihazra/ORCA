'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const navLinks = ['How It Works', 'Team'];

export function Navbar() {
  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 sm:px-8 md:px-12 h-16 border-b border-white/10"
      style={{ background: 'rgba(5, 11, 20, 0.55)', backdropFilter: 'blur(12px)' }}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Logo */}
      <Link href="/" className="font-display text-xl font-bold text-white tracking-[0.15em] hover:text-teal-400 transition-colors duration-300">
        ORCA
      </Link>

      {/* Nav links + CTA */}
      <div className="flex items-center gap-6 md:gap-8">
        {navLinks.map((label, i) => (
          <motion.a
            key={label}
            href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
            className="hidden md:inline text-sm text-white/75 hover:text-white transition-colors duration-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
          >
            {label}
          </motion.a>
        ))}

        <motion.a
          href="#demo"
          className="relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-full border border-white/20 hover:border-teal-400/50 hover:bg-teal-400/10 transition-all duration-300"
          style={{ backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.06)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Try the Demo
        </motion.a>
      </div>
    </motion.nav>
  );
}
