import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { permissionsForRole, type Principal } from "./policy";
import {
  createSessionToken,
  getSessionExpiresAt,
  hashSessionToken,
  SESSION_COOKIE_NAME
} from "./session";
import { canFinalizeSession, initialSessionStatusForRole, isStaffTwoFactorEnabled } from "./two-factor";

const authUserInclude = {
  role: {
    include: {
      permissions: {
        include: {
          permission: true
        }
      }
    }
  },
  clientProfile: true,
  twoFactorCredential: true
} satisfies Prisma.UserInclude;

export type AuthUser = Prisma.UserGetPayload<{ include: typeof authUserInclude }>;

export type AuthContext = {
  sessionId: string;
  sessionStatus: string;
  twoFactorAttemptCount: number;
  twoFactorLockedUntil: Date | null;
  user: AuthUser;
  principal: Principal;
};

export class AuthRequiredError extends Error {
  constructor() {
    super("Authentication required.");
    this.name = "AuthRequiredError";
  }
}

export class ActiveSessionRequiredError extends Error {
  constructor() {
    super("Active session required.");
    this.name = "ActiveSessionRequiredError";
  }
}

export function getIpAddress(request: Request) {
  const realIp = normalizeIpHeader(request.headers.get("x-real-ip"));
  if (realIp) {
    return realIp;
  }

  if (process.env.APP_ENV === "production" || process.env.NODE_ENV === "production") {
    return null;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  return normalizeIpHeader(forwardedFor?.split(",")[0] ?? null);
}

export function getUserAgent(request: Request) {
  return request.headers.get("user-agent");
}

function normalizeIpHeader(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized || null;
}

export function principalFromUser(user: AuthUser): Principal {
  const roleName = user.role.name;
  const permissions = user.role.permissions.map((entry) => entry.permission.key);
  return {
    id: user.id,
    roleName,
    permissions: permissions.length > 0 ? permissions : permissionsForRole(roleName),
    clientId: user.clientProfile?.id ?? null
  };
}

export function safeUser(user: AuthUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    locale: user.locale,
    status: user.status,
    role: user.role.name,
    clientId: user.clientProfile?.id ?? null,
    staffTwoFactorState: isStaffTwoFactorEnabled() ? user.twoFactorCredential?.recoveryState ?? null : null
  };
}

export function getSessionTokenFromCookieHeader(cookieHeader: string) {
  const rawToken = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.slice(SESSION_COOKIE_NAME.length + 1);

  return rawToken ? decodeURIComponent(rawToken) : null;
}

export async function createSessionForUser(user: AuthUser, request: Request) {
  const token = createSessionToken();
  const status = initialSessionStatusForRole(user.role.name);
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: hashSessionToken(token),
      status,
      twoFactorVerifiedAt: status === "ACTIVE" && user.role.name === "Client" ? null : undefined,
      expiresAt: getSessionExpiresAt(),
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request)
    }
  });

  return { token, session };
}

export async function getAuthContextFromRequest(
  request: Request,
  options: { allowPendingTwoFactor?: boolean } = {}
): Promise<AuthContext | null> {
  return getAuthContextFromCookieHeader(request.headers.get("cookie") ?? "", options);
}

export async function getAuthContextFromCookieHeader(
  cookieHeader: string,
  options: { allowPendingTwoFactor?: boolean } = {}
): Promise<AuthContext | null> {
  const token = getSessionTokenFromCookieHeader(cookieHeader);
  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: {
      user: {
        include: authUserInclude
      }
    }
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    return null;
  }

  if (!options.allowPendingTwoFactor && !canFinalizeSession(session.user.role.name, session)) {
    return null;
  }

  return {
    sessionId: session.id,
    sessionStatus: session.status,
    twoFactorAttemptCount: session.twoFactorAttemptCount,
    twoFactorLockedUntil: session.twoFactorLockedUntil,
    user: session.user,
    principal: principalFromUser(session.user)
  };
}

export async function requireAuthContext(request: Request, options: { allowPendingTwoFactor?: boolean } = {}) {
  const context = await getAuthContextFromRequest(request, options);
  if (!context) {
    throw new AuthRequiredError();
  }

  return context;
}
