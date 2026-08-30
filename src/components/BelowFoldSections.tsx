'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight } from 'lucide-react';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { BorderRotate } from '@/components/ui/animated-gradient-border';
import { MagneticText } from '@/components/ui/morphing-cursor';
import { GlassFilter } from '@/components/ui/liquid-glass';
import { Footer } from '@/components/ui/footer-section';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function Section({ id, children, className = '' }: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      // Bumped from /80 to /92 and layered a top-to-bottom fade so bright
      // patches of the animated WebGL gradient behind can't bleed through
      // and wash out the copy, regardless of which frame is showing.
      className={`relative z-10 bg-[#050B14]/92 backdrop-blur-2xl px-6 sm:px-10 md:px-16 py-24 sm:py-32 ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#050B14]/40 via-transparent to-[#050B14]/40"
        aria-hidden="true"
      />
      <div className="relative">{children}</div>
    </section>
  );
}

function RevealBlock({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

// ─── 01: The Problem (Spotlight Bento Grid) ─────────────────────────────────
function ProblemSection() {
  const stats = [
    {
      value: '4M+',
      scriptLabel: 'active fishers',
      label: 'relying on complex scientific bulletins without conversational decision support (CMFRI)',
    },
    {
      value: 'Petabytes',
      scriptLabel: 'satellite data',
      label: 'of ISRO MOSDAC & INCOIS ocean observations generated daily but underutilized at sea',
    },
    {
      value: '5',
      scriptLabel: 'target languages',
      label: 'Tamil, Bengali, Malayalam, Hindi & English, with localized natural language understanding',
    },
  ];

  return (
    <Section id="problem" className="border-t border-white/[0.08]">
      <div className="max-w-6xl mx-auto space-y-16">

        {/* Section Header */}
        <div className="space-y-4 max-w-4xl">
          <RevealBlock>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-teal-400 font-bold">
                [ 01 // SIH26176 PROBLEM CONTEXT ]
              </span>
              <span className="h-px flex-1 max-w-[80px] bg-teal-400/30" />
            </div>
          </RevealBlock>

          <RevealBlock delay={0.1}>
            <h2
              className="text-4xl sm:text-5xl lg:text-7xl leading-[1.08] text-white font-heading font-extrabold tracking-tight"
              style={{ textShadow: '0 2px 24px rgba(0,0,0,0.65)' }}
            >
              The ocean is{' '}
              <span className="font-script text-teal-300 font-normal lowercase tracking-normal text-5xl sm:text-6xl lg:text-8xl inline-block px-1">
                talking
              </span>
              .<br />
              <MagneticText
                text="ORCA"
                hoverText="SIH26176"
                circleSize={210}
                circleBgColor="bg-teal-300"
                hoverTextColor="text-[#050B14]"
                textClassName="text-4xl sm:text-5xl lg:text-7xl text-white font-heading font-extrabold tracking-tight"
                className="mr-3"
              />{' '}
              delivers the{' '}
              <span className="font-display font-extrabold uppercase text-white tracking-tight underline decoration-teal-400/40 decoration-4 underline-offset-8">
                intelligence layer
              </span>
              .
            </h2>
          </RevealBlock>

          <RevealBlock delay={0.2}>
            <p className="mt-6 max-w-2xl text-base sm:text-lg text-white/70 font-light leading-relaxed">
              Every day, ISRO MOSDAC and INCOIS produce extensive satellite Earth Observation and
              oceanographic data — sea surface temperature, chlorophyll concentration, potential fishing zones,
              and wave state forecasts. ORCA bridges raw scientific data with coastal operators through
              explainable, evidence-grounded agentic reasoning.
            </p>
          </RevealBlock>
        </div>

        {/* Spotlight Bento Metric Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
          {stats.map(({ value, scriptLabel, label }, i) => (
            <RevealBlock key={value} delay={0.15 + i * 0.1}>
              <SpotlightCard className="h-full hover:scale-[1.02] transition-transform">
                <div className="flex flex-col justify-between h-full space-y-6">
                  <div>
                    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                      <span className="font-heading text-3xl sm:text-4xl lg:text-4xl font-extrabold text-white tracking-tight">
                        {value}
                      </span>
                      <span className="font-heading text-sm sm:text-base font-semibold text-teal-300 uppercase tracking-wide">
                        {scriptLabel}
                      </span>
                    </div>
                    <p className="mt-4 text-xs sm:text-sm text-white/75 font-light leading-relaxed">
                      {label}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-white/[0.1] flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                      INDICATOR 0{i + 1}
                    </span>
                    <ArrowDownRight className="w-4 h-4 text-teal-400" />
                  </div>
                </div>
              </SpotlightCard>
            </RevealBlock>
          ))}
        </div>

      </div>
    </Section>
  );
}

// ─── 02: Architecture (Spotlight Bento Grid without Unnecessary Logos) ───────
function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      title: 'Automated EO Ingestion',
      scriptTag: 'ISRO MOSDAC & INCOIS Data Layer',
      body: 'Autonomous discovery and retrieval of satellite Earth Observation products (Oceansat-3 SST & Chlorophyll) and INCOIS ERDDAP Potential Fishing Zone forecasts.',
    },
    {
      step: '02',
      title: 'LangGraph Multi-Agent Mesh',
      scriptTag: 'Stateful Agent Orchestration',
      body: 'Planner Agent autonomously decomposes complex natural language queries, routing tasks to dedicated Ocean, Weather, and Risk/Geofencing specialist agents.',
    },
    {
      step: '03',
      title: 'Multilingual Natural Language NLP',
      scriptTag: 'Indic Dialect Synthesis',
      body: 'Synthesizer Agent detects language intent and formats evidence-based advisories in Indian regional languages (Tamil, Bengali, Malayalam, Hindi & English).',
    },
    {
      step: '04',
      title: 'Explainable Evidence Provenance',
      scriptTag: 'Verifiable Source Attribution',
      body: 'Designed to cite its source: every generated recommendation is built to reference the satellite grid tiles, sensor timestamps, and official bulletins behind it.',
    },
  ];

  return (
    <Section id="how-it-works" className="border-t border-white/[0.08]">
      <div className="max-w-6xl mx-auto space-y-16">

        {/* Section Header */}
        <div className="space-y-4 max-w-4xl">
          <RevealBlock>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-teal-400 font-bold">
                [ 02 // AGENTIC SYSTEM ARCHITECTURE ]
              </span>
              <span className="h-px flex-1 max-w-[80px] bg-teal-400/30" />
            </div>
          </RevealBlock>

          <RevealBlock delay={0.1}>
            <h2
              className="text-4xl sm:text-5xl lg:text-7xl leading-[1.08] text-white font-heading font-extrabold tracking-tight"
              style={{ textShadow: '0 2px 24px rgba(0,0,0,0.65)' }}
            >
              From{' '}
              <span className="font-script text-teal-300 font-normal lowercase tracking-normal text-5xl sm:text-6xl lg:text-8xl inline-block px-1">
                satellite observation
              </span>{' '}
              to{' '}
              <span className="font-display font-extrabold uppercase text-white tracking-tight">
                natural language
              </span>
              <br />
              with full provenance.
            </h2>
          </RevealBlock>
        </div>

        {/* 4-Card Spotlight Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map(({ step, title, scriptTag, body }, i) => (
            <RevealBlock key={step} delay={0.1 + i * 0.1}>
              <SpotlightCard className="h-full hover:scale-[1.02] transition-transform">
                <div className="flex flex-col justify-between h-full space-y-4">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs text-teal-400 font-bold tracking-widest">
                        PIPELINE {step}
                      </span>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-teal-300 bg-teal-400/10 px-2.5 py-0.5 rounded-full border border-teal-400/20">
                        {scriptTag}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-heading text-lg sm:text-xl font-bold text-white">
                        {title}
                      </h3>
                    </div>

                    <p className="text-xs sm:text-sm text-white/75 font-light leading-relaxed">
                      {body}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/[0.1] mt-6 flex items-center justify-between font-mono text-[10px] text-white/50">
                    <span>STATUS: VALIDATED</span>
                    <span className="text-teal-400 font-semibold tracking-wider">CITATION GROUNDED</span>
                  </div>
                </div>
              </SpotlightCard>
            </RevealBlock>
          ))}
        </div>

      </div>
    </Section>
  );
}

function MemberAvatar({ name, image }: { name: string; image: string }) {
  const [hasError, setHasError] = useState(false);
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className="relative size-20 sm:size-24 rounded-2xl bg-zinc-900 border border-teal-400/20 overflow-hidden flex items-center justify-center shrink-0 shadow-[0_8px_20px_rgba(0,0,0,0.5)]">
      {!hasError ? (
        <Image
          src={image}
          alt={name}
          fill
          unoptimized
          sizes="(max-width: 640px) 80px, 96px"
          className="object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <span className="font-mono text-base font-bold text-teal-300">
          {initials}
        </span>
      )}
    </div>
  );
}

// ─── 03: Team DeTABIS (Animated Rotating Glow Borders Grid) ─────────────────
function TeamSection() {
  const team = [
    {
      name: 'Dhrubojyoti',
      image: '/team/dhrubojyoti.jpg',
      role: 'Team Lead · AI Architecture',
      focus: 'LangGraph Multi-Agent Mesh, Shared State Schema & Orchestration',
      gradientColors: { primary: '#083344', secondary: '#06b6d4', accent: '#38bdf8' },
      backgroundColor: '#05131f',
    },
    {
      name: 'Isheeka',
      image: '/team/isheeka.jpg',
      role: 'Backend & Persistence Lead',
      focus: 'FastAPI Integration, Supabase Geofencing & Conversation State',
      gradientColors: { primary: '#3b0764', secondary: '#9333ea', accent: '#c084fc' },
      backgroundColor: '#140724',
    },
    {
      name: 'Samprikta',
      image: '/team/samprikta.jpg',
      role: 'Agent Systems Lead',
      focus: 'Weather, Ocean & Risk Specialist Agents, Multilingual NLP Synthesis',
      gradientColors: { primary: '#451a03', secondary: '#f59e0b', accent: '#fde047' },
      backgroundColor: '#1c0f05',
    },
    {
      name: 'Tiyasha',
      image: '/team/tiyasha.jpg',
      role: 'Data & Integration Lead',
      focus: 'MOSDAC (Oceansat-3 SST & Chlorophyll) & INCOIS ERDDAP APIs',
      gradientColors: { primary: '#022c22', secondary: '#10b981', accent: '#34d399' },
      backgroundColor: '#041712',
    },
    {
      name: 'Adhiraj',
      image: '/team/adhiraj.jpg',
      role: 'Presentation, Research & QA',
      focus: 'SIH Problem Validation, User Research & Domain Evaluation Sets',
      gradientColors: { primary: '#4c0519', secondary: '#f43f5e', accent: '#fb7185' },
      backgroundColor: '#1c060e',
    },
    {
      name: 'Biswanath',
      image: '/team/biswanath.jpg',
      role: 'Frontend Engineering Lead',
      focus: 'Next.js 16, Mapbox/Leaflet GIS Layer & Real-time Telemetry UI',
      gradientColors: { primary: '#172554', secondary: '#3b82f6', accent: '#60a5fa' },
      backgroundColor: '#071024',
    },
  ];

  return (
    <Section id="team" className="border-t border-white/[0.08]">
      <div className="max-w-6xl mx-auto space-y-16">

        {/* Section Header */}
        <div className="space-y-4 max-w-4xl">
          <RevealBlock>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-teal-400 font-bold">
                [ 03 // RESEARCH & ENGINEERING COLLECTIVE ]
              </span>
              <span className="h-px flex-1 max-w-[80px] bg-teal-400/30" />
            </div>
          </RevealBlock>

          <RevealBlock delay={0.1}>
            <h2
              className="text-4xl sm:text-5xl lg:text-7xl leading-[1.08] text-white font-heading font-extrabold tracking-tight"
              style={{ textShadow: '0 2px 24px rgba(0,0,0,0.65)' }}
            >
              <span className="font-script text-teal-300 font-normal lowercase tracking-normal text-5xl sm:text-6xl lg:text-8xl inline-block pr-2">
                Engineered by six
              </span>
              , for{' '}
              <span className="font-display font-extrabold uppercase text-white tracking-tight">
                national impact
              </span>
              .
            </h2>
          </RevealBlock>

          <RevealBlock delay={0.2}>
            <p className="text-base sm:text-lg text-white/70 font-light leading-relaxed">
              Team DeTABIS · Smart India Hackathon 2026 Entry for Problem Statement SIH26176 (Indian Space Research Organisation, Dept. of Space).
            </p>
          </RevealBlock>
        </div>

        {/* Team 6-Card Animated Glowing Gradient Border Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map((member, i) => (
            <RevealBlock key={member.name} delay={0.08 + i * 0.08}>
              <BorderRotate
                animationMode="auto-rotate"
                animationSpeed={3.5 + i * 0.4}
                borderWidth={1.8}
                borderRadius={24}
                gradientColors={member.gradientColors}
                backgroundColor={member.backgroundColor}
                className="h-full p-6 sm:p-7 shadow-[0_12px_36px_rgba(0,0,0,0.5)] hover:scale-[1.02] transition-transform duration-300"
              >
                <div className="flex flex-col justify-between h-full space-y-5">
                  <div className="flex items-center gap-4.5">
                    <MemberAvatar name={member.name} image={member.image} />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading text-lg sm:text-xl font-bold text-white leading-tight">
                        {member.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-teal-300 font-mono mt-1 leading-snug">
                        {member.role}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/[0.08]">
                    <p className="text-xs sm:text-[13px] text-white/60 font-light leading-relaxed">
                      <span className="text-white/40 font-mono text-[10px] uppercase tracking-wider block mb-1">
                        Domain Focus
                      </span>
                      {member.focus}
                    </p>
                  </div>
                </div>
              </BorderRotate>
            </RevealBlock>
          ))}
        </div>

      </div>
    </Section>
  );
}

export function BelowFoldSections() {
  return (
    <div className="relative w-full">
      <GlassFilter />
      <ProblemSection />
      <HowItWorksSection />
      <TeamSection />
      <Footer />
    </div>
  );
}
