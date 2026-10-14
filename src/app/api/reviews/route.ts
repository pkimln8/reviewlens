
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { REVIEW_SYSTEM_PROMPT } from "@/lib/review-prompt";
import type {
  Finding,
  FindingCategory,
  ReviewResult,
  Severity,
} from "@/types/review";

const ALLOWED_SEVERITIES: readonly Severity[] = [
  "critical",
  "high",
  "medium",
  "low",
];

const ALLOWED_CATEGORIES: readonly FindingCategory[] = [
  "bug",
  "edge_case",
  "security",
  "performance",
  "missing_test",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isSeverity(value: unknown): value is Severity {
  return (
    typeof value === "string" &&
    ALLOWED_SEVERITIES.includes(value as Severity)
  );
}

function isFindingCategory(value: unknown): value is FindingCategory {
  return (
    typeof value === "string" &&
    ALLOWED_CATEGORIES.includes(value as FindingCategory)
  );
}

function isFinding(value: unknown): value is Finding {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.title === "string" &&
    value.title.trim().length > 0 &&
    isSeverity(value.severity) &&
    isFindingCategory(value.category) &&
    typeof value.filePath === "string" &&
    value.filePath.trim().length > 0 &&
    (value.lineNumber === null ||
      (typeof value.lineNumber === "number" &&
        Number.isInteger(value.lineNumber) &&
        value.lineNumber >= 1)) &&
    typeof value.description === "string" &&
    value.description.trim().length > 0 &&
    typeof value.evidence === "string" &&
    value.evidence.trim().length > 0 &&
    typeof value.suggestion === "string" &&
    value.suggestion.trim().length > 0 &&
    typeof value.confidence === "number" &&
    Number.isFinite(value.confidence) &&
    value.confidence >= 0 &&
    value.confidence <= 1
  );
}

function isReviewResult(value: unknown): value is ReviewResult {
  return (
    isRecord(value) &&
    typeof value.summary === "string" &&
    Array.isArray(value.findings) &&
    value.findings.every(isFinding)
  );
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "ollama",
  baseURL:
    process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (
    !isRecord(body) ||
    typeof body.diff !== "string" ||
    body.diff.trim().length === 0
  ) {
    return NextResponse.json(
      { error: "A non-empty diff is required" },
      { status: 400 },
    );
  }

  const diff = body.diff;

  if (diff.length > 30_000) {
    return NextResponse.json(
      { error: "Diff is too large" },
      { status: 413 },
    );
  }

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "qwen2.5-coder:7b",
      temperature: 0,
      max_tokens: 1600,
      messages: [
        {
          role: "system",
          content: REVIEW_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Review this git diff:\n\n${diff}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message.content;

    if (!content) {
      throw new Error("The model returned an empty response.");
    }

    const parsed: unknown = JSON.parse(content);

    if (!isReviewResult(parsed)) {
      throw new Error("The model returned an invalid review format.");
    }

    return NextResponse.json({
      reviewId: crypto.randomUUID(),
      result: parsed,
    });
  } catch (error) {
    console.error("Code review failed:", error);

    return NextResponse.json(
      {
        error: "Unable to complete the code review. Please try again.",
      },
      { status: 502 },
    );
  }
}
