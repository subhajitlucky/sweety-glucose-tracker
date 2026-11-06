export function BrandMark({ size = 40, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Sweety"
    >
      <rect width="48" height="48" rx="14" fill="currentColor" />
      <path
        d="M24 9c6.9 7.7 11.2 13.3 11.2 18.9 0 7-5 11.8-11.2 11.8s-11.2-4.8-11.2-11.8C12.8 22.3 17.1 16.7 24 9Z"
        fill="#F4EFE1"
      />
      <path
        d="M18.5 29.6c1.3 3.4 3.4 5 6.2 5s4.9-1.6 6.2-5"
        fill="none"
        stroke="#E87253"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Brand({ light = false, withTagline = true, markSize = 38 }) {
  return (
    <span className={`brand ${light ? 'brand--light' : ''}`}>
      <BrandMark size={markSize} className="brand__mark" />
      <span className="brand__words">
        <span className="brand__name">
          sweety<span className="brand__dot">.</span>
        </span>
        {withTagline && <span className="brand__tagline">glucose journal</span>}
      </span>
    </span>
  );
}
