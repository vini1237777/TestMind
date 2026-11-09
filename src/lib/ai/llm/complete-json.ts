import type { z } from "zod";
import { getGeminiClient } from "@/src/lib/ai/llm/gemini";
import { getOpenAIClient, type LlmUsage } from "@/src/lib/ai/llm/openai";
import { parseJson } from "@/src/lib/ai/utils/parse-json";

const OPENAI_MODEL = "gpt-4o-mini";
const GEMINI_MODEL = "gemini-2.5-flash";
const TIMEOUT_MS = 60_000;

export type LlmProvider = {
  name: string;
  isConfigured: () => boolean;
  complete: (prompt: string) => Promise<{ text: string; usage: LlmUsage }>;
};

const openAIProvider: LlmProvider = {
  name: "openai",
  isConfigured: () => Boolean(process.env.OPENAI_API_KEY),
  complete: async (prompt) => {
    const completion = await getOpenAIClient().chat.completions.create(
      {
        model: OPENAI_MODEL,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
      },
      // The fallback is the retry, so a failing provider is not retried first.
      { timeout: TIMEOUT_MS, maxRetries: 0 },
    );
    return {
      text: completion.choices[0]?.message?.content ?? "",
      usage: {
        model: completion.model,
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
      },
    };
  },
};

const geminiProvider: LlmProvider = {
  name: "gemini",
  isConfigured: () => Boolean(process.env.GEMINI_API_KEY),
  complete: async (prompt) => {
    const response = await getGeminiClient().models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        httpOptions: { timeout: TIMEOUT_MS },
      },
    });
    return {
      text: response.text ?? "",
      usage: {
        model: response.modelVersion ?? GEMINI_MODEL,
        promptTokens: response.usageMetadata?.promptTokenCount,
        completionTokens: response.usageMetadata?.candidatesTokenCount,
      },
    };
  },
};

export const DEFAULT_PROVIDERS = [openAIProvider, geminiProvider];

export class AllProvidersFailedError extends Error {
  constructor(public readonly failures: { provider: string; error: string }[]) {
    super(
      `All AI providers failed: ${failures.map((f) => `${f.provider}: ${f.error}`).join("; ")}`,
    );
    this.name = "AllProvidersFailedError";
  }
}

// Tries each configured provider in order. Output that fails the schema counts
// as a failure too, because a broken suite is no more use than an outage.
export async function completeJson<S extends z.ZodType>(
  prompt: string,
  schema: S,
  providers: LlmProvider[] = DEFAULT_PROVIDERS,
): Promise<{ data: z.output<S>; usage: LlmUsage; provider: string }> {
  const failures: { provider: string; error: string }[] = [];

  for (const provider of providers) {
    if (!provider.isConfigured()) continue;
    try {
      const { text, usage } = await provider.complete(prompt);
      if (!text) throw new Error("Empty response");
      const data = schema.parse(parseJson<unknown>(text));
      if (failures.length) {
        console.warn(`[llm] ${provider.name} served after: ${failures.map((f) => f.provider).join(", ")}`);
      }
      return { data, usage, provider: provider.name };
    } catch (err) {
      const error = err instanceof Error ? err.message.slice(0, 200) : "Unknown error";
      console.error(`[llm] ${provider.name} failed: ${error}`);
      failures.push({ provider: provider.name, error });
    }
  }

  if (!failures.length) {
    throw new Error("No AI provider is configured. Set OPENAI_API_KEY or GEMINI_API_KEY.");
  }
  throw new AllProvidersFailedError(failures);
}
