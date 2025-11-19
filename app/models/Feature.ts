import { Schema, models, model } from "mongoose";

const FeatureSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    projectId: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const Feature = models.Feature || model("Feature", FeatureSchema);

export default Feature;
