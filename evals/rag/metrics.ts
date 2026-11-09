export type EvalCase = { id: string; project: string; text: string };

export type EvalQuery = {
  project: string;
  text: string;
  // Cases a useful search should return. Empty means nothing here is relevant.
  relevant: string[];
};

export type Ranked = { id: string; score: number };

export function cosine(a: number[], b: number[]) {
  let dot = 0;
  let aSize = 0;
  let bSize = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    aSize += a[i] * a[i];
    bSize += b[i] * b[i];
  }
  return dot / Math.sqrt(aSize * bSize);
}

// The score Atlas reports for cosine, so RAG_MIN_SCORE means the same thing here.
export const atlasScore = (a: number[], b: number[]) => (1 + cosine(a, b)) / 2;

export function hitAt(ranked: Ranked[], relevant: string[], k: number) {
  return ranked.slice(0, k).some((item) => relevant.includes(item.id)) ? 1 : 0;
}

export function recallAt(ranked: Ranked[], relevant: string[], k: number) {
  const found = ranked.slice(0, k).filter((item) => relevant.includes(item.id));
  return found.length / relevant.length;
}

export const mean = (values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;
