import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../../../../../app/api/reviews/route";

const { create } = vi.hoisted(() => ({
  create: vi.fn(),
}));

vi.mock("openai", () => ({
  default: class OpenAI {
    chat = {
      completions: {
        create,
      },
    };

    constructor() {}
  },
}));

function createRequest(body: string) {
  return new Request("http://localhost/api/reviews", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });
}

function mockModelReview(review: unknown) {
  create.mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify(review),
        },
      },
    ],
  });
}

function validFinding(overrides: Record<string, unknown> = {}) {
  return {
    severity: "high",
    filePath: "src/example.ts",
    line: 1,
    title: "Potential bug",
    description: "This code may fail at runtime.",
    suggestion: "Add appropriate validation.",
    ...overrides,
  };
}

describe("POST /api/reviews", () => {
  beforeEach(() => {
    create.mockReset();
  });

  it("returns a review for a valid request", async () => {
    const review = {
      summary: "Potential issue found.",
      findings: [validFinding()],
    };

    mockModelReview(review);

    const response = await POST(
      createRequest(JSON.stringify({ diff: "const result = 1;" })),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reviewId).toEqual(expect.any(String));
    expect(body.result).toEqual(review);
    expect(create).toHaveBeenCalledOnce();
  });

  it("returns 400 for invalid JSON", async () => {
    const response = await POST(createRequest("{invalid json"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid request body",
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("returns 400 when diff is missing", async () => {
    const response = await POST(createRequest(JSON.stringify({})));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "A non-empty diff is required",
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("returns 400 when diff is empty", async () => {
    const response = await POST(
      createRequest(JSON.stringify({ diff: "   " })),
    );

    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it("returns 400 when diff is not a string", async () => {
    const response = await POST(
      createRequest(JSON.stringify({ diff: 123 })),
    );

    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it("returns 413 when diff exceeds the size limit", async () => {
    const response = await POST(
      createRequest(JSON.stringify({ diff: "a".repeat(30_001) })),
    );

    expect(response.status).toBe(413);
    expect(create).not.toHaveBeenCalled();
  });

  it("accepts a valid review with no findings", async () => {
    const review = {
      summary: "No significant issues found.",
      findings: [],
    };

    mockModelReview(review);

    const response = await POST(
      createRequest(JSON.stringify({ diff: "const result = 1;" })),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.result).toEqual(review);
  });

  it("returns 502 when the model returns invalid JSON", async () => {
    create.mockResolvedValue({
      choices: [{ message: { content: "not valid JSON" } }],
    });

    const response = await POST(
      createRequest(JSON.stringify({ diff: "const result = 1;" })),
    );

    expect(response.status).toBe(502);
  });

  it("returns 502 when the model returns an invalid severity", async () => {
    mockModelReview({
      summary: "Potential issue found.",
      findings: [validFinding({ severity: "urgent" })],
    });

    const response = await POST(
      createRequest(JSON.stringify({ diff: "const result = 1;" })),
    );

    expect(response.status).toBe(502);
  });

  it("returns 502 when a finding has an invalid line number", async () => {
    mockModelReview({
      summary: "Potential issue found.",
      findings: [validFinding({ line: 0 })],
    });

    const response = await POST(
      createRequest(JSON.stringify({ diff: "const result = 1;" })),
    );

    expect(response.status).toBe(502);
  });

  it("returns 502 when a finding is missing required fields", async () => {
    mockModelReview({
      summary: "Potential issue found.",
      findings: [
        {
          severity: "high",
          filePath: "src/example.ts",
          line: 1,
          title: "Missing description",
        },
      ],
    });

    const response = await POST(
      createRequest(JSON.stringify({ diff: "const result = 1;" })),
    );

    expect(response.status).toBe(502);
  });

  it("returns 502 when the model request fails", async () => {
    create.mockRejectedValue(new Error("Model unavailable"));

    const response = await POST(
      createRequest(JSON.stringify({ diff: "const result = 1;" })),
    );

    expect(response.status).toBe(502);
  });
});