export default function BrandMark({ className }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect width="64" height="64" rx="17" fill="#2563eb" />
      <path d="M15 46L30 17C31 15 33 15 34 17L49 46" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 36H39L46 27" stroke="#93c5fd" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="41" y="20" width="10" height="10" rx="3" fill="#bfdbfe" />
    </svg>
  );
}
