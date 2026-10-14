import Link from "next/link";

export default function Header({ onHome }: { onHome: () => void }) {
  return (
    <header className="topbar">
      <Link
        className="brand"
        href="/"
        aria-label="ReviewLens home"
        onClick={(event) => {
          event.preventDefault();
          onHome();
        }}
      >
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none">
            <path
              d="M6 8.5h12M6 15.5h8M6 22.5h7"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <circle
              cx="21"
              cy="20"
              r="5.5"
              stroke="currentColor"
              strokeWidth="2.2"
            />
            <path
              d="m25 24 3 3"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span>ReviewLens</span>
        <span className="brand-tag">BETA</span>
      </Link>

      <div className="topbar-right">
        <span className="status-dot" />
        <span>AI Code Review</span>
      </div>
    </header>
  );
}
