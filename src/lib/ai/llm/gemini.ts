import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

export function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  if (!client) {
    client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      ...(process.env.GEMINI_BASE_URL
        ? { httpOptions: { baseUrl: process.env.GEMINI_BASE_URL } }
        : {}),
    });
  }

  return client;
}
