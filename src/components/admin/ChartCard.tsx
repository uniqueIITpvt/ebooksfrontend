'use client';

import React from 'react';

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface ChartCardProps {
  title: string;
  data: ChartData[];
  type: 'line' | 'pie' | 'bar';
  height?: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function ChartCard({ title, data, type, height = 300 }: ChartCardProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <div className="relative" style={{ height: `${height}px` }}>
            <svg width="100%" height="100%" className="overflow-visible">
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-200 dark:text-gray-700" opacity="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Line chart */}
              <polyline
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
                points={data.map((item, index) => {
                  const x = (index / (data.length - 1)) * 100;
                  const y = 100 - (item.value / maxValue) * 80;
                  return `${x}%,${y}%`;
                }).join(' ')}
              />
              
              {/* Data points */}
              {data.map((item, index) => {
                const x = (index / (data.length - 1)) * 100;
                const y = 100 - (item.value / maxValue) * 80;
                return (
                  <circle
                    key={index}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    fill="#3B82F6"
                    className="hover:r-6 transition-all"
                  />
                );
              })}
            </svg>
            
            {/* Labels */}
            <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
              {data.map((item, index) => (
                <span key={index}>{item.name}</span>
              ))}
            </div>
          </div>
        );

      case 'pie':
        const total = data.reduce((sum, item) => sum + item.value, 0);
        let cumulativePercentage = 0;
        
        return (
          <div className="flex flex-col items-center" style={{ height: `${height}px` }}>
            <div className="relative w-48 h-48">
              <svg width="192" height="192" className="transform -rotate-90">
                {data.map((item, index) => {
                  const percentage = (item.value / total) * 100;
                  const strokeDasharray = `${percentage} ${100 - percentage}`;
                  const strokeDashoffset = -cumulativePercentage;
                  cumulativePercentage += percentage;
                  
                  return (
                    <circle
                      key={index}
                      cx="96"
                      cy="96"
                      r="80"
                      fill="transparent"
                      stroke={item.color || COLORS[index % COLORS.length]}
                      strokeWidth="32"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-300 hover:stroke-width-36"
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        );

      case 'bar':
        return (
          <div className="flex items-end justify-between space-x-2" style={{ height: `${height}px` }}>
            {data.map((item, index) => {
              const barHeight = (item.value / maxValue) * (height - 40);
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {item.value}
                  </div>
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                    style={{ height: `${barHeight}px`, minHeight: '4px' }}
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                    {item.name}
                  </div>
                </div>
              );
            })}
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            Chart type not supported
          </div>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      <div className="w-full">
        {renderChart()}
      </div>
      
      {/* Legend for pie chart */}
      {type === 'pie' && (
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          {data.map((entry, index) => (
            <div key={entry.name} className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: entry.color || COLORS[index % COLORS.length] }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {entry.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
