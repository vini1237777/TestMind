// Two kinds of traffic at once, run by benchmarks/run-load-test.mjs:
// readers open the home page and their project list, and writers start a
// generation and poll until the worker finishes it.
import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const BASE = __ENV.BASE_URL;
const COOKIE = `tm_session=${__ENV.SESSION_TOKEN}`;
const PROJECT_ID = __ENV.PROJECT_ID;
const DURATION = __ENV.DURATION || "60s";
const READERS = Number(__ENV.READERS || 50);
const GENERATIONS_PER_SECOND = Number(__ENV.GENERATIONS_PER_SECOND || 2);

const generationTime = new Trend("generation_end_to_end", true);
const generationOk = new Rate("generation_ok");
const queueBusy = new Counter("generation_queue_busy");

export const options = {
  scenarios: {
    readers: { executor: "constant-vus", exec: "read", vus: READERS, duration: DURATION },
    writers: {
      executor: "constant-arrival-rate",
      exec: "generate",
      rate: GENERATIONS_PER_SECOND,
      timeUnit: "1s",
      duration: DURATION,
      preAllocatedVUs: 50,
      maxVUs: 400,
    },
  },
  // The per request lines also make the summary report each request on its own.
  thresholds: {
    "http_req_failed{scenario:readers}": ["rate<0.01"],
    "http_req_duration{name:home}": ["p(95)<2000"],
    "http_req_duration{name:project list}": ["p(95)<1000"],
    "http_req_duration{name:start generation}": ["p(95)<1000"],
    "http_req_duration{name:poll generation}": ["p(95)<1000"],
    generation_ok: ["rate>0.99"],
  },
};

// Each request comes from its own address, so the 10 a minute limit per IP
// does not reject the load. The limiter itself still runs on every request.
const ip = () => `10.${__VU % 250}.${Math.floor(__ITER / 250) % 250}.${__ITER % 250}`;
const headers = (extra = {}) => ({ cookie: COOKIE, "x-real-ip": ip(), ...extra });

export function read() {
  const home = http.get(`${BASE}/`, { headers: headers(), tags: { name: "home" } });
  check(home, { "home 200": (r) => r.status === 200 });
  const list = http.get(`${BASE}/api/projects`, { headers: headers(), tags: { name: "project list" } });
  check(list, { "list 200": (r) => r.status === 200 });
  sleep(1);
}

export function generate() {
  const started = Date.now();
  const res = http.post(
    `${BASE}/api/generate-tests`,
    JSON.stringify({
      projectId: PROJECT_ID,
      featureName: `Load ${__VU}-${__ITER}-${started}`,
      description: "Customers pay for a cart with a saved card and can apply one coupon.",
    }),
    { headers: headers({ "content-type": "application/json" }), tags: { name: "start generation" } },
  );
  if (res.status === 503) queueBusy.add(1);
  if (!check(res, { "generation accepted": (r) => r.status === 202 })) {
    generationOk.add(false);
    return;
  }
  const jobId = res.json("jobId");
  for (let i = 0; i < 240; i++) {
    sleep(0.5);
    const poll = http.get(`${BASE}/api/generate-tests/${jobId}`, { headers: headers(), tags: { name: "poll generation" } });
    const status = poll.status === 200 ? poll.json("status") : "error";
    if (status === "done" || status === "failed" || status === "error") {
      const ok = status === "done";
      generationOk.add(ok);
      if (ok) generationTime.add(Date.now() - started);
      return;
    }
  }
  generationOk.add(false);
}
