import { Schema, model, models } from "mongoose";

// _id is the sha256 of the cookie token, so a leaked database cannot sign anyone in.
const SessionSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);

// MongoDB removes a session once it expires.
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = models.Session || model("Session", SessionSchema);

export default Session;
