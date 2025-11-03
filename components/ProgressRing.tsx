import React from 'react';

interface Props {
  score: number;
}

const ProgressRing: React.FC<Props> = ({ score }) => {
  const radius = 20;
  const stroke = 3;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = () => {
    if (score < 40) return '#EF4444'; // red-500
    if (score < 70) return '#F59E0B'; // amber-500
    return '#10B981'; // green-500
  };

  return (
    <div className="relative flex items-center justify-center w-12 h-12">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        <circle
          stroke="#E5E7EB" // gray-200
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={getScoreColor()}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.35s' }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-xs font-bold" style={{ color: getScoreColor() }}>
        {score > 0 ? `${Math.round(score)}%` : '--'}
      </span>
    </div>
  );
};

export default ProgressRing;
