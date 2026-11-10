// One fixed request rate on the signed in project list, run once per rate by
// benchmarks/run-load-test.mjs (MODE=capacity) to find where latency climbs.
import http from "k6/http";
import { check } from "k6";

const RATE = Number(__ENV.RATE || 100);

export const options = {
  scenarios: {
    list: {
      executor: "constant-arrival-rate",
      rate: RATE,
      timeUnit: "1s",
      duration: __ENV.DURATION || "30s",
      preAllocatedVUs: Math.min(RATE, 500),
      maxVUs: 2000,
    },
  },
};

// Each request comes from its own address, so the 10 a minute limit per IP does
// not reject the load. The limiter itself still runs on every request.
const ip = () => `10.${__VU % 250}.${Math.floor(__ITER / 250) % 250}.${__ITER % 250}`;

export default function () {
  const res = http.get(`${__ENV.BASE_URL}/api/projects`, {
    headers: { cookie: `tm_session=${__ENV.SESSION_TOKEN}`, "x-real-ip": ip() },
  });
  check(res, { "list 200": (r) => r.status === 200 });
}
