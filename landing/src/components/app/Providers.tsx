"use client";

import React from "react";
import { AppProvider } from "@/lib/app-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}
