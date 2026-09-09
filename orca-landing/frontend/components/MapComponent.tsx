"use client";

import React, { useEffect, useRef } from "react";

interface MapLayer {
  layer_type: string;
  title: string;
  latitude: number;
  longitude: number;
  radius_m?: number;
  color?: string;
  target_species?: string[];
}

interface MapComponentProps {
  centerLat: number;
  centerLon: number;
  layers: MapLayer[];
}

export default function MapComponent({ centerLat, centerLon, layers }: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let L: any;
    try {
      L = require("leaflet");
    } catch (e) {
      console.warn("Leaflet not available yet:", e);
      return;
    }

    // Initialize map if not already created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([centerLat, centerLon], 9);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([centerLat, centerLon], 9);
    }

    const map = mapInstanceRef.current;

    // Clear previous vector layers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Circle || layer instanceof L.Marker || layer instanceof L.Polygon) {
        map.removeLayer(layer);
      }
    });

    // Custom Icon helper
    const createIcon = (color: string, label: string) => L.divIcon({
      className: "custom-pin",
      html: `<div style="background:${color}; width:16px; height:16px; border-radius:50%; border:2px solid white; box-shadow:0 0 10px ${color};"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    // 1. Draw base vessel marker
    const baseMarker = L.marker([centerLat, centerLon], {
      icon: createIcon("#38bdf8", "Base")
    }).addTo(map);
    baseMarker.bindPopup("<b>Current Vessel Position</b><br/>GPS Active");

    // 2. Render dynamic layers (PFZ, Hazard Zones)
    layers.forEach((layer) => {
      if (layer.layer_type === "pfz_zone") {
        const pfzCircle = L.circle([layer.latitude, layer.longitude], {
          color: layer.color || "#10b981",
          fillColor: layer.color || "#10b981",
          fillOpacity: 0.35,
          radius: layer.radius_m || 12000
        }).addTo(map);

        const speciesList = layer.target_species?.join(", ") || "Pelagic species";
        pfzCircle.bindPopup(`
          <div style="font-size:12px; color:#1e293b;">
            <b style="color:#059669;">Potential Fishing Zone (PFZ)</b><br/>
            <b>${layer.title}</b><br/>
            Target: <i>${speciesList}</i><br/>
            Advisory: High chlorophyll front detected
          </div>
        `);
      } else if (layer.layer_type === "hazard_zone") {
        const hazardCircle = L.circle([layer.latitude, layer.longitude], {
          color: layer.color || "#ef4444",
          fillColor: layer.color || "#ef4444",
          fillOpacity: 0.25,
          radius: layer.radius_m || 25000
        }).addTo(map);

        hazardCircle.bindPopup(`
          <div style="font-size:12px; color:#1e293b;">
            <b style="color:#dc2626;">Hazard Advisory Zone</b><br/>
            <b>${layer.title}</b><br/>
            Rough sea and wind advisory in effect
          </div>
        `);
      }
    });

    // 3. Render Static Protected / Restricted Maritime Boundaries (IMBL & Gulf of Mannar)
    const imblPoly = L.polygon([
      [9.0, 79.2], [9.0, 80.2], [10.4, 80.2], [10.4, 79.2]
    ], {
      color: "#f43f5e",
      fillColor: "#f43f5e",
      fillOpacity: 0.2,
      dashArray: "6, 6"
    }).addTo(map);
    imblPoly.bindPopup("<b style='color:#e11d48;'>India - Sri Lanka IMBL Boundary</b><br/>Strictly restricted. No crossing.");

  }, [centerLat, centerLon, layers]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900">
      <div ref={mapContainerRef} className="w-full h-full min-h-[420px]" />
      <div className="absolute top-3 right-3 z-[1000] bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-700 text-xs text-slate-300 space-y-1 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
          <span>Vessel Location</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Potential Fishing Zone (PFZ)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Restricted Zone / IMBL</span>
        </div>
      </div>
    </div>
  );
}
