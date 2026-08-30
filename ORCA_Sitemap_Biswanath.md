# ORCA — App Sitemap & Screen Spec
**For:** Biswanath (Frontend Engineering Lead)  
**Stack:** Next.js · Tailwind CSS · shadcn/ui · Framer Motion · Leaflet  
**Design ref:** `design.md` (dark-first, gray scale with cool undertone, cyan accent, Claude/Gemini/ChatGPT layout pattern)  
**Last updated:** 30 August 2026

---

## Locked Decisions That Shape This Sitemap

| Decision | What It Means for You |
|---|---|
| ChatGPT / Gemini / Claude layout | Sidebar left, centered input on empty state, thread fills on active chat |
| Charts → optional "tap for details" | No charts rendered by default — plain language + icon first, chart expandable on tap |
| Map stays as default visual | Leaflet map renders inline inside response cards — no chart literacy needed |
| Onboarding tutorial → 4 tooltip beats | One-time tooltip walkthrough after first login, replayable from Settings |
| 5 languages | English, Hindi, Bengali, Marathi, Tamil — UI strings AND voice input both |
| Auth methods | Phone OTP (primary) · Email/password · Google OAuth |
| Theme | Dark default · Light option · Sun/moon switch top-right of main area |

---

## Route Map

```
/                          Landing page (public, already built)
/login                     Auth entry point (public)
/onboarding                First-time setup — 4 steps (auth required)
/chat                      Main chat interface — empty state (auth required)
/chat/[id]                 Active conversation thread (auth required)
/alerts                    Dedicated alerts & advisories panel (auth required)
/settings                  User settings (auth required)
/settings/profile          Edit profile sub-page
/settings/language         Language & region preference sub-page
```

---

## Screen-by-Screen Spec

---

### `/login` — Auth Entry

**Layout:** Full-screen centered card, `--bg-base` background.

**Content:**
- ORCA wordmark + tagline ("Speak to the sea.")
- Three auth options stacked:
  1. **📱 Continue with Phone** — OTP flow (primary, shown first — matches target user base)
  2. **✉️ Continue with Email**
  3. **G Continue with Google**
- Language selector at bottom-right (default: English) — so fishers can read the login screen in their language before they've even set a profile

**State machine:**
```
DEFAULT
  → [Phone selected] → PHONE_ENTRY (enter number) → OTP_VERIFY (6-digit code) → DONE
  → [Email selected] → EMAIL_ENTRY (email + password) → DONE
  → [Google selected] → OAuth popup → DONE
DONE
  → profile exists?  YES → /chat
                     NO  → /onboarding
```

---

### `/onboarding` — First-Time Setup (4 Steps)

Keep it fast. One question per screen. Progress dots at top.

**Step 1 — Name**
```
"What should we call you?"
[ _________________ ]  (text input)
                  [Next →]
```

**Step 2 — Language**
```
"Which language do you prefer?"
  ○ English   ○ हिन्दी (Hindi)
  ○ বাংলা (Bengali)  ○ मराठी (Marathi)
  ○ தமிழ் (Tamil)
                  [Next →]
```
*UI immediately switches to selected language from this point forward.*

**Step 3 — Location**
```
"Where do you fish?"
  [📍 Detect my location automatically]
     — or —
  [ Type your district / village ]
                  [Next →]
```
*Auto-detect uses browser `navigator.geolocation`. Manual fallback is a plain text input — no dropdown required.*

**Step 4 — Vessel type (optional, skippable)**
```
"What kind of vessel do you use?"
  ○ Small boat (< 8m)
  ○ Medium trawler (8–15m)
  ○ Large vessel (> 15m)
  ○ I'd rather skip this
                  [Get Started →]
```
*Vessel size affects which wave-height thresholds are dangerous — useful context for the Risk Agent. Made optional so it's not a barrier.*

**On completion:** Profile saved → redirect to `/chat` → tooltip tutorial fires.

---

### `/chat` — Empty State (Core App)

**This is the main screen. It mirrors the Gemini/Claude layout exactly.**

```
┌──────────────────┬────────────────────────────────────────────┐
│  SIDEBAR         │  MAIN AREA                      [☀/🌙]    │
│                  │                                             │
│  [+ New Chat]    │                                             │
│                  │           Hey, [Name]. 👋                   │
│  ── Nav ──       │      What would you like to know?          │
│  💬 Chats        │                                             │
│  🔔 Alerts    ●  │   ┌─────────────────────────────────────┐  │
│  ⚙️  Settings    │   │  🎤  Ask anything...            ➤   │  │
│                  │   │  ──────────────── + ──────────────  │  │
│  ── Recent ──    │   └─────────────────────────────────────┘  │
│  Chat 1          │                                             │
│  Chat 2          │   Suggested questions:                      │
│  Chat 3          │   "Is it safe to go out tomorrow?"          │
│                  │   "Where's the nearest fishing zone?"       │
│  ──────────────  │   "Any alerts near Veraval today?"          │
│  [👤 Profile]    │                                             │
└──────────────────┴────────────────────────────────────────────┘
```

**Sidebar spec:**
- `[+ New Chat]` pinned top — starts a fresh conversation, routes to `/chat/[new-id]`
- Nav items: Chats, Alerts (with unread dot badge), Settings
- Recent chats list: scrollable, shows first line of conversation + timestamp
- User profile avatar + name pinned bottom — taps to `/settings/profile`
- Sidebar collapses to icon-only on narrow screens (< 768px)

**Main area — empty state:**
- Personalized greeting: "Hey, [Name]." in user's chosen language
- Pill-shaped input bar (matches `design.md` §5): `+` attach left, mic icon right (Groq Whisper), send arrow appears once text exists
- 3 suggested questions — tapping one fills the input bar

**Input bar detail:**
- Mic holds on press → transcribes on release (Groq Whisper → Web Speech fallback)
- `+` attach is reserved for future file sharing — can render as disabled/greyed for MVP
- Send button: `--accent-cyan` fill, white arrow icon

**Onboarding tooltip sequence (fires once, first login only):**
1. Tooltip on input bar: "Type or tap the mic to ask anything"
2. Tooltip on mic icon: "Tap and hold to speak in your language"
3. Tooltip on Alerts nav: "Hazard alerts for your area appear here"
4. Tooltip on sidebar: "Your past conversations are saved here"
- Each tooltip has a "Got it" dismiss — all 4 dismissed = walkthrough complete
- Replay from Settings → "Show tutorial again"

---

### `/chat/[id]` — Active Conversation Thread

**Layout:** Same sidebar, greeting replaced by scrollable message thread.

```
┌──────────────────┬────────────────────────────────────────────┐
│  SIDEBAR         │  [thread title / location]      [☀/🌙]    │
│  (same)          │  ─────────────────────────────────────────  │
│                  │                                             │
│                  │  USER (right-aligned, --bg-elevated-2 pill) │
│                  │  "Is it safe to fish near Veraval tomorrow?"│
│                  │                                             │
│                  │  ORCA (left-aligned, no bubble)             │
│                  │  ┌─────────────────────────────────────┐   │
│                  │  │ ⚠️  Moderate risk — 2.2m wave height │   │
│                  │  │                                      │   │
│                  │  │ [🗺 Map — Veraval zone highlighted]  │   │
│                  │  │                                      │   │
│                  │  │ Tomorrow's conditions near Veraval:  │   │
│                  │  │ 🌊 Waves: 2.2m — above safe limit   │   │
│                  │  │    for small boats                   │   │
│                  │  │ 💨 Wind: 28 knots                   │   │
│                  │  │ 🌡 SST: 28.4°C — warmer than usual  │   │
│                  │  │                                      │   │
│                  │  │ [See detailed charts ▾]              │   │
│                  │  └─────────────────────────────────────┘   │
│                  │                                             │
│                  │  ┌─────────────────────────────────────┐   │
│                  │  │  🎤  Ask a follow-up...         ➤   │   │
│                  │  └─────────────────────────────────────┘   │
└──────────────────┴────────────────────────────────────────────┘
```

**Message rules (from `design.md`):**
- **User messages:** right-aligned, `--bg-elevated-2` pill background
- **ORCA responses:** left-aligned, NO bubble background — text sits on page, same as Claude/ChatGPT
- **Rich inline cards** (map, advisory, data): `--bg-elevated` background, `--border-subtle` border, glassmorphism blur only on cards with live data

**Response card anatomy:**
```
┌─ Response Card ────────────────────────────────┐
│ [severity indicator — amber/red/none]           │
│                                                 │
│ [Leaflet map snippet — zone highlighted]        │
│   ↑ Always shown. No chart literacy required.  │
│                                                 │
│ Plain-language conditions                       │
│  🌊 Waves: 2.2m — above safe limit for        │
│     small boats                                 │
│  💨 Wind: 28 knots                             │
│  🌡 SST: 28.4°C — warmer than usual           │
│  🐟 PFZ: 12km south of Veraval port           │
│                                                 │
│ [See detailed charts ▾]  ← collapsed by default│
│  (expands: SST trend line, wave forecast chart) │
│                                                 │
│ Evidence: MOSDAC Oceansat-3 · INCOIS ERDDAP    │
│ Updated: 6 hours ago                            │
└─────────────────────────────────────────────────┘
```

**"See detailed charts ▾" accordion:**
- Collapses by default (plain language shown first)
- Expands to show SST trend line, wave height forecast (Recharts or Chart.js)
- Serves secondary users (researchers, officials) without cluttering fisher-first experience
- SIH scoring: charts exist and are accessible = brief requirement ✅

**Severity colour rules (`design.md` §2 — alert tokens):**
- 🔴 `--alert-red` : cyclone / extremely hazardous / do not go out
- 🟡 `--alert-amber` : moderate risk / conditions deteriorating / caution
- No colour badge: safe / conditions normal
- Never use amber or red decoratively

**Loading states:**
- Thinking indicator: 3-dot pulse in `--accent-cyan`, left-aligned
- Streaming: text appears word-by-word (SSE stream from FastAPI)

---

### `/alerts` — Advisories Panel

**Purpose:** Proactive push surface for INCOIS hazard alerts — cyclones, high waves, geofence warnings. Reachable from sidebar nav with unread badge.

```
┌──────────────────┬────────────────────────────────────────────┐
│  SIDEBAR         │  Alerts & Advisories           [☀/🌙]     │
│  (same)          │  ─────────────────────────────────────────  │
│                  │                                             │
│                  │  ┌── 🔴 CYCLONE WARNING ──────────────┐   │
│                  │  │ Bay of Bengal · Updated 2h ago      │   │
│                  │  │ Cyclone Dana — Category 2           │   │
│                  │  │ Expected landfall: 48–72h            │   │
│                  │  │ Affected zones: WB coast, Odisha    │   │
│                  │  │ [See on map ▸]  [Ask ORCA about it] │   │
│                  │  └─────────────────────────────────────┘   │
│                  │                                             │
│                  │  ┌── 🟡 HIGH WAVE ADVISORY ────────────┐   │
│                  │  │ Veraval sector · 3h ago             │   │
│                  │  │ Waves 2.0–2.8m forecast for 24h    │   │
│                  │  │ Small boats: stay ashore            │   │
│                  │  │ [See on map ▸]  [Ask ORCA about it] │   │
│                  │  └─────────────────────────────────────┘   │
│                  │                                             │
│                  │  ── Historical ──                           │
│                  │  [Dismissed alerts, greyed out]            │
└──────────────────┴────────────────────────────────────────────┘
```

**Behaviour:**
- Alerts sourced from INCOIS ERDDAP, filtered to user's saved location
- "Ask ORCA about it" → opens `/chat/[new-id]` pre-filled with the alert context
- "See on map ▸" → inline map expands showing affected zone
- Unread count drives the sidebar badge dot
- Alerts auto-dismissed after 48h or manual swipe

---

### `/settings` — User Settings

**Sub-pages (tabs or sub-routes):**

#### `/settings/profile`
- Display name (editable)
- Phone number (read-only — from auth)
- Location (editable — retriggers geolocation or manual entry)
- Vessel type (editable)
- [Save Changes]
- [Delete Account] — danger zone, confirmation modal
- [Log Out]

#### `/settings/language`
- Language selector: English · हिन्दी · বাংলা · मराठी · தமிழ்
- "Show tutorial again" button → re-triggers the 4-tooltip onboarding walkthrough
- Theme preference: [Dark] / [Light] (mirrors the in-app toggle, persistent)

---

## Component Checklist for Biswanath

```
Shared / Layout
  ☐ AppShell              — sidebar + main area wrapper, handles mobile collapse
  ☐ Sidebar               — new chat button, nav items, recent list, profile footer
  ☐ ThemeToggle           — sun/moon switch, top-right fixed, localStorage persistence
  ☐ LanguageProvider      — next-intl wrapper, switches all UI strings

Auth
  ☐ LoginPage             — three auth method cards
  ☐ PhoneOTPFlow          — number entry → 6-digit OTP
  ☐ EmailAuthFlow         — email + password
  ☐ GoogleOAuth           — Supabase redirect

Onboarding
  ☐ OnboardingShell       — progress dots, step transitions (Framer Motion)
  ☐ StepName
  ☐ StepLanguage
  ☐ StepLocation          — geolocation button + manual input
  ☐ StepVessel
  ☐ TooltipTutorial       — 4-beat first-time overlay, dismissable, replayable

Chat
  ☐ ChatEmptyState        — greeting + suggested questions
  ☐ ChatThread            — scrollable message list
  ☐ UserMessage           — right-aligned pill
  ☐ OrcaMessage           — left-aligned, no bubble
  ☐ ResponseCard          — map + plain-language conditions + chart accordion
  ☐ LeafletMapSnippet     — inline map with zone highlight (lazy loaded)
  ☐ ChartAccordion        — collapsed by default, SST/wave charts inside
  ☐ ThinkingIndicator     — 3-dot pulse while agent responds
  ☐ InputBar              — pill shaped, mic + attach + send

Alerts
  ☐ AlertCard             — severity colour header, description, two action buttons
  ☐ AlertsPage            — list of AlertCards, historical section

Settings
  ☐ ProfileSettings
  ☐ LanguageSettings
```

---

## Mobile Behaviour

| Breakpoint | Sidebar | Input bar | Map cards |
|---|---|---|---|
| ≥ 1024px (desktop) | Full sidebar visible | Centred, max-width 720px | Inline in thread |
| 768–1023px (tablet) | Icon-only collapsed sidebar | Full width | Inline in thread |
| < 768px (phone) | Hidden, hamburger toggle | Full width, bottom-fixed | Full-width cards |

*PWA installability is a stretch goal — but build mobile-first from day one since that's the actual usage device.*

---

## What Is NOT In Scope for Frontend V1

- Dashboard stats page (total queries, history analytics) — cut
- File upload (future feature — no attachment for MVP)
- TTS voice output — deferred (see TECH_STACK.md §8)
- URL sharing of conversations
- Push notifications (alerts are in-app only for V1)
