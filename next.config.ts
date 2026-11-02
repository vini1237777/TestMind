import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",
  // Pin the workspace root so a stray lockfile higher up can't widen the build scope.
  turbopack: { root: __dirname },
};

export default withSentryConfig(nextConfig, {
  org: "73a69f221555",
  project: "testmind",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
