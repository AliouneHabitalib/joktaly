import { useState, useCallback } from "react";

export function RabbitMascot({ className }: { className?: string }) {
  const [tick, setTick] = useState(0);

  const replay = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  return (
    <button
      key={tick}
      type="button"
      onClick={replay}
      aria-hidden="true"
      tabIndex={-1}
      className={`pointer-events-auto cursor-pointer select-none border-none bg-transparent p-0 ${className || ""}`}
      title="Coucou !"
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="rabbit-mascot h-full w-full"
        aria-hidden="true"
      >
        {/* Ears */}
        <ellipse cx="22" cy="18" rx="8" ry="18" fill="currentColor" />
        <ellipse cx="42" cy="18" rx="8" ry="18" fill="currentColor" />
        <ellipse cx="22" cy="20" rx="4" ry="12" fill="#fff" fillOpacity="0.35" />
        <ellipse cx="42" cy="20" rx="4" ry="12" fill="#fff" fillOpacity="0.35" />
        {/* Head */}
        <circle cx="32" cy="38" r="18" fill="currentColor" />
        {/* Cheeks */}
        <circle cx="22" cy="40" r="3" fill="#fff" fillOpacity="0.35" />
        <circle cx="42" cy="40" r="3" fill="#fff" fillOpacity="0.35" />
        {/* Eyes */}
        <circle cx="26" cy="34" r="2.5" fill="#1a2e2a" />
        <circle cx="38" cy="34" r="2.5" fill="#1a2e2a" />
        <circle cx="27" cy="32.8" r="0.8" fill="#fff" />
        <circle cx="39" cy="32.8" r="0.8" fill="#fff" />
        {/* Smile */}
        <path
          d="M26 42c2 3 10 3 12 0"
          stroke="#1a2e2a"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Nose */}
        <ellipse cx="32" cy="39" rx="2.2" ry="1.6" fill="#1a2e2a" />
        {/* Teeth */}
        <rect x="30.2" y="40.5" width="1.6" height="2.2" rx="0.4" fill="#fff" />
        <rect x="32.2" y="40.5" width="1.6" height="2.2" rx="0.4" fill="#fff" />
      </svg>
    </button>
  );
}
