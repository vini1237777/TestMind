import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1,
  environment: process.env.NODE_ENV,
  enabled: true,
  enableLogs: true,
  sendDefaultPii: true,
});
