"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";

export type GhostMood = "neutral" | "happy" | "sad" | "excited" | "angry" | "anxious";
export type GhostAnimationStyle = "smooth" | "classic";

export interface MoodConfig {
  lEyeRot: number;
  rEyeRot: number;
  eyeScale: number;
  mouthW: number;
  mouthY: number;
  mouthCurveT: number;
  mouthCurveB: number;
  mouthOp: number;
  browY: number;
  browAngle: number;
  browCurve: number;
  browOp: number;
}

export const MOOD_STATES: Record<GhostMood, MoodConfig> = {
  neutral: {
    lEyeRot: 0,
    rEyeRot: 0,
    eyeScale: 1,
    mouthW: 10,
    mouthY: 118,
    mouthCurveT: 0,
    mouthCurveB: 0,
    mouthOp: 0,
    browY: 86,
    browAngle: 0,
    browCurve: 0,
    browOp: 0,
  },
  happy: {
    lEyeRot: 0,
    rEyeRot: 0,
    eyeScale: 1,
    mouthW: 22,
    mouthY: 116,
    mouthCurveT: 2,
    mouthCurveB: 14,
    mouthOp: 1,
    browY: 78,
    browAngle: -5,
    browCurve: -4,
    browOp: 1,
  },
  sad: {
    lEyeRot: -12,
    rEyeRot: 12,
    eyeScale: 0.9,
    mouthW: 16,
    mouthY: 122,
    mouthCurveT: -6,
    mouthCurveB: -2,
    mouthOp: 1,
    browY: 84,
    browAngle: -12,
    browCurve: -2,
    browOp: 1,
  },
  excited: {
    lEyeRot: 0,
    rEyeRot: 0,
    eyeScale: 1.15,
    mouthW: 14,
    mouthY: 120,
    mouthCurveT: -10,
    mouthCurveB: 14,
    mouthOp: 1,
    browY: 74,
    browAngle: 0,
    browCurve: -6,
    browOp: 1,
  },
  angry: {
    lEyeRot: 18,
    rEyeRot: -18,
    eyeScale: 0.95,
    mouthW: 14,
    mouthY: 118,
    mouthCurveT: -3,
    mouthCurveB: 1,
    mouthOp: 1,
    browY: 88,
    browAngle: 18,
    browCurve: 2,
    browOp: 1,
  },
  anxious: {
    lEyeRot: 0,
    rEyeRot: 0,
    eyeScale: 0.8,
    mouthW: 12,
    mouthY: 120,
    mouthCurveT: -2,
    mouthCurveB: 2,
    mouthOp: 1,
    browY: 80,
    browAngle: -4,
    browCurve: -1,
    browOp: 1,
  },
};

export interface GhostProps {
  animationStyle?: GhostAnimationStyle;
  mood?: GhostMood;
  colorTop?: string;
  colorMiddle?: string;
  colorBottom?: string;
  colorBackTop?: string;
  colorBackBottom?: string;
  showGlow?: boolean;
  glowColor?: string;
  bodyHeight?: number;
  characterScale?: number;
  floatingSpeed?: number;
  animatingSpeed?: number;
  interactiveEyes?: boolean;
  followGlobalMouse?: boolean;
  enableChat?: boolean;
  quotes?: string[];
  chatBgColor?: string;
  chatTextColor?: string;
  className?: string;
  style?: React.CSSProperties;
  onGhostClick?: (currentQuote: string) => void;
}

export default function InteractiveGhost({
  animationStyle = "smooth",
  mood = "neutral",
  colorTop = "#eaff5e",
  colorMiddle = "#a3e635",
  colorBottom = "#16a34a",
  colorBackTop = "#65a30d",
  colorBackBottom = "#14532d",
  showGlow = true,
  glowColor = "#eaff5e",
  bodyHeight = 170,
  characterScale = 1,
  floatingSpeed = 1,
  animatingSpeed = 1,
  interactiveEyes = true,
  followGlobalMouse = true,
  enableChat = true,
  quotes = [
    "Boo! 👻 Coordinates lost!",
    "404: Even my sonar is puzzled!",
    "I'm a friendly phantom!",
    "You're off the oceanic charts!",
    "Did I scare you? Click me again!",
    "Return to safe shores! 🌊",
  ],
  chatBgColor = "#ffffff",
  chatTextColor = "#0f172a",
  className = "",
  style,
  onGhostClick,
}: GhostProps) {
  const [time, setTime] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Physics refs
  const targetMouse = useRef({ x: 0, y: 0 });
  const currentMouse = useRef({ x: 0, y: 0 });
  const faceState = useRef<MoodConfig>({ ...MOOD_STATES.neutral });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const moodRef = useRef<GhostMood>(mood);

  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-hide chat bubble after 4.5 seconds
  useEffect(() => {
    if (chatOpen) {
      const timer = setTimeout(() => setChatOpen(false), 4500);
      return () => clearTimeout(timer);
    }
  }, [chatOpen, quoteIndex]);

  // Main animation & physics loop
  useEffect(() => {
    let animationFrameId: number;
    const start = Date.now();

    const renderLoop = () => {
      setTime(Date.now() - start);

      // 1. Smooth Mouse Tracking (Lerp)
      const dx = targetMouse.current.x - currentMouse.current.x;
      const dy = targetMouse.current.y - currentMouse.current.y;
      currentMouse.current.x += dx * 0.08;
      currentMouse.current.y += dy * 0.08;

      // 2. Velocity for mouth reaction
      const velocity = Math.sqrt(dx * dx + dy * dy);
      const mouthReaction = Math.min(velocity * 15, 5);

      // 3. Smooth Facial Morphing (Lerp)
      const baseTarget = MOOD_STATES[moodRef.current] || MOOD_STATES.neutral;
      const targetFace: MoodConfig = { ...baseTarget };

      // Apply subtle real-time reaction ONLY to mouth
      if (baseTarget.mouthOp > 0) {
        targetFace.mouthCurveT -= mouthReaction * 0.5;
        targetFace.mouthCurveB += mouthReaction;
      } else if (mouthReaction > 0.5) {
        targetFace.mouthOp = Math.min(0.6, mouthReaction * 0.2);
        targetFace.mouthW = 8;
        targetFace.mouthCurveT = -mouthReaction * 0.5;
        targetFace.mouthCurveB = mouthReaction;
      }

      const currentFace = faceState.current;
      for (const key in targetFace) {
        const k = key as keyof MoodConfig;
        currentFace[k] += (targetFace[k] - currentFace[k]) * 0.12;
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Global & Container mouse move handlers
  useEffect(() => {
    if (!followGlobalMouse || !interactiveEyes) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Normalize distance relative to viewport
      const nx = (e.clientX - centerX) / (window.innerWidth / 2);
      const ny = (e.clientY - centerY) / (window.innerHeight / 2);

      targetMouse.current = {
        x: Math.max(-1.5, Math.min(1.5, nx)),
        y: Math.max(-1.5, Math.min(1.5, ny)),
      };
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    return () => window.removeEventListener("mousemove", handleWindowMouseMove);
  }, [followGlobalMouse, interactiveEyes]);

  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (followGlobalMouse) return; // already handled globally
    if (!interactiveEyes || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    targetMouse.current = { x: x * 2, y: y * 2 };
  };

  const handleMouseLeave = () => {
    if (!followGlobalMouse && interactiveEyes) {
      targetMouse.current = { x: 0, y: 0 };
    }
  };

  const handleGhostClick = () => {
    if (!enableChat || quotes.length === 0) return;
    const nextIdx = chatOpen ? (quoteIndex + 1) % quotes.length : quoteIndex;
    setQuoteIndex(nextIdx);
    setChatOpen(true);
    onGhostClick?.(quotes[nextIdx]);
  };

  const cx = 100;
  const R = 70;
  const baseY = bodyHeight;

  // Generate Body Paths
  const { frontPath, backPath } = useMemo(() => {
    if (animationStyle === "classic") {
      const amp = 14;
      const numWaves = 3;
      const speed = 0.003 * animatingSpeed;
      let fPath = `M ${cx - R} 100 A ${R} ${R} 0 0 1 ${cx + R} 100 `;
      for (let i = 0; i <= 50; i++) {
        const theta = (i / 50) * Math.PI;
        const x = cx + R * Math.cos(theta);
        const y = baseY + Math.sin(theta * numWaves - time * speed) * amp;
        fPath += `L ${x} ${y} `;
      }
      fPath += `Z`;

      let bPath = `M ${cx - R} 100 L ${cx + R} 100 `;
      for (let i = 0; i <= 50; i++) {
        const theta = 2 * Math.PI - (i / 50) * Math.PI;
        const x = cx + R * Math.cos(theta);
        const y = baseY + Math.sin(theta * numWaves - time * speed) * amp;
        bPath += `L ${x} ${y} `;
      }
      bPath += `Z`;
      return { frontPath: fPath, backPath: bPath };
    } else {
      const numPoints = 60;
      const wind = time * 0.002 * animatingSpeed;
      const getWaveY = (x: number, isBack: boolean) => {
        const nx = (x - cx) / R;
        const drape = Math.cos(nx * Math.PI * 0.5) * 12;
        const offset = isBack ? Math.PI * 0.8 : 0;
        const wave1 = Math.sin(nx * 3.14 - wind + offset) * 8;
        const wave2 = Math.sin(nx * 6.28 - wind * 1.5 + offset) * 3;
        const flutter = Math.sin(nx * 12 - wind * 3) * (Math.abs(nx) * 2);
        return baseY + (isBack ? -drape * 0.5 : drape) + wave1 + wave2 + flutter;
      };

      let fPath = `M ${cx - R} 100 A ${R} ${R} 0 0 1 ${cx + R} 100 `;
      for (let i = 0; i <= numPoints; i++) {
        const x = cx + R - (i / numPoints) * (2 * R);
        fPath += `L ${x} ${getWaveY(x, false)} `;
      }
      fPath += `Z`;

      let bPath = `M ${cx - R} 100 L ${cx + R} 100 `;
      for (let i = 0; i <= numPoints; i++) {
        const x = cx - R + (i / numPoints) * (2 * R);
        bPath += `L ${x} ${getWaveY(x, true)} `;
      }
      bPath += `Z`;
      return { frontPath: fPath, backPath: bPath };
    }
  }, [time, baseY, animatingSpeed, animationStyle]);

  // Natural eyelid double-blink
  let blinkScale = 1;
  const blinkCycle = time % 4000;
  if (blinkCycle < 150) {
    blinkScale = Math.max(0.1, 1 - Math.sin((blinkCycle / 150) * Math.PI));
  }

  // Lerped state & offsets
  const fs = faceState.current;
  const mX = currentMouse.current.x;
  const mY = currentMouse.current.y;
  const eyeOffsetX = interactiveEyes ? mX * 16 : 0;
  const eyeOffsetY = interactiveEyes ? mY * 16 : 0;

  // Body sway & floating rotation
  const isClassic = animationStyle === "classic";
  const swayX = isClassic ? 0 : Math.cos(time * 0.0015 * floatingSpeed) * 8;
  const floatY = Math.sin(time * 0.002 * floatingSpeed) * (isClassic ? 8 : 12);
  const bodyRotation = isClassic
    ? 0
    : (interactiveEyes ? mX * 8 : 0) + Math.sin(time * 0.001 * floatingSpeed) * 3;

  // Morphing SVG Facial Paths
  const mouthPath = `M ${100 - fs.mouthW / 2} ${fs.mouthY} Q 100 ${
    fs.mouthY + fs.mouthCurveT
  } ${100 + fs.mouthW / 2} ${fs.mouthY} Q 100 ${fs.mouthY + fs.mouthCurveB} ${
    100 - fs.mouthW / 2
  } ${fs.mouthY} Z`;
  const lBrowPath = `M 70 ${fs.browY} Q 80 ${fs.browY + fs.browCurve} 90 ${fs.browY}`;
  const rBrowPath = `M 110 ${fs.browY} Q 120 ${fs.browY + fs.browCurve} 130 ${fs.browY}`;
  const vbHeight = Math.max(240, bodyHeight + 60);

  // Fallback before mount for SSR consistency
  if (!mounted) {
    return (
      <div
        className={`relative flex items-center justify-center ${className}`}
        style={{ width: "100%", height: "100%", minHeight: "280px", ...style }}
      >
        <div className="size-24 rounded-full bg-cyan-400/20 animate-pulse" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleContainerMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleGhostClick}
      className={`relative select-none flex items-center justify-center ${className}`}
      style={{
        width: "100%",
        height: "100%",
        cursor: enableChat ? "pointer" : "default",
        ...style,
      }}
      title={enableChat ? "Click the ghost to chat!" : undefined}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${characterScale})`,
          transformOrigin: "center center",
        }}
      >
        <svg
          viewBox={`-150 -80 500 ${vbHeight + 120}`}
          style={{
            width: "100%",
            height: "100%",
            maxHeight: "100%",
            overflow: "visible",
          }}
        >
          <defs>
            <linearGradient id="frontGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colorTop} />
              <stop offset="40%" stopColor={colorMiddle} />
              <stop offset="100%" stopColor={colorBottom} />
            </linearGradient>
            <linearGradient id="backGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colorBackTop} />
              <stop offset="100%" stopColor={colorBackBottom} />
            </linearGradient>
            <filter id="glowBlur1" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="25" />
            </filter>
            <filter id="glowBlur2" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="40" />
            </filter>
          </defs>

          <g
            transform={`translate(${swayX}, ${floatY}) rotate(${bodyRotation} 100 ${
              vbHeight / 2
            })`}
          >
            {/* Ambient Multi-Layer Spectral Glow */}
            {showGlow && (
              <g>
                <ellipse
                  cx="100"
                  cy={vbHeight / 2}
                  rx="90"
                  ry="110"
                  fill={glowColor}
                  opacity="0.3"
                  filter="url(#glowBlur1)"
                />
                <ellipse
                  cx="100"
                  cy={vbHeight / 2}
                  rx="130"
                  ry="150"
                  fill={glowColor}
                  opacity="0.2"
                  filter="url(#glowBlur2)"
                />
              </g>
            )}

            {/* Back Cloth Drapery */}
            <path d={backPath} fill="url(#backGrad)" />

            {/* Front Translucent Spectral Body */}
            <path d={frontPath} fill="url(#frontGrad)" />

            {/* Facial Features (Eyes, Brows, Morphing Mouth) */}
            <g style={{ transform: `translate(${eyeOffsetX}px, ${eyeOffsetY}px)` }}>
              {/* Brows */}
              <g opacity={fs.browOp}>
                <path
                  d={lBrowPath}
                  stroke="#000"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                  style={{
                    transformOrigin: `80px ${fs.browY}px`,
                    transform: `rotate(${fs.browAngle}deg)`,
                  }}
                />
                <path
                  d={rBrowPath}
                  stroke="#000"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                  style={{
                    transformOrigin: `120px ${fs.browY}px`,
                    transform: `rotate(${-fs.browAngle}deg)`,
                  }}
                />
              </g>

              {/* Left Eye */}
              <ellipse
                cx={80}
                cy={100}
                rx={8 * fs.eyeScale}
                ry={16 * fs.eyeScale}
                fill="#000"
                style={{
                  transformOrigin: "80px 100px",
                  transform: `rotate(${fs.lEyeRot}deg) scaleY(${blinkScale})`,
                }}
              />

              {/* Right Eye */}
              <ellipse
                cx={120}
                cy={100}
                rx={8 * fs.eyeScale}
                ry={16 * fs.eyeScale}
                fill="#000"
                style={{
                  transformOrigin: "120px 100px",
                  transform: `rotate(${fs.rEyeRot}deg) scaleY(${blinkScale})`,
                }}
              />

              {/* Morphing Mouth */}
              <path d={mouthPath} fill="#000" opacity={fs.mouthOp} />
            </g>

            {/* End facial features */}
          </g>
        </svg>
      </div>

      {/* HTML Speech Bubble Overlay for 100% Reliable Cross-Browser Rendering */}
      {enableChat && quotes.length > 0 && (
        <div
          className={`absolute pointer-events-none transition-all duration-300 z-30 ${
            chatOpen
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-75 translate-y-2 pointer-events-none"
          }`}
          style={{
            top: "8%",
            right: "10%",
            maxWidth: "200px",
          }}
        >
          <div
            className="relative px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-2xl leading-snug select-none border border-black/10 backdrop-blur-sm"
            style={{
              backgroundColor: chatBgColor,
              color: chatTextColor,
            }}
          >
            {/* Speech Tail */}
            <div
              className="absolute -bottom-1.5 left-4 size-3 rotate-45 shadow-sm"
              style={{ backgroundColor: chatBgColor }}
            />
            <span className="relative z-10">{quotes[quoteIndex]}</span>
          </div>
        </div>
      )}
    </div>
  );
}
