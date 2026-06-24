export type MutationOriginDecision = {
  allowed: boolean;
  reason:
    | "safe_method"
    | "same_origin"
    | "missing_origin_allowed"
    | "missing_origin_rejected"
    | "missing_app_origin"
    | "cross_origin";
  expectedOrigin?: string;
  receivedOrigin?: string;
};

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function isStateChangingMethod(method: string) {
  return !SAFE_METHODS.has(method.toUpperCase());
}

export function evaluateMutationOrigin(input: {
  method: string;
  requestUrl: string;
  originHeader?: string | null;
  refererHeader?: string | null;
  appOrigin?: string | null;
  strictMissingOrigin?: boolean;
}): MutationOriginDecision {
  if (!isStateChangingMethod(input.method)) {
    return { allowed: true, reason: "safe_method" };
  }

  const configuredOrigin = normalizeOrigin(input.appOrigin);
  if (input.strictMissingOrigin && !configuredOrigin) {
    return { allowed: false, reason: "missing_app_origin" };
  }

  const expectedOrigin = configuredOrigin ?? normalizeOrigin(input.requestUrl);
  if (!expectedOrigin) {
    return { allowed: false, reason: "missing_app_origin" };
  }

  const receivedOrigin = normalizeOrigin(input.originHeader) ?? normalizeOrigin(input.refererHeader);
  if (!receivedOrigin) {
    return {
      allowed: !input.strictMissingOrigin,
      reason: input.strictMissingOrigin ? "missing_origin_rejected" : "missing_origin_allowed",
      expectedOrigin
    };
  }

  const isSameOrigin =
    receivedOrigin === expectedOrigin ||
    (!input.strictMissingOrigin && isEquivalentLocalDevOrigin(receivedOrigin, expectedOrigin));

  return {
    allowed: isSameOrigin,
    reason: isSameOrigin ? "same_origin" : "cross_origin",
    expectedOrigin,
    receivedOrigin
  };
}

export function shouldUseStrictMutationOrigin(env: NodeJS.ProcessEnv = process.env) {
  if (env.CSRF_STRICT_ORIGIN === "true") {
    return true;
  }
  if (env.CSRF_STRICT_ORIGIN === "false") {
    return false;
  }
  return env.APP_ENV === "production" || env.NODE_ENV === "production";
}

function normalizeOrigin(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isEquivalentLocalDevOrigin(left: string, right: string) {
  try {
    const leftUrl = new URL(left);
    const rightUrl = new URL(right);
    return (
      leftUrl.protocol === rightUrl.protocol &&
      leftUrl.port === rightUrl.port &&
      isLoopbackHost(leftUrl.hostname) &&
      isLoopbackHost(rightUrl.hostname)
    );
  } catch {
    return false;
  }
}

function isLoopbackHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]";
}
