import OpenAI from "openai";
import { NextResponse } from "next/server";
import { REVIEW_SYSTEM_PROMPT } from "@/lib/review-prompt";

const ALLOWED_SEVERITIES = [
  "critical",
  "high",
  "medium",
  "low",
] as const;

type ReviewFinding = {
  severity: (typeof ALLOWED_SEVERITIES)[number];
  filePath: string;
  line: number | null;
  title: string;
  description: string;
  suggestion: string;
};

type ReviewResult = {
  summary: string;
  findings: ReviewFinding[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isReviewResult(value: unknown): value is ReviewResult {
  if (
    !isRecord(value) ||
    typeof value.summary !== "string" ||
    !Array.isArray(value.findings)
  ) {
    return false;
  }

  return value.findings.every((finding: unknown) => {
    if (!isRecord(finding)) {
      return false;
    }

    return (
      typeof finding.severity === "string" &&
      ALLOWED_SEVERITIES.includes(
        finding.severity as (typeof ALLOWED_SEVERITIES)[number],
      ) &&
      typeof finding.filePath === "string" &&
      (finding.line === null ||
        (typeof finding.line === "number" &&
          Number.isInteger(finding.line) &&
          finding.line >= 1)) &&
      typeof finding.title === "string" &&
      finding.title.trim().length > 0 &&
      typeof finding.description === "string" &&
      finding.description.trim().length > 0 &&
      typeof finding.suggestion === "string" &&
      finding.suggestion.trim().length > 0
    );
  });
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
      max_tokens: 1200,
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