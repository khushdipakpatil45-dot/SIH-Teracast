'use client';

import React, { useState } from 'react';
import { AlertOctagon, TrendingUp } from 'lucide-react';

interface DataPoint {
  hour: number;
  timeLabel: string;
  moisture: number;
  porePressure: number;
  fs: number;
}

const predictiveData: DataPoint[] = [
  { hour: 0, timeLabel: 'Now (T+0h)', moisture: 22.4, porePressure: 12.1, fs: 1.48 },
  { hour: 1, timeLabel: 'T+1h', moisture: 26.8, porePressure: 18.5, fs: 1.35 },
  { hour: 2, timeLabel: 'T+2h', moisture: 31.5, porePressure: 26.4, fs: 1.21 },
  { hour: 3, timeLabel: 'T+3h', moisture: 36.2, porePressure: 35.8, fs: 1.08 },
  { hour: 4, timeLabel: 'T+4h', moisture: 41.8, porePressure: 48.2, fs: 0.88 }, // Failure crossover
  { hour: 5, timeLabel: 'T+5h', moisture: 48.6, porePressure: 61.0, fs: 0.72 },
  { hour: 6, timeLabel: 'T+6h', moisture: 54.2, porePressure: 74.5, fs: 0.59 },
];

export const PredictiveChart: React.FC = () => {
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(predictiveData[4]); // Default to 4h crossover

  // Chart coordinate math
  const width = 340;
  const height = 150;
  const padLeft = 32;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 26;

  const minX = 0;
  const maxX = 6;
  const minY = 10;
  const maxY = 60;

  const getX = (hour: number) => padLeft + (hour / maxX) * (width - padLeft - padRight);
  const getY = (val: number) => height - padBottom - ((val - minY) / (maxY - minY)) * (height - padTop - padBottom);

  // Path generator
  const linePath = predictiveData
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.hour).toFixed(1)} ${getY(p.moisture).toFixed(1)}`)
    .join(' ');

  // Gradient area path
  const areaPath = `
    ${linePath} 
    L ${getX(6).toFixed(1)} ${getY(minY).toFixed(1)} 
    L ${getX(0).toFixed(1)} ${getY(minY).toFixed(1)} 
    Z
  `;

  // Critical threshold Y
  const thresholdY = getY(40);

  return (
    <div className="w-full select-none">
      {/* Interactive Chart Container */}
      <div className="relative w-full bg-slate-950/60 rounded-md p-2 border border-slate-800">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="55%" stopColor="#f59e0b" />
              <stop offset="68%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>

            <linearGradient id="curveArea" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[20, 30, 40, 50].map((level) => (
            <g key={level}>
              <line
                x1={padLeft}
                y1={getY(level)}
                x2={width - padRight}
                y2={getY(level)}
                stroke="#334155"
                strokeWidth="0.75"
                strokeDasharray="2,2"
              />
              <text
                x={padLeft - 4}
                y={getY(level) + 3}
                fill="#64748b"
                fontSize="8"
                fontFamily="monospace"
                textAnchor="end"
              >
                {level}%
              </text>
            </g>
          ))}

          {/* Time axis ticks */}
          {predictiveData.map((d) => (
            <text
              key={d.hour}
              x={getX(d.hour)}
              y={height - padBottom + 12}
              fill={d.hour === 4 ? '#ef4444' : '#64748b'}
              fontWeight={d.hour === 4 ? 'bold' : 'normal'}
              fontSize="8"
              fontFamily="monospace"
              textAnchor="middle"
            >
              T+{d.hour}h
            </text>
          ))}

          {/* 40% Critical Failure Threshold Line */}
          <line
            x1={padLeft}
            y1={thresholdY}
            x2={width - padRight}
            y2={thresholdY}
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="4,3"
          />
          <text
            x={width - padRight - 2}
            y={thresholdY - 3}
            fill="#ef4444"
            fontSize="7.5"
            fontWeight="bold"
            fontFamily="monospace"
            textAnchor="end"
          >
            CRITICAL THRESHOLD: 40%
          </text>

          {/* Fill under line */}
          <path d={areaPath} fill="url(#curveArea)" />

          {/* Predictive line */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#curveGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Crossover point highlight at 4h */}
          <circle
            cx={getX(4)}
            cy={getY(41.8)}
            r="4.5"
            fill="#ef4444"
            stroke="#ffffff"
            strokeWidth="1.5"
            className="animate-pulse"
          />

          {/* Interactive clickable data points */}
          {predictiveData.map((p) => {
            const cx = getX(p.hour);
            const cy = getY(p.moisture);
            const isSelected = hoveredPoint?.hour === p.hour;

            return (
              <g
                key={p.hour}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(p)}
                onClick={() => setHoveredPoint(p)}
              >
                {isSelected && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="8"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                  />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={p.hour === 4 ? 4 : 3}
                  fill={p.moisture >= 40 ? '#ef4444' : p.moisture > 30 ? '#f59e0b' : '#38bdf8'}
                  stroke="#0f172a"
                  strokeWidth="1"
                />
              </g>
            );
          })}
        </svg>

        {/* Selected Data Point HUD Tooltip */}
        {hoveredPoint && (
          <div className="mt-2 bg-slate-900/90 border border-slate-700/80 rounded px-2.5 py-1.5 flex items-center justify-between text-[11px] font-mono shadow-md">
            <div>
              <span className="text-slate-400">Time: </span>
              <strong className="text-cyan-400">{hoveredPoint.timeLabel}</strong>
              <span className="mx-1 text-slate-600">|</span>
              <span className="text-slate-400">Moisture: </span>
              <strong className={hoveredPoint.moisture >= 40 ? 'text-red-400' : 'text-amber-400'}>
                {hoveredPoint.moisture}%
              </strong>
            </div>
            <div>
              <span className="text-slate-400">FS: </span>
              <strong className={hoveredPoint.fs < 1.0 ? 'text-red-400' : 'text-emerald-400'}>
                {hoveredPoint.fs.toFixed(2)}
              </strong>
            </div>
          </div>
        )}
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-slate-400 px-0.5">
        <span>Model: Green-Ampt + PINN Infiltration</span>
        <span className="text-rose-400 font-semibold">T+4h Peak Saturation</span>
      </div>
    </div>
  );
};
