import { loadEnvConfig } from "@next/env";

// Imported first because other modules read process.env as they load.
// Env files only exist in development. Variables already set take priority.
loadEnvConfig(process.cwd());
