import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { BelowFoldSections } from "@/components/BelowFoldSections";
import AnimatedGradient from "@/components/ui/animated-gradient";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#050B14] text-white">
      {/* ── Fixed Full-Page WebGL2 Animated Gradient Background ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <AnimatedGradient
          config={{
            preset: "custom",
            color1: "#03080E", // deep oceanic obsidian
            color2: "#0A3945", // deep marine teal
            color3: "#1FB6B6", // bright electric teal
            rotation: 35,
            proportion: 42,
            scale: 0.85,
            speed: 24,
            distortion: 12,
            swirl: 65,
            swirlIterations: 8,
            softness: 90,
            shape: "Checks",
            shapeSize: 32,
          }}
          noise={{ opacity: 0.12, scale: 1.1 }}
        />
      </div>

      {/* Fixed nav */}
      <Navbar />

      {/* Hero Section with Dual ORCA Morph-Reveal + Liquid Glass Card */}
      <HeroSection />

      {/* Below the fold sections */}
      <BelowFoldSections />
    </main>
  );
}
