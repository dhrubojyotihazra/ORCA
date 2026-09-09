import Link from "next/link";
import { Compass, Home, MessageSquare } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="relative mb-6">
        <div className="absolute inset-0 -m-6 rounded-full bg-teal-500/20 blur-2xl pointer-events-none" />
        <div className="relative size-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_40px_rgba(20,184,166,0.3)]">
          <Compass className="size-10 text-teal-400" />
        </div>
      </div>

      <span className="font-mono text-xs uppercase tracking-[0.2em] text-teal-400 font-semibold px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 mb-3">
        404 · Uncharted Coastal Waters
      </span>

      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
        Coordinates Not Found
      </h1>

      <p className="text-slate-400 max-w-md text-sm sm:text-base mb-8">
        The requested oceanic channel or sector does not exist in the ORCA registry. Please re-anchor to the main coastal deck.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-medium transition-all"
        >
          <Home className="size-4 text-slate-300" />
          <span>Home Deck</span>
        </Link>
        <Link
          href="/app"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-semibold text-sm shadow-[0_0_24px_rgba(20,184,166,0.4)] transition-all"
        >
          <MessageSquare className="size-4" />
          <span>Launch ORCA Chat</span>
        </Link>
      </div>
    </div>
  );
}

