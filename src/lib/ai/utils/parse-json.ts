export function parseJson<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    throw new Error(
      `Failed to parse AI JSON response: ${
        error instanceof Error ? error.message : "Unknown parsing error"
      }`
    );
  }
}
