// @vitest-environment node

import { describe, expect, it } from "vitest";
import OpenAI from "openai";
import { REVIEW_SYSTEM_PROMPT } from "@/lib/review-prompt";
import { reviewCases } from "./fixtures/review-cases";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "ollama",
  baseURL: process.env.OPENAI_BASE_URL || "http://localhost:11434/v1",
});

const model = process.env.OPENAI_MODEL || "qwen2.5-coder:7b";

describe("ReviewLens review quality", () => {
  const selectedCases = [
    "hardcoded password logged to console",
    "null dereference",
    "safe multiplication",
  ];

  for (const name of selectedCases) {
    const testCase = reviewCases.find((item) => item.name === name);

    if (!testCase) {
      throw new Error(`Missing review test case: ${name}`);
    }

    it(
      name,
      async () => {
        const response = await openai.chat.completions.create({
          model,
          temperature: 0,
          max_tokens: 800,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: REVIEW_SYSTEM_PROMPT },
            {
              role: "user",
              content: `Review this git diff:\n\n${testCase.diff}`,
            },
          ],
        });

        const content = response.choices[0]?.message.content;
        expect(content).toBeTruthy();

        const result = JSON.parse(content!);

        expect(typeof result.summary).toBe("string");
        expect(Array.isArray(result.findings)).toBe(true);

        expect(result.findings.length > 0).toBe(testCase.expectFinding);
      },
      30_000,
    );
  }
});
