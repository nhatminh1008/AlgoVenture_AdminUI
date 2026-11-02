export default function BrandMark({ className }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect width="64" height="64" rx="19" fill="var(--portal-ink)" />
      <path d="M15 46L30 17Q32 13 34 17L49 46M22 34H42" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="17" r="4" fill="var(--portal-yellow)" />
      <circle cx="22" cy="34" r="3.5" fill="var(--portal-yellow)" />
      <circle cx="49" cy="46" r="4" fill="var(--portal-yellow)" />
    </svg>
  );
}
