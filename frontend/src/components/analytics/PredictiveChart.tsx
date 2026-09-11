'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { AlertOctagon, Activity, ShieldAlert, Check } from 'lucide-react';

interface ChartRecord {
  timeLabel: string;
  hour: number;
  // Historical scatter observations
  historicalFS?: number;
  historicalMoisture?: number;
  // Dynamic forecast trajectory
  forecastFS?: number;
  fsConfidenceUpper?: number;
  fsConfidenceLower?: number;
  // Pore water pressure (kPa)
  porePressure?: number;
  type: 'HISTORICAL' | 'NOW' | 'FORECAST';
}

const predictiveDataset: ChartRecord[] = [
  // Historical measured observations (Scatter)
  { timeLabel: 'T-4h', hour: -4, historicalFS: 1.62, historicalMoisture: 18.2, porePressure: 8.5, type: 'HISTORICAL' },
  { timeLabel: 'T-3h', hour: -3, historicalFS: 1.58, historicalMoisture: 19.5, porePressure: 9.8, type: 'HISTORICAL' },
  { timeLabel: 'T-2h', hour: -2, historicalFS: 1.54, historicalMoisture: 20.8, porePressure: 10.9, type: 'HISTORICAL' },
  { timeLabel: 'T-1h', hour: -1, historicalFS: 1.50, historicalMoisture: 21.6, porePressure: 11.7, type: 'HISTORICAL' },
  { 
    timeLabel: 'Now', 
    hour: 0, 
    historicalFS: 1.48, 
    forecastFS: 1.48, 
    fsConfidenceUpper: 1.58, 
    fsConfidenceLower: 1.38, 
    historicalMoisture: 22.4, 
    porePressure: 12.1, 
    type: 'NOW' 
  },
  // Forecast curve with Bayesian confidence interval
  { timeLabel: 'T+1h', hour: 1, forecastFS: 1.35, fsConfidenceUpper: 1.47, fsConfidenceLower: 1.23, porePressure: 18.5, type: 'FORECAST' },
  { timeLabel: 'T+2h', hour: 2, forecastFS: 1.21, fsConfidenceUpper: 1.36, fsConfidenceLower: 1.06, porePressure: 26.4, type: 'FORECAST' },
  { timeLabel: 'T+3h', hour: 3, forecastFS: 1.08, fsConfidenceUpper: 1.24, fsConfidenceLower: 0.92, porePressure: 35.8, type: 'FORECAST' },
  { timeLabel: 'T+4h', hour: 4, forecastFS: 0.88, fsConfidenceUpper: 1.05, fsConfidenceLower: 0.71, porePressure: 48.2, type: 'FORECAST' },
  { timeLabel: 'T+5h', hour: 5, forecastFS: 0.72, fsConfidenceUpper: 0.91, fsConfidenceLower: 0.53, porePressure: 61.0, type: 'FORECAST' },
  { timeLabel: 'T+6h', hour: 6, forecastFS: 0.59, fsConfidenceUpper: 0.79, fsConfidenceLower: 0.39, porePressure: 74.5, type: 'FORECAST' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ChartRecord;
    const isFailure = (data.forecastFS !== undefined && data.forecastFS < 1.0) || (data.historicalFS !== undefined && data.historicalFS < 1.0);
    return (
      <div className="bg-slate-900 border border-slate-700 p-2.5 rounded shadow-lg text-[11px] font-mono text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1.5 font-bold">
          <span className="text-cyan-400">{data.timeLabel}</span>
          <span className="text-slate-500 text-[10px]">{data.type}</span>
        </div>
        {data.historicalFS !== undefined && (
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Observed FS:</span>
            <span className="font-bold text-sky-400">{data.historicalFS.toFixed(2)}</span>
          </div>
        )}
        {data.forecastFS !== undefined && (
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">PINN Forecast FS:</span>
            <span className={`font-bold ${isFailure ? 'text-red-400' : 'text-emerald-400'}`}>
              {data.forecastFS.toFixed(2)}
            </span>
          </div>
        )}
        {data.fsConfidenceLower !== undefined && (
          <div className="flex justify-between gap-4 text-[10px] text-slate-400">
            <span>95% CI Range:</span>
            <span className="text-slate-300">[{data.fsConfidenceLower.toFixed(2)} - {data.fsConfidenceUpper?.toFixed(2)}]</span>
          </div>
        )}
        {data.porePressure !== undefined && (
          <div className="flex justify-between gap-4 mt-1 pt-1 border-t border-slate-800 text-[10px]">
            <span className="text-slate-400">Pore Pressure:</span>
            <span className="text-amber-400 font-bold">{data.porePressure.toFixed(1)} kPa</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const PredictiveChart: React.FC = () => {
  const [activeMetric, setActiveMetric] = useState<'FS' | 'PORE_PRESSURE'>('FS');

  return (
    <div className="w-full select-none flex flex-col gap-2 font-mono">
      
      {/* Flat, Deep Crimson Status Bar (Aviation/Military Command Center Alert) */}
      <div className="bg-[#7f1d1d] border border-red-700 px-3 py-2 rounded flex items-center justify-between text-xs font-mono text-red-100 tracking-wider shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-red-400 rounded-none animate-pulse"></div>
          <span className="font-bold">FAILURE PROBABLE : T+4h (FS 0.88)</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] bg-red-950/80 border border-red-600 px-2 py-0.5 rounded text-red-200 font-semibold">
          <span>CRITICAL LIMIT EXCEEDED</span>
        </div>
      </div>

      {/* Chart Canvas Card */}
      <div className="bg-slate-950/90 border border-slate-700 rounded p-2.5 flex flex-col">
        
        {/* Top Metric Header & Legend */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2 border-b border-slate-800 pb-1.5">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block"></span>
              <span>Observed Data</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-amber-400 inline-block"></span>
              <span>Forecasted FS</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-slate-700 border border-slate-600 inline-block"></span>
              <span>95% CI</span>
            </span>
          </div>
          <div className="text-slate-500">
            Green-Ampt + Mohr Coulomb
          </div>
        </div>

        {/* High-Fidelity Responsive Chart */}
        <div className="w-full h-44">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={predictiveDataset}
              margin={{ top: 8, right: 12, left: -22, bottom: 0 }}
            >
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" opacity={0.5} />
              
              <XAxis 
                dataKey="timeLabel" 
                stroke="#64748b" 
                fontSize={9} 
                tickLine={false} 
                fontFamily="monospace"
              />
              <YAxis 
                domain={[0.2, 1.8]} 
                ticks={[0.4, 0.7, 1.0, 1.3, 1.6]} 
                stroke="#64748b" 
                fontSize={9} 
                tickLine={false}
                fontFamily="monospace"
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Equilibrium Failure Threshold Reference Line */}
              <ReferenceLine 
                y={1.0} 
                stroke="#ef4444" 
                strokeWidth={1.5} 
                strokeDasharray="4 4"
                label={{
                  value: 'CRITICAL LIMIT (FS=1.0)',
                  fill: '#ef4444',
                  fontSize: 8,
                  position: 'right',
                  fontFamily: 'monospace'
                }} 
              />

              {/* Shaded Confidence Interval Upper Band */}
              <Area
                type="monotone"
                dataKey="fsConfidenceUpper"
                stroke="transparent"
                fill="#475569"
                fillOpacity={0.25}
                isAnimationActive={false}
              />

              {/* Shaded Confidence Interval Lower Mask */}
              <Area
                type="monotone"
                dataKey="fsConfidenceLower"
                stroke="transparent"
                fill="#020617"
                fillOpacity={0.9}
                isAnimationActive={false}
              />

              {/* Dynamic Forecasted FS Curve */}
              <Line
                type="monotone"
                dataKey="forecastFS"
                stroke="#f59e0b"
                strokeWidth={2.2}
                dot={{ r: 3, fill: '#f59e0b', stroke: '#0f172a', strokeWidth: 1 }}
                activeDot={{ r: 5, fill: '#ef4444', stroke: '#ffffff', strokeWidth: 1.5 }}
                isAnimationActive={false}
              />

              {/* Historical Sensor Data Points as Scatter Plot */}
              <Scatter
                name="Historical FS"
                dataKey="historicalFS"
                fill="#38bdf8"
                shape="circle"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Technical HUD Summary */}
        <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
          <div>
            <span>Shear Strength Cohesion: </span>
            <strong className="text-slate-200">14.0 kPa</strong>
          </div>
          <div>
            <span>Friction Angle: </span>
            <strong className="text-slate-200">28.0°</strong>
          </div>
          <div>
            <span>Pore Pressure Peak: </span>
            <strong className="text-red-400">48.2 kPa</strong>
          </div>
        </div>

      </div>

    </div>
  );
};
