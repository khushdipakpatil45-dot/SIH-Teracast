'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Layers,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  AlertTriangle,
  Key,
  Box,
  Eye,
  EyeOff,
  Satellite,
  Mountain,
  Moon,
  Map as MapIcon,
} from 'lucide-react';

interface GoogleMapsGisProps {
  corridorId: string;
  isBlocked: boolean;
  onSelectNode?: (nodeName: string) => void;
}

// Real GPS coordinates for the NH-10 corridor
const DEFAULT_CENTER: [number, number] = [27.15, 88.50];
const DEFAULT_ZOOM = 10;

const NH10_WAYPOINTS: { name: string; coords: [number, number]; isCapital?: boolean }[] = [
  { name: 'Siliguri Hub', coords: [26.7271, 88.3953] },
  { name: 'Sevoke Diversion', coords: [26.8833, 88.4719] },
  { name: 'Teesta Bazaar (Hazard Zone)', coords: [27.0607, 88.4975] },
  { name: 'Singtam Depot', coords: [27.2348, 88.4984] },
  { name: 'Ranipool Outpost', coords: [27.2954, 88.5833] },
  { name: 'Gangtok Command HQ', coords: [27.3389, 88.6065], isCapital: true },
];

const NH10_POLYLINE: [number, number][] = NH10_WAYPOINTS.map((w) => w.coords);

const BYPASS_ROUTE: [number, number][] = [
  [26.8833, 88.4719],  // Sevoke
  [26.9800, 88.5800],  // Gorubathan
  [27.0869, 88.5866],  // Lava
  [27.0594, 88.4695],  // Kalimpong
  [27.2348, 88.4984],  // Rejoin Singtam
  [27.3389, 88.6065],  // Gangtok
];

const SAR_ZONES: {
  id: string;
  name: string;
  tier: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  color: string;
  fillOpacity: number;
  velocity: string;
  coords: [number, number][];
}[] = [
  {
    id: 'crit-teesta',
    name: 'Teesta Gorge Escarpment (KM 29.4)',
    tier: 'CRITICAL',
    color: '#ef4444',
    fillOpacity: 0.55,
    velocity: '-24.8 mm/yr',
    coords: [
      [27.045, 88.475],
      [27.075, 88.515],
      [27.065, 88.530],
      [27.035, 88.490],
    ],
  },
  {
    id: 'high-singtam',
    name: 'Singtam North Cut Slope',
    tier: 'HIGH',
    color: '#f97316',
    fillOpacity: 0.45,
    velocity: '-14.2 mm/yr',
    coords: [
      [27.220, 88.480],
      [27.250, 88.515],
      [27.240, 88.530],
      [27.210, 88.495],
    ],
  },
  {
    id: 'mod-ranipool',
    name: 'Ranipool Valley Fluvial Bank',
    tier: 'MODERATE',
    color: '#eab308',
    fillOpacity: 0.40,
    velocity: '-8.1 mm/yr',
    coords: [
      [27.280, 88.565],
      [27.310, 88.600],
      [27.300, 88.615],
      [27.270, 88.580],
    ],
  },
  {
    id: 'low-sevoke',
    name: 'Sevoke Forest Bedrock (Stable)',
    tier: 'LOW',
    color: '#22c55e',
    fillOpacity: 0.30,
    velocity: '-1.2 mm/yr',
    coords: [
      [26.870, 88.440],
      [26.900, 88.490],
      [26.890, 88.510],
      [26.860, 88.460],
    ],
  },
];

type TileLayer = 'dark' | 'satellite' | 'terrain';

const TILE_SOURCES: Record<TileLayer, { url: string; attr: string; maxZoom: number; maxNativeZoom?: number }> = {
  dark: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attr: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 18,
    maxNativeZoom: 16,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18,
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attr: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
    maxZoom: 17,
  },
};

export const GoogleMapsGis: React.FC<GoogleMapsGisProps> = ({
  corridorId,
  isBlocked,
  onSelectNode,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const tileRef = useRef<any>(null);
  const overlayGroupRef = useRef<any>(null);

  const [activeTile, setActiveTile] = useState<TileLayer>('dark');
  const [showSarHeatmap, setShowSarHeatmap] = useState(true);
  const [showBypass, setShowBypass] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  // ---------- Leaflet init ----------
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;
    let alive = true;

    const boot = async () => {
      const L = (await import('leaflet')).default;
      if (!alive || !mapContainerRef.current) return;

      // destroy previous instance if hot-reload
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: false,
        attributionControl: false,
      });

      const src = TILE_SOURCES[activeTile];
      tileRef.current = L.tileLayer(src.url, {
        maxZoom: src.maxZoom,
        maxNativeZoom: src.maxNativeZoom,
      }).addTo(map);
      overlayGroupRef.current = L.layerGroup().addTo(map);

      mapRef.current = map;
      setMapReady(true);
    };

    boot();

    return () => {
      alive = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Switch base tiles ----------
  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return;
    const swap = async () => {
      const L = (await import('leaflet')).default;
      if (tileRef.current) mapRef.current.removeLayer(tileRef.current);
      const src = TILE_SOURCES[activeTile];
      tileRef.current = L.tileLayer(src.url, {
        maxZoom: src.maxZoom,
        maxNativeZoom: src.maxNativeZoom,
      }).addTo(mapRef.current);
    };
    swap();
  }, [activeTile]);

  // ---------- Render overlays ----------
  useEffect(() => {
    if (!mapRef.current || !overlayGroupRef.current || typeof window === 'undefined') return;

    const draw = async () => {
      const L = (await import('leaflet')).default;
      const grp = overlayGroupRef.current;
      grp.clearLayers();

      // 1 ── SAR Deformation Heatmap Polygons
      if (showSarHeatmap) {
        SAR_ZONES.forEach((z) => {
          const poly = L.polygon(z.coords, {
            color: z.color,
            weight: 2,
            fillColor: z.color,
            fillOpacity: z.fillOpacity,
            dashArray: z.tier === 'CRITICAL' ? undefined : '4,4',
          }).addTo(grp);

          poly.bindPopup(`
            <div style="font-family:monospace;font-size:11px;padding:2px 4px">
              <strong style="color:${z.color}">${z.name}</strong><br/>
              Tier: <b>${z.tier}</b><br/>
              InSAR LOS: <b>${z.velocity}</b><br/>
              Platform: Sentinel-1C / C-Band
            </div>
          `);
        });
      }

      // 2 ── NH-10 Main Highway (amber/yellow polyline)
      L.polyline(NH10_POLYLINE, {
        color: '#facc15',
        weight: 5,
        opacity: 0.95,
      })
        .addTo(grp)
        .bindPopup('<b style="color:#facc15;font-family:monospace">NH-10 Lifeline Corridor<br/>Siliguri → Gangtok</b>');

      // 3 ── Blocked section at Teesta Bazaar
      if (isBlocked) {
        const blockedSeg: [number, number][] = [
          [27.035, 88.480],
          [27.0607, 88.4975],
          [27.085, 88.510],
        ];

        L.polyline(blockedSeg, {
          color: '#ef4444',
          weight: 9,
          opacity: 1,
          dashArray: '8,6',
        })
          .addTo(grp)
          .bindPopup('<b style="color:#ef4444;font-family:monospace">🚨 NH-10 SEVERED — KM 29.4 DEBRIS RUNOUT</b>');

        // Pulsing failure marker
        const pulseIcon = L.divIcon({
          className: '',
          html: `
            <div style="position:relative;display:flex;align-items:center;justify-content:center;width:40px;height:40px">
              <div style="position:absolute;width:40px;height:40px;background:#ef4444;border-radius:50%;animation:ping 1.2s cubic-bezier(0,0,.2,1) infinite;opacity:.6"></div>
              <div style="position:relative;width:16px;height:16px;background:#ef4444;border:3px solid #fff;border-radius:50%;box-shadow:0 0 12px rgba(239,68,68,.7)"></div>
            </div>
            <style>@keyframes ping{75%,100%{transform:scale(2);opacity:0}}</style>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        L.marker([27.0607, 88.4975], { icon: pulseIcon })
          .addTo(grp)
          .bindPopup(`
            <div style="font-family:monospace;font-size:11px;padding:4px">
              <strong style="color:#ef4444">CRITICAL CREEP: -24.8 mm/yr | BLOCKED</strong><br/>
              <span style="color:#94a3b8">Debris Volume: 5,200 m³<br/>FS: 0.88 (FAILURE)</span>
            </div>
          `);
      }

      // 4 ── Safe NDRF Convoy Bypass (green dashed polyline)
      if (showBypass) {
        L.polyline(BYPASS_ROUTE, {
          color: '#10b981',
          weight: 4,
          opacity: 0.9,
          dashArray: '8,6',
        })
          .addTo(grp)
          .bindPopup('<b style="color:#10b981;font-family:monospace">NDRF/SDRF Safe Convoy Bypass<br/>Via Lava → Kalimpong Ridge Route</b>');
      }

      // 5 ── Town markers
      NH10_WAYPOINTS.forEach((wp) => {
        const isCapital = wp.isCapital;
        const townIcon = L.divIcon({
          className: '',
          html: `
            <div style="display:flex;align-items:center;gap:4px;cursor:pointer;background:rgba(15,23,42,.85);backdrop-filter:blur(8px);padding:2px 6px;border-radius:4px;border:1px solid #334155;box-shadow:0 2px 8px rgba(0,0,0,.5)">
              <div style="width:8px;height:8px;border-radius:50%;background:${isCapital ? '#06b6d4' : '#f8fafc'};${isCapital ? 'box-shadow:0 0 6px #06b6d4' : ''}"></div>
              <span style="font-size:10px;font-family:monospace;font-weight:700;color:#e2e8f0;white-space:nowrap">${wp.name}</span>
            </div>
          `,
          iconSize: [120, 22],
          iconAnchor: [60, 11],
        });

        L.marker(wp.coords, { icon: townIcon })
          .addTo(grp)
          .on('click', () => onSelectNode?.(wp.name));
      });

      // 6 ── Flagged slope markers (🚩)
      const flagSlopes: { name: string; coords: [number, number]; risk: string }[] = [
        { name: 'Slope FL-29 (Teesta Escarpment)', coords: [27.055, 88.505], risk: 'CRITICAL' },
        { name: 'Slope FL-12 (Ranipool North)', coords: [27.302, 88.596], risk: 'HIGH' },
        { name: 'Slope FL-08 (Sevoke Cutting)', coords: [26.892, 88.472], risk: 'MODERATE' },
      ];

      flagSlopes.forEach((sl) => {
        const flagIcon = L.divIcon({
          className: '',
          html: `<div style="font-size:18px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5));cursor:pointer;text-align:center">🚩</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 20],
        });

        L.marker(sl.coords, { icon: flagIcon })
          .addTo(grp)
          .bindPopup(`
            <div style="font-family:monospace;font-size:11px;padding:2px 4px">
              <strong style="color:#ef4444">${sl.name}</strong><br/>
              Risk: <b>${sl.risk}</b><br/>
              PINN Mohr-Coulomb FS: 0.88
            </div>
          `);
      });
    };

    draw();
  }, [corridorId, isBlocked, showSarHeatmap, showBypass, onSelectNode, mapReady]);

  // ---------- Map controls ----------
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleRecenter = () => mapRef.current?.setView(DEFAULT_CENTER, DEFAULT_ZOOM);

  return (
    <div className="relative w-full h-full min-h-[520px] bg-slate-950 flex flex-col rounded-lg overflow-hidden border border-slate-700/80 shadow-2xl">
      {/* ── Header Bar ── */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/95 border-b border-slate-700/80 z-10 select-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <h3 className="text-xs font-mono font-bold tracking-wider text-slate-100 uppercase">
            LIVE GIS MAP <span className="text-slate-400 text-[10px] font-normal">(Constraint d/b)</span>
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/70 border border-blue-600/40 text-blue-400">
            SENTINEL-1 C-BAND InSAR + {activeTile === 'satellite' ? 'ESRI SATELLITE' : activeTile === 'terrain' ? 'OPENTOPOMAP TERRAIN' : 'ESRI DARK GRAY (DEFAULT)'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            SAR COHERENCE: 96.2%
          </span>
        </div>
      </div>

      {/* ── Map Container ── */}
      <div className="relative flex-1 w-full h-full min-h-[460px]">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* ─────────────────────────────────────────────────────── */}
        {/* TOP-LEFT: Floating Legend                               */}
        {/* ─────────────────────────────────────────────────────── */}
        <div className="absolute top-3 left-3 z-20 bg-slate-900/80 backdrop-blur-md border border-slate-700/70 rounded-lg p-2.5 shadow-2xl max-w-[200px] text-[11px] select-none">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold border-b border-slate-700/60 pb-1 mb-1.5 flex items-center justify-between">
            <span>Spatial Legend</span>
            <span className="text-cyan-400 text-[9px]">SAR 10m</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-red-500 border border-red-400 flex-shrink-0" />
              <span className="text-slate-200 font-medium">Critical (FS &lt; 1.0)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-amber-500 border border-amber-400 flex-shrink-0" />
              <span className="text-slate-300">High (FS 1.0–1.2)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-yellow-500 border border-yellow-400 flex-shrink-0" />
              <span className="text-slate-300">Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 border border-emerald-400 flex-shrink-0" />
              <span className="text-slate-400">Stable</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-1 rounded bg-yellow-400 flex-shrink-0" />
              <span className="text-slate-300">NH-10 Highway</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-1 rounded bg-emerald-400 flex-shrink-0" style={{ borderTop: '1px dashed white' }} />
              <span className="text-slate-300">Safe Convoy Bypass</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">🚩</span>
              <span className="text-slate-300">Flagged Slopes</span>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────── */}
        {/* TOP-RIGHT: Glassmorphism Layer Controls                 */}
        {/* ─────────────────────────────────────────────────────── */}
        <div className="absolute top-3 right-3 z-20 bg-slate-900/70 backdrop-blur-xl border border-slate-600/50 rounded-xl p-2.5 shadow-2xl select-none min-w-[170px]">
          <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400 mb-2 font-bold">
            Map Layers
          </div>

          {/* Base Tile Buttons */}
          <div className="flex gap-1 mb-2">
            <button
              onClick={() => setActiveTile('dark')}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-mono rounded-lg transition-all ${
                activeTile === 'dark'
                  ? 'bg-blue-600/90 text-white font-bold shadow-md shadow-blue-500/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80'
              }`}
              title="Dark Mode (Default) - Esri World Dark Gray Base"
            >
              <Moon className="w-3 h-3" />
              Dark Mode (Default)
            </button>
            <button
              onClick={() => setActiveTile('satellite')}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-mono rounded-lg transition-all ${
                activeTile === 'satellite'
                  ? 'bg-blue-600/90 text-white font-bold shadow-md shadow-blue-500/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80'
              }`}
              title="Satellite - Esri World Imagery"
            >
              <Satellite className="w-3 h-3" />
              Satellite
            </button>
            <button
              onClick={() => setActiveTile('terrain')}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-mono rounded-lg transition-all ${
                activeTile === 'terrain'
                  ? 'bg-blue-600/90 text-white font-bold shadow-md shadow-blue-500/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80'
              }`}
              title="Terrain - OpenTopoMap"
            >
              <Mountain className="w-3 h-3" />
              Terrain
            </button>
          </div>

          {/* Toggle Overlays */}
          <div className="space-y-1.5 border-t border-slate-700/60 pt-2">
            <button
              onClick={() => setShowSarHeatmap(!showSarHeatmap)}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[10px] font-mono transition-all ${
                showSarHeatmap
                  ? 'bg-red-950/70 border border-red-600/50 text-red-300 font-bold'
                  : 'bg-slate-800/60 border border-slate-700/40 text-slate-400'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {showSarHeatmap ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                SAR InSAR Heatmap
              </span>
              <span className="text-[9px]">{showSarHeatmap ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setShowBypass(!showBypass)}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[10px] font-mono transition-all ${
                showBypass
                  ? 'bg-emerald-950/70 border border-emerald-600/50 text-emerald-300 font-bold'
                  : 'bg-slate-800/60 border border-slate-700/40 text-slate-400'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {showBypass ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                Bypass Route
              </span>
              <span className="text-[9px]">{showBypass ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────── */}
        {/* BOTTOM-RIGHT: Zoom / Recenter                          */}
        {/* ─────────────────────────────────────────────────────── */}
        <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1 bg-slate-900/80 backdrop-blur-md border border-slate-700/70 p-1.5 rounded-lg shadow-2xl">
          <button onClick={handleZoomIn} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors" title="Zoom In">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleZoomOut} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors" title="Zoom Out">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleRecenter} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded text-xs transition-colors" title="Recenter NH-10 Corridor">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
