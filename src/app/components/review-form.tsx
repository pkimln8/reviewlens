"use client";

const SAMPLE_DIFF = `diff --git a/src/cart.ts b/src/cart.ts
index 1234567..abcdefg 100644
--- a/src/cart.ts
+++ b/src/cart.ts
@@ -1,7 +1,5 @@
 export type CartItem = {
   price: number;
 };

 export function calculateTotal(items: CartItem[]): number {
-  return items.reduce((sum, item) => sum + item.price, 0);
+  return items[0].price;
 }
`;

type ReviewFormProps = {
  diff: string;
  language: string;
  status: "idle" | "loading" | "success" | "error";
  error: string;
  onDiffChange: (diff: string) => void;
  onLanguageChange: (language: string) => void;
  onReview: () => void;
  onLoadSample: () => void;
};

export default function ReviewForm({
  diff,
  language,
  status,
  error,
  onDiffChange,
  onLanguageChange,
  onReview,
  onLoadSample,
}: ReviewFormProps) {
  const isLoading = status === "loading";

  return (
    <div className="panel editor-panel">
      <div className="panel-heading">
        <div>
          <span className="step-label">01 / INPUT</span>
          <h2>Review your changes</h2>
        </div>
        <button
          type="button"
          className="text-button"
          onClick={onLoadSample}
          disabled={isLoading}
        >
          ↗ Load sample diff
        </button>
      </div>

      <div className="editor-toolbar">
        <label htmlFor="language">Language</label>
        <select
          id="language"
          value={language}
          onChange={(event) => onLanguageChange(event.target.value)}
          disabled={isLoading}
        >
          <option value="typescript">TypeScript</option>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="php">PHP</option>
          <option value="unknown">Other / Auto-detect</option>
        </select>
        <span className="editor-hint">Unified diff</span>
      </div>

      <label htmlFor="diff-input" className="sr-only">
        Code diff
      </label>
      <textarea
        id="diff-input"
        className="diff-input"
        value={diff}
        onChange={(event) => onDiffChange(event.target.value)}
        placeholder={[
          "Paste your git diff here...",
          "",
          "Example:",
          "diff --git a/src/example.ts b/src/example.ts",
          "@@ -10,3 +10,4 @@",
          "- oldValue();",
          "+ newValue();",
        ].join("\n")}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        disabled={isLoading}
      />

      <div className="editor-footer">
        <span>{diff.length.toLocaleString()} characters</span>
        <span className={diff.length > 30_000 ? "limit-warning" : ""}>
          Max 30,000
        </span>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          <span className="error-icon" aria-hidden="true">
            !
          </span>
          <div>
            <strong>Review unsuccessful</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      <button
        type="button"
        className="primary-button"
        onClick={onReview}
        disabled={!diff.trim() || diff.length > 30_000 || isLoading}
      >
        {isLoading ? (
          <>
            <span className="spinner" />
            Analyzing your code...
          </>
        ) : (
          <>
            Review code
            <span aria-hidden="true">→</span>
          </>
        )}
      </button>

      <p className="privacy-note">
        <span aria-hidden="true">◈</span>
        Your diff is sent to the AI provider for analysis. Avoid submitting
        secrets or sensitive code.
      </p>
    </div>
  );
}

export { SAMPLE_DIFF };
