'use client';
import React from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Globe, Radio, Waves, ShieldCheck, Compass, Code } from 'lucide-react';

interface FooterLink {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FooterSectionData {
  label: string;
  links: FooterLink[];
}

const footerLinks: FooterSectionData[] = [
  {
    label: 'Architecture',
    links: [
      { title: 'LangGraph Mesh', href: '#how-it-works' },
      { title: '7-Pipeline Carousel', href: '#how-it-works' },
      { title: 'Multilingual Whisper', href: 'https://github.com/openai/whisper#available-models-and-languages' },
      { title: 'LangGraph Framework', href: 'https://www.langchain.com/langgraph' },
    ],
  },
  {
    label: 'EO Data Feeds',
    links: [
      { title: 'ISRO MOSDAC', href: 'https://www.mosdac.gov.in' },
      { title: 'INCOIS ERDDAP', href: 'https://erddap.incois.gov.in/erddap/index.html' },
      { title: 'Oceansat-3 EO Telemetry', href: 'https://www.mosdac.gov.in/oceansat-3' },
      { title: 'ICAR-CMFRI Census', href: 'https://mfcensus-gis.cmfri.org.in/' },
    ],
  },
  {
    label: 'SIH26176',
    links: [
      { title: 'Problem Statement', href: '#problem' },
      { title: 'Team DeTABIS', href: '#team' },
      { title: 'Smart India Hackathon', href: 'https://www.sih.gov.in' },
      { title: 'NavIC Satellite Nav', href: 'https://www.isro.gov.in/SatelliteNavigationServices.html' },
    ],
  },
  {
    label: 'Connectivity',
    links: [
      { title: 'Interactive Globe', href: '#hero', icon: Waves },
      { title: 'ISRO Official Portal', href: 'https://www.isro.gov.in', icon: Globe },
      { title: 'Team Profiles', href: '#team', icon: Radio },
      { title: 'GitHub Repository', href: 'https://github.com/dhrubojyotihazra/ORCA', icon: Code },
    ],
  },
];

export function Footer() {
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <footer suppressHydrationWarning className="relative w-full max-w-6xl mx-auto flex flex-col items-center justify-center rounded-t-4xl border-t border-white/10 bg-[radial-gradient(40%_140px_at_50%_0%,rgba(31,182,182,0.12),transparent)] px-6 py-14 lg:py-20 z-20">
      <div className="bg-teal-400/30 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur-sm" />

      <div className="grid w-full gap-10 xl:grid-cols-3 xl:gap-12">
        <AnimatedContainer className="space-y-4 max-w-sm">
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl font-extrabold text-white tracking-[0.18em]">
              ORCA
            </span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded border border-teal-400/30">
              SIH26176
            </span>
          </div>

          <p className="text-white/60 text-xs sm:text-sm leading-relaxed font-light">
            Marine EcOsystem Reasoning with Collaborative Agents. Autonomous geospatial multi-agent intelligence for Indian coastal waters.
          </p>

          <p className="text-white/40 text-xs font-mono pt-2">
            © 2026 Team DeTABIS · ISRO SIH2026 Software Track.
          </p>
        </AnimatedContainer>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2">
          {footerLinks.map((section, index) => (
            <AnimatedContainer key={section.label} delay={0.1 + index * 0.08}>
              <div suppressHydrationWarning>
                <h3 className="text-xs font-mono uppercase tracking-widest text-teal-400 font-bold mb-4">
                  {section.label}
                </h3>
                <ul className="space-y-2.5 text-xs sm:text-sm text-white/60 font-light">
                  {section.links.map((link) => {
                    const isExternal = link.href.startsWith('http');
                    return (
                      <li key={link.title}>
                        <a
                          href={link.href}
                          target={isExternal ? '_blank' : undefined}
                          rel={isExternal ? 'noopener noreferrer' : undefined}
                          onClick={(e) => handleScroll(e, link.href)}
                          className="hover:text-white hover:translate-x-1 inline-flex items-center gap-1.5 transition-all duration-200 group"
                        >
                          {link.icon && <link.icon className="size-3.5 text-teal-400/80 shrink-0" />}
                          <span>{link.title}</span>
                          {isExternal && (
                            <span className="text-[10px] text-teal-400/60 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200">
                              ↗
                            </span>
                          )}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </AnimatedContainer>
          ))}
        </div>
      </div>
    </footer>
  );
}

type ViewAnimationProps = {
  delay?: number;
  className?: ComponentProps<typeof motion.div>['className'];
  children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default Footer;
