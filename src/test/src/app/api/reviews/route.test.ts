import { describe, expect, it } from "vitest";
import { POST } from "../../../../../app/api/reviews/route";

function createRequest(body: string) {
  return new Request("http://localhost/api/reviews", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });
}

describe("POST /api/reviews", () => {
  it("returns the submitted diff for a valid request", async () => {
    const diff = "const result = 1;";
    const response = await POST(createRequest(JSON.stringify({ diff })));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { diff },
    });
  });

  it("returns 400 for invalid JSON", async () => {
    const response = await POST(createRequest("{invalid json"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid request body",
    });
  });

  it("returns 400 when diff is missing", async () => {
    const response = await POST(createRequest(JSON.stringify({})));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "A non-empty diff is required",
    });
  });

  it("returns 400 when diff is empty", async () => {
    const response = await POST(createRequest(JSON.stringify({ diff: "   " })));

    expect(response.status).toBe(400);
  });

  it("returns 400 when diff is not a string", async () => {
    const response = await POST(createRequest(JSON.stringify({ diff: 123 })));

    expect(response.status).toBe(400);
  });
});
