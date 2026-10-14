"use client";

import type { FeedbackVote, Finding, Severity } from "@/types/review";

const severityOrder: Severity[] = ["critical", "high", "medium", "low"];

const severityLabels: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const categoryLabels: Record<string, string> = {
  bug: "Bug",
  edge_case: "Edge case",
  security: "Security",
  performance: "Performance",
  missing_test: "Missing test",
};

function isSeverity(value: string): value is Severity {
  return severityOrder.includes(value as Severity);
}

type FindingCardProps = {
  finding: Finding;
  index: number;
  vote?: FeedbackVote;
  onVote: (index: number, vote: FeedbackVote) => void;
};

export default function FindingCard({
  finding,
  index,
  vote,
  onVote,
}: FindingCardProps) {
  const severity = isSeverity(finding.severity) ? finding.severity : "medium";

  return (
    <article className="finding-card">
      <div className="finding-topline">
        <div className="finding-badges">
          <span className={`severity-badge severity-${severity}`}>
            {severityLabels[severity]}
          </span>
          <span className="category-badge">
            {categoryLabels[finding.category] ?? finding.category}
          </span>
        </div>
        <span className="finding-number">
          #{String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <h3 className="finding-title">{finding.title}</h3>

      <div className="finding-location">
        <span aria-hidden="true">⌘</span>
        <code>{finding.filePath}</code>
        <span className="location-line">
          {finding.lineNumber != null
            ? `:L${finding.lineNumber}`
            : ": location unavailable"}
        </span>
      </div>

      <p className="finding-description">{finding.description}</p>

      <div className="evidence-block">
        <span className="detail-label">WHY IT MATTERS</span>
        <p>{finding.evidence}</p>
      </div>

      {finding.suggestion && (
        <div className="suggestion-block">
          <span className="detail-label">SUGGESTED FIX</span>
          <p>{finding.suggestion}</p>
        </div>
      )}

      <div className="finding-footer">
        <span className="feedback-prompt">Was this finding useful?</span>
        <div className="feedback-actions">
          <button
            type="button"
            className={`feedback-button ${vote === "helpful" ? "selected" : ""}`}
            aria-pressed={vote === "helpful"}
            onClick={() => onVote(index, "helpful")}
          >
            <span aria-hidden="true">↑</span> Helpful
          </button>
          <button
            type="button"
            className={`feedback-button ${vote === "incorrect" ? "selected" : ""}`}
            aria-pressed={vote === "incorrect"}
            onClick={() => onVote(index, "incorrect")}
          >
            <span aria-hidden="true">↓</span> Incorrect
          </button>
        </div>
      </div>
    </article>
  );
}
