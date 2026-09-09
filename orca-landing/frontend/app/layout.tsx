import "./globals.css";
import React from "react";

export const metadata = {
  title: "ORCA — Marine EcOsystem Reasoning with Collaborative Agents",
  description: "ISRO SIH26176 Marine Intelligence Platform for Fishermen Safety, PFZ & Geofencing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
