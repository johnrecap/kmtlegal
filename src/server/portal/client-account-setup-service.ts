import { createHmac, timingSafeEqual } from "node:crypto";
import { Prisma, type User } from "@prisma/client";
import { z } from "zod";
import { appendAuditLogBestEffort } from "@/server/audit/audit-service";
import { hashPassword } from "@/server/auth/password";
import { ROLES } from "@/server/auth/policy";
import { createSessionForUser } from "@/server/auth/session-store";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { publicConsultationReference } from "@/server/consultations/consultation-service";
import { emailSchema, localeSchema, parseWithSchema, uuidSchema } from "@/server/validation/schemas";

const CLIENT_ACCOUNT_SETUP_PURPOSE = "client_account_setup";
export const CLIENT_ACCOUNT_SETUP_TOKEN_TTL_MS = 30 * 60 * 1000;

const tokenSchema = z.string().min(32).max(4096);

const tokenPayloadSchema = z.object({
  purpose: z.literal(CLIENT_ACCOUNT_SETUP_PURPOSE),
  version: z.literal(1),
  clientId: uuidSchema,
  consultationId: uuidSchema,
  email: emailSchema.optional(),
  iat: z.number().int().positive(),
  exp: z.number().int().positive()
});

export const publicClientAccountSetupSchema = z
  .object({
    token: tokenSchema,
    email: emailSchema,
    password: z.string().min(10).max(256),
    confirmPassword: z.string().min(10).max(256),
    locale: localeSchema.optional()
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match."
      });
    }
  });

type ClientAccountSetupPayload = z.infer<typeof tokenPayloadSchema>;

type ClientAccountSetupTargetInput = {
  client: {
    id: string;
    email: string | null;
    userId: string | null;
  };
  consultationId: string;
  request?: Request;
  now?: Date;
};

export type PublicClientAccountSetupTarget =
  | {
      status: "setup_available";
      setupUrl: string;
      expiresAt: string;
      email: string | null;
    }
  | {
      status: "existing_account";
      loginUrl: string;
      email: string | null;
    };

const sessionUserInclude = {
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

export function publicClientAccountSetupTarget(input: ClientAccountSetupTargetInput): PublicClientAccountSetupTarget {
  if (input.client.userId) {
    return {
      status: "existing_account",
      loginUrl: "/login?next=/client",
      email: input.client.email
    };
  }

  const token = createClientAccountSetupToken({
    clientId: input.client.id,
    consultationId: input.consultationId,
    email: input.client.email ?? undefined,
    now: input.now
  });

  const url = new URL("/client-account/setup", publicAppOrigin(input.request));
  url.searchParams.set("token", token.value);

  return {
    status: "setup_available",
    setupUrl: url.toString(),
    expiresAt: token.expiresAt.toISOString(),
    email: input.client.email
  };
}

export function createClientAccountSetupToken(input: {
  clientId: string;
  consultationId: string;
  email?: string | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const payload: ClientAccountSetupPayload = {
    purpose: CLIENT_ACCOUNT_SETUP_PURPOSE,
    version: 1,
    clientId: uuidSchema.parse(input.clientId),
    consultationId: uuidSchema.parse(input.consultationId),
    email: input.email ? emailSchema.parse(input.email) : undefined,
    iat: now.getTime(),
    exp: now.getTime() + CLIENT_ACCOUNT_SETUP_TOKEN_TTL_MS
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return {
    value: `${encodedPayload}.${signTokenPayload(encodedPayload)}`,
    expiresAt: new Date(payload.exp)
  };
}

export function verifyClientAccountSetupToken(tokenInput: string, now = new Date()) {
  const token = parseWithSchema(tokenSchema, tokenInput, "Client account setup token is invalid.");
  const [encodedPayload, signature, extra] = token.split(".");
  if (!encodedPayload || !signature || extra) {
    throw invalidTokenError();
  }

  const expectedSignature = signTokenPayload(encodedPayload);
  if (!safeEqual(signature, expectedSignature)) {
    throw invalidTokenError();
  }

  let decodedPayload: unknown;
  try {
    decodedPayload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    throw invalidTokenError();
  }

  const payload = tokenPayloadSchema.safeParse(decodedPayload);
  if (!payload.success) {
    throw invalidTokenError();
  }

  if (payload.data.exp <= now.getTime()) {
    throw new ApiError(410, "TOKEN_EXPIRED", "Client account setup link has expired.");
  }

  return payload.data;
}

export async function getClientAccountSetupContext(input: { token: string; now?: Date }) {
  const payload = verifyClientAccountSetupToken(input.token, input.now);
  const consultation = await prisma.consultationRequest.findUnique({
    where: { id: payload.consultationId },
    select: {
      id: true,
      clientId: true,
      status: true,
      summary: true,
      preferredMode: true,
      client: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          userId: true,
          deletedAt: true
        }
      },
      appointments: {
        where: { type: "CONSULTATION" },
        orderBy: { startsAt: "desc" },
        take: 1,
        select: {
          id: true,
          title: true,
          startsAt: true,
          status: true
        }
      }
    }
  });

  if (!consultation || consultation.clientId !== payload.clientId || !consultation.client || consultation.client.deletedAt) {
    throw new ApiError(404, "NOT_FOUND", "Consultation account setup link was not found.");
  }

  if (consultation.status !== "SCHEDULED") {
    throw new ApiError(409, "CONFLICT", "Client account can be created after a confirmed consultation request.");
  }

  const appointment = consultation.appointments[0] ?? null;
  return {
    token: input.token,
    expiresAt: new Date(payload.exp).toISOString(),
    client: {
      id: consultation.client.id,
      fullName: consultation.client.fullName,
      phone: consultation.client.phone,
      email: consultation.client.email,
      hasPortalAccount: Boolean(consultation.client.userId)
    },
    consultation: {
      id: consultation.id,
      reference: publicConsultationReference(consultation.id),
      status: consultation.status,
      summary: consultation.summary,
      preferredMode: consultation.preferredMode,
      appointment: appointment
        ? {
            id: appointment.id,
            title: appointment.title,
            startsAt: appointment.startsAt.toISOString(),
            status: appointment.status
          }
        : null
    }
  };
}

export async function completePublicClientAccountSetup(input: { body: unknown; request: Request; requestId: string }) {
  const body = parseWithSchema(publicClientAccountSetupSchema, input.body, "Client account setup payload is invalid.");
  const context = await getClientAccountSetupContext({ token: body.token });

  if (context.client.hasPortalAccount) {
    throw new ApiError(409, "CONFLICT", "Client already has a portal account.");
  }
  if (context.client.email && context.client.email.toLowerCase() !== body.email) {
    throw new ApiError(409, "CONFLICT", "Use the email already saved on this consultation request.");
  }

  const clientRole = await prisma.role.findUnique({
    where: { name: ROLES.client },
    select: { id: true }
  });
  if (!clientRole) {
    throw new ApiError(500, "INTERNAL_ERROR", "Client role is missing. Run production seed first.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: body.email },
    include: {
      role: { select: { name: true } },
      clientProfile: { select: { id: true } }
    }
  });

  if (existingUser && existingUser.role.name !== ROLES.client) {
    throw new ApiError(409, "CONFLICT", "Email is already used by a staff account.");
  }
  if (existingUser && !existingUser.clientProfile) {
    throw new ApiError(409, "CONFLICT", "Email is already registered. Sign in or contact the office to link it.");
  }
  if (existingUser?.clientProfile && existingUser.clientProfile.id !== context.client.id) {
    throw new ApiError(409, "CONFLICT", "Email is already linked to another client.");
  }

  const passwordHash = hashPassword(body.password);
  const user = await prisma.$transaction(async (tx) => {
    const freshClient = await tx.client.findUnique({
      where: { id: context.client.id },
      select: { id: true, userId: true, fullName: true, phone: true, email: true, status: true, deletedAt: true }
    });
    if (!freshClient || freshClient.deletedAt) {
      throw new ApiError(404, "NOT_FOUND", "Client was not found.");
    }
    if (freshClient.userId) {
      throw new ApiError(409, "CONFLICT", "Client already has a portal account.");
    }
    if (freshClient.email && freshClient.email.toLowerCase() !== body.email) {
      throw new ApiError(409, "CONFLICT", "Use the email already saved on this consultation request.");
    }

    const savedUser = existingUser
      ? await tx.user.update({
          where: { id: existingUser.id },
          data: {
            name: freshClient.fullName,
            phone: freshClient.phone,
            passwordHash,
            status: "ACTIVE",
            locale: body.locale ?? "ar"
          }
        })
      : await tx.user.create({
          data: {
            email: body.email,
            name: freshClient.fullName,
            phone: freshClient.phone,
            passwordHash,
            roleId: clientRole.id,
            status: "ACTIVE",
            locale: body.locale ?? "ar"
          }
        });

    await tx.client.update({
      where: { id: freshClient.id },
      data: {
        userId: savedUser.id,
        email: body.email,
        status: freshClient.status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE"
      }
    });

    return savedUser;
  });

  const sessionUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    include: sessionUserInclude
  });
  const session = await createSessionForUser(sessionUser, input.request);

  await appendAuditLogBestEffort({
    actorId: user.id,
    action: "client.account.public_setup",
    resourceType: "Client",
    resourceId: context.client.id,
    clientId: context.client.id,
    metadata: {
      consultationId: context.consultation.id,
      reference: context.consultation.reference,
      linkedExistingUser: Boolean(existingUser),
      source: "public-consultation-success"
    },
    request: input.request,
    requestId: input.requestId
  });

  return {
    token: session.token,
    user: clientSetupUserDto(sessionUser),
    redirectTo: "/client"
  };
}

function clientSetupUserDto(user: User & { role: { name: string }; clientProfile: { id: string } | null }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name,
    clientId: user.clientProfile?.id ?? null
  };
}

function publicAppOrigin(request?: Request) {
  const configured = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.PUBLIC_APP_URL || process.env.APP_ORIGIN;
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  if (request) {
    return new URL(request.url).origin;
  }
  return "http://localhost:3000";
}

function signTokenPayload(encodedPayload: string) {
  return createHmac("sha256", clientAccountSetupSigningSecret()).update(encodedPayload).digest("base64url");
}

function clientAccountSetupSigningSecret() {
  const secret = process.env.CLIENT_ACCOUNT_SETUP_SIGNING_SECRET || process.env.AUTH_SECRET || "";
  if (secret.length >= 32) {
    return secret;
  }
  if (process.env.APP_ENV === "production" || process.env.NODE_ENV === "production") {
    throw new ApiError(500, "INTERNAL_ERROR", "Client account setup signing secret is missing.");
  }
  return "local-client-account-setup-dev-secret-32-plus-chars";
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function invalidTokenError() {
  return new ApiError(400, "VALIDATION_ERROR", "Client account setup token is invalid.");
}
