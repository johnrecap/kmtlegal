import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "@/lib/sentry-privacy";

const enabled = process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true" && Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

Sentry.init({
  enabled,
  dsn: enabled ? process.env.NEXT_PUBLIC_SENTRY_DSN : undefined,
  environment: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_RELEASE,
  sendDefaultPii: false,
  tracesSampleRate: 0,
  beforeSend: (event) => scrubSentryEvent(event)
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
