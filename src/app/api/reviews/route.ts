import { NextResponse } from "next/server";

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
    typeof body !== "object" ||
    body === null ||
    !("diff" in body) ||
    typeof body.diff !== "string" ||
    body.diff.trim().length === 0
  ) {
    return NextResponse.json(
      { error: "A non-empty diff is required" },
      { status: 400 },
    );
  }

  // TODO: Connect the actual code review logic.
  return NextResponse.json({
    success: true,
    data: body,
  });
}
