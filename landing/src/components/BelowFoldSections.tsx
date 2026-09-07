'use client';

import Image from 'next/image';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, animate, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MagneticText } from '@/components/ui/morphing-cursor';
import { GlassFilter } from '@/components/GlassFilterDefs';
import { Footer } from '@/components/ui/footer-section';
import ArcFlowCarousel, { SmoothSliderItem } from '@/components/ui/arc-flow-carousel';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function Section({ id, children, className = '', style }: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section
      id={id}
      style={style}
      className={`relative z-10 bg-[#060b13]/92 backdrop-blur-2xl px-4 sm:px-10 md:px-16 py-16 sm:py-24 md:py-32 ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#060b13]/40 via-transparent to-[#060b13]/40"
        aria-hidden="true"
      />
      <div className="relative">{children}</div>
    </section>
  );
}

function RevealBlock({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.8, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── 01: The Problem (Interactive Folder-Tab Cutout Cards) ──────────────────
interface FramerFolderCardData {
  id: string;
  title: string;
  description: string;
  code: string;
  borderColor: string;
  fGColor: string;
  titleColor: string;
  descriptionColor: string;
  numberColor: string;
  iconColor: string;
  bgImage: string;
  artImage: string;
  href: string;
  sourceName?: string;
}

const indicators: FramerFolderCardData[] = [
  {
    id: "01",
    title: "8,13,431 Fisherman Families",
    description: "Fisherman families navigate complex scientific bulletins without conversational decision support (CMFRI).",
    code: "010038",
    borderColor: "rgb(1, 0, 38)",
    fGColor: "rgb(4, 0, 74)",
    titleColor: "rgb(255, 255, 255)",
    descriptionColor: "rgba(255, 255, 255, 0.6)",
    numberColor: "rgb(255, 255, 255)",
    iconColor: "rgb(255, 255, 255)",
    bgImage: "/images/framer-cards/bg_1.jpg",
    artImage: "/images/framer-cards/art_1.png",
    href: "https://mfcensus-gis.cmfri.org.in/",
    sourceName: "ICAR-CMFRI Marine Fisheries Census",
  },
  {
    id: "02",
    title: "Satellite Earth Observation",
    description: "Daily Earth Observation data synthesized into real-time, evidence-grounded marine intelligence.",
    code: "020038",
    borderColor: "rgb(193, 207, 222)",
    fGColor: "rgb(228, 231, 237)",
    titleColor: "rgb(18, 18, 18)",
    descriptionColor: "rgba(18, 18, 18, 0.8)",
    numberColor: "rgb(18, 18, 18)",
    iconColor: "rgb(18, 18, 18)",
    bgImage: "/images/framer-cards/bg_2.jpg",
    artImage: "/images/framer-cards/art_2.png",
    href: "https://www.mosdac.gov.in/oceansat-3",
    sourceName: "ISRO MOSDAC Satellite Telemetry",
  },
  {
    id: "03",
    title: "5 Regional Dialects",
    description: "Tamil, Bengali, Malayalam, Hindi & English with localized natural language understanding at the edge.",
    code: "030038",
    borderColor: "rgb(2, 4, 5)",
    fGColor: "rgb(16, 27, 33)",
    titleColor: "rgb(255, 255, 255)",
    descriptionColor: "rgba(255, 255, 255, 0.6)",
    numberColor: "rgb(255, 255, 255)",
    iconColor: "rgb(255, 255, 255)",
    bgImage: "/images/framer-cards/bg_3.jpg",
    artImage: "/images/framer-cards/art_3.png",
    href: "https://github.com/openai/whisper#available-models-and-languages",
    sourceName: "OpenAI Whisper Language Docs",
  }
];

const FRAMER_SPRING = {
  type: "spring" as const,
  duration: 1,
  bounce: 0.4,
  delay: 0,
};

const FOLDER_MASK_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='170' height='32' fill='none'%3E%3Cpath fill='%23000' d='M0 0v32h170v-2h-25.95a20 20 0 0 1-13.324-5.085L108.528 5.085A20 20 0 0 0 95.203 0Z'/%3E%3C/svg%3E")`;

function FolderArrow({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5"
    >
      <path
        d="M 0 10 L 10 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(7 7)"
      />
      <path
        d="M 0 0 L 10 0 L 10 10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(7 7)"
      />
    </svg>
  );
}

const FolderCard = ({ data }: { data: FramerFolderCardData }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <a
      href={data.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${data.title} - View official documentation & evidence (${data.sourceName || 'Verified Source'})`}
      className="relative block w-full max-w-[338px] sm:w-[338px] h-[360px] rounded-[28px] overflow-hidden cursor-pointer select-none transition-all duration-300 shadow-2xl group flex-none no-underline hover:shadow-[0_20px_50px_rgba(0,0,0,0.6)] hover:scale-[1.015]"
      style={{
        border: `9px solid ${data.borderColor}`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* LAYER 1: Background Image with hover expansion */}
      <motion.div
        initial={false}
        animate={{
          inset: isHovered ? -27 : 0,
        }}
        transition={FRAMER_SPRING}
        className="absolute z-0 overflow-hidden pointer-events-none"
      >
        <img
          src={data.bgImage}
          alt=""
          className="w-full h-full object-cover object-center pointer-events-none"
        />
      </motion.div>

      {/* LAYER 2: Animated PNG / 3D Art Element */}
      <motion.div
        initial={false}
        animate={{
          top: isHovered ? 57 : 95,
          rotate: isHovered ? -10 : 0,
        }}
        transition={FRAMER_SPRING}
        className="absolute left-1/2 -translate-x-1/2 w-[270px] z-[1] pointer-events-none"
      >
        <img
          src={data.artImage}
          alt={data.title}
          className="w-full h-auto object-contain pointer-events-none"
        />
      </motion.div>

      {/* LAYER 3: Solid Foreground Folder Overlay (Flush to Border) */}
      <motion.div
        initial={false}
        animate={{
          top: isHovered ? 148 : 124,
        }}
        transition={FRAMER_SPRING}
        className="absolute left-0 w-full h-[100vh] z-[2] pointer-events-none"
      >
        {/* FG Top: 170x32px Tab with flush left edge and exact S-curve shoulder */}
        <div
          className="absolute top-0 -left-px w-[171px] h-[32px] z-[1]"
          style={{
            backgroundColor: data.fGColor,
            mask: `${FOLDER_MASK_SVG} no-repeat center / cover`,
            WebkitMask: `${FOLDER_MASK_SVG} no-repeat center / cover`,
          }}
        />

        {/* FG Body: Folder body connected at top: 30px, seamless from left to right border */}
        <div
          className="absolute top-[30px] -left-px -right-px h-[100vh] z-[1]"
          style={{
            backgroundColor: data.fGColor,
          }}
        >
          {/* Subtle code stamp at the bottom of the flap */}
          <div className="absolute top-[150px] left-1/2 -translate-x-1/2 opacity-30 font-mono text-[10px] select-none text-current">
            {data.code}
          </div>
        </div>
      </motion.div>

      {/* LAYER 4: Large Folder Number */}
      <motion.div
        initial={false}
        animate={{
          top: isHovered ? 166 : 142,
        }}
        transition={FRAMER_SPRING}
        className="absolute left-[27px] z-[3] pointer-events-none"
      >
        <span
          className="font-heading font-medium text-[48px] leading-none tracking-[-0.05em]"
          style={{ color: data.numberColor }}
        >
          {data.id}
        </span>
      </motion.div>

      {/* LAYER 5: Arrow Icon on the shoulder */}
      <motion.div
        initial={false}
        animate={{
          top: isHovered ? 193 : 169,
        }}
        transition={FRAMER_SPRING}
        className="absolute right-[27px] w-5 h-5 z-[3] pointer-events-none flex items-center justify-center"
      >
        <FolderArrow color={data.iconColor} />
      </motion.div>

      {/* LAYER 6: Bottom Text (Fixed Title & Description without tiny evidence pill) */}
      <div className="absolute bottom-[20px] left-[24px] right-[24px] z-[4] flex flex-col gap-1.5 pointer-events-none">
        <h3
          className="font-heading text-[15px] font-semibold leading-snug"
          style={{ color: data.titleColor }}
        >
          {data.title}
        </h3>
        <p
          className="text-[12px] font-light leading-[1.38]"
          style={{ color: data.descriptionColor }}
        >
          {data.description}
        </p>
      </div>
    </a>
  );
};

function ProblemSection() {
  return (
    <Section id="problem" className="border-t border-white/[0.08]">
      <div className="max-w-7xl mx-auto space-y-16">

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
              className="text-3xl sm:text-5xl lg:text-7xl leading-[1.08] text-white font-heading font-extrabold tracking-tight"
              style={{ textShadow: '0 2px 24px rgba(0,0,0,0.65)' }}
            >
              The ocean is{' '}
              <span className="font-script text-teal-300 font-normal lowercase tracking-normal text-3xl sm:text-6xl lg:text-8xl inline-block px-1">
                talking
              </span>
              .<br />
              <MagneticText
                text="ORCA"
                hoverText="SIH26176"
                circleSize={210}
                circleBgColor="bg-teal-300"
                hoverTextColor="text-[#050B14]"
                textClassName="text-3xl sm:text-5xl lg:text-7xl text-white font-heading font-extrabold tracking-tight"
                className="mr-2"
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

        {/* ── Folder Cards Grid ── */}
        <div className="w-full flex flex-col md:flex-row flex-wrap xl:flex-nowrap gap-6 justify-center items-center">
          {indicators.map((item, i) => (
            <RevealBlock key={item.id} delay={0.15 + i * 0.1} className="w-full max-w-[338px] flex justify-center">
              <FolderCard data={item} />
            </RevealBlock>
          ))}
        </div>

      </div>
    </Section>
  );
}

// ─── 02: Architecture (Arc-Flow Multi-Agent Carousel) ─────────────────────
function HowItWorksSection() {
  const architecturePipelines: SmoothSliderItem[] = [
    {
      title: "Automated EO Ingestion",
      label: "MOSDAC & INCOIS",
      description:
        "Autonomous discovery and continuous retrieval of Oceansat-3 SST, Chlorophyll-a, and INCOIS ERDDAP Potential Fishing Zone bulletins.",
      src: "/images/pipelines/pipeline-1-eo-ingestion.jpg",
      alt: "Satellite Earth Observation and Oceanic Telemetry",
    },
    {
      title: "LangGraph Multi-Agent Mesh",
      label: "Cyclic Orchestration",
      description:
        "Planner Agent autonomously decomposes complex natural language queries, routing subtasks to dedicated Ocean, Weather, and Risk specialist agents.",
      src: "/images/pipelines/pipeline-2-agent-mesh.jpg",
      alt: "Autonomous Cyclic Agent Mesh Network",
    },
    {
      title: "Ocean & PFZ Reasoning",
      label: "Marine Intelligence",
      description:
        "Spatial-temporal correlation of thermal fronts, chlorophyll convergence, and pelagic fish migration patterns for precision fishing advisories.",
      src: "/images/pipelines/pipeline-3-pfz-reasoning.jpg",
      alt: "Bioluminescent Ocean Currents and Sea Surface Gradients",
    },
    {
      title: "Marine Hazard & Squall Engine",
      label: "Extreme Weather",
      description:
        "Continuous monitoring of wave heights, squall warnings, wind vectors, and cyclone trajectory forecasting to prevent capsizing at sea.",
      src: "/images/pipelines/pipeline-4-squall-engine.jpg",
      alt: "Atmospheric Storm Radar and Maritime Weather Warnings",
    },
    {
      title: "IMBL Geofencing Protocol",
      label: "Maritime Compliance",
      description:
        "Autonomous boundary detection against International Maritime Boundary Lines (IMBL) and Marine Protected Areas (MPA) for legal compliance.",
      src: "/images/pipelines/pipeline-5-imbl-geofence.jpg",
      alt: "Maritime Boundary GIS and Nautical Radar Geofence",
    },
    {
      title: "Multilingual Indic Synthesis",
      label: "5 Regional Languages",
      description:
        "Synthesizer Agent formats localized voice and text advisories in Tamil, Bengali, Malayalam, Hindi, and English for low-connectivity coastal users.",
      src: "/images/pipelines/pipeline-6-indic-synthesis.jpg",
      alt: "Acoustic Dialect Synthesis and Voice Telemetry",
    },
    {
      title: "Verifiable Evidence Provenance",
      label: "Grounded Attribution",
      description:
        "Every safety advisory cites specific MOSDAC satellite grid tiles, sensor timestamps, and official MoES bulletins with verifiable audit trails.",
      src: "/images/pipelines/pipeline-7-evidence-provenance.jpg",
      alt: "Verifiable Cryptographic and Telemetry Provenance",
    },
  ];

  return (
    <section id="how-it-works" className="relative z-10 bg-[#060b13] border-t border-white/[0.08] overflow-hidden">
      {/* Section Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-10 md:px-16 pt-16 sm:pt-24 md:pt-32 pb-4 space-y-4">
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
            <span className="font-script text-teal-300 font-normal lowercase tracking-normal text-4xl sm:text-6xl lg:text-8xl inline-block px-1">
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

        <RevealBlock delay={0.2}>
          <p className="text-white/60 text-sm sm:text-base max-w-2xl font-light">
            Drag, scroll, or hover through the stateful multi-agent DAG mesh coordinating Earth Observation telemetry, marine reasoning, and verifiable evidence generation.
          </p>
        </RevealBlock>
      </div>

      {/* Arc-Flow Carousel Showcase */}
      <div className="w-full relative pb-12">
        <ArcFlowCarousel
          items={architecturePipelines}
          radiusRatio={0.92}
          cardRatio={0.27}
          minCardWidth={220}
          maxCardWidth={400}
          cardAspect={848 / 1264}
          overlap={-0.02}
          arcOffset={0.43}
          smoothing={5.5}
          dragSensitivity={1.2}
          momentum={1}
          snap={false}
          wheelControl="horizontal"
          autoRotateSpeed={0}
          pauseOnHover
          surfaceColor="#060b13"
          className="h-[520px] sm:h-[680px] lg:h-[820px] w-full"
        />
      </div>
    </section>
  );
}

// ─── 03: Team DeTABIS (Interactive Member Carousel from Woblo) ─────────────
const CAROUSEL_CARD_SPRING = {
  type: "spring" as const,
  stiffness: 320,
  damping: 34,
  mass: 1.05,
};

const CAROUSEL_TRACK_SPRING = {
  type: "spring" as const,
  stiffness: 320,
  damping: 34,
  mass: 0.9,
};

interface TeamMember {
  id: number;
  name: string;
  role: string;
  domainFocus: string;
  tag: string;
  image: string;
  linkedin: string;
}

interface TeamMemberCardProps {
  member: TeamMember;
  isActive: boolean;
  cardWidth: number;
  cardHeight: number;
  onClick: () => void;
}

function TeamMemberCard({ member, isActive, cardWidth, cardHeight, onClick }: TeamMemberCardProps) {
  const imageMargin = 10;
  const radius = 32;
  const activePhotoRatio = 0.56;

  return (
    <motion.article
      onClick={onClick}
      role="button"
      tabIndex={-1}
      aria-label={`${member.name} card`}
      whileHover={{ scale: isActive ? 1.03 : 0.99, y: isActive ? -6 : -2 }}
      whileTap={{ scale: isActive ? 1.015 : 0.985 }}
      style={{
        position: 'relative',
        width: cardWidth,
        height: cardHeight,
        flex: '0 0 auto',
        borderRadius: radius,
        boxShadow: isActive
          ? '0 20px 50px rgba(0,0,0,0.25)'
          : '0 10px 30px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        cursor: 'pointer',
        background: '#FFFFFF',
        WebkitTapHighlightColor: 'transparent',
        willChange: 'transform',
      }}
      animate={{
        scale: isActive ? 1.02 : 0.97,
        y: isActive ? -4 : 0,
      }}
      transition={CAROUSEL_CARD_SPRING}
    >
      {/* Photo Container */}
      <motion.div
        initial={false}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          overflow: 'hidden',
          willChange: 'height, top, left, right',
          zIndex: 2,
        }}
        animate={{
          top: imageMargin,
          left: imageMargin,
          right: imageMargin,
          height: isActive
            ? `calc(${activePhotoRatio * 100}% - ${imageMargin * 2}px)`
            : `calc(100% - ${imageMargin * 2}px)`,
          borderRadius: radius - 12,
        }}
        transition={CAROUSEL_CARD_SPRING}
      >
        <img
          src={member.image}
          alt={member.name}
          style={{
            width: '100%',
            height: `${Math.max(0, cardHeight - imageMargin * 2)}px`,
            objectFit: 'cover',
            objectPosition: isActive ? 'center 20%' : 'center',
            display: 'block',
            transform: 'translateZ(0)',
          }}
          draggable={false}
        />
      </motion.div>

      {/* Details Bottom Drawer */}
      <motion.div
        initial={false}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          top: `${Math.round(activePhotoRatio * 100)}%`,
          background: '#FFFFFF',
          borderBottomLeftRadius: radius,
          borderBottomRightRadius: radius,
          padding: '20px 22px 22px',
          boxShadow: 'none',
          willChange: 'transform, opacity',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
        animate={{
          opacity: isActive ? 1 : 0,
          y: isActive ? 0 : 18,
        }}
        transition={CAROUSEL_CARD_SPRING}
      >
        {/* Name */}
        <h3
          style={{
            fontFamily: 'var(--font-heading, sans-serif)',
            fontSize: '24px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: '1.05em',
            color: '#000000',
            margin: 0,
          }}
        >
          {member.name}
        </h3>

        {/* Role & Domain */}
        <p
          style={{
            fontSize: '13.5px',
            fontWeight: 500,
            letterSpacing: '-0.01em',
            lineHeight: '1.35em',
            color: '#000000',
            opacity: 0.82,
            marginTop: '8px',
          }}
        >
          {member.role}
        </p>

        {/* Bottom Row: Tag Badge + View Profile Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginTop: '16px',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              fontWeight: 500,
              letterSpacing: '-0.01em',
              lineHeight: '1em',
              padding: '7px 10px',
              borderRadius: '999px',
              background: '#F5F5F5',
              color: '#000000',
              whiteSpace: 'nowrap',
            }}
          >
            {member.tag}
          </span>

          <motion.a
            href={member.linkedin || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            style={{
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '-0.01em',
              lineHeight: '1em',
              padding: '10px 14px',
              borderRadius: '999px',
              background: '#111111',
              color: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.10)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            View Profile
          </motion.a>
        </div>
      </motion.div>
    </motion.article>
  );
}

function TeamSection() {
  const [activeIndex, setActiveIndex] = useState(2); // Center on middle member initially
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  const team: TeamMember[] = [
    {
      id: 1,
      name: "Dhrubojyoti",
      role: "Team Lead · AI Architecture",
      domainFocus: "LangGraph Multi-Agent Mesh, Shared State Schema & Orchestration",
      tag: "AI Architecture",
      image: "/team/dhrubojyoti.jpg",
      linkedin: "https://www.linkedin.com/in/dhrubojyoti-hazra-a71a9a325/",
    },
    {
      id: 2,
      name: "Isheeka",
      role: "Backend & Persistence Lead",
      domainFocus: "FastAPI Integration, Supabase Geofencing & Conversation State",
      tag: "Backend & Cloud",
      image: "/team/isheeka.jpg",
      linkedin: "https://www.linkedin.com/in/isheeka-mukhopadhyay-6910aa326/",
    },
    {
      id: 3,
      name: "Samprikta",
      role: "Agent Systems Lead",
      domainFocus: "Weather, Ocean & Risk Specialist Agents, Multilingual NLP Synthesis",
      tag: "Agent Systems",
      image: "/team/samprikta.jpg",
      linkedin: "https://www.linkedin.com/in/samprikta-de-141a46288/",
    },
    {
      id: 4,
      name: "Tiyasha",
      role: "Data & Integration Lead",
      domainFocus: "MOSDAC (Oceansat-3 SST & Chlorophyll) & INCOIS ERDDAP APIs",
      tag: "Data Ingestion",
      image: "/team/tiyasha.jpg",
      linkedin: "https://www.linkedin.com/in/tiyasha-baidya-2a6ab6283/",
    },
    {
      id: 5,
      name: "Adhiraj",
      role: "Presentation, Research & QA",
      domainFocus: "SIH Problem Validation, User Research & Domain Evaluation Sets",
      tag: "Research & QA",
      image: "/team/adhiraj.jpg",
      linkedin: "https://www.linkedin.com/in/adhiraj-das-b924283b3/",
    },
    {
      id: 6,
      name: "Biswanath",
      role: "Frontend Engineering Lead",
      domainFocus: "Next.js 16, Mapbox/Leaflet GIS Layer & Real-time Telemetry UI",
      tag: "Frontend & GIS",
      image: "/team/biswanath.jpg",
      linkedin: "https://www.linkedin.com/in/biswanath-goswami2004/",
    }
  ];

  // Measure container width for responsive carousel math
  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const isMobile = containerWidth > 0 && containerWidth < 640;
  const isTablet = containerWidth >= 640 && containerWidth < 980;

  const cardWidth = isMobile ? 270 : isTablet ? 290 : 324;
  const cardHeight = isMobile ? 420 : isTablet ? 440 : 478;
  const gap = 28;
  const itemWidth = cardWidth + gap;
  const centerOffset = (containerWidth - cardWidth) / 2;

  const x = useMotionValue(0);

  // Sync track position when activeIndex or centerOffset changes
  useEffect(() => {
    const targetX = -(activeIndex * itemWidth) + centerOffset;
    animate(x, targetX, CAROUSEL_TRACK_SPRING);
  }, [activeIndex, itemWidth, centerOffset, x]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => Math.min(team.length - 1, prev + 1));
  }, [team.length]);

  // Keyboard arrow keys navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    }
  }, [handleNext, handlePrev]);

  // Horizontal drag gesture handler with velocity snapping
  const handleDragEnd = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const n = info.offset.x + info.velocity.x * 0.25;
    const r = Math.max(40, itemWidth * 0.25);
    let nextIndex = activeIndex;
    if (n < -r) {
      nextIndex += 1;
    } else if (n > r) {
      nextIndex -= 1;
    } else {
      const curr = -(x.get() - centerOffset) / itemWidth;
      nextIndex = Math.round(curr);
    }
    const clamped = Math.max(0, Math.min(nextIndex, team.length - 1));
    setActiveIndex(clamped);
  }, [activeIndex, itemWidth, centerOffset, team.length, x]);

  return (
    <Section id="team" className="border-t border-white/[0.08]">
      <div className="max-w-7xl mx-auto space-y-12">

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
              <span className="font-script text-teal-300 font-normal tracking-normal text-4xl sm:text-6xl lg:text-8xl inline-block">
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

        {/* Woblo Team Member Carousel Container */}
        <div
          ref={containerRef}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="region"
          aria-label="Team member carousel"
          className="relative w-full py-6 select-none overflow-hidden outline-none"
        >
          {/* Left Arrow Button */}
          <motion.button
            type="button"
            aria-label="Previous team member"
            onClick={handlePrev}
            disabled={activeIndex === 0}
            whileHover={activeIndex > 0 ? { scale: 1.08 } : undefined}
            whileTap={activeIndex > 0 ? { scale: 0.95 } : undefined}
            className="absolute left-2 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 z-30 size-12 rounded-full border border-black/10 bg-white/95 text-black shadow-[0_8px_24px_rgba(0,0,0,0.15)] backdrop-blur-md flex items-center justify-center cursor-pointer transition-opacity disabled:opacity-25 disabled:cursor-not-allowed select-none"
          >
            <ChevronLeft className="size-5 stroke-[2.25]" />
          </motion.button>

          {/* Right Arrow Button */}
          <motion.button
            type="button"
            aria-label="Next team member"
            onClick={handleNext}
            disabled={activeIndex === team.length - 1}
            whileHover={activeIndex < team.length - 1 ? { scale: 1.08 } : undefined}
            whileTap={activeIndex < team.length - 1 ? { scale: 0.95 } : undefined}
            className="absolute right-2 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-30 size-12 rounded-full border border-black/10 bg-white/95 text-black shadow-[0_8px_24px_rgba(0,0,0,0.15)] backdrop-blur-md flex items-center justify-center cursor-pointer transition-opacity disabled:opacity-25 disabled:cursor-not-allowed select-none"
          >
            <ChevronRight className="size-5 stroke-[2.25]" />
          </motion.button>

          {/* Draggable Track */}
          <div className="relative w-full h-[520px] overflow-hidden flex items-center">
            <motion.div
              style={{
                x,
                display: 'flex',
                alignItems: 'center',
                gap,
                willChange: 'transform',
                touchAction: 'pan-y',
              }}
              drag="x"
              dragConstraints={{ left: -100000, right: 100000 }}
              dragElastic={0.08}
              onDragEnd={handleDragEnd}
              aria-label="Carousel track"
            >
              {team.map((member, index) => (
                <TeamMemberCard
                  key={member.id}
                  member={member}
                  isActive={index === activeIndex}
                  cardWidth={cardWidth}
                  cardHeight={cardHeight}
                  onClick={() => setActiveIndex(index)}
                />
              ))}
            </motion.div>
          </div>

          {/* Indicator Pills */}
          <div className="flex items-center justify-center gap-2 mt-6 z-20">
            {team.map((member, i) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setActiveIndex(i)}
                aria-label={`Go to ${member.name}`}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  i === activeIndex
                    ? 'w-8 bg-teal-400'
                    : 'w-2 bg-white/25 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
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
