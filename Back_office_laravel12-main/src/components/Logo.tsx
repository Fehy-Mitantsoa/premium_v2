import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "horizontal" | "badge";
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = "",
  size = "md",
  variant = "horizontal",
  showSubtitle = true,
}) => {
  // Dimension map
  const sizeMap = {
    sm: { icon: "w-7 h-7", text: "text-xs", sub: "text-[8px]" },
    md: { icon: "w-9 h-9", text: "text-sm", sub: "text-[9px]" },
    lg: { icon: "w-12 h-12", text: "text-lg", sub: "text-[11px]" },
    xl: { icon: "w-20 h-20", text: "text-2xl", sub: "text-xs" },
  };

  const currentSize = sizeMap[size];

  // Vector SVG perfectly reproducing the uploaded logo:
  // - Shopping cart in dark navy with green highlight
  // - Green tag attached to handle
  // - Wi-Fi signal arcs inside cart
  // - Speed dots trail
  // - Premium Shop curved typography + Vahaolana Mora
  const SvgIcon = () => (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-full drop-shadow-sm select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id="cartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>

      {/* Background Circle */}
      <circle cx="100" cy="100" r="92" fill="url(#bgGrad)" />

      {/* Speed trail dots */}
      <circle cx="58" cy="120" r="4.5" fill="#86efac" opacity="0.9" />
      <circle cx="68" cy="126" r="3.5" fill="#4ade80" opacity="0.8" />
      <circle cx="52" cy="128" r="3" fill="#bbf7d0" opacity="0.8" />
      <circle cx="62" cy="134" r="5" fill="#4ade80" opacity="0.95" />
      <circle cx="74" cy="132" r="3.5" fill="#86efac" opacity="0.7" />
      <circle cx="70" cy="140" r="4" fill="#22c55e" opacity="0.9" />

      {/* Base Arc / Road */}
      <path
        d="M 52 142 Q 100 156 150 134"
        stroke="#15803d"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M 58 140 Q 100 152 144 133"
        stroke="#4ade80"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Wi-Fi Signals from basket */}
      <path
        d="M 82 72 A 26 26 0 0 1 116 72"
        stroke="#4ade80"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M 88 80 A 18 18 0 0 1 110 80"
        stroke="#4ade80"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <circle cx="99" cy="88" r="3.5" fill="#4ade80" />

      {/* Green Tag on Cart Handle */}
      <g transform="rotate(-15 62 82)">
        <path
          d="M 58 72 L 68 72 L 72 82 L 64 90 L 56 86 Z"
          fill="#4ade80"
          stroke="#166534"
          strokeWidth="1.5"
        />
        <circle cx="63" cy="76" r="1.5" fill="#14532d" />
      </g>

      {/* Cart Body (Basket & Grid) */}
      {/* Handle */}
      <path
        d="M 52 68 C 60 68 64 74 68 84 L 78 116 C 80 120 84 122 90 122 L 132 120 C 138 120 142 116 144 110 L 152 82 C 153 78 150 74 145 74 L 70 74"
        fill="#0f2b48"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Cart Grid Lines (Light blue/white grid) */}
      <path
        d="M 82 82 L 142 82 M 85 92 L 139 92 M 88 102 L 135 102 M 92 112 L 130 112"
        stroke="#67e8f9"
        strokeWidth="2"
      />
      <path
        d="M 94 76 L 98 120 M 108 76 L 110 120 M 122 76 L 122 118 M 136 76 L 132 115"
        stroke="#67e8f9"
        strokeWidth="2"
      />

      {/* Cart Chassis Bar */}
      <path
        d="M 84 130 L 128 126"
        stroke="#0f2b48"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Wheels */}
      {/* Front / Right Wheel */}
      <circle cx="128" cy="132" r="11" fill="#0f2b48" stroke="#ffffff" strokeWidth="2.5" />
      <circle cx="128" cy="132" r="6" fill="#4ade80" />
      <circle cx="128" cy="132" r="2.5" fill="#0f2b48" />

      {/* Back / Left Wheel */}
      <circle cx="86" cy="136" r="13" fill="#0f2b48" stroke="#ffffff" strokeWidth="2.5" />
      <circle cx="86" cy="136" r="7.5" fill="#4ade80" />
      <circle cx="86" cy="136" r="3" fill="#0f2b48" />
    </svg>
  );

  if (variant === "icon") {
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 ${currentSize.icon} ${className}`}>
        <SvgIcon />
      </div>
    );
  }

  if (variant === "badge") {
    return (
      <div className={`flex flex-col items-center justify-center text-center p-3 rounded-2xl bg-gradient-to-b from-blue-900 to-slate-900 border border-blue-500/30 text-white shadow-xl ${className}`}>
        <div className="w-16 h-16 mb-2">
          <SvgIcon />
        </div>
        <div className="font-extrabold tracking-wider uppercase text-sm text-cyan-300 font-display">
          PREMIUM SHOP
        </div>
        {showSubtitle && (
          <div className="text-[10px] tracking-widest text-emerald-400 font-bold uppercase mt-0.5">
            VAHAOLANA MORA
          </div>
        )}
      </div>
    );
  }

  // Full / Horizontal
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`shrink-0 ${currentSize.icon}`}>
        <SvgIcon />
      </div>
      <div className="flex flex-col leading-tight min-w-0">
        <span className={`font-black tracking-wider uppercase text-white font-display flex items-center gap-1 ${currentSize.text}`}>
          <span className="text-cyan-300">PREMIUM</span>
          <span className="text-white">SHOP</span>
        </span>
        {showSubtitle && (
          <span className={`font-bold tracking-widest uppercase text-emerald-400 font-mono ${currentSize.sub}`}>
            VAHAOLANA MORA
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;
