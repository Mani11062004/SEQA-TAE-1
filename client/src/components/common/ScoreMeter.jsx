import React from 'react';

export function ScoreMeter({ score = 0, rating = 'Not Rated', size = 'md', showLabel = true }) {
  const numericScore = Math.min(100, Math.max(0, Math.round(Number(score) || 0)));

  // Determine colors based on score
  let strokeColor = '#10b981'; // green
  let glowColor = 'rgba(16, 185, 129, 0.3)';
  let grade = 'A';

  if (numericScore < 50 || (rating && rating.includes('(F)'))) {
    strokeColor = '#f43f5e'; // rose red
    glowColor = 'rgba(244, 63, 94, 0.4)';
    grade = 'F';
  } else if (numericScore < 70 || (rating && rating.includes('(D)'))) {
    strokeColor = '#f97316'; // orange
    glowColor = 'rgba(249, 115, 22, 0.3)';
    grade = 'D';
  } else if (numericScore < 85 || (rating && rating.includes('(C)'))) {
    strokeColor = '#eab308'; // yellow
    glowColor = 'rgba(234, 179, 8, 0.3)';
    grade = 'C';
  } else if (numericScore < 95 || (rating && rating.includes('(B)'))) {
    strokeColor = '#06b6d4'; // cyan
    glowColor = 'rgba(6, 182, 212, 0.3)';
    grade = 'B';
  } else {
    grade = 'A+';
  }

  // Dimensions
  const dimensions = {
    sm: { size: 68, stroke: 6, text: 'text-sm font-bold', sub: 'text-[9px]' },
    md: { size: 104, stroke: 8, text: 'text-2xl font-black', sub: 'text-xs' },
    lg: { size: 140, stroke: 10, text: 'text-3xl font-black', sub: 'text-sm' }
  };

  const dim = dimensions[size] || dimensions.md;
  const radius = (dim.size - dim.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (numericScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative inline-flex items-center justify-center" style={{ width: dim.size, height: dim.size }}>
        <svg
          className="transform -rotate-90"
          width={dim.size}
          height={dim.size}
          style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
        >
          {/* Background circle */}
          <circle
            cx={dim.size / 2}
            cy={dim.size / 2}
            r={radius}
            stroke="#1e293b"
            strokeWidth={dim.stroke}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={dim.size / 2}
            cy={dim.size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={dim.stroke}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`font-mono text-white ${dim.text} leading-none`}>
            {numericScore}%
          </span>
          <span className={`font-mono font-bold mt-0.5 ${dim.sub}`} style={{ color: strokeColor }}>
            GRADE {grade}
          </span>
        </div>
      </div>

      {showLabel && rating && (
        <div className="mt-2 text-center">
          <span className="text-xs font-mono font-medium tracking-wide text-slate-300">
            {rating}
          </span>
        </div>
      )}
    </div>
  );
}
