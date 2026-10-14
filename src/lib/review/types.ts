export type Severity = "critical" | "high" | "medium" | "low";

export type Category =
  "bug" | "edge_case" | "security" | "performance" | "missing_test";

export type Finding = {
  title: string;
  severity: Severity;
  category: Category;
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

export type ApiErrorResponse = {
  error?: {
    code?: string;
    message?: string;
  };
};
