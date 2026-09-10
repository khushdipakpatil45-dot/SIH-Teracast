'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  Navigation, 
  Layers, 
  Wifi, 
  WifiOff, 
  Activity, 
  Radio, 
  Camera, 
  PhoneCall, 
  Clock, 
  ChevronRight,
  Play,
  RotateCcw,
  CheckCircle,
  Download,
  CloudRain,
  CloudLightning,
  Droplets,
  Wind,
  AlertTriangle,
  Send,
  UserCheck,
  ChevronDown,
  Compass,
  FileText,
  Share2,
  ExternalLink,
  Flame
} from 'lucide-react';
import { useHazardStore } from '@/stores/useHazardStore';
import { subscribeToHazardEvents } from '@/lib/supabase';
import { CORRIDORS_DATA } from '@/lib/corridors';
import { GoogleMapsGis } from '@/components/gis/GoogleMapsGis';
import { SnapAndVerify } from '@/components/field/SnapAndVerify';
import { PredictiveChart } from '@/components/analytics/PredictiveChart';

export default function CommandCenter() {
  const { 
    selectedCorridor, 
    setSelectedCorridor, 
    activeLayers, 
    toggleLayer, 
    criticalZonesCount, 
    updateCriticalCount,
    blockedRoadSegments,
    addBlockedSegment
  } = useHazardStore();

  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'GIS MAP' | 'RISK REPORTS' | 'FIELD SYNC' | 'ALERTS' | 'RESOURCES'>('DASHBOARD');
  const [currentTime, setCurrentTime] = useState('11 SEP 2026 | 01:30 IST');
  const [isOnline, setIsOnline] = useState(true);
  const [isSimulatingStorm, setIsSimulatingStorm] = useState(false);
  const [isSnapModalOpen, setIsSnapModalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'khasi' | 'mizo' | 'assamese' | 'bodo' | 'garo'>('en');
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [alertsCount, setAlertsCount] = useState(4);

  const activeCorridorData = CORRIDORS_DATA[selectedCorridor] || CORRIDORS_DATA['NH-10'];
  const isHighwayBlocked = isSimulatingStorm || blockedRoadSegments.includes(selectedCorridor);

  // Live IST Clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format as DD MMM YYYY | HH:mm IST
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const day = String(now.getDate()).padStart(2, '0');
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${day} ${month} ${year} | ${hours}:${mins} IST`);
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Network monitor
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Supabase Realtime CDC subscription
  useEffect(() => {
    const unsubscribe = subscribeToHazardEvents(
      selectedCorridor,
      (alert) => {
        updateCriticalCount((c) => c + 1);
        setAlertsCount((prev) => prev + 1);
      },
      (cutoff) => {
        addBlockedSegment(cutoff.segment_name);
      }
    );
    return unsubscribe;
  }, [selectedCorridor, updateCriticalCount, addBlockedSegment]);

  // Simulation handler: Escalates rainfall and pore pressure to trigger shear failure
  const handleToggleStormSimulation = () => {
    if (!isSimulatingStorm) {
      setIsSimulatingStorm(true);
      addBlockedSegment(selectedCorridor);
      updateCriticalCount((c) => c + 1);
      setAlertsCount((prev) => prev + 1);
    } else {
      setIsSimulatingStorm(false);
    }
  };

  // Export tactical convoy bypass coordinates as GeoJSON
  const handleExportBypassGeoJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify(activeCorridorData.bypass, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `TERRACAST_${selectedCorridor}_BYPASS.geojson`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none font-sans pb-9">
      
      {/* ========================================================================= */}
      {/* 1. TOP NAVIGATION BAR                                                     */}
      {/* ========================================================================= */}
      <header className="h-14 bg-slate-900 border-b border-slate-700/80 px-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        {/* Left: App Logo + TERRACAST-NER + vertical separator + Muted Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 p-0.5 flex items-center justify-center shadow-md shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <span className="font-extrabold text-base tracking-wider text-white font-mono">
              TERRACAST-NER
            </span>
          </div>

          <div className="h-5 w-[1px] bg-slate-700 hidden sm:block"></div>

          <span className="text-xs text-slate-400 font-mono tracking-wider hidden sm:block">
            TITLE: AI-POWERED EARLY WARNING | NER
          </span>
        </div>

        {/* Center Navigation Tabs: Pill-style tabs */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-full border border-slate-800">
          {(['DASHBOARD', 'GIS MAP', 'RISK REPORTS', 'FIELD SYNC', 'ALERTS', 'RESOURCES'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1 text-xs font-mono rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600/25 text-blue-400 border border-blue-500/60 shadow-sm shadow-blue-500/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Red alert badge pill + User profile dropdown */}
        <div className="flex items-center gap-3">
          {/* Red Alert Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/70 border border-red-500/60 text-red-400 text-xs font-mono font-bold animate-pulse shadow-sm shadow-red-500/20">
            <span className="text-sm">🚨</span>
            <span>{alertsCount} ACTIVE ALERTS</span>
          </div>

          {/* User Profile Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-medium text-slate-200 transition-colors shadow-sm"
            >
              <span>👤</span>
              <span className="hidden sm:inline">District Admin | Gangtok</span>
              <span className="sm:hidden">Admin</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {adminDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-52 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1.5 z-50 text-xs font-mono">
                <div className="px-3 py-1.5 border-b border-slate-800 text-slate-400">
                  Logged in as: <strong className="text-slate-200 block">SDRF Gangtok HQ</strong>
                </div>
                <button 
                  onClick={() => setAdminDropdownOpen(false)}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300"
                >
                  Switch Corridor (NH-10 / NH-29)
                </button>
                <button 
                  onClick={() => setAdminDropdownOpen(false)}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300"
                >
                  IVRS Audio Broadcast Panel
                </button>
                <div className="border-t border-slate-800 my-1"></div>
                <button 
                  onClick={() => setAdminDropdownOpen(false)}
                  className="w-full text-left px-3 py-1.5 hover:bg-red-950/50 text-red-400"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN 4-COLUMN COMMAND CENTER GRID (18% | 44% | 20% | 18%)                 */}
      {/* ========================================================================= */}
      <main className="flex-1 p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 max-w-[1920px] w-full mx-auto">

        {/* ----------------------------------------------------------------------- */}
        {/* COLUMN 1: Status & Weather Summary (~18% width -> col-span-2)          */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          
          {/* Card 1: Date/Time */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-lg p-3 shadow-md">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              <span>Station Timestamp</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-sm font-mono font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>{currentTime}</span>
            </div>
            <div className="mt-1 text-[10px] font-mono text-slate-400">
              Indian Standard Time (UTC+05:30)
            </div>
          </div>

          {/* Card 2: Current Status */}
          <div className="bg-slate-900/90 border border-amber-500/40 rounded-lg p-3 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>
            <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              Operation Mode
            </div>
            <div className="px-2.5 py-1.5 rounded-md bg-amber-950/60 border border-amber-600/50 text-amber-300 font-mono text-xs font-bold leading-tight">
              MONSOON DETECTED - ACTIVE MONITORING
            </div>
            <div className="mt-2 text-[10px] text-slate-400 font-mono flex items-center justify-between">
              <span>Teesta Basin Saturation</span>
              <span className="text-amber-400 font-bold">88.4%</span>
            </div>
          </div>

          {/* Card 3: Risk Summary - Constraint f */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-lg p-3 shadow-md flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Risk Summary (Constraint f)
                </span>
                <span className="text-[10px] font-mono text-slate-500">55 SLOPES</span>
              </div>

              <div className="space-y-2">
                {/* Critical */}
                <div className="bg-red-950/60 border border-red-600/60 rounded-lg px-3 py-2 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-xs font-mono font-bold text-red-200">Critical</span>
                  </div>
                  <span className="text-base font-mono font-black text-red-400">{criticalZonesCount}</span>
                </div>

                {/* High */}
                <div className="bg-amber-950/60 border border-amber-600/60 rounded-lg px-3 py-2 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-xs font-mono font-bold text-amber-200">High</span>
                  </div>
                  <span className="text-base font-mono font-black text-amber-400">15</span>
                </div>

                {/* Moderate */}
                <div className="bg-yellow-950/50 border border-yellow-600/50 rounded-lg px-3 py-2 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                    <span className="text-xs font-mono font-bold text-yellow-200">Moderate</span>
                  </div>
                  <span className="text-base font-mono font-black text-yellow-400">34</span>
                </div>
              </div>
            </div>

            {/* Quick Corridor Switcher */}
            <div className="mt-3 pt-2.5 border-t border-slate-800">
              <span className="text-[9px] font-mono uppercase text-slate-400 block mb-1.5">Monitored Corridor</span>
              <div className="grid grid-cols-3 gap-1">
                {(['NH-10', 'NH-29', 'NH-6'] as const).map((id) => (
                  <button
                    key={id}
                    onClick={() => setSelectedCorridor(id)}
                    className={`py-1 text-[10px] font-mono font-bold rounded transition-colors ${
                      selectedCorridor === id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 4: Weather Forecast - IMD API */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-lg p-3 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                Weather Forecast
              </span>
              <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                IMD API live data
              </span>
            </div>

            {/* 2x2 Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-950/70 border border-slate-800 rounded p-2 flex flex-col">
                <div className="flex items-center justify-between text-slate-400">
                  <CloudRain className="w-4 h-4 text-cyan-400" />
                  <span className="text-[10px]">Gangtok</span>
                </div>
                <div className="text-sm font-bold text-white mt-1">15°C</div>
                <div className="text-[9px] text-cyan-300">Heavy Rain</div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded p-2 flex flex-col">
                <div className="flex items-center justify-between text-slate-400">
                  <CloudLightning className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px]">Ranipool</span>
                </div>
                <div className="text-sm font-bold text-white mt-1">18°C</div>
                <div className="text-[9px] text-amber-300">Downpour</div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded p-2 flex flex-col">
                <div className="flex items-center justify-between text-slate-400">
                  <Droplets className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px]">Singtam</span>
                </div>
                <div className="text-sm font-bold text-white mt-1">19°C</div>
                <div className="text-[9px] text-blue-300">92% Humid</div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded p-2 flex flex-col">
                <div className="flex items-center justify-between text-slate-400">
                  <Wind className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px]">Sevoke</span>
                </div>
                <div className="text-sm font-bold text-white mt-1">21°C</div>
                <div className="text-[9px] text-emerald-300">42 km/h Wind</div>
              </div>
            </div>
          </div>

          {/* Interactive Simulation Trigger Button */}
          <button
            onClick={handleToggleStormSimulation}
            className={`w-full py-2.5 px-3 rounded-lg font-mono text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
              isSimulatingStorm
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white shadow-blue-700/30'
            }`}
          >
            {isSimulatingStorm ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>RESET SIMULATION</span>
              </>
            ) : (
              <>
                <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>SIMULATE STORM (KM 29.4)</span>
              </>
            )}
          </button>

        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* COLUMN 2: Detailed GIS SAR Map (~44% width -> col-span-5)              */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-5 flex flex-col gap-2 min-h-[580px] h-full">
          <GoogleMapsGis 
            corridorId={selectedCorridor} 
            isBlocked={isHighwayBlocked}
          />
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* COLUMN 3: Analytics & Incident Response (~20% width -> col-span-3)      */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          
          {/* Card A: LIVE PREDICTIVE ANALYTICS (Constraint b/f) */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-lg p-3 shadow-md">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                LIVE PREDICTIVE ANALYTICS (Constraint b/f)
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-950 border border-red-700/60 text-red-400 animate-pulse">
                LIVE PINN
              </span>
            </div>

            {/* Subheader */}
            <div className="bg-red-950/50 border-l-2 border-red-500 px-2.5 py-1.5 my-2 rounded-r">
              <div className="text-xs font-mono font-bold text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>NH-10 | PINN Model: FAILURE PROBABLE in 4 Hours</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                Pore water pressure exceeds critical shear resistance.
              </div>
            </div>

            {/* Interactive Predictive Line Chart */}
            <PredictiveChart />
          </div>

          {/* Card B: EMERGENCY ALERTS LOG (Constraint c) */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-lg p-3 shadow-md flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                EMERGENCY ALERTS LOG (Constraint c)
              </span>
              <span className="text-[9px] font-mono text-cyan-400">IVRS &amp; CAP</span>
            </div>

            {/* Scrollable feed */}
            <div className="space-y-2 overflow-y-auto max-h-[170px] pr-1">
              <div className="bg-slate-950/80 border border-red-800/60 rounded p-2 text-[11px] font-mono">
                <div className="text-red-400 font-bold">
                  [CRITICAL | NH-10 Ranipool | 11:15 IST]
                </div>
                <div className="text-slate-300 mt-0.5 text-[10px]">
                  SMS/Voice Sent (Mizo, Nepalese, English) to SDRF &amp; NDRF 2nd Bn.
                </div>
              </div>

              <div className="bg-slate-950/80 border border-amber-800/60 rounded p-2 text-[11px] font-mono">
                <div className="text-amber-400 font-bold">
                  [HIGH | NH-29 Pagla Pahar | 10:30 IST]
                </div>
                <div className="text-slate-300 mt-0.5 text-[10px]">
                  Soil pore pressure spiked to 42.1 kPa. Traffic divert alert dispatched.
                </div>
              </div>

              <div className="bg-slate-950/80 border border-yellow-800/60 rounded p-2 text-[11px] font-mono">
                <div className="text-yellow-400 font-bold">
                  [WARNING | NH-6 Sonapur | 09:45 IST]
                </div>
                <div className="text-slate-300 mt-0.5 text-[10px]">
                  InSAR deformation &gt;14mm/yr detected. Border Roads Org notified.
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded p-2 text-[11px] font-mono">
                <div className="text-slate-400 font-bold">
                  [ADVISORY | Gangtok Urban | 08:20 IST]
                </div>
                <div className="text-slate-400 mt-0.5 text-[10px]">
                  Heavy precipitation &gt;65mm/hr forecast by IMD Doppler Radar.
                </div>
              </div>
            </div>
          </div>

          {/* Card C: ROAD CONNECTIVITY & REROUTING (Constraint f) */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-lg p-3 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                ROAD CONNECTIVITY &amp; REROUTING (Constraint f)
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-700/60 text-emerald-400 font-semibold">
                OSRM ACTIVE
              </span>
            </div>

            {/* Text Status */}
            <div className="space-y-1 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-red-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span>• NH-10 blocked (Red)</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>• NDRF/SDRF alternate safe routes calculated</span>
              </div>
            </div>

            {/* Mini thumbnail canvas / card showing bypass route */}
            <div className="mt-2.5 bg-slate-950 border border-slate-800 rounded p-2 relative overflow-hidden">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-slate-800 pb-1 mb-1.5">
                <span className="text-cyan-400 font-bold">Tactical Bypass Route</span>
                <span>Lava → Algarah → Kalimpong</span>
              </div>

              {/* Schematic Bypass Visual */}
              <div className="h-14 w-full relative flex items-center justify-center bg-slate-950/90 rounded border border-slate-800/60">
                <svg viewBox="0 0 280 50" className="w-full h-full">
                  {/* Blocked line */}
                  <line x1="20" y1="35" x2="140" y2="35" stroke="#ef4444" strokeWidth="3" strokeDasharray="4,3" />
                  <circle cx="140" cy="35" r="4" fill="#ef4444" />
                  <text x="140" y="47" fill="#ef4444" fontSize="8" textAnchor="middle" fontFamily="monospace">KM 29.4 BLOCKED</text>

                  {/* Bypass dashed line */}
                  <path d="M 20 35 Q 80 5 150 12 T 260 20" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="5,4" />
                  <circle cx="260" cy="20" r="3.5" fill="#10b981" />
                  <text x="260" y="12" fill="#10b981" fontSize="8" textAnchor="middle" fontFamily="monospace">GANGTOK</text>
                </svg>
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">Clearance: <strong className="text-emerald-400">100% CLEAR</strong></span>
                <button
                  onClick={handleExportBypassGeoJSON}
                  className="px-2 py-0.5 rounded bg-blue-900/60 hover:bg-blue-800 border border-blue-600/60 text-blue-300 flex items-center gap-1 text-[10px] transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Export GPX/GeoJSON
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* COLUMN 4: Field Reports & Citizen Science (~18% width -> col-span-2)   */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-lg p-3 shadow-md flex-1 flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                FIELD REPORTS (Constraint e/d)
              </span>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.2 rounded">
                8 TODAY
              </span>
            </div>

            {/* Top Action Mini-Bar */}
            <div className="bg-slate-950/80 border border-slate-800 rounded px-2.5 py-1.5 flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                + Geo-tagged user uploads
              </span>
              <span className="text-[9px] font-mono text-slate-400">Offline-sync</span>
            </div>

            {/* Scrollable Card Feed: 4 Populated Submissions */}
            <div className="space-y-2.5 overflow-y-auto flex-1 pr-1 max-h-[460px]">
              
              {/* Card 1 */}
              <div className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-lg p-2 transition-colors">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/60 flex items-center justify-center text-xs font-bold text-blue-300 flex-shrink-0">
                    RV
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="font-bold text-slate-200 truncate">Rajesh Vol.</span>
                      <span className="text-[10px] text-slate-400">10:45 IST</span>
                    </div>
                    <div className="text-[10px] font-mono text-cyan-400">Ranipool</div>
                    <div className="text-[11px] text-slate-300 mt-1 italic leading-tight">
                      &ldquo;Minor Slumping/Visible Cracks&rdquo;
                    </div>
                  </div>
                </div>

                {/* Embedded photo thumbnail with play overlay icon */}
                <div className="mt-2 relative h-16 w-full rounded bg-slate-900 overflow-hidden border border-slate-800 flex items-center justify-center group cursor-pointer">
                  {/* Realistic Field Texture Simulation */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/60 via-slate-900 to-slate-800 opacity-90"></div>
                  <div className="absolute inset-0 flex flex-col justify-end p-1.5 z-10">
                    <span className="text-[9px] font-mono text-slate-300">Geo-tag: 27.294°N, 88.591°E</span>
                  </div>
                  <div className="relative z-20 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm border border-white/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-lg p-2 transition-colors">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-600/30 border border-amber-500/60 flex items-center justify-center text-xs font-bold text-amber-300 flex-shrink-0">
                    TB
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="font-bold text-slate-200 truncate">Tashi BRO Officer</span>
                      <span className="text-[10px] text-slate-400">10:12 IST</span>
                    </div>
                    <div className="text-[10px] font-mono text-amber-400">29th Mile Escarpment</div>
                    <div className="text-[11px] text-slate-300 mt-1 italic leading-tight">
                      &ldquo;Talus scree sliding onto road shoulder&rdquo;
                    </div>
                  </div>
                </div>

                {/* Embedded photo thumbnail */}
                <div className="mt-2 relative h-16 w-full rounded bg-slate-900 overflow-hidden border border-slate-800 flex items-center justify-center group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-tr from-red-950/60 via-slate-900 to-slate-800 opacity-90"></div>
                  <div className="absolute inset-0 flex flex-col justify-end p-1.5 z-10">
                    <span className="text-[9px] font-mono text-slate-300">Azimuth: 184° | Tilt: 44°</span>
                  </div>
                  <div className="relative z-20 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm border border-white/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-lg p-2 transition-colors">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-600/30 border border-emerald-500/60 flex items-center justify-center text-xs font-bold text-emerald-300 flex-shrink-0">
                    PS
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="font-bold text-slate-200 truncate">Pema SDRF Scout</span>
                      <span className="text-[10px] text-slate-400">09:30 IST</span>
                    </div>
                    <div className="text-[10px] font-mono text-emerald-400">Singtam Bridge</div>
                    <div className="text-[11px] text-slate-300 mt-1 italic leading-tight">
                      &ldquo;Turbid seepage observed at culvert base&rdquo;
                    </div>
                  </div>
                </div>

                <div className="mt-2 relative h-16 w-full rounded bg-slate-900 overflow-hidden border border-slate-800 flex items-center justify-center group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/60 via-slate-900 to-slate-800 opacity-90"></div>
                  <div className="absolute inset-0 flex flex-col justify-end p-1.5 z-10">
                    <span className="text-[9px] font-mono text-slate-300">Confidence: 94% Verified</span>
                  </div>
                  <div className="relative z-20 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm border border-white/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-lg p-2 transition-colors">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-purple-600/30 border border-purple-500/60 flex items-center justify-center text-xs font-bold text-purple-300 flex-shrink-0">
                    BC
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="font-bold text-slate-200 truncate">Bikram Citizen</span>
                      <span className="text-[10px] text-slate-400">08:50 IST</span>
                    </div>
                    <div className="text-[10px] font-mono text-purple-400">Rangpo Chokepoint</div>
                    <div className="text-[11px] text-slate-300 mt-1 italic leading-tight">
                      &ldquo;Tension fissure opening along wall&rdquo;
                    </div>
                  </div>
                </div>

                <div className="mt-2 relative h-16 w-full rounded bg-slate-900 overflow-hidden border border-slate-800 flex items-center justify-center group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-950/60 via-slate-900 to-slate-800 opacity-90"></div>
                  <div className="absolute inset-0 flex flex-col justify-end p-1.5 z-10">
                    <span className="text-[9px] font-mono text-slate-300">Flagged for Drone Survey</span>
                  </div>
                  <div className="relative z-20 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm border border-white/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Fixed CTA Button: Full-width bright blue button */}
            <button
              onClick={() => setIsSnapModalOpen(true)}
              className="mt-3 w-full py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-mono text-xs font-bold tracking-wide transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>+ UPLOAD GEO-TAGGED REPORT</span>
            </button>

          </div>

        </div>

      </main>

      {/* ========================================================================= */}
      {/* 6. BOTTOM STICKY FOOTER BAR                                               */}
      {/* ========================================================================= */}
      <footer className="fixed bottom-0 left-0 right-0 h-8 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-4 flex items-center justify-between text-[11px] font-mono z-40">
        
        {/* Left: System Health Indicators */}
        <div className="flex items-center gap-4 text-slate-400 overflow-x-auto whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>PINN SOLVER: <strong className="text-slate-200">OPERATIONAL (LATENCY 42ms)</strong></span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>SAR COHERENCE: <strong className="text-slate-200">98.4%</strong></span>
          </div>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>VOELLMY-SALM: <strong className="text-slate-200">READY</strong></span>
          </div>
          <span className="text-slate-700 hidden md:inline">|</span>
          <div className="hidden md:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>POSTGIS: <strong className="text-slate-200">CONNECTED</strong></span>
          </div>
        </div>

        {/* Right: Connectivity Status Badge */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[10px] sm:text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>OFFLINE SYNC: ENABLED | NETWORK: LOW (Constraints d/e/low network/offline)</span>
          </div>
        </div>

      </footer>

      {/* Snap & Verify Offline PWA Modal */}
      <SnapAndVerify 
        isOpen={isSnapModalOpen} 
        onClose={() => setIsSnapModalOpen(false)} 
        corridorId={selectedCorridor}
      />

    </div>
  );
}
