"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { conversationCopy } from "@/content/conversation-copy";
import { ConversationalBookingChat } from "@/features/public-site/conversational-booking-chat";
import { ClientTeamChatPanel } from "./client-team-chat-panel";

export function ClientConversationWorkspace({ locale }: { locale: "ar" | "en" }) {
  const [team, setTeam] = useState(false);
  const workspace = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const shell = workspace.current?.closest<HTMLElement>(".client-portal-shell");
    const viewport = window.visualViewport;
    if (!shell || !viewport) return;
    const resize = () => shell.style.setProperty("--client-viewport-height", `${viewport.height}px`);
    resize();
    viewport.addEventListener("resize", resize);
    viewport.addEventListener("scroll", resize);
    return () => {
      viewport.removeEventListener("resize", resize);
      viewport.removeEventListener("scroll", resize);
      shell.style.removeProperty("--client-viewport-height");
    };
  }, []);

  return <div ref={workspace} className="client-conversation-workspace flex min-h-0 flex-1 flex-col">
    {team ? <div className="min-h-0 flex-1 overflow-y-auto"><ClientTeamChatPanel locale={locale} onBack={() => setTeam(false)} /></div> : <ConversationalBookingChat
      locale={locale}
      layout="portal"
      headerAction={<Button variant="outline" onClick={() => setTeam(true)}>{conversationCopy[locale].staff}</Button>}
    />}
  </div>;
}
