"use client";

import React from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { ChatInterface } from "@/components/app/ChatInterface";
import { useApp } from "@/lib/app-context";

import { ChatSession } from "@/lib/chat-store";

function ChatSessionContent() {
  const params = useParams();
  const chatId = String(params?.id || "1");
  const { chats } = useApp();

  // 1. Look in active in-memory chats context
  let activeChat = chats.find((c) => c.id === chatId);

  // 2. Fallback to localStorage directly if not hydrated into state yet
  if (!activeChat && typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("orca_chats_sessions_v4");
      if (saved) {
        const parsed: ChatSession[] = JSON.parse(saved);
        activeChat = parsed.find((c) => c.id === chatId);
      }
    } catch {}
  }

  // 3. Clean fallback session
  if (!activeChat) {
    activeChat = {
      id: chatId,
      title: "Maritime Inquiry Session",
      createdAt: "Just now",
      model: "ORCA Multi-Agent (Groq LPU)",
      statusDotColor: "bg-teal-400",
      messages: [
        {
          id: `msg-${chatId}-init`,
          role: "assistant" as const,
          content: "ORCA Marine Multi-Agent System connected. Ask about fishing zones (PFZ), ocean state forecasts, hydrodynamic vessel safety, or maritime geofences.",
          timestamp: "Just now",
          modelUsed: "ORCA Multi-Agent (Groq LPU)",
        },
      ],
    };
  }

  return <ChatInterface chat={activeChat} />;
}

export default function ChatSessionPage() {
  return (
    <AppShell>
      <ChatSessionContent />
    </AppShell>
  );
}
