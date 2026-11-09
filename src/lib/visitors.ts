import { createHmac } from "node:crypto";
import { isbot } from "isbot";

export function isBot(userAgent: string | null) {
  return !userAgent || isbot(userAgent);
}

// A keyed hash, so the network address itself is never stored.
export function visitorId(ip: string, secret: string) {
  return createHmac("sha256", secret).update(ip).digest("hex");
}
