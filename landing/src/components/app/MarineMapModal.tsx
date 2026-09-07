"use client";

import React from "react";
import { useApp } from "@/lib/app-context";
import { MarineMap } from "./MarineMap";

export function MarineMapModal() {
  const { isMapOpen, setIsMapOpen } = useApp();

  if (!isMapOpen) return null;

  return (
    <MarineMap
      mode="modal"
      onClose={() => setIsMapOpen(false)}
    />
  );
}
