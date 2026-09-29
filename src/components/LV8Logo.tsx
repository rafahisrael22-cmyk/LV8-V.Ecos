import React from 'react';

interface LV8LogoProps {
  variant?: 'full' | 'icon' | 'compact' | 'banner';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showSubtitle?: boolean;
}

export const LV8Logo: React.FC<LV8LogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  showSubtitle = true,
}) => {
  const iconSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
  };

  const textClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Detailed SVG Emblem */}
      <div className={`relative ${iconSizeClasses[size]} shrink-0 group`}>
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-600/40 via-yellow-500/30 to-purple-600/40 rounded-2xl blur-md group-hover:blur-lg transition-all duration-300" />

        <svg
          viewBox="0 0 100 100"
          className="relative w-full h-full drop-shadow-[0_4px_12px_rgba(245,158,11,0.35)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Outer Shield Gradient */}
            <linearGradient id="lv8_border_grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="30%" stopColor="#FDE68A" />
              <stop offset="70%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>

            {/* Inner Shield Dark Plate */}
            <radialGradient id="lv8_plate_grad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#27272A" />
              <stop offset="60%" stopColor="#18181B" />
              <stop offset="100%" stopColor="#09090B" />
            </radialGradient>

            {/* Cosmic Fold Energy Stream */}
            <linearGradient id="lv8_rift_grad" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#A855F7" />
              <stop offset="50%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>

            {/* Gold Letter Gradient */}
            <linearGradient id="lv8_gold_text" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="25%" stopColor="#FDE68A" />
              <stop offset="60%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>

            {/* Primal Claw Glow */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Octagonal / Hex Shield Outer Ring */}
          <polygon
            points="50,4 88,18 96,60 76,92 50,96 24,92 4,60 12,18"
            fill="url(#lv8_plate_grad)"
            stroke="url(#lv8_border_grad)"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Runic Inner Ring */}
          <circle
            cx="50"
            cy="50"
            r="38"
            stroke="url(#lv8_border_grad)"
            strokeWidth="1"
            strokeDasharray="4 3"
            opacity="0.6"
          />

          {/* Dobra / Cosmic Rift Slash (Diagonal) */}
          <path
            d="M20,82 Q42,52 48,16"
            stroke="url(#lv8_rift_grad)"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#glow)"
            opacity="0.85"
          />
          <path
            d="M80,18 Q58,48 52,84"
            stroke="url(#lv8_rift_grad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#glow)"
            opacity="0.7"
          />

          {/* Primal Beast Claw Marks (3 slashes) */}
          <path
            d="M28,26 L38,36"
            stroke="#FDE68A"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.75"
          />
          <path
            d="M36,22 L46,32"
            stroke="#F59E0B"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            d="M44,20 L52,28"
            stroke="#D97706"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Geometric Facets / Crystal Cuts */}
          <polygon
            points="50,14 74,26 80,56 64,80 50,82 36,80 20,56 26,26"
            stroke="#E4E4E7"
            strokeWidth="0.8"
            strokeOpacity="0.25"
            fill="none"
          />

          {/* Center Brand Text: LV8 */}
          <text
            x="50"
            y="60"
            textAnchor="middle"
            fill="url(#lv8_gold_text)"
            fontSize="30"
            fontWeight="900"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="-1"
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))"
          >
            LV8
          </text>

          {/* Bottom Runic Knot / Micro Symbol */}
          <circle cx="50" cy="74" r="2" fill="#FDE68A" />
          <path d="M42,74 L46,74 M54,74 L58,74" stroke="#F59E0B" strokeWidth="1" strokeLinecap="round" />
        </svg>
      </div>

      {/* Typography Brand Labels */}
      {variant !== 'icon' && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span className={`font-black tracking-wider text-zinc-100 uppercase leading-tight ${textClasses[size]}`}>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
                LV8 2.0
              </span>
              <span className="text-zinc-400 font-normal mx-1.5">•</span>
              <span className="text-zinc-100 font-extrabold">Ecos da Dobra</span>
            </span>

            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/10 text-amber-400 text-[10px] font-black tracking-wider uppercase border border-amber-500/40 shadow-sm">
              Regras Brutais
            </span>
          </div>

          {showSubtitle && (
            <p className="text-[11px] text-zinc-400 tracking-wide flex items-center gap-1.5 mt-0.5">
              <span className="text-amber-500 font-semibold">Fantasia Primal &amp; Furry</span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-400">Combate Tático IA</span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-400">Gamebook</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};
