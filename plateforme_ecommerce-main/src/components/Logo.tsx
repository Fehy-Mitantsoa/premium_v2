/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  variant?: 'horizontal' | 'vertical' | 'icon-only' | 'badge';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  linkToHome?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

/**
 * Premium Shop Logo Component
 * Faithfully reproduces the official brand logo with the wifi shopping cart,
 * 'PREMIUM SHOP' text, and 'VAHAOLANA MORA' tagline.
 */
export const LogoIcon: React.FC<{ sizeClass?: string; className?: string }> = ({ 
  sizeClass = "w-10 h-10", 
  className = "" 
}) => {
  return (
    <svg 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClass} ${className} shrink-0 drop-shadow-sm`}
      aria-label="Logo Premium Shop Vahaolana Mora"
    >
      <defs>
        {/* Background Aura Gradient */}
        <linearGradient id="bgGrad" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="50%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>

        {/* Soft Badge Glow */}
        <radialGradient id="badgeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.45" />
          <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
        </radialGradient>

        {/* Cart Neon Green Gradient */}
        <linearGradient id="neonGreen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="50%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>

        {/* Deep Navy Gradient */}
        <linearGradient id="deepNavy" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        {/* Basket Cyan Fill */}
        <linearGradient id="basketCyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* Outer Circle Background */}
      <circle cx="100" cy="95" r="76" fill="url(#bgGrad)" />
      <circle cx="100" cy="95" r="74" fill="url(#badgeGlow)" />

      {/* Speed particles trailing behind the cart */}
      <circle cx="56" cy="115" r="3.5" fill="#86efac" opacity="0.85" />
      <circle cx="64" cy="110" r="4.5" fill="#4ade80" opacity="0.9" />
      <circle cx="72" cy="116" r="3" fill="#86efac" opacity="0.75" />
      <circle cx="60" cy="122" r="3.8" fill="#4ade80" opacity="0.8" />
      <circle cx="70" cy="123" r="5" fill="#22c55e" opacity="0.85" />
      <circle cx="77" cy="128" r="4" fill="#86efac" opacity="0.9" />

      {/* Curved Ground Swoosh under cart */}
      <path 
        d="M 52 128 C 80 138 120 138 152 125 C 130 133 90 133 60 126 Z" 
        fill="url(#neonGreen)" 
      />

      {/* Wifi Signal Waves above the cart */}
      {/* Wave 3 (Outer) */}
      <path 
        d="M 82 58 C 96 46 112 48 119 56" 
        stroke="url(#neonGreen)" 
        strokeWidth="4.5" 
        strokeLinecap="round" 
      />
      {/* Wave 2 (Middle) */}
      <path 
        d="M 84 68 C 94 60 106 61 112 67" 
        stroke="url(#neonGreen)" 
        strokeWidth="4.5" 
        strokeLinecap="round" 
      />
      {/* Wave 1 (Inner) */}
      <path 
        d="M 87 77 C 93 72 101 73 105 77" 
        stroke="url(#neonGreen)" 
        strokeWidth="4.5" 
        strokeLinecap="round" 
      />
      {/* Wifi Dot */}
      <circle cx="89" cy="84" r="3.2" fill="#4ade80" />

      {/* Price Tag on the handle */}
      <g transform="rotate(-20 62 76)">
        <path 
          d="M 52 74 L 62 64 C 64 62 67 62 69 64 L 74 69 C 76 71 76 74 74 76 L 64 86 C 62 88 59 88 57 86 L 52 81 C 50 79 50 76 52 74 Z" 
          fill="url(#neonGreen)" 
          stroke="#1e3a8a" 
          strokeWidth="1.2"
        />
        <circle cx="70" cy="68" r="2" fill="#0f172a" />
      </g>

      {/* Shopping Cart Basket Body */}
      {/* Basket Base Fill with Grid */}
      <path 
        d="M 76 79 L 140 73 C 143 73 145 76 144 79 L 136 108 C 135 112 131 115 127 115 L 90 115 C 85 115 81 111 80 106 L 76 79 Z" 
        fill="url(#basketCyan)" 
      />

      {/* Cart Wireframe Grid (Horizontal Lines) */}
      <path d="M 78 87 L 142 81" stroke="#0f172a" strokeWidth="2.5" />
      <path d="M 80 97 L 138 92" stroke="#0f172a" strokeWidth="2.5" />
      <path d="M 82 106 L 132 102" stroke="#0f172a" strokeWidth="2.5" />

      {/* Cart Wireframe Grid (Vertical Lines) */}
      <path d="M 91 85 L 89 113" stroke="#0f172a" strokeWidth="2.5" />
      <path d="M 103 84 L 102 113" stroke="#0f172a" strokeWidth="2.5" />
      <path d="M 115 83 L 115 112" stroke="#0f172a" strokeWidth="2.5" />
      <path d="M 127 82 L 126 109" stroke="#0f172a" strokeWidth="2.5" />

      {/* Cart Rim & Frame */}
      <path 
        d="M 52 68 C 55 64 61 63 68 66 L 74 70 L 81 112 C 82 118 87 122 93 122 L 134 122" 
        stroke="url(#deepNavy)" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Top Cart Rim Highlight (White/Mint) */}
      <path 
        d="M 74 76 L 141 71 C 145 71 148 74 147 78 L 139 108" 
        stroke="#ffffff" 
        strokeWidth="2.8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Cart Handle Cover (White/Lime Highlight) */}
      <path 
        d="M 53 67 C 56 64 62 63 69 66" 
        stroke="#f0fdf4" 
        strokeWidth="3.2" 
        strokeLinecap="round" 
      />

      {/* Wheels */}
      {/* Left Wheel */}
      <g>
        <circle cx="94" cy="126" r="11" fill="url(#deepNavy)" stroke="#0f172a" strokeWidth="1" />
        <circle cx="94" cy="126" r="8" fill="#22c55e" />
        <circle cx="94" cy="126" r="5" fill="#0f172a" />
        <circle cx="94" cy="126" r="2.2" fill="#86efac" />
      </g>

      {/* Right Wheel */}
      <g>
        <circle cx="132" cy="123" r="11" fill="url(#deepNavy)" stroke="#0f172a" strokeWidth="1" />
        <circle cx="132" cy="123" r="8" fill="#22c55e" />
        <circle cx="132" cy="123" r="5" fill="#0f172a" />
        <circle cx="132" cy="123" r="2.2" fill="#86efac" />
      </g>
    </svg>
  );
};

export default function Logo({
  variant = 'horizontal',
  size = 'md',
  className = '',
  linkToHome = true,
  theme = 'auto'
}: LogoProps) {

  // Size mapping
  const sizeStyles = {
    sm: { icon: 'w-7 h-7', title: 'text-sm', sub: 'text-[9px]' },
    md: { icon: 'w-10 h-10', title: 'text-base sm:text-lg', sub: 'text-[10px] sm:text-[11px]' },
    lg: { icon: 'w-14 h-14', title: 'text-xl sm:text-2xl', sub: 'text-xs sm:text-sm' },
    xl: { icon: 'w-24 h-24', title: 'text-3xl sm:text-4xl', sub: 'text-sm sm:text-base' }
  }[size];

  const content = (
    <div className={`inline-flex items-center gap-3 select-none group ${className}`}>
      {variant === 'icon-only' ? (
        <LogoIcon sizeClass={sizeStyles.icon} />
      ) : variant === 'vertical' || variant === 'badge' ? (
        <div className="flex flex-col items-center text-center">
          <div className="relative transform group-hover:scale-105 transition-transform duration-300">
            <LogoIcon sizeClass={sizeStyles.icon} />
          </div>
          <div className="mt-2">
            <div className={`font-sans font-black tracking-tight uppercase ${sizeStyles.title} ${
              theme === 'dark' 
                ? 'text-white' 
                : theme === 'light' 
                  ? 'text-slate-900' 
                  : 'text-slate-900 dark:text-white'
            }`}>
              <span className="bg-gradient-to-r from-blue-700 via-sky-600 to-teal-500 dark:from-sky-400 dark:via-teal-300 dark:to-emerald-400 bg-clip-text text-transparent">
                PREMIUM SHOP
              </span>
            </div>
            <div className={`font-mono font-bold tracking-[0.25em] uppercase text-cyan-600 dark:text-cyan-400 ${sizeStyles.sub} -mt-0.5`}>
              VAHAOLANA MORA
            </div>
          </div>
        </div>
      ) : (
        /* Horizontal layout (Default for Navbar & Header) */
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="transform group-hover:scale-105 transition-transform duration-300">
            <LogoIcon sizeClass={sizeStyles.icon} />
          </div>
          <div className="flex flex-col justify-center text-left leading-tight">
            <div className={`font-sans font-black tracking-tight uppercase ${sizeStyles.title} leading-none flex items-center gap-1`}>
              <span className="bg-gradient-to-r from-blue-800 via-sky-600 to-teal-600 dark:from-sky-300 dark:via-teal-300 dark:to-emerald-300 bg-clip-text text-transparent">
                PREMIUM
              </span>
              <span className="text-slate-900 dark:text-white font-extrabold">
                SHOP
              </span>
            </div>
            <div className={`font-mono font-bold tracking-[0.2em] sm:tracking-[0.25em] uppercase text-sky-600 dark:text-cyan-400 ${sizeStyles.sub} mt-0.5`}>
              VAHAOLANA MORA
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link to="/" className="inline-block focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-xl" aria-label="Retour à l'accueil Premium Shop">
        {content}
      </Link>
    );
  }

  return content;
}
