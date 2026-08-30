'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { GlassFilterDefs } from '@/components/GlassFilterDefs';
import { OceanGlobeCard } from '@/components/OceanGlobeCard';
import { FishyButton } from '@/components/ui/fishy-button';

interface TrailPoint {
  x: number;
  y: number;
  r: number;
  alpha: number;
  seed: number;
}

const TRAIL_MAX_POINTS = 60;
const TRAIL_HEAD_R = 140;
const TRAIL_NOISE_AMP = 44;
const TRAIL_BLOB_PTS = 24;
const TRAIL_FADE_SPEED = 0.92;
const TRAIL_SAMPLE_DIST = 8;

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: EASE, delay },
});

// Draw an image into a canvas using `object-fit: contain` math, centered.
function drawContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number
) {
  if (!img.naturalWidth || !img.naturalHeight) return;
  const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = (w - dw) / 2;
  const dy = (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

export function HeroSection() {
  const stageRef = useRef<HTMLDivElement>(null);
  const orcaStackRef = useRef<HTMLDivElement>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement>(null);

  const frontImgRef = useRef<HTMLImageElement | null>(null);
  const revealImgRef = useRef<HTMLImageElement | null>(null);

  const [isHovering, setIsHovering] = useState(false);
  const mousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const headRadius = useRef(0);
  const lastSample = useRef<{ x: number; y: number }>({ x: -999, y: -999 });
  const points = useRef<TrailPoint[]>([]);
  const timeRef = useRef(0);
  const animFrameId = useRef<number>(0);

  // 24-point organic morph blob generator
  const drawMorphBlob = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    t: number,
    seed: number
  ) => {
    if (r < 2) return;
    const pts: { x: number; y: number }[] = [];

    for (let i = 0; i < TRAIL_BLOB_PTS; i++) {
      const angle = (i / TRAIL_BLOB_PTS) * Math.PI * 2;
      const n1 = Math.sin(angle * 3 + t * 1.4 + seed) * 0.45;
      const n2 = Math.sin(angle * 5 - t * 0.9 + seed * 2.3) * 0.3;
      const n3 = Math.cos(angle * 2 + t * 1.8 + seed * 0.7) * 0.25;
      const noise = (n1 + n2 + n3) * TRAIL_NOISE_AMP * (r / TRAIL_HEAD_R);
      const rad = r + noise;
      pts.push({
        x: cx + Math.cos(angle) * rad,
        y: cy + Math.sin(angle) * rad,
      });
    }

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < pts.length; i++) {
      const p0 = pts[i];
      const p1 = pts[(i + 1) % pts.length];
      const mx = (p0.x + p1.x) / 2;
      const my = (p0.y + p1.y) / 2;
      ctx.quadraticCurveTo(p0.x, p0.y, mx, my);
    }
    ctx.closePath();
    ctx.fill();
  };

  useEffect(() => {
    // Preload the two orca images once.
    const front = new Image();
    front.src = '/images/orca-front.png';
    frontImgRef.current = front;

    const reveal = new Image();
    reveal.src = '/images/orca-reveal.png';
    revealImgRef.current = reveal;
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    const stack = orcaStackRef.current;
    const canvas = compositeCanvasRef.current;

    if (!stage || !stack || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = stack.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mousePos.current = { x, y };
      setIsHovering(true);
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => {
      setIsHovering(false);
      lastSample.current = { x: -999, y: -999 };
    };

    stage.addEventListener('mousemove', handleMouseMove);
    stage.addEventListener('mouseenter', handleMouseEnter);
    stage.addEventListener('mouseleave', handleMouseLeave);

    const loop = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;

      const fRect = stack.getBoundingClientRect();
      const w = Math.max(1, Math.floor(fRect.width));
      const h = Math.max(1, Math.floor(fRect.height));

      // Account for device pixel ratio so the composite stays crisp,
      // but cap it — this is drawn every frame so we don't want to
      // over-pay for retina density on top of the extra draw calls.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pw = Math.round(w * dpr);
      const ph = Math.round(h * dpr);
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const targetR = isHovering ? TRAIL_HEAD_R : 0;
      headRadius.current += (targetR - headRadius.current) * (isHovering ? 0.14 : 0.04);

      if (isHovering && headRadius.current > 5) {
        const dx = mousePos.current.x - lastSample.current.x;
        const dy = mousePos.current.y - lastSample.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > TRAIL_SAMPLE_DIST) {
          points.current.unshift({
            x: mousePos.current.x,
            y: mousePos.current.y,
            r: headRadius.current,
            alpha: 1.0,
            seed: Math.random() * 100,
          });
          if (points.current.length > TRAIL_MAX_POINTS) {
            points.current.pop();
          }
          lastSample.current = { ...mousePos.current };
        }
      }

      for (let i = points.current.length - 1; i >= 0; i--) {
        const p = points.current[i];
        p.alpha *= TRAIL_FADE_SPEED;
        p.r *= 0.995;
        if (p.alpha < 0.01) {
          points.current.splice(i, 1);
        }
      }

      // ── Single-canvas composite. No CSS masks, no toDataURL() round-trips. ──
      ctx.clearRect(0, 0, w, h);

      const frontImg = frontImgRef.current;
      const revealImg = revealImgRef.current;

      // 1. Draw the front (cybernetic) orca normally.
      if (frontImg && frontImg.complete) {
        drawContain(ctx, frontImg, w, h);
      }

      // 2. Punch holes where the mouse trail is, straight on the GPU —
      //    no serialization, just a composite-mode draw.
      if (points.current.length || (isHovering && headRadius.current > 3)) {
        ctx.globalCompositeOperation = 'destination-out';
        if (isHovering && headRadius.current > 3) {
          drawMorphBlob(ctx, mousePos.current.x, mousePos.current.y, headRadius.current, t, 0);
        }
        for (const p of points.current) {
          ctx.globalAlpha = p.alpha;
          drawMorphBlob(ctx, p.x, p.y, p.r, t, p.seed);
        }
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';

        // 3. Fill those holes with the holographic reveal orca, placed
        //    *behind* what's left of the front layer via destination-over
        //    — it only becomes visible exactly where we cut a hole above.
        if (revealImg && revealImg.complete) {
          ctx.globalCompositeOperation = 'destination-over';
          drawContain(ctx, revealImg, w, h);
          ctx.globalCompositeOperation = 'source-over';
        }
      }

      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameId.current);
      stage.removeEventListener('mousemove', handleMouseMove);
      stage.removeEventListener('mouseenter', handleMouseEnter);
      stage.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isHovering]);

  return (
    <section
      id="hero"
      ref={stageRef}
      className="relative min-h-screen flex flex-col justify-between overflow-hidden cursor-crosshair pt-6 pb-6 px-5 sm:px-8 md:px-12 z-10"
    >
      <GlassFilterDefs />

      {/* ── Center Stage: Giant Wordmark + Dual ORCA Morph Composite ── */}
      <div className="relative pt-0 pb-0 flex flex-col items-center justify-center min-h-[320px] md:min-h-[400px]">

        {/* 1. Giant Background Wordmark: ORCA */}
        <div
          className="absolute inset-0 flex items-center justify-center font-display text-[33vw] md:text-[28.5vw] lg:text-[29vw] font-bold tracking-tight leading-none pointer-events-none select-none z-10"
          style={{
            color: 'transparent',
            WebkitTextStroke: '2.5px rgba(255, 255, 255, 0.22)',
            textShadow: '0 0 100px rgba(31, 182, 182, 0.3)',
          }}
        >
          <span className="text-white drop-shadow-2xl">OR</span>
          <span
            style={{
              background: 'linear-gradient(180deg, #1FB6B6 0%, #3bf4e4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            CA
          </span>
        </div>

        {/* 2. Single composited canvas replaces the old dual-<img> + CSS mask stack */}
        <div
          ref={orcaStackRef}
          className="relative z-20 w-[82vw] max-w-[420px] md:max-w-[520px] aspect-square flex items-center justify-center pointer-events-none select-none"
        >
          <canvas
            ref={compositeCanvasRef}
            className="absolute inset-0 w-full h-full"
            style={{
              filter:
                'drop-shadow(0 20px 50px rgba(0,0,0,0.85)) drop-shadow(0 0 60px rgba(31,182,182,0.55))',
            }}
          />
        </div>
      </div>

      {/* ── Bottom Section: Headline, Chamfered CTA + Liquid Glass Card ─── */}
      <div className="relative z-30 flex flex-col lg:flex-row items-end justify-between gap-8 mt-2">

        {/* Left Column: Eyebrow badge + Headline + Subhead + Chamfered Button */}
        <div className="max-w-xl">
          <motion.div {...fadeUp(0.15)}>
            <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.15em] px-3 py-1.5 border-l-2 border-white bg-white/15 backdrop-blur-md text-white">
              ISRO SIH26176 · Dept. of Space · Team DeTABIS
            </span>
          </motion.div>

          <motion.h1
            className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.04] tracking-tight text-white drop-shadow-xl"
            {...fadeUp(0.28)}
          >
            Where the{' '}
            <span className="font-script text-teal-300 font-normal lowercase tracking-normal text-5xl sm:text-6xl lg:text-7xl inline-block px-1">
              ocean
            </span>
            <br />
            Answers Back
          </motion.h1>

          <motion.p
            className="mt-4 max-w-lg text-base sm:text-lg leading-relaxed text-white/75 drop-shadow-md"
            {...fadeUp(0.42)}
          >
            ORCA synthesizes live ISRO MOSDAC Earth Observation feeds, ocean sensors, and INCOIS bulletins into explainable conversational recommendations before departure.
          </motion.p>

          {/* Oceanic FishyButton CTA */}
          <motion.div className="mt-7" {...fadeUp(0.54)}>
            <FishyButton
              className="button--2"
              width="230px"
              height="52px"
              borderRadius="16px"
              fishSpeed="2.0s"
              onClick={() => {
                const el = document.getElementById('demo');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span>TALK TO ORCA</span>
              <ChevronRight className="w-4 h-4 text-teal-300 inline-block ml-1" />
            </FishyButton>
          </motion.div>
        </div>

        {/* Right Column: Interactive 3D Cobe Globe with Key Coastal Fishing Grounds */}
        <div id="demo" className="flex-shrink-0 w-full lg:w-auto flex justify-center lg:justify-end scroll-mt-24">
          <OceanGlobeCard />
        </div>

      </div>
    </section>
  );
}
