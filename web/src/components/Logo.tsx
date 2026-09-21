// SplitPay mark: a coin split into three shares (indigo / ochre / green),
// the same tri-color coding used across the app. Simple geometric monogram.
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="SplitPay logo">
      <rect width="48" height="48" rx="11" fill="#1A1712" />
      <g stroke="#1A1712" strokeWidth="2" strokeLinejoin="round">
        <path d="M24 24 L24 9 A15 15 0 0 1 24 39 Z" fill="#4F46E5" />
        <path d="M24 24 L24 39 A15 15 0 0 1 9.73 19.37 Z" fill="#C0803A" />
        <path d="M24 24 L9.73 19.37 A15 15 0 0 1 24 9 Z" fill="#2F9160" />
      </g>
    </svg>
  );
}
