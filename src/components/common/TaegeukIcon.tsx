export default function TaegeukIcon({ size = 96 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full bg-white shadow-lg"
      style={{ width: size, height: size }}
      role="img"
      aria-label="דגל דרום קוריאה"
    >
      <svg viewBox="0 0 100 100" width={size * 0.66} height={size * 0.66}>
        <circle cx="50" cy="50" r="48" fill="#ffffff" />
        <g transform="rotate(-45 50 50)">
          <path
            d="M50,2 A24,24 0 0,1 50,50 A24,24 0 0,0 50,98 A48,48 0 0,0 50,2 Z"
            fill="#C60C30"
          />
          <path
            d="M50,2 A48,48 0 0,0 50,98 A24,24 0 0,0 50,50 A24,24 0 0,1 50,2 Z"
            fill="#003478"
          />
        </g>
      </svg>
    </div>
  )
}
