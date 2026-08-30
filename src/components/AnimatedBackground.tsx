'use client';

import { useEffect, useRef } from 'react';

// AnimatedBackground — canvas gradient fallback when no video is available.
// Renders a slowly drifting deep-navy → teal → seafoam gradient with a subtle
// noise wave, so the glass card still has movement to refract.

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let t = 0;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      if (!canvas || !ctx) return;
      const { width: w, height: h } = canvas;
      t += 0.003;

      // Drifting vertical gradient — navy → teal → seafoam
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      const shift = Math.sin(t) * 0.08;
      grad.addColorStop(Math.max(0, 0.0 + shift), '#050B14');
      grad.addColorStop(Math.max(0, 0.45 + shift * 0.5), '#0B3D4A');
      grad.addColorStop(Math.min(1, 0.85 + shift * 0.3), '#1FB6B6');
      grad.addColorStop(1, '#1a9090');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subtle wave bands — layered sinusoids at low opacity
      for (let i = 0; i < 4; i++) {
        const amp = 30 + i * 12;
        const freq = 0.004 + i * 0.0015;
        const speed = t * (0.4 + i * 0.15);
        const yBase = h * (0.3 + i * 0.15);

        ctx.beginPath();
        ctx.moveTo(0, yBase);
        for (let x = 0; x <= w; x += 4) {
          const y = yBase + Math.sin(x * freq + speed) * amp + Math.sin(x * freq * 2.3 + speed * 0.7) * (amp * 0.35);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fillStyle = `rgba(31, 182, 182, ${0.04 - i * 0.008})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
