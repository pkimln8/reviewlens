export type Severity = "critical" | "high" | "medium" | "low";

export type FindingCategory =
  "bug" | "edge_case" | "security" | "performance" | "missing_test";

export type Finding = {
  title: string;
  severity: Severity;
  category: FindingCategory;
  filePath: string;
  lineNumber: number | null;
  description: string;
  evidence: string;
  suggestion: string;
  confidence: number;
};

export type ReviewResult = {
  summary: string;
  findings: Finding[];
};

export type ReviewApiResponse = {
  reviewId: string;
  result: ReviewResult;
};

export type ApiError = {
  error?: {
    code?: string;
    message?: string;
  };
};

export type FeedbackVote = "helpful" | "incorrect";
