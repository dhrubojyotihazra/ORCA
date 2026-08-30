<div align="center">

<br />

# 🐋 ORCA
### **O**cean **R**eal-time **C**oastal **A**dvisory

**SIH Problem Statement 26176 · Team DeTABIS**

*An AI-powered, satellite-backed advisory platform that translates petabytes of ISRO Oceansat-3 ocean intelligence into actionable, multilingual guidance for India's 4 million active fishers.*

<br />

[![Next.js](https://img.shields.io/badge/Next.js-16.3.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-13-0055FF?style=flat-square&logo=framer)](https://www.framer.com/motion/)
[![SIH 2026](https://img.shields.io/badge/SIH_2026-26176-FF6B35?style=flat-square)](https://www.sih.gov.in/)

<br />

</div>

---

## 🌊 The Problem

India's fishing sector is a lifeline for millions — but it operates in a dangerous information vacuum.

| Reality | Scale |
|---|---|
| Active fishers in India | **4 million+** (CMFRI) |
| Satellite oceanography data produced (Oceansat-3) | **Petabytes / year** |
| Actionable advisories reaching fishers | **Near zero** |
| Language barrier | **22+ official languages** |

ISRO's Oceansat-3 and INCOIS produce world-class ocean intelligence — Sea Surface Temperature (SST), chlorophyll-a concentrations, potential fishing zones, and cyclone-grade wave forecasts. This data sits in dense scientific bulletins accessible only to researchers. Fishers make life-or-death decisions with WhatsApp forwards and word of mouth.

**ORCA closes this gap.**

---

## 🐋 What ORCA Does

ORCA is a full-stack conversational AI platform that:

1. **Ingests** real-time satellite telemetry from ISRO MOSDAC (Oceansat-3 SST & Chlorophyll-a) and INCOIS ERDDAP API feeds
2. **Synthesises** multi-variable ocean intelligence through a LangGraph multi-agent mesh
3. **Delivers** plain-language, actionable fishing advisories in the fisher's native language
4. **Alerts** proactively on extreme weather, geofencing violations (maritime boundaries), and hazardous sea states
5. **Visualises** real-time ocean conditions on an interactive 3D WebGL globe with 10 globally significant coastal fishing grounds

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│           ORCA Frontend                 │
│   Next.js 16 · React 19 · Tailwind 4   │
│       (This Repository)                 │
└──────────────┬──────────────────────────┘
               │ REST / WebSocket
┌──────────────▼──────────────────────────┐
│         FastAPI Backend                 │
│  Supabase PostGIS Geofencing            │
│  Conversation State & History           │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│     LangGraph Multi-Agent Mesh          │
│                                         │
│  [Weather Agent] [Ocean Agent] [Risk]   │
│           ↓           ↓         ↓       │
│      [Synthesis Agent — Multilingual]   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│            Data Sources                 │
│  ISRO MOSDAC         INCOIS ERDDAP      │
│  (Oceansat-3 SST,    (Wave Height,      │
│   Chlorophyll-a)      PFZ Bulletins)    │
└─────────────────────────────────────────┘
```

---

## ✨ Landing Page Features

The landing page demonstrates ORCA's capabilities through a series of engineered visual sequences.

### 🎬 Hero Section — GPU-Composited ORCA Morph

A cinematic hero built on a single hardware-accelerated `<canvas>`:
- **`destination-out`** — morphing blob trails punch holes through the foreground ORCA silhouette
- **`destination-over`** — holographic "reveal" ORCA shows through those holes
- Zero `toDataURL()` base64 serialization — pure GPU compositing locked at 60fps
- Fluid WebGL gradient background with procedural noise animation

### 🌍 Interactive 3D Ocean Globe

WebGL globe powered by [cobe](https://github.com/shuding/cobe):
- **10 key coastal fishing grounds** — 5 in India + 5 globally distributed
- Mouse-wheel **zoom** (50km → 2000km altitude range)
- Physics-based **drag-to-spin** with momentum and decay
- Real-time telemetry arcs routing from ISRO/INCOIS nodes to coastal markers
- Liquid glass container with SVG `feTurbulence` refraction — borderless, zero hard edges

| Marker | Region | Notes |
|---|---|---|
| 🇮🇳 Gulf of Mannar | Tamil Nadu | Coral reef ecosystems, tuna fisheries |
| 🇮🇳 Veraval Shelf | Gujarat | India's largest fishing port |
| 🇮🇳 Visakhapatnam | Andhra Pradesh | Bay of Bengal deep-sea zone |
| 🇮🇳 Kochi Shelf | Kerala | Arabian Sea sardine corridor |
| 🇮🇳 Sundarbans Delta | West Bengal | Mangrove fisheries, hilsa habitat |
| 🌍 Grand Banks | Newfoundland, Canada | Atlantic cod, historic fishery |
| 🌍 Humboldt Current | Peru | World's most productive upwelling |
| 🌍 North Sea | UK / Norway | European herring & mackerel |
| 🌍 Coral Triangle | Indonesia | Global epicentre of marine biodiversity |
| 🌍 Agulhas Bank | South Africa | Southern Ocean tuna corridor |

### 🔬 ORCA Magnetic Lens Effect

The word **ORCA** in the Problem Context section uses a custom `MagneticText` component:
- Expanding circular lens reveals hidden text `SIH26176` on hover
- Spring-physics animation with proportional font scaling
- Dotted underline affordance indicating interactivity

### 📊 Problem Context — Spotlight Bento Grid

Animated spotlight cards with cursor-tracking radial spotlight effects, displaying key statistics sourced from CMFRI, INCOIS, and ISRO mission reports.

### 👥 Team DeTABIS — Animated Glow Cards

Team member cards featuring:
- Conic-gradient rotating border glow (unique colour palette per member)
- Interactive cursor-tracking spotlight pools in each member's accent colour
- Smooth scroll-reveal animations via Framer Motion viewport triggers

---

## 🛠️ Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 16.3.3 | SSR, routing, image optimisation |
| **UI Library** | React | 19.2.8 | Component model |
| **Language** | TypeScript | 5 | End-to-end type safety |
| **Styling** | Tailwind CSS | 4 | Utility-first design system |
| **Animation** | Framer Motion | 13.1 | Spring physics, viewport reveals, motion values |
| **3D Globe** | cobe | 2.0.1 | WebGL globe via OGL |
| **3D Scene** | React Three Fiber + Three.js | 9.7 / 0.185 | WebGL background gradient mesh |
| **Icons** | Lucide React | 1.37 | Consistent icon set |
| **Utilities** | clsx + tailwind-merge | latest | Conditional class composition |

---

## 📁 Project Structure

```
orca-landing/
├── public/
│   ├── images/              # ORCA morph poster assets (front.png, reveal.png)
│   ├── team/                # Team member avatars (dhrubojyoti.jpg, etc.)
│   └── icon.png             # ORCA favicon
│
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout — Inter + Space Mono fonts, metadata
│   │   ├── page.tsx         # Entry point — composes HeroSection + BelowFoldSections
│   │   └── globals.css      # CSS variables, scroll behaviour, native cursor
│   │
│   ├── components/
│   │   ├── HeroSection.tsx          # GPU-composited ORCA morph canvas + OceanGlobeCard
│   │   ├── BelowFoldSections.tsx    # Problem · Solution · Team · Footer sections
│   │   ├── OceanGlobeCard.tsx       # Liquid glass wrapper for the 3D globe
│   │   ├── GlassFilterDefs.tsx      # Shared SVG <defs> for SVG glass distortion
│   │   └── Navbar.tsx               # Adaptive notch navigation bar
│   │
│   └── components/ui/
│       ├── cobe-globe.tsx                    # WebGL globe with zoom & drag physics
│       ├── morphing-cursor.tsx               # MagneticText expanding lens effect
│       ├── spotlight-card.tsx                # Cursor-tracking borderless glass card
│       ├── animated-gradient-border.tsx      # Rotating conic glow border (team cards)
│       ├── animated-gradient.tsx             # WebGL background gradient mesh
│       ├── fishy-button.tsx                  # Animated CTA button with particle trail
│       ├── liquid-glass.tsx                  # SVG feTurbulence refraction filter
│       ├── footer-section.tsx                # Site footer with nav links
│       └── adaptive-notch-navigation-bar.tsx # Dynamic island-style navbar
│
└── tailwind.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** 9+

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/dhrubojyotihazra/ORCA.git
cd ORCA/orca-landing

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Production Build

```bash
npm run build
npm run start
```

### TypeScript Check

```bash
npx tsc --noEmit
```

---

## 🖼️ Adding Team Photos

Drop team member photos into `public/team/` with these exact filenames:

```
public/team/
├── dhrubojyoti.jpg
├── isheeka.jpg
├── samprikta.jpg
├── tiyasha.jpg
├── adhiraj.jpg
└── biswanath.jpg
```

The `MemberAvatar` component automatically falls back to a colour-coded monogram if any image is missing.

---

## 🌐 Data Sources

| Source | Data Type |
|---|---|
| **ISRO MOSDAC** | Oceansat-3 Sea Surface Temperature, Chlorophyll-a |
| **INCOIS ERDDAP** | Potential Fishing Zones, Wave Height, Swell Period |
| **IMD** | Cyclone tracks, monsoon onset |
| **CMFRI** | Fisheries statistics, species distribution atlases |
| **Supabase PostGIS** | Maritime boundary geofencing |

---

## 🏆 SIH 2026 Context

| Field | Value |
|---|---|
| **Problem ID** | SIH 26176 |
| **Category** | Smart Automation |
| **Ministry** | Ministry of Fisheries, Animal Husbandry & Dairying |
| **Team Name** | DeTABIS |

---

## 👥 Team DeTABIS

| Member | Role | Focus |
|---|---|---|
| **Dhrubojyoti** | Team Lead · AI Architecture | LangGraph Multi-Agent Mesh, Shared State & Orchestration |
| **Isheeka** | Backend & Persistence Lead | FastAPI, Supabase Geofencing & Conversation State |
| **Samprikta** | Agent Systems Lead | Weather, Ocean & Risk Specialist Agents, Multilingual NLP |
| **Tiyasha** | Data & Integration Lead | MOSDAC (Oceansat-3 SST & Chlorophyll) & INCOIS ERDDAP APIs |
| **Adhiraj** | Research, Presentation & QA | SIH Problem Validation, User Research & Domain Evaluation |
| **Biswanath** | Frontend Engineering Lead | Next.js, Mapbox/Leaflet GIS Layer & Real-time Telemetry UI |

---

## 📄 License

Developed for **Smart India Hackathon 2026**.  
All rights reserved — Team DeTABIS.

---

<div align="center">

*Built with 🌊 by Team DeTABIS · SIH 2026*

</div>
