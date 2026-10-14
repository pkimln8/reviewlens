"use client";

import type {
  FeedbackVote,
  Finding,
  ReviewResult,
  Severity,
} from "@/types/review";
import FindingCard from "./finding-card";

type ReviewState = "idle" | "loading" | "success" | "error";

const severityOrder: Severity[] = ["critical", "high", "medium", "low"];

const severityLabels: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

type ReviewResultsProps = {
  status: ReviewState;
  result: ReviewResult | null;
  reviewId: string | null;
  votes: Record<number, FeedbackVote | undefined>;
  onVote: (index: number, vote: FeedbackVote) => void;
  onLoadSample: () => void;
  onRetry: () => void;
  canRetry: boolean;
};

export default function ReviewResults({
  status,
  result,
  reviewId,
  votes,
  onVote,
  onLoadSample,
  onRetry,
  canRetry,
}: ReviewResultsProps) {
  const findings: Finding[] = result?.findings ?? [];

  const severityCounts = severityOrder.reduce(
    (counts, severity) => {
      counts[severity] = findings.filter(
        (finding) => finding.severity === severity,
      ).length;
      return counts;
    },
    {} as Record<Severity, number>,
  );

  return (
    <div className="results-panel">
      <div className="panel-heading results-heading">
        <div>
          <span className="step-label">02 / RESULTS</span>
          <h2>Review findings</h2>
        </div>
        {status === "success" && (
          <span className="result-count">
            {findings.length} {findings.length === 1 ? "finding" : "findings"}
          </span>
        )}
      </div>

      {status === "idle" && (
        <div className="empty-state">
          <div className="empty-illustration" aria-hidden="true">
            <svg viewBox="0 0 80 80" fill="none">
              <rect
                x="13"
                y="9"
                width="43"
                height="55"
                rx="6"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M23 23h22M23 32h13M23 41h17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle
                cx="54"
                cy="51"
                r="13"
                fill="var(--surface)"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="m63 61 7 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h3>Ready for a closer look?</h3>
          <p>
            Your review will appear here, with clear explanations and practical
            suggestions for every finding.
          </p>
          <button
            type="button"
            className="secondary-button"
            onClick={onLoadSample}
          >
            Try a sample diff <span aria-hidden="true">→</span>
          </button>
        </div>
      )}

      {status === "loading" && (
        <div className="loading-state" role="status" aria-live="polite">
          <div className="loading-orbit">
            <span />
            <span />
            <span />
          </div>
          <h3>Looking for potential issues</h3>
          <p>
            Analyzing your changes, checking edge cases, and preparing
            suggestions.
          </p>
          <div className="loading-progress">
            <span />
          </div>
          <span className="loading-caption">This may take a few seconds.</span>
        </div>
      )}

      {status === "error" && (
        <div className="empty-state error-state">
          <div className="error-illustration" aria-hidden="true">
            !
          </div>
          <h3>We couldn&apos;t finish the review</h3>
          <p>Check the error above and try again when you&apos;re ready.</p>
          <button
            type="button"
            className="secondary-button"
            onClick={onRetry}
            disabled={!canRetry}
          >
            Try again <span aria-hidden="true">↻</span>
          </button>
        </div>
      )}

      {status === "success" && result && (
        <div className="results-content">
          <div className="summary-card">
            <div className="summary-heading">
              <span className="summary-icon" aria-hidden="true">
                ✳
              </span>
              <span>AI SUMMARY</span>
            </div>
            <p>{result.summary}</p>

            <div className="severity-summary">
              {severityOrder.map((severity) => (
                <span className="severity-count" key={severity}>
                  <span className={`severity-dot severity-dot-${severity}`} />
                  {severityLabels[severity]}
                  <strong>{severityCounts[severity]}</strong>
                </span>
              ))}
            </div>
          </div>

          {findings.length === 0 ? (
            <div className="clean-state">
              <span className="clean-icon" aria-hidden="true">
                ✓
              </span>
              <h3>No significant issues found</h3>
              <p>
                The AI didn&apos;t identify actionable issues in this diff. This
                doesn&apos;t guarantee that the code is bug-free.
              </p>
            </div>
          ) : (
            <div className="findings-list">
              {findings.map((finding, index) => (
                <FindingCard
                  key={`${finding.filePath}-${finding.lineNumber}-${index}`}
                  finding={finding}
                  index={index}
                  vote={votes[index]}
                  onVote={onVote}
                />
              ))}
            </div>
          )}

          <div className="results-disclaimer">
            AI findings may be incorrect or incomplete. Verify suggestions
            before applying them.
            {reviewId && (
              <span className="review-id">Review ID: {reviewId}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
