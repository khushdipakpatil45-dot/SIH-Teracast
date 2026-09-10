'use client';

import React, { useState } from 'react';
import { CORRIDORS_DATA, HighwayNode } from '@/lib/corridors';
import { MapPin, AlertOctagon, Radio, Navigation, ShieldCheck } from 'lucide-react';

interface InteractiveMapProps {
  corridorId: string;
  activeLayers: {
    cartoDem: boolean;
    insarVelocity: boolean;
    factorOfSafety: boolean;
    cutSlopes: boolean;
    iotSensors: boolean;
    safeCorridor: boolean;
  };
  isBlocked: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  corridorId,
  activeLayers,
  isBlocked,
}) => {
  const corridor = CORRIDORS_DATA[corridorId] || CORRIDORS_DATA['NH-10'];
  const [selectedNode, setSelectedNode] = useState<HighwayNode | null>(null);

  // Compute SVG projection bounds from corridor coordinates
  const allPoints = [...corridor.nodes.map((n) => [n.lon, n.lat])];
  if (corridor.bypass) {
    allPoints.push(...corridor.bypass.coordinates);
  }

  const minLon = Math.min(...allPoints.map((p) => p[0]));
  const maxLon = Math.max(...allPoints.map((p) => p[0]));
  const minLat = Math.min(...allPoints.map((p) => p[1]));
  const maxLat = Math.max(...allPoints.map((p) => p[1]));

  const width = 800;
  const height = 480;
  const padding = 60;

  const project = (lon: number, lat: number): [number, number] => {
    const x = padding + ((lon - minLon) / (maxLon - minLon || 1)) * (width - padding * 2);
    // Invert Y because SVG coordinates increase downwards
    const y = height - (padding + ((lat - minLat) / (maxLat - minLat || 1)) * (height - padding * 2));
    return [x, y];
  };

  // Build Highway path string
  const highwayPath = corridor.nodes
    .map((node, i) => {
      const [x, y] = project(node.lon, node.lat);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Build Bypass path string
  const bypassPath = corridor.bypass.coordinates
    .map((coord, i) => {
      const [x, y] = project(coord[0], coord[1]);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Critical slip point coords (29th Mile or first critical node)
  const criticalNode = corridor.nodes.find((n) => n.critical_risk) || corridor.nodes[2];
  const [critX, critY] = project(criticalNode.lon, criticalNode.lat);

  return (
    <div className="relative w-full h-full min-h-[440px] bg-slate-950 flex items-center justify-center overflow-hidden select-none">
      {/* Background Topographic Contour Grid Simulation */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b1a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b1a_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* SVG Canvas */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full relative z-0"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="bypassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          <radialGradient id="debrisFan" cx="50%" cy="0%" r="90%">
            <stop offset="0%" stopColor="#e11d48" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#f43f5e" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#fda4af" stopOpacity="0.05" />
          </radialGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. InSAR Displacement Velocity Heatmap Simulation Layer */}
        {activeLayers.insarVelocity && (
          <g opacity={0.65}>
            <ellipse
              cx={critX - 15}
              cy={critY - 20}
              rx={65}
              ry={35}
              fill="url(#debrisFan)"
              transform={`rotate(-25 ${critX} ${critY})`}
            />
          </g>
        )}

        {/* 2. D-Infinity Debris Flow Runout Fan Polygon (when triggered / blocked) */}
        {isBlocked && (
          <g filter="url(#glow)">
            {/* Runout Fan Polygon intersecting Highway */}
            <polygon
              points={`${critX - 35},${critY - 55} ${critX + 45},${critY - 40} ${critX + 15},${critY + 25} ${critX - 25},${critY + 15}`}
              fill="url(#debrisFan)"
              stroke="#f43f5e"
              strokeWidth={1.5}
              strokeDasharray="4 2"
            />
            {/* Impact Center Pulse */}
            <circle cx={critX} cy={critY} r={16} fill="#f43f5e" opacity={0.3} className="animate-ping" />
          </g>
        )}

        {/* 3. Safe Convoy Bypass Corridor (Emerald Dashed Path) */}
        {activeLayers.safeCorridor && (
          <g>
            <path
              d={bypassPath}
              fill="none"
              stroke="url(#bypassGrad)"
              strokeWidth={4}
              strokeDasharray="8 6"
              strokeLinecap="round"
              className="animate-[dash_1.5s_linear_infinite]"
            />
            {corridor.bypass.coordinates.map((coord, idx) => {
              const [bx, by] = project(coord[0], coord[1]);
              return (
                <circle
                  key={idx}
                  cx={bx}
                  cy={by}
                  r={3.5}
                  fill="#10b981"
                  stroke="#022c22"
                  strokeWidth={2}
                />
              );
            })}
          </g>
        )}

        {/* 4. Primary Highway Vector Line */}
        <path
          d={highwayPath}
          fill="none"
          stroke={isBlocked ? '#fb7185' : '#38bdf8'}
          strokeWidth={isBlocked ? 4 : 5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Severed Section highlight if blocked */}
        {isBlocked && (
          <line
            x1={critX - 22}
            y1={critY - 12}
            x2={critX + 22}
            y2={critY + 12}
            stroke="#e11d48"
            strokeWidth={8}
            strokeLinecap="round"
            className="animate-pulse"
          />
        )}

        {/* 5. Highway Nodes & IoT Probe Markers */}
        {corridor.nodes.map((node, idx) => {
          const [nx, ny] = project(node.lon, node.lat);
          const isCritical = node.critical_risk && isBlocked;

          return (
            <g
              key={idx}
              className="cursor-pointer transition transform hover:scale-125"
              onClick={() => setSelectedNode(node)}
            >
              <circle
                cx={nx}
                cy={ny}
                r={isCritical ? 9 : 5}
                fill={isCritical ? '#e11d48' : '#0284c7'}
                stroke="#0f172a"
                strokeWidth={2}
              />
              {activeLayers.iotSensors && (
                <circle
                  cx={nx + 6}
                  cy={ny - 6}
                  r={3}
                  fill="#f59e0b"
                  className="animate-pulse"
                />
              )}
              {/* Chainage Labels */}
              <text
                x={nx + 10}
                y={ny + 4}
                fill="#94a3b8"
                fontSize={10}
                fontFamily="monospace"
                fontWeight={isCritical ? 'bold' : 'normal'}
              >
                {node.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Selected Node Inspector Popup */}
      {selectedNode && (
        <div className="absolute bottom-14 left-4 bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-xl z-20 text-xs font-mono text-slate-200 max-w-xs backdrop-blur-md animate-in fade-in">
          <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
            <span className="font-bold text-white flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" /> {selectedNode.name}
            </span>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-500 hover:text-white"
            >
              ×
            </button>
          </div>
          <div className="pt-2 space-y-1 text-[11px] text-slate-400">
            <div>Chainage: <span className="text-white">KM {selectedNode.chainage_km}</span></div>
            <div>Coordinates: <span className="text-white">{selectedNode.lat}° N, {selectedNode.lon}° E</span></div>
            {selectedNode.critical_risk && isBlocked && (
              <div className="text-rose-400 font-semibold pt-1 border-t border-slate-800">
                STATUS: SEVERED BY DEBRIS RUNOUT (Vol: 5,200 m³)
              </div>
            )}
            {activeLayers.iotSensors && (
              <div className="pt-1 text-amber-400 flex items-center gap-1">
                <Radio className="w-3 h-3" /> Live Pore Pressure: 48.2 kPa (High)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Legend HUD */}
      <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 px-3 py-2 rounded-lg text-[10px] font-mono text-slate-400 flex items-center gap-4 z-10">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1 bg-sky-400 rounded-full" />
          <span>Highway Vector</span>
        </div>
        {activeLayers.safeCorridor && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-emerald-500 border-b border-dashed border-emerald-300" />
            <span className="text-emerald-300">Convoy Bypass</span>
          </div>
        )}
        {isBlocked && (
          <div className="flex items-center gap-1.5 text-rose-400">
            <AlertOctagon className="w-3 h-3" />
            <span>Severed Chokepoint</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-amber-400">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>ESP32 Probe</span>
        </div>
      </div>
    </div>
  );
};
