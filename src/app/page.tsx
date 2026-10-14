"use client";

import { useState } from "react";
import type {
  ApiError,
  FeedbackVote,
  ReviewApiResponse,
  ReviewResult,
} from "@/types/review";

import Header from "./components/header";
import Hero from "./components/hero";
import ReviewForm, { SAMPLE_DIFF } from "./components/review-form";
import ReviewResults from "./components/review-results";
import Footer from "./components/footer";

type ReviewState = "idle" | "loading" | "success" | "error";

function getErrorMessage(payload: ApiError, status: number): string {
  if (payload.error?.message) {
    return payload.error.message;
  }

  if (status === 429) {
    return "Too many requests. Please wait and try again.";
  }

  if (status >= 500) {
    return "The review service is temporarily unavailable.";
  }

  return "Something went wrong. Please check your diff and try again.";
}

export default function HomePage() {
  const [diff, setDiff] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [status, setStatus] = useState<ReviewState>("idle");
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [votes, setVotes] = useState<Record<number, FeedbackVote | undefined>>(
    {},
  );

  function resetReview() {
    setResult(null);
    setReviewId(null);
    setVotes({});
    setError("");
    setStatus("idle");
  }

  function loadSample() {
    setDiff(SAMPLE_DIFF);
    setLanguage("typescript");
    resetReview();
  }

  async function handleReview() {
    if (!diff.trim() || diff.length > 30_000 || status === "loading") {
      return;
    }

    setStatus("loading");
    setError("");
    setResult(null);
    setReviewId(null);
    setVotes({});

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          diff,
          language: language || undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        (ReviewApiResponse & ApiError) | null;

      if (!response.ok) {
        throw new Error(getErrorMessage(payload ?? {}, response.status));
      }

      if (
        !payload?.reviewId ||
        !payload.result ||
        !Array.isArray(payload.result.findings) ||
        typeof payload.result.summary !== "string"
      ) {
        throw new Error("The server returned an invalid review response.");
      }

      setReviewId(payload.reviewId);
      setResult(payload.result);
      setStatus("success");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete the review. Please try again.",
      );
      setStatus("error");
    }
  }

  function handleVote(index: number, vote: FeedbackVote) {
    setVotes((current) => ({
      ...current,
      [index]: current[index] === vote ? undefined : vote,
    }));
  }

  return (
    <main className="app-shell">
      <Header
        onHome={() => {
          resetReview();
          setDiff("");
        }}
      />

      <Hero />

      <section className="workspace">
        <ReviewForm
          diff={diff}
          language={language}
          status={status}
          error={error}
          onDiffChange={setDiff}
          onLanguageChange={setLanguage}
          onReview={handleReview}
          onLoadSample={loadSample}
        />

        <ReviewResults
          status={status}
          result={result}
          reviewId={reviewId}
          votes={votes}
          onVote={handleVote}
          onLoadSample={loadSample}
          onRetry={handleReview}
          canRetry={Boolean(diff.trim()) && diff.length <= 30_000}
        />
      </section>

      <Footer />
    </main>
  );
}
