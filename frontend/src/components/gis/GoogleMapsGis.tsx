'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Layers,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  AlertTriangle,
  Radio,
  Eye,
  EyeOff,
  Satellite,
  Mountain,
  Compass,
  Map as MapIcon,
  ShieldAlert
} from 'lucide-react';
import { CORRIDORS_DATA, CorridorData } from '@/lib/corridors';

interface GoogleMapsGisProps {
  corridorId: string;
  isBlocked: boolean;
  onSelectNode?: (nodeName: string) => void;
}

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
    attr: 'Tiles &copy; Esri &mdash; USGS, ESA, Copernicus',
    maxZoom: 18,
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attr: 'Map data: &copy; OpenStreetMap contributors, SRTM',
    maxZoom: 17,
  },
};

// Fallback SAR zones mapped by corridor
const FALLBACK_SAR_ZONES: Record<string, Array<{
  id: string;
  name: string;
  tier: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  color: string;
  fillOpacity: number;
  velocity: string;
  coords: [number, number][]; // [lat, lon]
}>> = {
  'NH-10': [
    {
      id: 'crit-teesta',
      name: 'Teesta Gorge Escarpment (KM 29.4)',
      tier: 'CRITICAL',
      color: '#ef4444',
      fillOpacity: 0.55,
      velocity: '-24.8 mm/yr',
      coords: [[27.045, 88.475], [27.075, 88.515], [27.065, 88.530], [27.035, 88.490]]
    },
    {
      id: 'high-singtam',
      name: 'Singtam North Cut Slope',
      tier: 'HIGH',
      color: '#f97316',
      fillOpacity: 0.45,
      velocity: '-14.2 mm/yr',
      coords: [[27.220, 88.480], [27.250, 88.515], [27.240, 88.530], [27.210, 88.495]]
    },
    {
      id: 'mod-ranipool',
      name: 'Ranipool Fluvial Toe',
      tier: 'MODERATE',
      color: '#eab308',
      fillOpacity: 0.40,
      velocity: '-8.1 mm/yr',
      coords: [[27.280, 88.565], [27.310, 88.600], [27.300, 88.615], [27.270, 88.580]]
    }
  ],
  'NH-27': [
    {
      id: 'crit-haflong',
      name: 'Haflong - Jatinga Valley Mudflow Basin (Dima Hasao)',
      tier: 'CRITICAL',
      color: '#ef4444',
      fillOpacity: 0.60,
      velocity: '-28.6 mm/yr',
      coords: [[25.150, 93.010], [25.180, 93.045], [25.165, 93.060], [25.135, 93.025]]
    },
    {
      id: 'crit-harangajao',
      name: 'Harangajao Subsided Cut-Slope',
      tier: 'CRITICAL',
      color: '#ef4444',
      fillOpacity: 0.55,
      velocity: '-21.2 mm/yr',
      coords: [[24.960, 92.840], [24.990, 92.875], [24.975, 92.890], [24.945, 92.855]]
    }
  ],
  'SH-5': [
    {
      id: 'crit-mawkdok',
      name: 'Mawkdok Dympep Gorge Canyon Rim (East Khasi Hills)',
      tier: 'CRITICAL',
      color: '#ef4444',
      fillOpacity: 0.60,
      velocity: '-22.1 mm/yr',
      coords: [[25.340, 91.740], [25.370, 91.775], [25.355, 91.790], [25.325, 91.755]]
    },
    {
      id: 'high-sohra',
      name: 'Sohra (Cherrapunji) Plateau Saturation Toe',
      tier: 'HIGH',
      color: '#f97316',
      fillOpacity: 0.50,
      velocity: '-16.4 mm/yr',
      coords: [[25.260, 91.710], [25.285, 91.745], [25.275, 91.760], [25.250, 91.725]]
    }
  ],
  'NH-310A': [
    {
      id: 'crit-chungthang',
      name: 'Chungthang Teesta Headwaters Dam Breach (North Sikkim)',
      tier: 'CRITICAL',
      color: '#ef4444',
      fillOpacity: 0.65,
      velocity: '-26.3 mm/yr',
      coords: [[27.590, 88.630], [27.620, 88.665], [27.605, 88.675], [27.575, 88.640]]
    }
  ],
  'NH-306': [
    {
      id: 'high-sairang',
      name: 'Sairang Valley Regolith Slump (Aizawl)',
      tier: 'HIGH',
      color: '#f97316',
      fillOpacity: 0.55,
      velocity: '-16.8 mm/yr',
      coords: [[23.790, 92.650], [23.820, 92.685], [23.805, 92.695], [23.775, 92.660]]
    }
  ],
  'NH-13': [
    {
      id: 'high-sela',
      name: 'Sela Pass High-Altitude Talus Slump (Tawang)',
      tier: 'HIGH',
      color: '#f97316',
      fillOpacity: 0.55,
      velocity: '-15.4 mm/yr',
      coords: [[27.490, 92.090], [27.520, 92.125], [27.505, 92.135], [27.475, 92.100]]
    }
  ],
  'NH-29': [
    {
      id: 'crit-paglapahar',
      name: 'Pagla Pahar Chokepoint Creep Zone (Nagaland)',
      tier: 'CRITICAL',
      color: '#ef4444',
      fillOpacity: 0.60,
      velocity: '-21.4 mm/yr',
      coords: [[25.750, 93.850], [25.770, 93.880], [25.755, 93.895], [25.735, 93.865]]
    }
  ],
  'NH-6': [
    {
      id: 'crit-sonapur',
      name: 'Sonapur Tunnel Mudflow Chokepoint (Meghalaya)',
      tier: 'CRITICAL',
      color: '#ef4444',
      fillOpacity: 0.60,
      velocity: '-23.4 mm/yr',
      coords: [[25.095, 92.345], [25.125, 92.380], [25.110, 92.395], [25.080, 92.360]]
    }
  ]
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
  const [sarGeoJsonData, setSarGeoJsonData] = useState<any>(null);

  const corridorData: CorridorData = CORRIDORS_DATA[corridorId] || CORRIDORS_DATA['NH-10'];

  // Fetch live SAR GeoJSON feed for the active corridor
  useEffect(() => {
    let isSubscribed = true;
    const fetchSarFeed = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
        const res = await fetch(`${backendUrl}/api/v1/sar/heatmap?corridor_id=${corridorId}`);
        if (res.ok) {
          const data = await res.json();
          if (isSubscribed && data && data.features) {
            setSarGeoJsonData(data);
          }
        }
      } catch {
        // Fallback to calibrated local fixtures
      }
    };

    fetchSarFeed();
    return () => {
      isSubscribed = false;
    };
  }, [corridorId]);

  // Leaflet map initialization
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;
    let alive = true;

    const boot = async () => {
      const L = (await import('leaflet')).default;
      if (!alive || !mapContainerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: corridorData.center,
        zoom: corridorData.zoom,
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

  // Update center/zoom when corridor changes
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    mapRef.current.flyTo(corridorData.center, corridorData.zoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [corridorId, corridorData, mapReady]);

  // Switch base tiles
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

  // Render overlays
  useEffect(() => {
    if (!mapRef.current || !overlayGroupRef.current || typeof window === 'undefined') return;

    const draw = async () => {
      const L = (await import('leaflet')).default;
      const grp = overlayGroupRef.current;
      grp.clearLayers();

      // 1. SAR Deformation Hazard Polygons
      if (showSarHeatmap) {
        if (sarGeoJsonData && sarGeoJsonData.features && sarGeoJsonData.features.length > 0) {
          L.geoJSON(sarGeoJsonData, {
            style: (feature: any) => {
              const p = feature.properties || {};
              return {
                color: p.stroke_color || p.risk_color || '#ef4444',
                weight: p.stroke_weight || 2,
                fillColor: p.fill_color || p.risk_color || '#ef4444',
                fillOpacity: p.fill_opacity || 0.55,
              };
            },
            onEachFeature: (feature: any, layer: any) => {
              const p = feature.properties || {};
              layer.bindPopup(`
                <div style="font-family:monospace;font-size:11px;padding:4px 6px;line-height:1.4">
                  <div style="font-weight:bold;color:${p.risk_color || '#ef4444'};border-bottom:1px solid #334155;padding-bottom:2px;margin-bottom:3px">
                    ${p.name || 'SAR Hazard Sector'}
                  </div>
                  <div>Tier: <b>${p.threat_tier || 'CRITICAL'}</b></div>
                  <div>InSAR Velocity: <b>${p.los_velocity_mm_year ? p.los_velocity_mm_year + ' mm/yr' : 'N/A'}</b></div>
                  <div>Pore Pressure: <b>${p.pore_pressure_kpa ? p.pore_pressure_kpa + ' kPa' : 'N/A'}</b></div>
                  <div>Sensor Platform: <b>${p.sensor_platform || 'Sentinel-1C / InSAR C-Band'}</b></div>
                  <div style="color:#94a3b8;font-size:10px;margin-top:2px">${p.description || ''}</div>
                </div>
              `);
            },
          }).addTo(grp);
        } else {
          // Local fallback polygons for active corridor
          const fallbackZones = FALLBACK_SAR_ZONES[corridorId] || FALLBACK_SAR_ZONES['NH-10'];
          fallbackZones.forEach((z) => {
            const poly = L.polygon(z.coords, {
              color: z.color,
              weight: 2,
              fillColor: z.color,
              fillOpacity: z.fillOpacity,
            }).addTo(grp);

            poly.bindPopup(`
              <div style="font-family:monospace;font-size:11px;padding:4px 6px;line-height:1.4">
                <div style="font-weight:bold;color:${z.color};border-bottom:1px solid #334155;padding-bottom:2px;margin-bottom:3px">
                  ${z.name}
                </div>
                <div>Tier: <b>${z.tier}</b></div>
                <div>InSAR LOS: <b>${z.velocity}</b></div>
                <div>Sensor Platform: Sentinel-1C / C-Band</div>
              </div>
            `);
          });
        }
      }

      // 2. Main Highway Polyline
      const waypoints: [number, number][] = corridorData.nodes.map((n) => [n.lat, n.lon]);
      L.polyline(waypoints, {
        color: isBlocked ? '#ef4444' : '#eab308',
        weight: 4.5,
        opacity: 0.95,
        dashArray: isBlocked ? '6, 5' : undefined,
      }).addTo(grp);

      // 3. Highway Nodes / Checkpoints
      corridorData.nodes.forEach((node) => {
        const isCritical = node.critical_risk;
        const markerColor = isCritical && isBlocked ? '#ef4444' : isCritical ? '#f97316' : '#38bdf8';

        const circle = L.circleMarker([node.lat, node.lon], {
          radius: isCritical ? 6.5 : 4.5,
          fillColor: markerColor,
          color: '#0f172a',
          weight: 2,
          fillOpacity: 1,
        }).addTo(grp);

        circle.bindPopup(`
          <div style="font-family:monospace;font-size:11px;padding:2px 4px">
            <strong style="color:${markerColor}">${node.name}</strong><br/>
            Chainage: <b>KM ${node.chainage_km.toFixed(1)}</b><br/>
            Status: <b>${isCritical && isBlocked ? 'SEVERED / BLOCKED' : isCritical ? 'HIGH RISK' : 'PASSABLE'}</b>
          </div>
        `);

        if (onSelectNode) {
          circle.on('click', () => onSelectNode(node.name));
        }
      });

      // 4. Tactical Safe Convoy Bypass
      if (showBypass && corridorData.bypass && corridorData.bypass.coordinates.length > 0) {
        const bypassCoords: [number, number][] = corridorData.bypass.coordinates.map(([lon, lat]) => [lat, lon]);
        L.polyline(bypassCoords, {
          color: '#10b981',
          weight: 3.5,
          dashArray: '6, 5',
          opacity: 0.9,
        }).addTo(grp);

        // Checkpoints along bypass
        corridorData.bypass.checkpoints.forEach((cp, idx) => {
          if (idx < bypassCoords.length) {
            const coord = bypassCoords[Math.min(idx, bypassCoords.length - 1)];
            L.circleMarker(coord, {
              radius: 4,
              fillColor: '#10b981',
              color: '#022c22',
              weight: 1.5,
              fillOpacity: 1,
            })
              .bindPopup(`
                <div style="font-family:monospace;font-size:11px;padding:2px 4px">
                  <strong style="color:#10b981">${cp.name}</strong><br/>
                  Status: <b>${cp.status}</b><br/>
                  Route: Convoy Safe Bypass
                </div>
              `)
              .addTo(grp);
          }
        });
      }
    };

    draw();
  }, [corridorId, corridorData, isBlocked, showSarHeatmap, showBypass, sarGeoJsonData, onSelectNode]);

  // Zoom controls
  const handleZoom = (delta: number) => {
    if (!mapRef.current) return;
    mapRef.current.setZoom(mapRef.current.getZoom() + delta);
  };

  const handleResetView = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo(corridorData.center, corridorData.zoom, { duration: 1.0 });
  };

  return (
    <div className="relative w-full h-full min-h-[580px] bg-slate-950 border border-slate-700 rounded-lg overflow-hidden flex flex-col select-none">
      
      {/* Top Tactical HUD Bar */}
      <div className="absolute top-2 left-2 right-2 z-[400] flex items-center justify-between gap-2 pointer-events-none">
        
        {/* Left Status HUD */}
        <div className="bg-slate-900/95 border border-slate-700 rounded px-2.5 py-1.5 flex items-center gap-3 text-xs font-mono pointer-events-auto shadow-md">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span className="font-bold text-slate-200">{corridorData.id}</span>
            <span className="text-slate-400 text-[11px]">({corridorData.state})</span>
          </div>

          <span className="text-slate-700">|</span>

          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-slate-400">Status:</span>
            {isBlocked ? (
              <span className="text-red-400 font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> SEVERED
              </span>
            ) : (
              <span className="text-emerald-400 font-bold">CLEAR / PASSABLE</span>
            )}
          </div>

          <span className="text-slate-700 hidden sm:inline">|</span>

          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400">
            <span>Center:</span>
            <span className="text-slate-200">{corridorData.center[0].toFixed(2)}°N, {corridorData.center[1].toFixed(2)}°E</span>
          </div>
        </div>

        {/* Right Layer & Satellite Switcher */}
        <div className="bg-slate-900/95 border border-slate-700 rounded p-1 flex items-center gap-1 pointer-events-auto shadow-md text-xs font-mono">
          {(['dark', 'satellite', 'terrain'] as TileLayer[]).map((tile) => (
            <button
              key={tile}
              onClick={() => setActiveTile(tile)}
              className={`px-2 py-0.5 rounded uppercase text-[10px] font-bold transition-colors ${
                activeTile === tile
                  ? 'bg-slate-700 text-cyan-400 border border-slate-600'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tile}
            </button>
          ))}
        </div>

      </div>

      {/* Leaflet Map Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full flex-1 z-0" />

      {/* Bottom Map Controls Overlay */}
      <div className="absolute bottom-2 left-2 z-[400] flex items-center gap-1.5 bg-slate-900/95 border border-slate-700 rounded p-1 text-xs font-mono shadow-md">
        
        {/* Toggle SAR */}
        <button
          onClick={() => setShowSarHeatmap(!showSarHeatmap)}
          className={`px-2 py-1 rounded text-[11px] flex items-center gap-1.5 font-bold transition-colors ${
            showSarHeatmap
              ? 'bg-red-950/70 border border-red-700/80 text-red-300'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          {showSarHeatmap ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>SAR InSAR Polygons</span>
        </button>

        {/* Toggle Tactical Bypass */}
        <button
          onClick={() => setShowBypass(!showBypass)}
          className={`px-2 py-1 rounded text-[11px] flex items-center gap-1.5 font-bold transition-colors ${
            showBypass
              ? 'bg-emerald-950/70 border border-emerald-700/80 text-emerald-300'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          {showBypass ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>Tactical Bypass</span>
        </button>

      </div>

      {/* Bottom Right Zoom Controls */}
      <div className="absolute bottom-2 right-2 z-[400] flex flex-col gap-1 bg-slate-900/95 border border-slate-700 rounded p-1 shadow-md">
        <button
          onClick={() => handleZoom(1)}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(-1)}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors"
          title="Reset Corridor View"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};
