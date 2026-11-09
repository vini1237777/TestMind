import { Schema, model, models } from "mongoose";

// One saved test case, ready for retrieval. The vector index that searches
// `embedding` lives in Atlas: see atlas/test-case-chunks-vector-index.json.
const TestCaseChunkSchema = new Schema(
  {
    _id: { type: String, required: true },
    projectId: { type: String, required: true },
    suiteId: { type: String, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true, select: false },
  },
  { timestamps: true, versionKey: false },
);

TestCaseChunkSchema.index({ suiteId: 1 });

const TestCaseChunk =
  models.TestCaseChunk || model("TestCaseChunk", TestCaseChunkSchema);

export default TestCaseChunk;
