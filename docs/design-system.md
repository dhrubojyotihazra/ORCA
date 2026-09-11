# ORCA -- Design System

Extends the landing page's existing visual language (Plus Jakarta Sans, Inter, JetBrains Mono, cyan/teal accent) into a full light + dark theme system for the core app. Reference points: the Claude/Gemini/ChatGPT screenshots you shared for the sidebar + centered-input layout pattern.

---

## 1. Direction recap

Dark-mode-first, bento-grid card layout, glassmorphism used only on live-data surfaces (map cards, advisory cards) -- not the whole UI. Now extended with a light theme, since not everyone will want dark mode, and a top-right toggle to switch between them. Full reasoning for the base direction lives in earlier conversation; this file is the concrete token spec.

---

## 2. Color tokens

**On the gray question:** you asked for dark grays rather than the landing page's navy-black. Going with a gray scale that carries a faint cool undertone rather than a fully neutral gray -- it keeps continuity with the brand's navy/teal identity without being literally navy. If you want fully neutral gray instead (no blue undertone at all), that's a one-line swap in the values below, not a structural change.

### Dark theme

| Token | Value | Use |
|---|---|---|
| `--bg-base` | `#0E1113` | App background |
| `--bg-elevated` | `#16191C` | Sidebar, cards |
| `--bg-elevated-2` | `#1D2124` | Nested cards, input bar |
| `--border-subtle` | `#2A2E32` | Card/sidebar borders |
| `--text-primary` | `#F2F3F4` | Headings, message text |
| `--text-secondary` | `#A3A9AE` | Nav labels, timestamps |
| `--text-muted` | `#6B7075` | Placeholder text, disabled |
| `--accent-cyan` | `#1FB6B6` | Primary accent -- buttons, active states, links |
| `--accent-cyan-hover` | `#3BF4E4` | Hover/lighter variant (matches landing page's seafoam) |

### Light theme

| Token | Value | Use |
|---|---|---|
| `--bg-base` | `#FAF8F4` | App background (cream, not pure white) |
| `--bg-elevated` | `#FFFFFF` | Sidebar, cards |
| `--bg-elevated-2` | `#F1ECE2` | Nested cards, input bar |
| `--border-subtle` | `#E4DFD3` | Card/sidebar borders |
| `--text-primary` | `#1A1A18` | Headings, message text |
| `--text-secondary` | `#5C5A54` | Nav labels, timestamps |
| `--text-muted` | `#8A877E` | Placeholder text, disabled |
| `--accent-cyan` | `#0E8A8A` | Primary accent -- **darker than dark mode's**, see below |
| `--accent-cyan-hover` | `#0BA3A3` | Hover/lighter variant |

**Why light mode's cyan is a different value, not just the same hex:** `#1FB6B6` reads clearly against near-black but loses contrast against a cream background -- text or icons in that exact color on `#FAF8F4` won't pass accessible contrast. `#0E8A8A` is the same hue, deepened until it holds up on a light background. Solid-fill buttons (white text on a cyan fill) can still use the brighter value in either theme, since contrast there comes from the text color, not the accent itself.

### Reserved -- both themes, same values

| Token | Value | Rule |
|---|---|---|
| `--alert-amber` | `#F5A623` | **Real hazard alerts only** -- never decorative |
| `--alert-red` | `#E5484D` | **Real hazard alerts only** -- never decorative |

This is the same rule from the landing page work: if amber or red shows up anywhere that isn't an actual advisory, the one color that's supposed to mean "pay attention" stops meaning anything.

---

## 3. Typography

Reused directly from the landing page -- no third type system for the core app:

- **Headings:** Plus Jakarta Sans (600/700)
- **Body / UI text:** Inter (400/500/600)
- **Telemetry / status labels:** JetBrains Mono (500/700), uppercase, tracked
- The landing page's Syne display face and Pinyon Script accent stay on the landing page -- they're too loud for a text-dense chat surface used for long stretches.

---

## 4. Layout pattern

Reverse-engineered from the three references, since all three converge on the same shape:

```
â"Œâ"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"¬â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"
â"‚  Sidebar    â"‚  Main content        [toggle]â"‚
â"‚             â"‚                               â"‚
â"‚  + New chat â"‚      centered greeting        â"‚
â"‚             â"‚      "Hey, [name]."           â"‚
â"‚  â"€ nav â"€    â"‚                               â"‚
â"‚  Alerts     â"‚   â"Œâ"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"    â"‚
â"‚             â"‚   â"‚  pill input bar      â"‚    â"‚
â"‚  â"€ recent â"€ â"‚   â"‚  + attach  mic  send  â"‚    â"‚
â"‚  chat 1     â"‚   â""â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"˜    â"‚
â"‚  chat 2     â"‚                               â"‚
â"‚  chat 3     â"‚                               â"‚
â"‚             â"‚                               â"‚
â"‚  â"€ profile â"€â"‚                               â"‚
â""â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"´â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"˜
```

- **Sidebar:** New chat action pinned at top, then nav items (matches your `/chat`, `/alerts`, `/settings` routes), then the scrollable recent-conversations list, then the user profile pinned at the bottom -- same skeleton as all three references.
- **Main area, empty state:** centered greeting personalized with the user's name, pill-shaped input bar below it -- directly matching Gemini's "What's next, [name]?" and Claude's "Evening, how are things?" pattern.
- **Main area, active conversation:** greeting disappears, message thread fills the space top-down, input bar stays pinned at the bottom.
- **Theme toggle:** fixed top-right of the main content area -- see Â§6.

---

## 5. Core components

- **Input bar:** pill-shaped, `--bg-elevated-2` background, `+` attach icon left, mic icon right (Groq Whisper hook-in point), send button appears once there's text. Matches the shape in all three references.
- **Message bubbles:** user messages right-aligned on `--bg-elevated-2`; ORCA's responses left-aligned, no bubble background -- just text on the page background, same convention Claude and ChatGPT both use, which keeps long responses from feeling boxed in.
- **Inline rich cards:** map snippets, advisory cards, and (per Bklit UI) any data charts render as bento-style cards inside the response, `--bg-elevated` background, `--border-subtle` border, glassmorphism blur reserved for cards showing genuinely live data.
- **Sidebar nav item (active state):** `--accent-cyan` icon + text, subtle `--bg-elevated-2` pill background -- same treatment Gemini gives "New chat" when selected.

---

## 6. Theme toggle

- **Placement:** fixed top-right corner of the main content area, always visible, independent of scroll.
- **Form:** a switch (sun/moon), not a plain icon button -- a switch communicates "this is a persistent setting," where an icon button reads more like a one-off action.
- **Persistence:** store the choice (localStorage or the user's Supabase profile, given accounts already exist) so it holds across sessions rather than resetting on every visit.
- **Default:** dark, matching the landing page -- but respect the OS-level `prefers-color-scheme` on first visit before a user has picked anything, rather than forcing dark on everyone.


---

## 8. Light Mode -- Neumorphism (Soft UI) Rendering

**Decision:** The light theme uses Neumorphism (Soft UI) as its rendering technique. Instead of flat cards on a cream background, every surface is *molded from the same cool-grey clay* -- depth comes entirely from dual opposing shadows, not from borders, fills, or color contrast between elements.

This replaces the original flat light-mode token values (`#FAF8F4` cream, `#FFFFFF` cards) with the neumorphic surface system below. The dark theme is **unchanged** -- dark mode keeps its existing token spec from §2.

---

### 8.1 Philosophy

> Elements appear to either extrude from the surface (raised/convex) or be pressed into it (inset/concave). The effect mimics soft matte plastic -- tactile, calm, and physically grounded.

Two rules govern everything:
1. **No borders.** Shadows define all edges. `border: transparent` always.
2. **No `bg-white` for cards.** Cards must match the body background -- they are *part of the surface*, not placed on top of it.

---

### 8.2 Updated Light Theme Color Tokens

> Replaces the §2 light theme table. Dark theme tokens in §2 are unchanged.

| Token | Value | Use |
|---|---|---|
| `--bg-base` | `#E0E5EC` | Page background -- the "cool clay" every element is molded from |
| `--bg-elevated` | `#E0E5EC` | Cards and sidebar -- **same as bg-base** (depth comes from shadows, not fill) |
| `--bg-elevated-2` | `#E0E5EC` | Input bar, nested cards -- same rule |
| `--border-subtle` | `transparent` | Never used -- shadows replace borders |
| `--text-primary` | `#3D4852` | Headings, message text -- dark blue-grey, 7.5:1 contrast ratio (WCAG AAA) |
| `--text-secondary` | `#6B7280` | Nav labels, timestamps -- 4.6:1 contrast ratio (WCAG AA) |
| `--text-muted` | `#A0AEC0` | Placeholder text only |
| `--accent-cyan` | `#0E8A8A` | Primary accent -- unchanged from §2 light token |
| `--accent-cyan-hover` | `#0BA3A3` | Hover -- unchanged |

**Shadow colors (RGBA -- must not be replaced with hex):**

| Variable | Value | Direction |
|---|---|---|
| `--shadow-light` | `rgba(255, 255, 255, 0.55)` | Top-left highlight |
| `--shadow-dark` | `rgba(163, 177, 198, 0.65)` | Bottom-right shadow |

> The specific blue-grey `rgb(163,177,198)` was chosen because it matches the undertone of `#E0E5EC` -- it reads as the surface's own shadow, not a separate element dropped on top.

---

### 8.3 Typography Reconciliation

Neumorphism brings in **DM Sans** for body text (clean, highly legible). This slots alongside the existing type system without conflict:

| Role | Font | Weight |
|---|---|---|
| Display headings | Plus Jakarta Sans (existing) | 700-800 |
| UI headings | Plus Jakarta Sans (existing) | 600-700 |
| Body / UI text | **DM Sans** (new for light mode) | 400-500 |
| Telemetry labels | JetBrains Mono (existing) | 500-700, uppercase |

DM Sans replaces Inter as body font *in light mode only*. Dark mode keeps Inter.

---

### 8.4 Shadow Scale

Five named levels -- use these class names consistently, never mix arbitrary shadow values:

**`shadow-neu-extruded`** -- Default resting state for all raised elements:
```css
box-shadow: 9px 9px 16px rgba(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5);
```

**`shadow-neu-extruded-hover`** -- Hover / lifted state:
```css
box-shadow: 12px 12px 20px rgba(163,177,198,0.7), -12px -12px 20px rgba(255,255,255,0.6);
```

**`shadow-neu-extruded-sm`** -- Small elements (nav pills, tags, chips):
```css
box-shadow: 5px 5px 10px rgba(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5);
```

**`shadow-neu-inset`** -- Standard pressed / well state:
```css
box-shadow: inset 6px 6px 10px rgba(163,177,198,0.6), inset -6px -6px 10px rgba(255,255,255,0.5);
```

**`shadow-neu-inset-deep`** -- Input fields, icon wells, active/focused states:
```css
box-shadow: inset 10px 10px 20px rgba(163,177,198,0.7), inset -10px -10px 20px rgba(255,255,255,0.6);
```

**Tailwind custom shadows to add to `tailwind.config.ts`:**
```ts
boxShadow: {
  'neu-extruded':       '9px 9px 16px rgba(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)',
  'neu-extruded-hover': '12px 12px 20px rgba(163,177,198,0.7), -12px -12px 20px rgba(255,255,255,0.6)',
  'neu-extruded-sm':    '5px 5px 10px rgba(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)',
  'neu-inset':          'inset 6px 6px 10px rgba(163,177,198,0.6), inset -6px -6px 10px rgba(255,255,255,0.5)',
  'neu-inset-deep':     'inset 10px 10px 20px rgba(163,177,198,0.7), inset -10px -10px 20px rgba(255,255,255,0.6)',
}
```

---

### 8.5 Radius Rules (Light Mode)

| Element | Radius | Tailwind |
|---|---|---|
| Cards, modals, sidebar | `32px` | `rounded-[32px]` |
| Buttons, inputs, pills | `16px` | `rounded-2xl` |
| Icon wells, nested elements | `12px` | `rounded-xl` |
| Toggle switches, avatars | `9999px` | `rounded-full` |

---

### 8.6 Component Behaviour in Light Mode

#### Cards (response cards, alert cards, settings panels)
- Background: `#E0E5EC` -- same as page
- Shadow: `shadow-neu-extruded` at rest
- Hover: `shadow-neu-extruded-hover` + `translate-y-[-2px]` (Framer Motion)
- Corner radius: `rounded-[32px]`
- **No border.** Shadows define the edge.

#### Input Bar
- Background: `#E0E5EC`
- Default: `shadow-neu-inset`
- Focus: `shadow-neu-inset-deep` + `ring-2 ring-[#0E8A8A] ring-offset-2 ring-offset-[#E0E5EC]`
- Corner radius: `rounded-2xl`

#### Buttons -- Primary (cyan fill)
- Background: `#0E8A8A` fill, white text
- Shadow: `shadow-neu-extruded-sm` at rest
- Hover: `translate-y-[-1px]` + `shadow-neu-extruded`
- Active/press: `translate-y-[0.5px]` + `shadow-neu-inset`
- Corner radius: `rounded-2xl`

#### Buttons -- Secondary (surface)
- Background: `#E0E5EC` -- matches page
- Shadow: `shadow-neu-extruded-sm` at rest
- Hover/active: same as primary button pattern but without fill

#### Nav Items (Sidebar)
- Default: no shadow (flush with sidebar surface)
- Active/selected: `shadow-neu-inset` pill + `--accent-cyan` icon + label
- Hover: `shadow-neu-extruded-sm`

#### Icon Wells (inside cards)
- Always: `shadow-neu-inset-deep` -- makes them look "drilled" into the card
- Corner radius: `rounded-xl`

#### Suggested Question Chips (empty state)
- Background: `#E0E5EC`
- Shadow: `shadow-neu-extruded-sm`
- Hover: `shadow-neu-extruded` + `translate-y-[-1px]`

---

### 8.7 Animation & Micro-interactions (Light Mode)

| Interaction | Transform | Shadow change | Duration |
|---|---|---|---|
| Card hover | `translateY(-2px)` | extruded -> extruded-hover | 300ms ease-out |
| Button hover | `translateY(-1px)` | extruded-sm -> extruded | 300ms ease-out |
| Button press | `translateY(0.5px)` | extruded -> inset | 150ms ease-out |
| Input focus | none | inset -> inset-deep | 200ms ease-out |
| Nav item select | none | none -> inset | 200ms ease-out |

Only `transform` and `box-shadow` animate -- never `background-color` (the whole point is that everything is already the same color).

---

### 8.8 Anti-Patterns (Light Mode -- Do Not Do)

- ❌ **Hard hex shadows** -- `#A3B1C6` as shadow color. Must use `rgba(163,177,198,0.6)` for blending.
- ❌ **`bg-white` cards** -- Cards must be `#E0E5EC`, not white. White destroys the same-surface illusion.
- ❌ **Borders on any element** -- `border` is always `transparent`. Shadows do this job.
- ❌ **`rounded-lg` (8px) or less** -- Minimum `rounded-2xl` (16px) for all interactive elements.
- ❌ **Text colors below WCAG AA** -- Never use `#A0AEC0` or lighter for body copy. `#6B7280` minimum.
- ❌ **Mixing neumorphism and glassmorphism in light mode** -- Glassmorphism (`backdrop-blur` + semi-transparent) is dark-mode-only (live data cards). In light mode, use neumorphic depth instead.

---

### 8.9 Dark Mode Reminder

Dark mode (`--bg-base: #0E1113`) keeps its existing token spec from §2 -- glassmorphism on live data surfaces, standard flat elevation on the rest. **Neumorphism is light mode only.** The `#0E1113` background is too dark for the dual-shadow technique to read cleanly.

---

## 9. Rules to Keep (Updated)

- Cyan means "interactive/primary" -- don't spend it on decoration.
- Alert amber/red are reserved, full stop -- §2.
- Light and dark are the same design, not two different ones -- same layout, same component structure, different rendering technique (neumorphism in light, existing dark token spec in dark).
- In light mode: shadows replace borders everywhere. If you are reaching for `border`, stop and use `shadow-neu-*` instead.
- Neumorphic shadows use `rgba`, never solid hex. This is not optional -- solid shadows break the blending effect.
