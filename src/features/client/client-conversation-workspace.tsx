"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { conversationCopy } from "@/content/conversation-copy";
import { ConversationalBookingChat } from "@/features/public-site/conversational-booking-chat";
import { ClientTeamChatPanel } from "./client-team-chat-panel";

export function ClientConversationWorkspace({ locale }: { locale: "ar" | "en" }) {
  const [team, setTeam] = useState(false);
  if (team) return <ClientTeamChatPanel locale={locale} onBack={() => setTeam(false)} />;
  return <div className="space-y-5"><Button variant="outline" onClick={() => setTeam(true)}>{conversationCopy[locale].staff}</Button><ConversationalBookingChat locale={locale} /></div>;
}
