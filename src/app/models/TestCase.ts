import mongoose, { Schema } from "mongoose";

const TestCaseSchema = new Schema({
  id: String,
  type: String,
  title: String,
  steps: [String],
  expected: String,
  samplePayload: Schema.Types.Mixed,
});

TestCaseSchema.index({ id: 1, createdAt: -1 });

export const TestCase =
  mongoose.models.TestCase || mongoose.model("TestCase", TestCaseSchema);
