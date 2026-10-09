import { ClientEmailVerification } from "@/features/public-site/client-email-verification";
import { conversationCopy } from "@/content/conversation-copy";

export const metadata = { title: conversationCopy.ar.verify, robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default function VerifyClientAccountPage() { return <ClientEmailVerification />; }
