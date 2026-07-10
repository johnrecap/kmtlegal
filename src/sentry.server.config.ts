import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "@/lib/sentry-privacy";

const enabled = process.env.SENTRY_ENABLED === "true" && Boolean(process.env.SENTRY_DSN);

Sentry.init({
  enabled,
  dsn: enabled ? process.env.SENTRY_DSN : undefined,
  environment: process.env.APP_ENV ?? process.env.NODE_ENV,
  release: process.env.APP_RELEASE,
  sendDefaultPii: false,
  tracesSampleRate: 0,
  beforeSend: (event) => scrubSentryEvent(event)
});
