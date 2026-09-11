'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, type Marker, type Arc } from '@/components/ui/cobe-globe';
import { MapPin } from 'lucide-react';

const FISHING_ZONES: Marker[] = [
  // ─── 5 Key Indian Coastal Fishing Grounds ───
  { id: 'in-mannar', location: [9.2876, 79.3129], label: 'Gulf of Mannar' },
  { id: 'in-veraval', location: [20.9042, 70.3671], label: 'Veraval Coast' },
  { id: 'in-vizag', location: [17.6868, 83.2185], label: 'Visakhapatnam' },
  { id: 'in-kochi', location: [9.9312, 76.2673], label: 'Kochi Shelf' },
  { id: 'in-sundarbans', location: [21.9497, 89.1833], label: 'Sundarbans' },
];

const TELEMETRY_ARCS: Arc[] = [
  { id: 'isro-mannar', from: [17.385, 78.4867], to: [9.2876, 79.3129] },
  { id: 'isro-veraval', from: [17.385, 78.4867], to: [20.9042, 70.3671] },
  { id: 'isro-vizag', from: [17.385, 78.4867], to: [17.6868, 83.2185] },
  { id: 'isro-kochi', from: [17.385, 78.4867], to: [9.9312, 76.2673] },
  { id: 'isro-sundarbans', from: [17.385, 78.4867], to: [21.9497, 89.1833] },
];

const ZONE_DETAILS: Record<string, { country: string; species: string }> = {
  'Gulf of Mannar': { country: 'Tamil Nadu, India', species: 'Squid, Sardine & Reef Fish' },
  'Veraval Coast': { country: 'Gujarat, India', species: 'Ribbonfish, Pomfret & Croaker' },
  'Visakhapatnam': { country: 'Andhra Pradesh, India', species: 'Yellowfin Tuna & Deep-Sea Prawns' },
  'Kochi Shelf': { country: 'Kerala, India', species: 'Indian Oil Sardine & Mackerel' },
  'Sundarbans': { country: 'West Bengal, India', species: 'Hilsa & Estuarine Fishery' },
};

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function OceanGlobeCard() {
  const [activeZoneIndex, setActiveZoneIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveZoneIndex((prev) => (prev + 1) % FISHING_ZONES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const activeZone = FISHING_ZONES[activeZoneIndex];
  const detail = ZONE_DETAILS[activeZone.label] || {
    country: 'Coastal Waters',
    species: 'Pelagic Marine Fishery',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, ease: EASE, delay: 0.25 }}
      className="relative flex flex-col justify-between w-[320px] sm:w-[350px] max-w-full rounded-[32px] overflow-hidden p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.45)] pointer-events-auto"
      style={{
        background: 'rgba(5, 18, 30, 0.45)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* ── Liquid Glass Refraction Filter Layer ── */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[inherit] -z-10 opacity-70"
        style={{
          filter: 'url(#glass-distortion)',
          WebkitFilter: 'url(#glass-distortion)',
        }}
      />

      {/* ── Seamless Header (Borderless) ── */}
      <div className="relative z-10 flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-teal-300 shadow-[0_0_8px_#1FB6B6]" />
          <div>
            <h2 className="text-sm font-heading font-bold text-white tracking-tight leading-none">
              Major Fishing Grounds
            </h2>
            <p className="text-[10.5px] text-white/60 font-light mt-0.5">
              5 Key Indian Fishing Grounds
            </p>
          </div>
        </div>
      </div>

      {/* ── 3D Interactive Cobe Globe with Zoom Support ── */}
      <div className="relative z-10 my-1 flex items-center justify-center">
        <div className="relative w-[210px] sm:w-[230px] aspect-square">
          <Globe
            markers={FISHING_ZONES}
            arcs={TELEMETRY_ARCS}
            dark={1}
            baseColor={[0.03, 0.1, 0.16]}
            markerColor={[0, 0.94, 1]}
            arcColor={[0.12, 0.72, 0.72]}
            glowColor={[0.12, 0.72, 0.72]}
            mapBrightness={6}
            markerSize={0.036}
            markerElevation={0.02}
            arcWidth={0.5}
            speed={0.0035}
            theta={0.2}
            enableZoom={true}
          />
        </div>
      </div>

      {/* ── Seamless Zone Detail (Borderless) ── */}
      <div className="relative z-10 rounded-2xl bg-black/25 p-3 space-y-1 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3 text-teal-300 shrink-0" />
            <h3 className="font-heading text-xs sm:text-sm font-bold text-white tracking-tight">
              {activeZone.label}
            </h3>
          </div>
          <span className="font-mono text-[9.5px] text-teal-300/80 font-medium">
            {activeZone.location[0].toFixed(2)}°, {activeZone.location[1].toFixed(2)}°
          </span>
        </div>

        <p className="text-[11px] text-white/70 font-light">
          {detail.country}
        </p>

        <p className="text-[10px] text-white/50 font-light pt-0.5">
          Harvest: {detail.species}
        </p>
      </div>
    </motion.div>
  );
}
