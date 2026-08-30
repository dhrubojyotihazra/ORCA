import type { Metadata } from "next";
import { Syne, Plus_Jakarta_Sans, Inter, JetBrains_Mono, Pinyon_Script } from "next/font/google";
import "./globals.css";

// Ultra-bold, avant-garde display typeface for giant wordmarks & bold straight headers
const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display",
  display: "swap",
});

// Modern high-impact geometric grotesque for section headings and UI
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

// Luxurious, flowing Spencerian cursive script for expressive Awwwards editorial contrast
const pinyonScript = Pinyon_Script({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-script",
  display: "swap",
});

// Clean, high-legibility body text
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

// High-tech telemetry labels
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ORCA",
  description:
    "Marine EcOsystem Reasoning with Collaborative Agents · ISRO SIH26176 · Team DeTABIS.",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${syne.variable} ${plusJakarta.variable} ${pinyonScript.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="font-[var(--font-body)] antialiased bg-[#050B14] text-white selection:bg-teal-400/30 selection:text-white"
        style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
