export default function SeoulSkylineSvg() {
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMax slice"
      className="h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1c2b52" />
          <stop offset="45%" stopColor="#5b3f6b" />
          <stop offset="75%" stopColor="#e4572e" />
          <stop offset="100%" stopColor="#f6b04d" />
        </linearGradient>
        <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff7e0" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fff7e0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3d2f4a" />
          <stop offset="100%" stopColor="#241a30" />
        </linearGradient>
      </defs>

      <rect width="400" height="300" fill="url(#sky)" />
      <circle cx="320" cy="60" r="36" fill="url(#moonGlow)" />
      <circle cx="320" cy="60" r="16" fill="#fff2cf" />

      {/* distant hill with Namsan-style tower */}
      <path d="M0,190 Q90,150 180,180 T400,170 V300 H0 Z" fill="url(#hill)" opacity="0.9" />
      <rect x="172" y="120" width="4" height="55" fill="#241a30" />
      <ellipse cx="174" cy="118" rx="9" ry="14" fill="#241a30" />
      <circle cx="174" cy="102" r="3" fill="#f6b04d" />

      {/* city silhouette */}
      <g fill="#150f1c">
        <rect x="0" y="230" width="26" height="70" />
        <rect x="30" y="205" width="20" height="95" />
        <rect x="54" y="240" width="30" height="60" />
        <rect x="90" y="215" width="18" height="85" />
        <rect x="112" y="250" width="24" height="50" />
        <rect x="140" y="225" width="22" height="75" />
        <rect x="200" y="235" width="28" height="65" />
        <rect x="232" y="210" width="18" height="90" />
        <rect x="254" y="245" width="26" height="55" />
        <rect x="284" y="220" width="20" height="80" />
        <rect x="308" y="250" width="30" height="50" />
        <rect x="342" y="200" width="16" height="100" />
        <rect x="362" y="235" width="24" height="65" />
      </g>
      <g fill="#f6b04d" opacity="0.75">
        <rect x="36" y="215" width="3" height="4" />
        <rect x="36" y="228" width="3" height="4" />
        <rect x="96" y="228" width="3" height="4" />
        <rect x="146" y="240" width="3" height="4" />
        <rect x="238" y="222" width="3" height="4" />
        <rect x="290" y="235" width="3" height="4" />
        <rect x="348" y="215" width="3" height="4" />
        <rect x="348" y="230" width="3" height="4" />
      </g>
    </svg>
  )
}
