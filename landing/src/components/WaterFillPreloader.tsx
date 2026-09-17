'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface WaterFillPreloaderProps {
  /** Total duration of loading in seconds before exit initiates */
  totalLoadTime?: number;
  /** Width of the logo canvas in pixels */
  logoWidth?: number;
  /** Height of the logo canvas in pixels */
  logoHeight?: number;
  /** Background color */
  backgroundColor?: string;
  /** Wave fill gradient start / crest color */
  waveCrestColor?: string;
  /** Deep water gradient color */
  waveDeepColor?: string;
  /** Callback when loading animation has completely exited */
  onComplete?: () => void;
  /** If true, only show once per browser session. Set to false to show on every page reload */
  oncePerSession?: boolean;
}

export function WaterFillPreloader({
  totalLoadTime = 2.4,
  logoWidth = 440,
  logoHeight = 240,
  backgroundColor = '#050B14',
  waveCrestColor = '#3bf4e4',
  waveDeepColor = '#0A3945',
  onComplete,
  oncePerSession = false,
}: WaterFillPreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [wavePath, setWavePath] = useState('');
  const [crestPath, setCrestPath] = useState('');

  // Refs for animation state (matching Woblo's organic timing and RAF loop)
  const startTimeRef = useRef<number | null>(null);
  const rafProgressRef = useRef<number | null>(null);
  const rafWaveRef = useRef<number | null>(null);
  const phaseRef = useRef(0);

  // Realistic organic pause at ~42%-65% for 450-800ms
  const pauseConfigRef = useRef({
    point: Math.floor(Math.random() * 25) + 42,
    duration: Math.random() * 400 + 450,
    startTime: null as number | null,
    isPausing: false,
  });

  const rawId = useId();
  // Safe CSS ID without colons
  const maskId = `orca-wave-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  // Check session storage if enabled
  useEffect(() => {
    if (oncePerSession && typeof window !== 'undefined') {
      const shown = sessionStorage.getItem('orca_preloader_shown');
      if (shown) {
        setIsFinished(true);
        if (onComplete) onComplete();
      }
    }
  }, [oncePerSession, onComplete]);

  // 1. Organic Progress Counter RAF Loop
  useEffect(() => {
    if (isFinished) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        setProgress(100);
        setIsExiting(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const stepProgress = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;

      const elapsed = timestamp - startTimeRef.current;
      let currentProgress = Math.min((elapsed / (totalLoadTime * 1000)) * 100, 100);
      const pause = pauseConfigRef.current;

      // Organic pause simulation
      if (currentProgress >= pause.point && !pause.isPausing && pause.startTime === null) {
        pause.isPausing = true;
        pause.startTime = timestamp;
        currentProgress = pause.point;
      } else if (pause.isPausing) {
        const pauseElapsed = timestamp - (pause.startTime || timestamp);
        if (pauseElapsed < pause.duration) {
          currentProgress = pause.point;
        } else {
          pause.isPausing = false;
          startTimeRef.current += pauseElapsed;
          currentProgress = pause.point;
        }
      }

      setProgress(currentProgress);

      if (currentProgress < 100) {
        rafProgressRef.current = requestAnimationFrame(stepProgress);
      } else {
        // Hold at 100% for 250ms, then trigger smooth exit
        setTimeout(() => {
          setIsExiting(true);
        }, 260);
      }
    };

    rafProgressRef.current = requestAnimationFrame(stepProgress);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (rafProgressRef.current) cancelAnimationFrame(rafProgressRef.current);
    };
  }, [totalLoadTime, isFinished]);

  // 2. Liquid Wave Surface RAF Loop (Woblo double sine-wave formula)
  useEffect(() => {
    if (isFinished) return;

    const stepWave = () => {
      // Baseline water level (rises from logoHeight + 20 to -20)
      // When progress is 0%, water is below logo (height + 15). When 100%, water is above logo (-25).
      const baselineY = (logoHeight + 35) * (1 - progress / 100) - 20;

      const freq = 0.016; // Wave frequency
      let pathUpper = `M 0 ${baselineY}`;
      let crestLine = `M 0 ${baselineY}`;

      for (let x = 0; x <= logoWidth; x += 3) {
        const wave =
          Math.sin(x * freq + phaseRef.current) * 11 +
          Math.sin(x * freq * 0.5 + phaseRef.current * 0.7) * 5.5;
        const currentY = baselineY + wave;
        pathUpper += ` L ${x} ${currentY}`;
        crestLine += ` L ${x} ${currentY}`;
      }

      // Close path around the top for the unfilled mask:
      pathUpper += ` L ${logoWidth} 0 L 0 0 Z`;

      setWavePath(pathUpper);
      setCrestPath(crestLine);

      // Advance fluid phase
      phaseRef.current += 0.048;
      rafWaveRef.current = requestAnimationFrame(stepWave);
    };

    rafWaveRef.current = requestAnimationFrame(stepWave);

    return () => {
      if (rafWaveRef.current) cancelAnimationFrame(rafWaveRef.current);
    };
  }, [progress, logoWidth, logoHeight, isFinished]);

  // 3. Exit Transition & Cleanup
  useEffect(() => {
    if (!isExiting) return;

    const exitTimer = setTimeout(() => {
      setIsFinished(true);
      if (oncePerSession && typeof window !== 'undefined') {
        sessionStorage.setItem('orca_preloader_shown', 'true');
      }
      if (onComplete) onComplete();
    }, 750); // Matches exit transition duration

    return () => clearTimeout(exitTimer);
  }, [isExiting, onComplete, oncePerSession]);

  if (isFinished) return null;

  return (
    <AnimatePresence>
      {!isFinished && (
        <motion.div
          key="orca-water-fill-preloader"
          initial={{ opacity: 1, scale: 1 }}
          animate={
            isExiting
              ? {
                  opacity: 0,
                  scale: 1.18,
                  filter: 'blur(10px)',
                }
              : { opacity: 1, scale: 1, filter: 'blur(0px)' }
          }
          transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            pointerEvents: isExiting ? 'none' : 'auto',
          }}
          className="select-none px-4"
          onClick={() => {
            // Optional click to fast-forward
            if (progress > 30) {
              setProgress(100);
              setIsExiting(true);
            }
          }}
        >
          {/* ── Center Stage: Water-Fill Masked Logo ── */}
          <div
            className="relative flex flex-col items-center justify-center max-w-[92vw]"
            style={{ width: logoWidth }}
          >
            <div
              className="relative w-full overflow-visible"
              style={{ height: logoHeight }}
            >
              <svg
                width={logoWidth}
                height={logoHeight}
                viewBox={`0 0 ${logoWidth} ${logoHeight}`}
                className="w-full h-full pointer-events-none drop-shadow-[0_0_40px_rgba(31,182,182,0.35)]"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  {/* ── 1. The Master Logo Silhouette Mask ── */}
                  <mask id={`${maskId}-logo`}>
                    <rect width={logoWidth} height={logoHeight} fill="black" />
                    <g fill="white">
                      {/* Top Whale Emblem */}
                      <image
                        href="/images/orca-logo-dark-transparent.png"
                        x={(logoWidth - 110) / 2}
                        y="12"
                        width="110"
                        height="110"
                        preserveAspectRatio="xMidYMid meet"
                      />

                      {/* Display Wordmark: ORCA */}
                      <text
                        x={logoWidth / 2}
                        y="166"
                        textAnchor="middle"
                        fill="white"
                        fontFamily="var(--font-display), 'Syne', sans-serif"
                        fontWeight="800"
                        fontSize="44"
                        letterSpacing="0.12em"
                      >
                        ORCA
                      </text>

                      {/* Maritime Subtitle */}
                      <text
                        x={logoWidth / 2}
                        y="198"
                        textAnchor="middle"
                        fill="white"
                        fontFamily="var(--font-mono), 'JetBrains Mono', monospace"
                        fontWeight="600"
                        fontSize="9.5"
                        letterSpacing="0.32em"
                        opacity="0.9"
                      >
                        ISRO SIH26176 · DEPT OF SPACE
                      </text>
                    </g>
                  </mask>

                  {/* ── 2. Upper Unfilled Wave Mask (Reveals everything ABOVE liquid) ── */}
                  <mask id={`${maskId}-wave`}>
                    <rect width={logoWidth} height={logoHeight} fill="black" />
                    <path d={wavePath} fill="white" />
                  </mask>

                  {/* ── 3. Lower Filled Wave Mask (Reveals everything BELOW liquid) ── */}
                  <mask id={`${maskId}-inverted-wave`}>
                    <rect width={logoWidth} height={logoHeight} fill="white" />
                    <path d={wavePath} fill="black" />
                  </mask>

                  {/* ── 4. Oceanic Deep Liquid Gradient ── */}
                  <linearGradient id={`${maskId}-grad`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={waveCrestColor} stopOpacity="1" />
                    <stop offset="35%" stopColor="#1FB6B6" stopOpacity="0.95" />
                    <stop offset="85%" stopColor={waveDeepColor} stopOpacity="1" />
                    <stop offset="100%" stopColor="#03080E" stopOpacity="1" />
                  </linearGradient>

                  {/* ── 5. Wave Crest Surface Glowing Gradient ── */}
                  <linearGradient id={`${maskId}-crest-grad`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#1FB6B6" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                    <stop offset="100%" stopColor="#3bf4e4" stopOpacity="0.8" />
                  </linearGradient>
                </defs>

                {/* ── Render Group masked by Logo Silhouette ── */}
                <g mask={`url(#${maskId}-logo)`}>
                  {/* Part A: Unfilled Top Silhouette (Subtle translucent glass white) */}
                  <rect
                    width={logoWidth}
                    height={logoHeight}
                    fill="#FFFFFF"
                    opacity={0.16}
                    mask={`url(#${maskId}-wave)`}
                  />

                  {/* Part B: Liquid Water Fill (Oceanic Gradient rising with wave) */}
                  <rect
                    width={logoWidth}
                    height={logoHeight}
                    fill={`url(#${maskId}-grad)`}
                    mask={`url(#${maskId}-inverted-wave)`}
                  />

                  {/* Part C: Luminous Foam / Wave Crest Line */}
                  <path
                    d={crestPath}
                    fill="none"
                    stroke={`url(#${maskId}-crest-grad)`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    opacity={progress > 1 && progress < 99 ? 0.95 : 0}
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(59, 244, 228, 0.8))',
                    }}
                  />
                </g>
              </svg>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
