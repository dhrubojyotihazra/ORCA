'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import cloudeeDefinition from './cloudee.avatar.json';
import '@bible-strong/avatar-react/styles.css';

// Dynamic import with SSR disabled to ensure client-only execution in Next.js
const Avatar = dynamic(
  () => import('@bible-strong/avatar-react').then((mod) => mod.Avatar),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center rounded-full bg-white/5 animate-pulse" />
    ),
  }
);

export type AvatarMood =
  | 'idle'
  | 'tracking-cursor'
  | 'field-focus'
  | 'password'
  | 'error'
  | 'success';

export interface FieldFocusInfo {
  name: string;
  rect?: DOMRect | null;
  direction?: 'center' | 'left' | 'right';
}

export type AnimationName = (typeof cloudeeDefinition.animationOrder)[number];
export type ExpressionName = (typeof cloudeeDefinition.expressionOrder)[number];

export const CLOUDEE_23_ANIMATIONS = cloudeeDefinition.animationOrder as readonly string[];
export const CLOUDEE_28_EXPRESSIONS = cloudeeDefinition.expressionOrder as readonly string[];

export type TargetOverride =
  | { kind: 'animation'; key: string }
  | { kind: 'expression'; key: string }
  | null;

export interface CloudeeAvatarProps {
  /** Avatar size in pixels (default 420 for split column, 290 for centered) */
  size?: number;
  /** High-level avatar mood state */
  mood?: AvatarMood;
  /** Focused field info object */
  focusedField?: FieldFocusInfo | null;
  /** Direct focused field name ('name' | 'phone' | 'email' | 'password' | 'otp') */
  focusedFieldName?: string | null;
  /** Whether password input currently has focus */
  isPasswordFocused?: boolean;
  /** Whether password text is currently revealed via eye toggle */
  isPasswordVisible?: boolean;
  /** Error message string if active */
  errorMessage?: string | null;
  /** Success message string if active */
  successMessage?: string | null;
  /** Direct expression override (e.g. 'angry-brows', 'uneasy-left') */
  expressionOverride?: string | null;
  /** Explicit manual target override from Studio Drawer */
  manualTarget?: TargetOverride;
  /** Accent color hex code (default oceanic cyan/teal #06b6d4) */
  accentColor?: string;
  /** Additional wrapper CSS class */
  className?: string;
}

export function CloudeeAvatar({
  size = 420,
  mood = 'idle',
  focusedField = null,
  focusedFieldName = null,
  isPasswordFocused = false,
  isPasswordVisible = false,
  errorMessage = null,
  successMessage = null,
  expressionOverride = null,
  manualTarget = null,
  accentColor = '#06b6d4',
  className = '',
}: CloudeeAvatarProps) {
  const [mounted, setMounted] = useState(false);
  const [cursorGaze, setCursorGaze] = useState<string>('neutral');
  const [isDirectlyHovered, setIsDirectlyHovered] = useState(false);

  // References for 60fps/120fps physics loop (zero React re-renders on pointermove)
  const containerRef = useRef<HTMLDivElement>(null);
  const targetTilt = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentTilt = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Gaze dwell and hysteresis filters to avoid thrashing the 420ms vector tween
  const candidateGaze = useRef<string>('neutral');
  const candidateSince = useRef<number>(0);
  const lastCommittedTime = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Convert hex accent color to rgba helper
  const accentRgba = useMemo(() => {
    let hex = accentColor.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    const num = parseInt(hex, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return (alpha: number) => `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }, [accentColor]);

  const isFieldActive =
    Boolean(focusedFieldName) ||
    Boolean(focusedField) ||
    isPasswordFocused ||
    mood === 'field-focus' ||
    mood === 'password';

  const isErrorState = Boolean(errorMessage) || mood === 'error' || expressionOverride === 'angry-brows';
  const isSuccessState = Boolean(successMessage) || mood === 'success';
  const isCoveringEyes = isPasswordFocused || mood === 'password' || focusedFieldName === 'password';

  // Submit glow bloom: gets brighter for a moment on successful submit
  const [isSubmitBurst, setIsSubmitBurst] = useState(false);
  const prevSuccessRef = useRef(false);

  useEffect(() => {
    const isSuccess = Boolean(successMessage) || mood === 'success' || manualTarget?.key === 'celebrate';
    if (isSuccess && !prevSuccessRef.current) {
      setIsSubmitBurst(true);
      const timer = setTimeout(() => {
        setIsSubmitBurst(false);
      }, 2200);
      return () => clearTimeout(timer);
    }
    prevSuccessRef.current = isSuccess;
  }, [successMessage, mood, manualTarget]);

  const isIdle = !isFieldActive && !isErrorState && !isSubmitBurst;

  // ── 1. Continuous Organic Floating & Physics Lerp Loop ──
  useEffect(() => {
    let animId: number;

    const tick = (time: number) => {
      if (containerRef.current) {
        // Floating & breathing curves so Cloudee feels alive rather than mechanical
        const isIdle = !isFieldActive && !isErrorState && !isSuccessState;
        const floatY = Math.sin(time * 0.002) * (isIdle ? 5 : 2.5);
        const floatX = Math.cos(time * 0.0016) * (isIdle ? 3 : 1.5);
        const floatRot = Math.sin(time * 0.0018) * (isIdle ? 2 : 0.8);
        const breathe = 1 + Math.sin(time * 0.0024) * 0.014;

        // Smooth physics lerp damping towards cursor target tilt (feels organic & springy)
        const lerpFactor = 0.085;
        currentTilt.current.x += (targetTilt.current.x - currentTilt.current.x) * lerpFactor;
        currentTilt.current.y += (targetTilt.current.y - currentTilt.current.y) * lerpFactor;

        // 3D perspective transform with buoyant floating
        const totalX = currentTilt.current.x + floatRot;
        const totalY = currentTilt.current.y;
        containerRef.current.style.transform = `perspective(800px) rotateX(${totalX.toFixed(2)}deg) rotateY(${totalY.toFixed(2)}deg) translate3d(${floatX.toFixed(2)}px, ${floatY.toFixed(2)}px, 0px) scale(${breathe.toFixed(3)})`;
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isFieldActive, isErrorState, isSuccessState]);

  // ── 2. Pointer Movement & Gaze Tracking Across the Page ──
  useEffect(() => {
    // Stop following mouse cursor while an input is focused or during error/success
    if (isFieldActive || isErrorState || isSuccessState) {
      if (isCoveringEyes) {
        targetTilt.current = { x: 0, y: 0 };
      } else if (isFieldActive) {
        // Look toward the left column where the input form is
        targetTilt.current = { x: -2, y: -6 };
      } else {
        targetTilt.current = { x: 0, y: 0 };
      }
      return;
    }

    const handlePointerMove = (e: PointerEvent | MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const distance = Math.hypot(dx, dy);

      // Capped 3D tilt calculation (strictly capped at ±10° pitch and yaw so eyes never leave the face)
      const maxTilt = 10;
      const tiltY = Math.max(-maxTilt, Math.min(maxTilt, (dx / (window.innerWidth * 0.45)) * 10));
      const tiltX = Math.max(-maxTilt, Math.min(maxTilt, -(dy / (window.innerHeight * 0.45)) * 10));
      targetTilt.current = { x: tiltX, y: tiltY };

      const now = performance.now();
      let nextCandidate = 'neutral';

      // Hover directly over Cloudee (< 40% radius)
      if (distance < size * 0.4) {
        setIsDirectlyHovered(true);
        nextCandidate = 'joyful-wide';
      } else {
        setIsDirectlyHovered(false);

        // Near distance: looks straight at user with attentive focus
        if (distance < size * 0.65) {
          nextCandidate = 'small-attentive';
        } else {
          // 8-directional spatial gaze tracking based on polar angle
          const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

          if (angle >= -22.5 && angle < 22.5) {
            // Looking Right
            nextCandidate = dx > 260 ? 'far-right-glance' : 'skeptical-right';
          } else if (angle >= 22.5 && angle < 67.5) {
            // Looking Down-Right
            nextCandidate = dy > 220 ? 'asymmetric-down-right' : 'joyful-down-right';
          } else if (angle >= 67.5 && angle < 112.5) {
            // Looking Down
            nextCandidate = dy > 240 ? 'wide-downward-gaze' : 'downward-gaze';
          } else if (angle >= 112.5 && angle < 157.5) {
            // Looking Down-Left
            nextCandidate = 'wide-down-left';
          } else if (angle >= 157.5 || angle < -157.5) {
            // Looking Left
            nextCandidate = Math.abs(dx) > 260 ? 'skeptical-left' : 'attentive-left';
          } else if (angle >= -157.5 && angle < -112.5) {
            // Looking Up-Left
            nextCandidate = 'asymmetric-up-left';
          } else if (angle >= -112.5 && angle < -67.5) {
            // Looking Up
            nextCandidate = 'upward-side-glance';
          } else if (angle >= -67.5 && angle < -22.5) {
            // Looking Up-Right
            nextCandidate = 'playful-right';
          }
        }
      }

      // Hysteresis & Dwell Filter:
      // Candidate must dwell for 70ms or 260ms elapsed to prevent thrashing the 420ms morph tween
      if (nextCandidate !== candidateGaze.current) {
        candidateGaze.current = nextCandidate;
        candidateSince.current = now;
      } else {
        const dwell = now - candidateSince.current;
        const timeSinceCommit = now - lastCommittedTime.current;
        if (dwell >= 70 || timeSinceCommit >= 260) {
          setCursorGaze(nextCandidate);
          lastCommittedTime.current = now;
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [isFieldActive, isErrorState, isSuccessState, isCoveringEyes, size]);

  // ── 3. Resolve Active Avatar Target (Animation vs Expression) ──
  const { activeAnimation, activeExpression } = useMemo(() => {
    // 0. Explicit manual target override from Studio Drawer (all 23 anims & 28 exprs)
    if (manualTarget) {
      if (manualTarget.kind === 'animation') {
        return { activeAnimation: manualTarget.key, activeExpression: undefined };
      } else {
        return { activeAnimation: undefined, activeExpression: manualTarget.key };
      }
    }

    // 1. Successful submit -> celebration animation timeline!
    if (isSuccessState) {
      return { activeAnimation: 'celebrate', activeExpression: undefined };
    }

    // 2. Validation error on blur / error message -> angry-brows error expression!
    if (isErrorState) {
      return { activeAnimation: undefined, activeExpression: 'angry-brows' };
    }

    // 3. Password field focused -> covers eyes (or peeks if visible)!
    if (isCoveringEyes) {
      if (isPasswordVisible) {
        return { activeAnimation: undefined, activeExpression: 'surprised-wide-left' };
      }
      return { activeAnimation: undefined, activeExpression: 'eyes-closed' };
    }

    // 4. Expression override (e.g. uneasy-left on OTP)
    if (expressionOverride) {
      return { activeAnimation: undefined, activeExpression: expressionOverride };
    }

    // 5. Non-password field focused -> looks toward the active field!
    // In split layout, the form inputs are located to the left of the avatar.
    if (isFieldActive) {
      const activeName = focusedFieldName || focusedField?.name;
      if (activeName === 'otp') {
        return { activeAnimation: undefined, activeExpression: 'uneasy-left' };
      }
      if (activeName === 'name') {
        return { activeAnimation: undefined, activeExpression: 'curious-left' };
      }
      if (activeName === 'phone' || activeName === 'email') {
        return { activeAnimation: undefined, activeExpression: 'attentive-left' };
      }
      return { activeAnimation: undefined, activeExpression: 'attentive-left' };
    }

    // 6. Directly hovered over body
    if (isDirectlyHovered) {
      return { activeAnimation: undefined, activeExpression: 'joyful-wide' };
    }

    // 7. Active cursor tracking across page
    return { activeAnimation: undefined, activeExpression: cursorGaze };
  }, [
    isSuccessState,
    isErrorState,
    isCoveringEyes,
    isPasswordVisible,
    expressionOverride,
    isFieldActive,
    focusedFieldName,
    focusedField,
    isDirectlyHovered,
    cursorGaze,
    manualTarget,
  ]);

  // Natural blinking should be active when eyes aren't closed
  const shouldBlink =
    !isCoveringEyes &&
    activeExpression !== 'eyes-closed' &&
    activeExpression !== 'drowsy-closed';

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Scoped CSS for natural organic eyelid double-blinking */}
      <style jsx global>{`
        .cloudee-avatar-blinking g[clip-path] path {
          transform-box: fill-box;
          transform-origin: center;
          animation: cloudee-natural-blink 4.2s ease-in-out infinite;
        }
        @keyframes cloudee-natural-blink {
          0%, 86%, 90%, 94%, 100% {
            transform: scaleY(1);
          }
          88% {
            transform: scaleY(0.06);
          }
          92% {
            transform: scaleY(0.06);
          }
        }
        @keyframes cloudee-glow-pulse {
          0% {
            transform: scale(0.94);
            opacity: 0.22;
          }
          50% {
            transform: scale(1.10);
            opacity: 0.46;
          }
          100% {
            transform: scale(0.94);
            opacity: 0.22;
          }
        }
        /* Shared environmental lighting & depth cues with oceanic wave background */
        .cloudee-avatar-container svg {
          filter: drop-shadow(0 28px 42px rgba(1, 16, 32, 0.85))
                  drop-shadow(-4px -6px 20px rgba(34, 211, 238, 0.48))
                  drop-shadow(2px 3px 14px rgba(250, 59, 140, 0.22));
          transition: filter 0.5s ease-out;
        }
      `}</style>

      {/* ── Micro-reflection & Glow Bleed Behind Avatar Blob ── */}
      {/* Blends avatar's warm rose tone into the oceanic fluid backdrop */}
      <div
        className="absolute pointer-events-none transition-all duration-1000 ease-out"
        style={{
          width: size * 1.35,
          height: size * 1.35,
          borderRadius: '50%',
          background: `radial-gradient(circle at center, ${
            isErrorState
              ? 'rgba(239, 68, 68, 0.35)'
              : isSubmitBurst
              ? accentRgba(0.55)
              : 'rgba(250, 59, 140, 0.22)'
          } 0%, ${
            isErrorState
              ? 'rgba(239, 68, 68, 0.12)'
              : isSubmitBurst
              ? accentRgba(0.28)
              : accentRgba(0.24)
          } 40%, ${
            isErrorState
              ? 'rgba(239, 68, 68, 0.02)'
              : isSubmitBurst
              ? accentRgba(0.08)
              : accentRgba(0.06)
          } 65%, transparent 78%)`,
          filter: isSubmitBurst ? 'blur(48px)' : 'blur(42px)',
          transform: isSubmitBurst ? 'scale(1.36)' : undefined,
          opacity: isSubmitBurst ? 0.95 : undefined,
          animation: isIdle ? 'cloudee-glow-pulse 4.5s ease-in-out infinite' : undefined,
        }}
      />

      {/* Secondary soft inner micro-glow for smooth bloom and depth without hard edges */}
      <div
        className="absolute pointer-events-none transition-all duration-700 ease-out"
        style={{
          width: size * 0.95,
          height: size * 0.95,
          borderRadius: '50%',
          background: `radial-gradient(circle at center, ${
            isErrorState
              ? 'rgba(244, 63, 94, 0.22)'
              : isSubmitBurst
              ? accentRgba(0.45)
              : accentRgba(0.22)
          } 0%, ${
            isErrorState
              ? 'rgba(244, 63, 94, 0.06)'
              : isSubmitBurst
              ? accentRgba(0.18)
              : accentRgba(0.06)
          } 48%, transparent 70%)`,
          filter: isSubmitBurst ? 'blur(28px)' : 'blur(24px)',
          transform: isSubmitBurst ? 'scale(1.24)' : undefined,
          opacity: isSubmitBurst ? 1 : isIdle ? 0.6 : 0.35,
        }}
      />

      {/* ── Oceanic Fluid Depth Contact Shadow beneath the floating avatar ── */}
      <div
        className="absolute pointer-events-none -bottom-8 transition-all duration-700 ease-out"
        style={{
          width: size * 0.72,
          height: size * 0.18,
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at center, rgba(1, 14, 28, 0.85) 0%, rgba(2, 28, 54, 0.5) 45%, transparent 72%)',
          filter: 'blur(22px)',
        }}
      />

      {/* ── Avatar Stage with Physics Damping & Perspective Tilt ── */}
      <div
        ref={containerRef}
        style={{ willChange: 'transform' }}
        className={`relative flex items-center justify-center cursor-pointer transition-transform duration-100 ${
          shouldBlink ? 'cloudee-avatar-blinking' : ''
        }`}
      >
        {mounted ? (
          <div
            style={{ width: size, height: size }}
            className="overflow-visible flex items-center justify-center pointer-events-none cloudee-avatar-container"
          >
            {/* 
              STABLE MOUNT: Key is fixed to prevent React unmounting.
              This allows Bible Strong's built-in 420ms directTransition to smoothly
              interpolate geometries and colors between expressions without snapping.
            */}
            <Avatar
              key="cloudee-avatar-single-instance"
              definition={cloudeeDefinition as any}
              {...(activeAnimation
                ? { animation: activeAnimation as any }
                : { expression: activeExpression as any })}
              size={size}
              ariaLabel="Cloudee Interactive Avatar Companion"
              className="select-none"
            />
          </div>
        ) : (
          <div style={{ width: size, height: size }} />
        )}
      </div>
    </div>
  );
}

export default CloudeeAvatar;
