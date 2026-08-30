'use client';

import { motion } from 'framer-motion';
import { Waves, Satellite, Brain, Globe, ShieldCheck } from 'lucide-react';

// ------------------------------------------------------------------
// Reusable section wrapper with fade-up reveal on scroll
// ------------------------------------------------------------------
function Section({ id, children, className = '' }: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`relative z-10 bg-[#050B14] px-5 sm:px-8 md:px-12 py-20 md:py-28 ${className}`}
    >
      {children}
    </section>
  );
}

function RevealBlock({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

// ------------------------------------------------------------------
// Problem / Context Section
// ------------------------------------------------------------------
function ProblemSection() {
  const stats = [
    { value: '4 million+', label: 'fishermen in India with no real-time ocean data' },
    { value: '30–40%', label: 'of catch lost to unsafe fishing zone decisions' },
    { value: '8+ languages', label: 'across India's coastal communities' },
  ];

  return (
    <Section id="problem" className="border-t border-white/8">
      <div className="max-w-5xl mx-auto">
        <RevealBlock>
          <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-teal-400">
            The Problem
          </span>
        </RevealBlock>

        <RevealBlock delay={0.1}>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-4 leading-tight">
            The ocean is talking.<br />No one built the translator.
          </h2>
        </RevealBlock>

        <RevealBlock delay={0.2}>
          <p className="mt-6 max-w-2xl text-base sm:text-lg text-white/70 leading-relaxed">
            ISRO and INCOIS generate petabytes of satellite and oceanographic data every day.
            Potential fishing zones, sea state forecasts, chlorophyll density maps — all of it
            locked behind scientific interfaces that coastal communities can't access or act on.
            ORCA is the agentic layer that bridges them.
          </p>
        </RevealBlock>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map(({ value, label }, i) => (
            <RevealBlock key={value} delay={0.15 + i * 0.1}>
              <div className="rounded-2xl border border-white/10 bg-white/4 p-6">
                <p className="font-display text-3xl font-bold text-teal-400">{value}</p>
                <p className="mt-2 text-sm text-white/65 leading-relaxed">{label}</p>
              </div>
            </RevealBlock>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ------------------------------------------------------------------
// How It Works Section
// ------------------------------------------------------------------
function HowItWorksSection() {
  const steps = [
    {
      icon: <Satellite className="w-6 h-6 text-teal-400" />,
      step: '01',
      title: 'Ingest satellite streams',
      body: 'Pulls live SST, chlorophyll, and current data from ISRO MOSDAC (Oceansat-3) and weather advisories from INCOIS in real time.',
    },
    {
      icon: <Brain className="w-6 h-6 text-teal-400" />,
      step: '02',
      title: 'Multi-agent reasoning',
      body: 'A LangGraph orchestrated mesh — Planner, Ocean Specialist, Weather Agent, Geofence Sentinel, and Synthesizer — decomposes each query and reasons over live data.',
    },
    {
      icon: <Globe className="w-6 h-6 text-teal-400" />,
      step: '03',
      title: 'Answers in your language',
      body: 'The Synthesizer Agent detects your dialect and delivers an evidence-cited recommendation in Tamil, Telugu, Bengali, Hindi, Malayalam, or English.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-teal-400" />,
      step: '04',
      title: 'Every answer cites its sources',
      body: 'ORCA never guesses. Every advisory links back to the raw satellite grid tile, sensor timestamp, and INCOIS bulletin that backs it up.',
    },
  ];

  return (
    <Section id="how-it-works" className="border-t border-white/8">
      <div className="max-w-5xl mx-auto">
        <RevealBlock>
          <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-teal-400">
            How It Works
          </span>
        </RevealBlock>

        <RevealBlock delay={0.1}>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-4 leading-tight">
            From satellite to plain speech<br />in under 200 ms.
          </h2>
        </RevealBlock>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map(({ icon, step, title, body }, i) => (
            <RevealBlock key={step} delay={0.1 + i * 0.1}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/4 p-7 flex flex-col gap-4 hover:border-teal-400/30 hover:bg-teal-400/5 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-teal-400/10 border border-teal-400/20 flex items-center justify-center">
                    {icon}
                  </div>
                  <span className="font-mono text-[11px] text-white/30 tracking-widest">{step}</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white">{title}</h3>
                <p className="text-sm text-white/65 leading-relaxed">{body}</p>
              </div>
            </RevealBlock>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ------------------------------------------------------------------
// Team Section
// ------------------------------------------------------------------
function TeamSection() {
  const team = [
    { name: 'Dhrubojyoti', role: 'Team Lead · Full-Stack & AI Architecture' },
    { name: 'Tiyasha', role: 'Ocean Agent & MOSDAC Data Layer' },
    { name: 'Samprikta', role: 'Weather Agent & INCOIS Integration' },
    { name: 'Member 4', role: 'Geofence Sentinel & GIS Layer' },
    { name: 'Member 5', role: 'Frontend & Multilingual Synthesis' },
    { name: 'Member 6', role: 'Evaluation, QA & Presentation' },
  ];

  return (
    <Section id="team" className="border-t border-white/8">
      <div className="max-w-5xl mx-auto">
        <RevealBlock>
          <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-teal-400">
            Team ASTID
          </span>
        </RevealBlock>

        <RevealBlock delay={0.1}>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-4 leading-tight">
            Built by six, for millions.
          </h2>
        </RevealBlock>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {team.map(({ name, role }, i) => (
            <RevealBlock key={name} delay={0.08 + i * 0.08}>
              <div className="rounded-2xl border border-white/10 bg-white/4 p-6 hover:border-teal-400/30 transition-colors duration-300">
                <div className="w-10 h-10 rounded-full bg-teal-400/10 border border-teal-400/20 flex items-center justify-center mb-4">
                  <Waves className="w-5 h-5 text-teal-400" />
                </div>
                <p className="font-semibold text-white">{name}</p>
                <p className="mt-1 text-sm text-white/55">{role}</p>
              </div>
            </RevealBlock>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ------------------------------------------------------------------
// Footer
// ------------------------------------------------------------------
function Footer() {
  return (
    <footer className="relative z-10 bg-[#050B14] border-t border-white/8 px-5 sm:px-8 md:px-12 py-10">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="font-display text-lg font-bold text-white tracking-[0.15em]">ORCA</span>
          <p className="mt-1 text-xs text-white/40 font-mono">ISRO SIH26176 · Team ASTID · 2026</p>
        </div>
        <p className="text-xs text-white/35">
          Marine EcOsystem Reasoning with Collaborative Agents
        </p>
      </div>
    </footer>
  );
}

// ------------------------------------------------------------------
// Export all below-fold sections as one bundle
// ------------------------------------------------------------------
export function BelowFoldSections() {
  return (
    <>
      <ProblemSection />
      <HowItWorksSection />
      <TeamSection />
      <Footer />
    </>
  );
}
