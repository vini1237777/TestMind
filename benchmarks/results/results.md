# List cache benchmark

Measured on 2026-11-09 with `npm run bench:cache`, from a production build of `19eda50`. Raw summaries are in this folder.

| Setup | Runs | Median req/s | Range req/s | Median p50 | Median p99 | Failed |
|---|---|---|---|---|---|---|
| Cache off | 3 | 159 | 152 to 163 | 294 ms | 491 ms | 0 |
| Cache on | 3 | 234 | 186 to 235 | 198 ms | 449 ms | 0 |

## How it was measured

- autocannon with 50 connections for 30 seconds per run, on `GET /api/suites`.
- One Next.js process, with local MongoDB and Redis. The data is 30 suites of 8 cases each.
- The app code is the deployed code. `upstash-local.mjs` gives it the Upstash REST API on top of local Redis, and hides the list cache when it is off.
- Each request sends a different `x-real-ip`, so the 10 a minute limiter still runs on every request but does not reject the load.

## What this does not show

- **Remote database.** MongoDB is on the same machine, so a cache miss is much cheaper here than against Atlas. The gain in production could be larger, and this test cannot say by how much.
- **Real Upstash.** The adapter is one Node process and adds its own overhead to every request, in both setups.
- **Production capacity.** This ran on an Apple M2 laptop with the load generator on the same machine, and production runs 2 web processes instead of 1.
