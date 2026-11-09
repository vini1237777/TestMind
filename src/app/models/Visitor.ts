import { Schema, model, models } from "mongoose";

const VisitorSchema = new Schema(
  {
    _id: { type: String, required: true },
    firstSeenAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

const Visitor = models.Visitor || model("Visitor", VisitorSchema);

export default Visitor;
