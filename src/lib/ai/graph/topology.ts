// Single source of truth for the graph shapes. The workflows compile from these
// names and the UI renders the same list, so the diagram can never drift from the code.
export const GENERATION_NODES = ["generate_test_cases", "validate_generated_cases"] as const;
export const REVIEW_NODES = ["review_suite", "improve_suite"] as const;

export type WorkflowKind = "generation" | "review";

export const WORKFLOWS: Record<WorkflowKind, { id: string; label: string; nodes: readonly string[] }> = {
  generation: { id: "langgraph_generation", label: "Generation graph", nodes: GENERATION_NODES },
  review: { id: "langgraph_review", label: "Review graph", nodes: REVIEW_NODES },
};

export const NODE_INFO: Record<string, { label: string; kind: "llm" | "deterministic"; does: string }> = {
  generate_test_cases: {
    label: "Generate",
    kind: "llm",
    does: "Prompts gpt-4o-mini in JSON mode with the spec and the last review summary, then validates the reply against a Zod schema.",
  },
  validate_generated_cases: {
    label: "Validate",
    kind: "deterministic",
    does: "Normalizes ids and steps and fails the run loudly if the model returned nothing usable.",
  },
  review_suite: {
    label: "Review",
    kind: "llm",
    does: "Scores coverage out of 100, lists missing areas and proposes new cases, all schema validated.",
  },
  improve_suite: {
    label: "Improve",
    kind: "deterministic",
    does: "Merges suggestions into the suite and dedupes on type + normalized title.",
  },
};

export type NodeTrace = {
  node: string;
  status: "ok" | "error";
  startedAt: string;
  durationMs: number;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  output?: string;
};

export type RunTrace = {
  workflow: WorkflowKind;
  totalMs: number;
  nodes: NodeTrace[];
};
