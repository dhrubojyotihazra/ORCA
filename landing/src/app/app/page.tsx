"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { PromptCard } from "@/components/app/PromptCard";
import { ActionChips } from "@/components/app/ActionChips";

export default function InnerAppPage() {
  const [injectedPrompt, setInjectedPrompt] = useState("");

  const handleSelectChip = (promptText: string) => {
    setInjectedPrompt(promptText);
  };

  return (
    <AppShell>
      <div className="flex-1 flex flex-col items-center justify-center p-4 my-auto relative z-10 w-full">
        <PromptCard initialText={injectedPrompt} showHero={true} />
        <ActionChips onSelectPrompt={handleSelectChip} />
      </div>
    </AppShell>
  );
}
