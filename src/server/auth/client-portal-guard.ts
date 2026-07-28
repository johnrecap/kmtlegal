import type { AuthContext } from "./session-store";
import { ROLES } from "./policy";
import {
  getClientContent,
  normalizeClientLocale,
  type ClientLocale
} from "@/content/client-content";

export type ClientPortalGuardIssue = {
  title: string;
  description: string;
};

export function clientPortalGuardIssue(
  context: AuthContext,
  locale: ClientLocale = normalizeClientLocale(context.user.locale)
): ClientPortalGuardIssue | null {
  const copy = getClientContent(locale).guard;
  if (context.principal.roleName !== ROLES.client) {
    return {
      title: copy.staffTitle,
      description: copy.staffDescription
    };
  }

  if (!context.principal.clientId) {
    return {
      title: copy.unlinkedTitle,
      description: copy.unlinkedDescription
    };
  }

  return null;
}
