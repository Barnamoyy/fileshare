'use client';

import React from 'react';
import { File } from 'lucide-react';

const CircularProgressBar = ({ progress }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <svg className="w-full h-full" viewBox="0 0 120 120">
        <circle
          className="text-gray-300"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
        />
        <circle
          className="text-black"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
          style={{
            transition: 'stroke-dashoffset 0.35s',
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <File className="w-8 h-8 text-black" />
        <span className="text-lg font-bold text-black mt-2">{progress}%</span>
      </div>
    </div>
  );
};

export default CircularProgressBar;
