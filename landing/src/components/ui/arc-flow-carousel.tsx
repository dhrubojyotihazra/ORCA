// Built using Hyperiux Vault: https://vault.hyperiux.com
// Adapted for ORCA with responsive zoom-safe layout, dark ocean design system, and stable initial mount.
"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { gsap } from "gsap";

const DEFAULT_IMAGES = [
  "/images/pipelines/pipeline-1-eo-ingestion.jpg",
  "/images/pipelines/pipeline-2-agent-mesh.jpg",
  "/images/pipelines/pipeline-3-pfz-reasoning.jpg",
  "/images/pipelines/pipeline-4-squall-engine.jpg",
  "/images/pipelines/pipeline-5-imbl-geofence.jpg",
  "/images/pipelines/pipeline-6-indic-synthesis.jpg",
  "/images/pipelines/pipeline-7-evidence-provenance.jpg",
];

const DEFAULT_META = [
  { alt: "Automated EO Ingestion", title: "Automated EO Ingestion", label: "MOSDAC & INCOIS", description: "Continuous retrieval of Oceansat-3 SST, Chlorophyll-a, and ERDDAP PFZ bulletins." },
  { alt: "LangGraph Multi-Agent Mesh", title: "LangGraph Agent Mesh", label: "Cyclic Orchestration", description: "Planner Agent decomposes queries, routing subtasks to specialized ocean, weather, and risk agents." },
  { alt: "Ocean & PFZ Reasoning", title: "Ocean & PFZ Reasoning", label: "Marine Intelligence", description: "Spatial-temporal correlation of thermal fronts and chlorophyll convergence for fishing advisories." },
  { alt: "Marine Hazard Engine", title: "Marine Hazard Engine", label: "Extreme Weather", description: "Continuous monitoring of wave heights, squall alerts, and cyclone trajectory forecasts." },
  { alt: "IMBL Geofencing Protocol", title: "IMBL Geofencing", label: "Maritime Compliance", description: "Autonomous boundary detection against International Maritime Boundary Lines and MPAs." },
  { alt: "Multilingual Indic Synthesis", title: "Multilingual Indic NLP", label: "5 Regional Languages", description: "Synthesizer Agent delivers localized advisories in Tamil, Bengali, Malayalam, Hindi, and English." },
  { alt: "Verifiable Provenance", title: "Verifiable Provenance", label: "Grounded Attribution", description: "Every safety advisory cites specific MOSDAC satellite tiles and sensor timestamps." },
];

export interface SmoothSliderItem {
  src: string;
  alt?: string;
  label?: string;
  title?: string;
  description?: string;
}

const defaultItems: SmoothSliderItem[] = DEFAULT_META.map((m, i) => ({
  src: DEFAULT_IMAGES[i % DEFAULT_IMAGES.length],
  ...m,
}));

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") return () => {};
      const mediaQueryList = window.matchMedia("(prefers-reduced-motion: reduce)");
      mediaQueryList.addEventListener("change", callback);
      return () => mediaQueryList.removeEventListener("change", callback);
    },
    () => (typeof window === "undefined" ? false : window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false),
    () => false
  );
}

export interface ArcFlowCarouselCompProps {
  items?: SmoothSliderItem[];
  /** Circle radius as a multiple of the container width. Bigger = flatter arc. */
  radiusRatio?: number;
  /** Card width as a fraction of the container width (clamped by min/max). */
  cardRatio?: number;
  minCardWidth?: number;
  maxCardWidth?: number;
  /** Card width / height. 0.62 ≈ typical card proportions. */
  cardAspect?: number;
  /** 0 = cards touch edge to edge, 0.3 = overlap by 30%, negative = a gap between them. */
  overlap?: number;
  /** Vertical position of the leading card's centre, as a fraction of height. */
  arcOffset?: number;
  /** Higher = the fan catches up to the pointer faster. 4–9 feels natural. */
  smoothing?: number;
  /** How far the fan travels per pixel dragged. 1 = 1:1 at the centre card, higher = more travel per drag. */
  dragSensitivity?: number;
  /** Flick distance multiplier after release. */
  momentum?: number;
  /** Snap to the nearest card once the flick settles. */
  snap?: boolean;
  /** How wheel / trackpad input is consumed. */
  wheelControl?: "horizontal" | "both" | "off";
  /** Constant idle drift in rad/s. Set to 0 to keep completely stable until dragged. */
  autoRotateSpeed?: number;
  /** Pause the idle drift while a pointer hovers the carousel. */
  pauseOnHover?: boolean;
  /** Shared hex color used for both the page background and the wheel surface. */
  surfaceColor?: string;
  className?: string;
}

const DRAG_SMOOTHING = 14;
const VELOCITY_WINDOW = 90;
const MAX_FLICK = 9;
/** How much slower a card follows per unit distance from the active one. 0 = no lag, 1 = edge cards barely move. */
const STAGGER_LAG_STRENGTH = 0.85;
/** Floor on a card's follow rate, as a fraction of the base rate, so far cards never stall. */
const MIN_FOLLOW_FRACTION = 0.6;

export default function ArcFlowCarousel({
  items = defaultItems,
  radiusRatio = 0.85,
  cardRatio = 0.21,
  minCardWidth = 140,
  maxCardWidth = 320,
  cardAspect = 0.62,
  overlap = -0.04,
  arcOffset = 0.5,
  smoothing = 5.5,
  dragSensitivity = 1.2,
  momentum = 1,
  snap = false,
  wheelControl = "horizontal",
  autoRotateSpeed = 0,
  pauseOnHover = true,
  surfaceColor = "#060b13",
  className = "",
}: ArcFlowCarouselCompProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const discRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const innerRefs = useRef<(HTMLDivElement | null)[]>([]);

  const reduceMotion = usePrefersReducedMotion();

  // How many card slots the wheel needs so the wrap point stays off screen.
  const [slotCount, setSlotCount] = useState(() => Math.max(items.length, 12));

  // Live geometry, recomputed on resize. Read by the ticker, never by render.
  const layoutRef = useRef({
    radius: 900,
    cardWidth: 220,
    cardHeight: 330,
    step: 0.14,
    centerX: 0,
    centerY: 0,
    maxAngle: 1,
    isMeasured: false,
  });

  // Wheel position in radians. `current` chases `target` every frame.
  const currentRef = useRef(0);
  const targetRef = useRef(0);
  // Each card's own eased position — chases `current`, not `target`.
  const slotOffsetsRef = useRef<number[]>([]);
  const draggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const lastXRef = useRef(0);
  const samplesRef = useRef<{ t: number; value: number }[]>([]);
  const wheelSettleRef = useRef(0);
  const hoveredRef = useRef(false);

  const total = items.length;

  const measure = useCallback(() => {
    const stage = stageRef.current;
    if (!stage || !total) return;

    const width = stage.offsetWidth;
    const height = stage.offsetHeight;
    if (width <= 0 || height <= 0) return;

    const cardWidth = gsap.utils.clamp(minCardWidth, maxCardWidth, width * cardRatio);
    const cardHeight = cardWidth / cardAspect;
    const radius = Math.max(width * radiusRatio, cardWidth * 4.2);

    // Arc length between two card centres -> angle between them.
    const step = (cardWidth * (1 - gsap.utils.clamp(-0.5, 0.85, overlap))) / radius;

    // Card centres ride the circle; `arcOffset` places the leading one.
    const centerX = width / 2;
    const centerY = height * arcOffset + radius;

    // The disc rim clears the card bottoms by a hair, reading as a ground line.
    const discRadius = radius - cardHeight * 0.66;

    // Angle of the card that sits on the stage's left edge, mirrored on the right.
    const edgeX = -cardWidth;
    const edgeY = height * arcOffset;
    const maxAngle = Math.atan2(Math.abs(edgeX - centerX), centerY - edgeY) + step;

    layoutRef.current = {
      radius,
      cardWidth,
      cardHeight,
      step,
      centerX,
      centerY,
      maxAngle,
      isMeasured: true,
    };

    const disc = discRef.current;
    if (disc) {
      disc.style.width = `${discRadius * 2}px`;
      disc.style.height = `${discRadius * 2}px`;
      disc.style.left = `${centerX}px`;
      disc.style.top = `${centerY - discRadius}px`;
    }

    // Enough slots that the wrap seam is always past `maxAngle`.
    const needed = Math.ceil((maxAngle * 2) / step) + 2;
    setSlotCount((prev) => {
      const next = Math.max(total, Math.ceil(needed / total) * total);
      return next === prev ? prev : next;
    });
  }, [arcOffset, cardAspect, cardRatio, maxCardWidth, minCardWidth, overlap, radiusRatio, total]);

  useIsomorphicLayoutEffect(() => {
    measure();

    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [measure]);

  // Render loop: one exponential lerp, then a transform per card.
  useEffect(() => {
    if (!total) return;

    // GSAP passes (time: seconds, deltaTime: milliseconds, frame: number)
    // CRITICAL: dt MUST be in seconds from deltaTime, NOT time!
    const draw = (_time: number, deltaTime: number) => {
      if (!layoutRef.current.isMeasured || layoutRef.current.centerX === 0) return;

      const dt = gsap.utils.clamp(0.001, 0.05, (deltaTime || 16.66) / 1000);
      const { radius, cardWidth, cardHeight, step, centerX, centerY, maxAngle } = layoutRef.current;
      const span = slotCount * step;
      const half = span / 2;
      const rate = draggingRef.current ? DRAG_SMOOTHING : reduceMotion ? DRAG_SMOOTHING : smoothing;
      const useUnifiedOffset = reduceMotion;

      const slotOffsets = slotOffsetsRef.current;
      if (slotOffsets.length !== slotCount) {
        slotOffsetsRef.current = Array.from({ length: slotCount }, () => currentRef.current);
      }

      // Idle drift — only if autoRotateSpeed is configured and user is not interacting.
      if (!draggingRef.current && autoRotateSpeed !== 0 && (!hoveredRef.current || !pauseOnHover)) {
        targetRef.current += autoRotateSpeed * dt;
      }

      // Wheel decay: gently ease back to 0 once trackpad input stops.
      if (!draggingRef.current && wheelSettleRef.current !== 0) {
        wheelSettleRef.current = gsap.utils.interpolate(
          wheelSettleRef.current,
          0,
          1 - Math.exp(-DRAG_SMOOTHING * dt)
        );
        if (Math.abs(wheelSettleRef.current) < 0.0001) wheelSettleRef.current = 0;
      }

      // Main wheel position chase.
      const prevCurrent = currentRef.current;
      currentRef.current = gsap.utils.interpolate(
        currentRef.current,
        targetRef.current,
        1 - Math.exp(-rate * dt)
      );

      // Snap to nearest card once the wheel has almost stopped moving.
      if (snap && !draggingRef.current && autoRotateSpeed === 0) {
        const speed = Math.abs(currentRef.current - prevCurrent) / Math.max(dt, 0.001);
        if (speed < 0.08) {
          const nearest = Math.round(targetRef.current / step) * step;
          if (Math.abs(targetRef.current - nearest) > 0.0001) {
            targetRef.current = gsap.utils.interpolate(
              targetRef.current,
              nearest,
              1 - Math.exp(-4 * dt)
            );
          }
        }
      }

      // The slot whose card is closest to the apex (angle 0).
      const activeSlot = Math.round(-currentRef.current / step);

      for (let i = 0; i < slotCount; i++) {
        const card = cardRefs.current[i];
        if (!card) continue;

        if (useUnifiedOffset) {
          slotOffsetsRef.current[i] = currentRef.current;
        } else {
          // Distance from the active card in slot units.
          const distFromActive = Math.abs(i - activeSlot);
          // Falloff: each card out gets a smaller fraction of the base follow rate.
          const lagFactor = Math.max(
            MIN_FOLLOW_FRACTION,
            1 / (1 + distFromActive * STAGGER_LAG_STRENGTH)
          );
          const cardRate = rate * lagFactor;
          slotOffsetsRef.current[i] = gsap.utils.interpolate(
            slotOffsetsRef.current[i] ?? currentRef.current,
            currentRef.current,
            1 - Math.exp(-cardRate * dt)
          );
        }

        const cardOffset = slotOffsetsRef.current[i];
        let angle = (i * step + cardOffset) % span;
        if (angle > half) angle -= span;
        if (angle < -half) angle += span;

        // Clip anything that has rotated out of view.
        if (Math.abs(angle) > maxAngle) {
          card.style.visibility = "hidden";
          continue;
        }

        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        const x = centerX + radius * sin;
        const y = centerY - radius * cos;

        // Tangent to the wheel, so cards fan out cleanly.
        const baseAngle = angle;

        card.style.visibility = "";
        card.style.width = `${cardWidth}px`;
        card.style.height = `${cardHeight}px`;
        card.style.transform = `translate3d(${x - cardWidth / 2}px, ${y - cardHeight / 2}px, 0px) rotate(${baseAngle}rad)`;
        card.style.zIndex = `${100 + i}`;

        const inner = innerRefs.current[i];
        if (inner) {
          inner.style.opacity = "1";
          inner.style.transform = "";
        }
      }
    };

    gsap.ticker.add(draw);
    return () => gsap.ticker.remove(draw);
  }, [autoRotateSpeed, pauseOnHover, reduceMotion, slotCount, smoothing, snap, total]);

  // Pointer drag handling: 1:1 follow while held, velocity-projected flick on release.
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    draggingRef.current = true;
    pointerIdRef.current = e.pointerId;
    lastXRef.current = e.clientX;
    samplesRef.current = [{ t: performance.now(), value: targetRef.current }];
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || e.pointerId !== pointerIdRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;

    const { radius } = layoutRef.current;
    // Map screen-space pixels dragged to an arc angle on the wheel.
    const deltaAngle = (dx / radius) * dragSensitivity;
    targetRef.current += deltaAngle;

    // Prune sample queue, keep only recent samples for velocity estimation.
    const now = performance.now();
    samplesRef.current.push({ t: now, value: targetRef.current });
    while (samplesRef.current.length > 0 && now - samplesRef.current[0].t > VELOCITY_WINDOW) {
      samplesRef.current.shift();
    }
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!draggingRef.current || e.pointerId !== pointerIdRef.current) return;
    draggingRef.current = false;
    pointerIdRef.current = null;

    const now = performance.now();
    const recent = samplesRef.current.filter((s) => now - s.t < VELOCITY_WINDOW);
    if (recent.length >= 2) {
      const first = recent[0];
      const last = recent[recent.length - 1];
      const dt = (last.t - first.t) / 1000;
      if (dt > 0.005) {
        const velocity = (last.value - first.value) / dt;
        const flick = gsap.utils.clamp(-MAX_FLICK, MAX_FLICK, velocity * 0.22 * momentum);
        targetRef.current += flick;
      }
    }
  };

  // Horizontal wheel / trackpad support.
  const onWheel = (e: React.WheelEvent) => {
    if (wheelControl === "off") return;
    let delta = 0;
    if (wheelControl === "horizontal") {
      delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
    } else {
      delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    }
    if (delta === 0) return;

    const { radius } = layoutRef.current;
    const deltaAngle = (-delta / radius) * dragSensitivity * 0.6;
    targetRef.current += deltaAngle;
    wheelSettleRef.current = deltaAngle;
  };

  // Keyboard navigation.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const { step } = layoutRef.current;
    if (e.key === "ArrowLeft") {
      targetRef.current += step;
    } else if (e.key === "ArrowRight") {
      targetRef.current -= step;
    }
  };

  if (!total) return null;

  const slots = Array.from({ length: slotCount }, (_, i) => items[i % total]);

  return (
    <div
      className={`relative overflow-hidden select-none ${className || "h-[620px] w-full"}`}
      style={{ backgroundColor: surfaceColor }}
    >
      <div
        ref={stageRef}
        tabIndex={0}
        role="region"
        aria-label="Draggable image carousel"
        className="absolute inset-0 cursor-grab active:cursor-grabbing outline-none"
        style={{ touchAction: "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={onWheel}
        onKeyDown={onKeyDown}
        onPointerEnter={() => {
          hoveredRef.current = true;
        }}
        onPointerLeave={() => {
          hoveredRef.current = false;
        }}
      >
        {/* Disc Rim hidden */}
        <div
          ref={discRef}
          aria-hidden
          className="hidden"
        />

        {/* Carousel Cards */}
        {slots.map((item, i) => (
          <div
            key={i}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="group absolute top-0 left-0 will-change-transform"
            style={{ visibility: "hidden" }}
          >
            <div
              ref={(el) => {
                innerRefs.current[i] = el;
              }}
              className="relative h-full w-full overflow-hidden rounded-2xl bg-[#0a121e] border border-white/10 group-hover:border-teal-400/50 transition-all duration-300 shadow-[0_20px_45px_-12px_rgba(0,0,0,0.85)] group-hover:shadow-[0_25px_50px_-10px_rgba(45,212,191,0.22)]"
            >
              {/* Card Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={item.alt ?? `Slide ${(i % total) + 1}`}
                draggable={false}
                className="pointer-events-none block h-full w-full object-cover select-none transition-transform duration-700 ease-out group-hover:scale-105 brightness-[0.85] group-hover:brightness-100"
              />

              {/* Ambient Dark Gradient for clean contrast */}
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#060b13]/95 via-[#060b13]/40 to-transparent transition-opacity duration-300"
              />

              {/* Top Tag & Index Badge */}
              <div className="absolute top-2.5 left-2.5 right-2.5 sm:top-3.5 sm:left-3.5 sm:right-3.5 flex items-center justify-between pointer-events-none z-10">
                {item.label ? (
                  <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-mono font-bold tracking-wider text-teal-300 uppercase bg-[#060b13]/90 backdrop-blur-md border border-teal-500/35 shadow-sm">
                    {item.label}
                  </span>
                ) : <span />}
                <span className="font-mono text-[9px] sm:text-[10px] text-white/50 px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-sm">
                  {String((i % total) + 1).padStart(2, "0")}
                </span>
              </div>

              {/* Bottom Content: Title */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 sm:p-5 text-white z-10">
                {item.title ? (
                  <h3 className="text-sm sm:text-base lg:text-lg font-bold font-heading text-white tracking-tight leading-snug group-hover:text-teal-300 transition-colors duration-200">
                    {item.title}
                  </h3>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
