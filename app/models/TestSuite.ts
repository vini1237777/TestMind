import { Schema, model, models } from "mongoose";

const TestCaseSchema = new Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ["happy", "negative", "edge"],
      required: true,
    },
    title: { type: String, required: true },
    steps: [{ type: String, required: true }],
    expected: { type: String, required: true },
    samplePayload: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const TestSuiteSchema = new Schema({
  name: { type: String, required: true },
  featureName: { type: String, required: true },
  description: { type: String, default: "" },
  projectId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  testCases: { type: [TestCaseSchema], default: [] },
});

const TestSuite = models.TestSuite || model("TestSuite", TestSuiteSchema);

export default TestSuite;
