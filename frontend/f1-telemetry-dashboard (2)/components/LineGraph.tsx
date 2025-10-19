import React from 'react';

interface LineGraphProps {
  data: number[];
  strokeColor: string;
  maxValue?: number;
  viewBoxWidth?: number;
  viewBoxHeight?: number;
}

const LineGraph: React.FC<LineGraphProps> = ({
  data,
  strokeColor,
  maxValue = 100,
  viewBoxWidth = 100,
  viewBoxHeight = 40,
}) => {
  if (data.length < 2) {
    return <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">Awaiting data...</div>;
  }

  const pathData = data
    .map((point, index) => {
      const x = (index / (data.length - 1)) * viewBoxWidth;
      // Ensure y is never negative and is capped by viewBoxHeight
      const y = Math.max(0, viewBoxHeight - (Math.min(point, maxValue) / maxValue) * viewBoxHeight);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} preserveAspectRatio="none">
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke" // Keep stroke width consistent on resize
      />
    </svg>
  );
};

export default LineGraph;