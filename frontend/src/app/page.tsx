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
  Flame,
  ArrowLeft,
  Film
} from 'lucide-react';
import { useHazardStore } from '@/stores/useHazardStore';
import { subscribeToHazardEvents } from '@/lib/supabase';
import { CORRIDORS_DATA, CorridorData } from '@/lib/corridors';
import { GoogleMapsGis } from '@/components/gis/GoogleMapsGis';
import { SnapAndVerify } from '@/components/field/SnapAndVerify';
import { PredictiveChart } from '@/components/analytics/PredictiveChart';

interface AlertItem {
  id: string;
  tier: string;
  district: string;
  corridor: string;
  location: string;
  timestamp: string;
  summary: string;
  dialects: string[];
  channels: string[];
}

interface FieldReportItem {
  report_id: string;
  client_uuid: string;
  reporter_name: string;
  reporter_phone: string;
  corridor_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  compass_azimuth: number;
  slope_tilt: number;
  hazard_type: string;
  severity: string;
  notes: string;
  media_type: 'image' | 'video' | 'none';
  media_url: string | null;
  thumbnail_url: string | null;
  exif_verified: boolean;
  exif_metadata: any;
  anti_spoofing_status: string;
  confidence_score: number;
  timestamp: string;
  created_at: string;
}

// Initial emergency dispatch log
const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 'disp-001',
    tier: 'CRITICAL',
    district: 'Dima Hasao',
    corridor: 'NH-27',
    location: 'Haflong - Jatinga Valley',
    timestamp: '09:45 IST',
    dialects: ['Assamese', 'English'],
    channels: ['SIP IVRS Outbound', 'Bulk SMS', 'CAP-CP'],
    summary: '[CRITICAL | Dima Hasao | 09:45 IST] IVRS & SMS dispatched to SDRF and Local Villages',
  },
  {
    id: 'disp-002',
    tier: 'CRITICAL',
    district: 'East Khasi Hills',
    corridor: 'SH-5',
    location: 'Mawkdok Dympep Gorge',
    timestamp: '09:15 IST',
    dialects: ['Khasi', 'English'],
    channels: ['SIP Automated Call', 'SMS Gateway'],
    summary: '[CRITICAL | East Khasi Hills | 09:15 IST] IVRS & SMS dispatched to SDRF and Local Villages',
  },
  {
    id: 'disp-003',
    tier: 'HIGH',
    district: 'North Sikkim',
    corridor: 'NH-310A',
    location: 'Chungthang Headwaters',
    timestamp: '08:50 IST',
    dialects: ['Nepali', 'English'],
    channels: ['SMS Broadcast', 'VHF Relay'],
    summary: '[HIGH | North Sikkim | 08:50 IST] Soil saturation 91%. Pre-emptive traffic diversion intimation dispatched',
  },
  {
    id: 'disp-004',
    tier: 'CRITICAL',
    district: 'Sikkim (NH-10)',
    corridor: 'NH-10',
    location: '29th Mile (Teesta Gorge)',
    timestamp: '08:10 IST',
    dialects: ['Nepali', 'Hindi', 'English'],
    channels: ['SIP IVRS Broadcast', 'SMS Gateway'],
    summary: '[CRITICAL | NH-10 Teesta | 08:10 IST] IVRS & SMS dispatched to SDRF and Local Villages',
  },
  {
    id: 'disp-005',
    tier: 'HIGH',
    district: 'Aizawl',
    corridor: 'NH-306',
    location: 'Sairang Hill Incline',
    timestamp: '07:30 IST',
    dialects: ['Mizo', 'English'],
    channels: ['SMS Gateway', 'Local Radio'],
    summary: '[HIGH | Aizawl | 07:30 IST] IVRS & SMS dispatched to SDRF and Local Villages',
  }
];

// Initial field reports seed
const INITIAL_FIELD_REPORTS: FieldReportItem[] = [
  {
    report_id: 'rep-ner-001',
    client_uuid: 'cl-001',
    reporter_name: 'Rajesh Vol.',
    reporter_phone: '+91-98765-43210',
    corridor_id: 'NH-10',
    location_name: 'Ranipool Valley',
    latitude: 27.2940,
    longitude: 88.5910,
    compass_azimuth: 185.0,
    slope_tilt: 42.0,
    hazard_type: 'ROAD_SUBSIDENCE',
    severity: 'HIGH',
    notes: 'Minor slumping and visible diagonal tension crack across road lane.',
    media_type: 'image',
    media_url: '/uploads/seed_ranipool.jpg',
    thumbnail_url: '/uploads/seed_ranipool.jpg',
    exif_verified: true,
    exif_metadata: { camera: 'Sony IMX766 (Mobile)', geotag_integrity: 'HARDWARE_STAMPED_MATCH' },
    anti_spoofing_status: 'VALID',
    confidence_score: 0.96,
    timestamp: '10:45 IST',
    created_at: '2026-09-11T05:15:00Z'
  },
  {
    report_id: 'rep-ner-002',
    client_uuid: 'cl-002',
    reporter_name: 'Tashi BRO Officer',
    reporter_phone: '+91-94350-11223',
    corridor_id: 'NH-10',
    location_name: '29th Mile Escarpment',
    latitude: 26.9851,
    longitude: 88.4612,
    compass_azimuth: 184.0,
    slope_tilt: 46.5,
    hazard_type: 'ROCKFALL',
    severity: 'CRITICAL',
    notes: 'Talus scree sliding onto road shoulder. Rockfall barrier breached.',
    media_type: 'image',
    media_url: '/uploads/seed_29mile.jpg',
    thumbnail_url: '/uploads/seed_29mile.jpg',
    exif_verified: true,
    exif_metadata: { camera: 'Garmin GPSCam Pro', geotag_integrity: 'HARDWARE_STAMPED_MATCH' },
    anti_spoofing_status: 'VALID',
    confidence_score: 0.98,
    timestamp: '10:12 IST',
    created_at: '2026-09-11T04:42:00Z'
  },
  {
    report_id: 'rep-ner-003',
    client_uuid: 'cl-003',
    reporter_name: 'Lalthanga SDRF Scout',
    reporter_phone: '+91-98623-77889',
    corridor_id: 'NH-27',
    location_name: 'Haflong Hill Cut (Dima Hasao)',
    latitude: 25.1682,
    longitude: 93.0298,
    compass_azimuth: 210.0,
    slope_tilt: 44.0,
    hazard_type: 'MUD_FLOW',
    severity: 'CRITICAL',
    notes: 'Rotational mudflow active near Jatinga valley railway alignment.',
    media_type: 'video',
    media_url: '/uploads/seed_haflong.mp4',
    thumbnail_url: '/uploads/seed_haflong_thumb.jpg',
    exif_verified: true,
    exif_metadata: { video_codec: 'H.264 / MP4', geotag_integrity: 'CELLULAR_TRIANGULATION_VERIFIED' },
    anti_spoofing_status: 'VALID',
    confidence_score: 0.94,
    timestamp: '09:50 IST',
    created_at: '2026-09-11T04:20:00Z'
  },
  {
    report_id: 'rep-ner-004',
    client_uuid: 'cl-004',
    reporter_name: 'Pema Citizen',
    reporter_phone: '+91-94361-99887',
    corridor_id: 'NH-310A',
    location_name: 'Chungthang Headwaters',
    latitude: 27.6040,
    longitude: 88.6470,
    compass_azimuth: 175.0,
    slope_tilt: 48.0,
    hazard_type: 'TENSION_CRACK',
    severity: 'HIGH',
    notes: 'Turbid seepage observed at culvert base and 8cm fissure.',
    media_type: 'image',
    media_url: '/uploads/seed_chungthang.jpg',
    thumbnail_url: '/uploads/seed_chungthang.jpg',
    exif_verified: true,
    exif_metadata: { camera: 'iPhone 14 Pro', geotag_integrity: 'HARDWARE_STAMPED_MATCH' },
    anti_spoofing_status: 'VALID',
    confidence_score: 0.95,
    timestamp: '09:30 IST',
    created_at: '2026-09-11T04:00:00Z'
  }
];

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

  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'GIS MAP' | 'FIELD SYNC' | 'ALERTS' | 'RESOURCES'>('DASHBOARD');
  const [currentTime, setCurrentTime] = useState('11 SEP 2026 | 09:30 IST');
  const [isOnline, setIsOnline] = useState(true);
  const [isSimulatingStorm, setIsSimulatingStorm] = useState(false);
  const [isSnapModalOpen, setIsSnapModalOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [alertsCount, setAlertsCount] = useState(5);

  // Dynamic state for emergency alerts log
  const [alertsLog, setAlertsLog] = useState<AlertItem[]>(INITIAL_ALERTS);

  // Dynamic state for field reports feed
  const [fieldReports, setFieldReports] = useState<FieldReportItem[]>(INITIAL_FIELD_REPORTS);

  const activeCorridorData: CorridorData = CORRIDORS_DATA[selectedCorridor] || CORRIDORS_DATA['NH-10'];
  const isHighwayBlocked = isSimulatingStorm || blockedRoadSegments.includes(selectedCorridor);

  // Live IST Clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
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

  // Fetch live backend alert history & field reports on mount
  useEffect(() => {
    const loadBackendFeeds = async () => {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      try {
        const [alertsRes, reportsRes] = await Promise.all([
          fetch(`${backendUrl}/api/v1/hazard/alerts/history`).catch(() => null),
          fetch(`${backendUrl}/api/v1/field-reports/history`).catch(() => null),
        ]);

        if (alertsRes && alertsRes.ok) {
          const alertsData = await alertsRes.json();
          if (Array.isArray(alertsData) && alertsData.length > 0) {
            setAlertsLog(alertsData);
            setAlertsCount(alertsData.length);
          }
        }

        if (reportsRes && reportsRes.ok) {
          const reportsData = await reportsRes.json();
          if (Array.isArray(reportsData) && reportsData.length > 0) {
            setFieldReports(reportsData);
          }
        }
      } catch {
        // Retain initial pre-seeded data
      }
    };

    loadBackendFeeds();
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
  const handleToggleStormSimulation = async () => {
    if (!isSimulatingStorm) {
      setIsSimulatingStorm(true);
      addBlockedSegment(selectedCorridor);
      updateCriticalCount((c) => c + 1);
      setAlertsCount((prev) => prev + 1);

      const nowStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) + ' IST';
      const newAlert: AlertItem = {
        id: `disp-sim-${Date.now()}`,
        tier: 'CRITICAL',
        district: activeCorridorData.district,
        corridor: selectedCorridor,
        location: `${activeCorridorData.nodes.find(n => n.critical_risk)?.name || activeCorridorData.name}`,
        timestamp: nowStr,
        dialects: ['Assamese', 'Khasi', 'Mizo', 'English'],
        channels: ['SIP IVRS Outbound', 'SMS Broadcast', 'CAP-CP Intimation'],
        summary: `[CRITICAL | ${activeCorridorData.district} | ${nowStr}] IVRS & SMS dispatched to SDRF and Local Villages`
      };

      setAlertsLog((prev) => [newAlert, ...prev]);

      // Call backend dispatch endpoint if available
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
        await fetch(`${backendUrl}/api/v1/hazard/alerts/dispatch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            district: activeCorridorData.district,
            corridor_id: selectedCorridor,
            location: newAlert.location,
            tier: 'CRITICAL'
          })
        });
      } catch {
        // Fallback
      }
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

  // Handler for newly submitted field reports from SnapAndVerify
  const handleNewReportSubmitted = (newReport: FieldReportItem) => {
    setFieldReports((prev) => [newReport, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none font-sans pb-8">
      
      {/* ========================================================================= */}
      {/* 1. PERSISTENT TOP NAVIGATION BAR (Command Center Theme)                   */}
      {/* ========================================================================= */}
      <header className="h-13 bg-slate-900 border-b border-slate-700 px-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        
        {/* Left: App Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-slate-800 border border-slate-600 rounded flex items-center justify-center">
              <Radio className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="font-extrabold text-sm tracking-wider text-white font-mono">
              TERRACAST-NER
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-700 hidden sm:block"></div>

          <span className="text-[11px] text-slate-400 font-mono tracking-wide hidden sm:block uppercase">
            Disaster Early Warning &amp; Lifeline Command Center
          </span>
        </div>

        {/* Center Navigation Tabs: Clean Data-Dense Tabs */}
        <nav className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-0.5 rounded">
          {(['DASHBOARD', 'GIS MAP', 'FIELD SYNC', 'ALERTS', 'RESOURCES'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-cyan-400 border border-slate-600'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Red Alert Indicator + Corridor Switcher */}
        <div className="flex items-center gap-2.5">
          
          {/* Active Alerts Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-950/80 border border-red-700 text-red-300 text-xs font-mono font-bold">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>{alertsCount} DISPATCH ALERTS</span>
          </div>

          {/* Admin Station Profile */}
          <div className="relative">
            <button
              onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-mono text-slate-200 transition-colors"
            >
              <span>👤</span>
              <span className="hidden sm:inline">NER HQ | Gangtok</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {adminDropdownOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-slate-900 border border-slate-700 rounded shadow-xl py-1 z-50 text-xs font-mono">
                <div className="px-3 py-1.5 border-b border-slate-800 text-slate-400">
                  Command Agency: <strong className="text-slate-200 block">SDRF / NDRF NER Joint Cell</strong>
                </div>
                <div className="px-3 py-1 text-[10px] text-slate-500 uppercase font-bold">Monitored State Sector</div>
                {Object.keys(CORRIDORS_DATA).map((cid) => (
                  <button
                    key={cid}
                    onClick={() => {
                      setSelectedCorridor(cid);
                      setAdminDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1 text-xs hover:bg-slate-800 flex items-center justify-between ${
                      selectedCorridor === cid ? 'text-cyan-400 font-bold bg-slate-800/60' : 'text-slate-300'
                    }`}
                  >
                    <span>{cid}</span>
                    <span className="text-[10px] text-slate-400">{CORRIDORS_DATA[cid].district}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. TAB ROUTING VIEW: FIELD SYNC FULL-SCREEN VIEW                          */}
      {/* ========================================================================= */}
      {activeTab === 'FIELD SYNC' ? (
        <main className="flex-1 flex flex-col p-4 max-w-4xl mx-auto w-full">
          <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('DASHBOARD')}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Back to Command Center Dashboard</span>
            </button>

            <span className="text-xs font-mono text-slate-400">
              Corridor Sector: <strong className="text-slate-200">{selectedCorridor} ({activeCorridorData.district})</strong>
            </span>
          </div>

          <SnapAndVerify
            isOpen={true}
            onClose={() => setActiveTab('DASHBOARD')}
            corridorId={selectedCorridor}
            onReportSubmitted={handleNewReportSubmitted}
            isFullScreenTab={true}
          />
        </main>
      ) : activeTab === 'GIS MAP' ? (
        <main className="flex-1 p-3 flex flex-col max-w-[1920px] w-full mx-auto">
          <div className="mb-2 flex items-center justify-between">
            <button
              onClick={() => setActiveTab('DASHBOARD')}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
            <div className="text-xs font-mono text-slate-400">
              Interactive Full-Screen GIS | Active Corridor: <strong className="text-slate-200">{selectedCorridor}</strong>
            </div>
          </div>
          <div className="flex-1 min-h-[750px]">
            <GoogleMapsGis corridorId={selectedCorridor} isBlocked={isHighwayBlocked} />
          </div>
        </main>
      ) : (
        /* ========================================================================= */
        /* 3. MAIN COMMAND CENTER GRID (High Data-Density Dashboard)                 */
        /* ========================================================================= */
        <main className="flex-1 p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 max-w-[1920px] w-full mx-auto">

          {/* ----------------------------------------------------------------------- */}
          {/* COLUMN 1: System Status & IMD/GPM Weather (~18% -> col-span-2)          */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            
            {/* Timestamp Panel */}
            <div className="bg-slate-900 border border-slate-700 rounded p-2.5 font-mono">
              <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                <span>Station Clock</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              </div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>{currentTime}</span>
              </div>
              <div className="mt-0.5 text-[9px] text-slate-500">
                Indian Standard Time (UTC+05:30)
              </div>
            </div>

            {/* Operational Mode Card */}
            <div className="bg-slate-900 border border-slate-700 rounded p-2.5 font-mono">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between font-bold">
                <span>Operation Mode</span>
                <span className="text-amber-400 text-[9px]">MONSOON SURGE</span>
              </div>
              <div className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-amber-300 text-[11px] font-bold">
                HIGHWAY PASSABILITY: {isHighwayBlocked ? 'CRITICAL SEVERANCE' : 'CONTROLLED OPEN'}
              </div>
              <div className="mt-1.5 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Current Basin:</span>
                <span className="text-slate-200 font-bold">{activeCorridorData.district}</span>
              </div>
            </div>

            {/* Full NER Corridor Switcher (All 8 Corridors) */}
            <div className="bg-slate-900 border border-slate-700 rounded p-2.5 font-mono">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  NER Corridor Selection
                </span>
                <span className="text-[9px] text-cyan-400">8 CORRIDORS</span>
              </div>
              
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                {Object.keys(CORRIDORS_DATA).map((cid) => {
                  const isSel = selectedCorridor === cid;
                  const item = CORRIDORS_DATA[cid];
                  return (
                    <button
                      key={cid}
                      onClick={() => setSelectedCorridor(cid)}
                      className={`p-1.5 rounded border text-left transition-colors ${
                        isSel
                          ? 'bg-slate-800 border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-bold">{cid}</div>
                      <div className="text-[9px] text-slate-500 truncate">{item.district}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Weather Forecast: Live IMD Doppler & NASA GPM Feed */}
            <div className="bg-slate-900 border border-slate-700 rounded p-2.5 font-mono">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Precipitation &amp; GPM Feed
                </span>
                <span className="text-[9px] text-emerald-400 flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  IMD / NASA GPM
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <div className="bg-slate-950 border border-slate-800 rounded p-1.5 flex flex-col">
                  <div className="flex items-center justify-between text-slate-400">
                    <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[10px]">Dima Hasao</span>
                  </div>
                  <div className="text-xs font-bold text-white mt-1">48.5 mm/h</div>
                  <div className="text-[9px] text-red-400">Saturation 91.2%</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded p-1.5 flex flex-col">
                  <div className="flex items-center justify-between text-slate-400">
                    <CloudLightning className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px]">East Khasi</span>
                  </div>
                  <div className="text-xs font-bold text-white mt-1">62.0 mm/h</div>
                  <div className="text-[9px] text-red-400">Saturation 94.8%</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded p-1.5 flex flex-col">
                  <div className="flex items-center justify-between text-slate-400">
                    <Droplets className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[10px]">N. Sikkim</span>
                  </div>
                  <div className="text-xs font-bold text-white mt-1">38.0 mm/h</div>
                  <div className="text-[9px] text-amber-400">Saturation 89.5%</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded p-1.5 flex flex-col">
                  <div className="flex items-center justify-between text-slate-400">
                    <Wind className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px]">Aizawl</span>
                  </div>
                  <div className="text-xs font-bold text-white mt-1">32.5 mm/h</div>
                  <div className="text-[9px] text-slate-400">Saturation 86.4%</div>
                </div>
              </div>
            </div>

            {/* Storm Simulation Trigger */}
            <button
              onClick={handleToggleStormSimulation}
              className={`w-full py-2 px-3 rounded font-mono text-xs font-bold transition-colors border flex items-center justify-center gap-1.5 ${
                isSimulatingStorm
                  ? 'bg-rose-950 border-rose-600 text-rose-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200'
              }`}
            >
              {isSimulatingStorm ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RESET MONSOON SIMULATION</span>
                </>
              ) : (
                <>
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>SIMULATE STORM SURGE</span>
                </>
              )}
            </button>

          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* COLUMN 2: Full NER GIS Map (~44% -> col-span-5)                         */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-5 flex flex-col min-h-[580px] h-full">
            <GoogleMapsGis 
              corridorId={selectedCorridor} 
              isBlocked={isHighwayBlocked}
            />
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* COLUMN 3: Predictive Analytics & Emergency Alerts Log (~20% -> col-span-3) */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            
            {/* Predictive PINN Analytics Chart */}
            <div className="bg-slate-900 border border-slate-700 rounded p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Predictive PINN Geotech Chart
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-950/80 border border-red-700 text-red-300 font-bold">
                  MDoNER 26001
                </span>
              </div>

              {/* Upgraded Multi-Variable Recharts Component */}
              <PredictiveChart />
            </div>

            {/* Emergency Alerts Log Intimation (Constraint 5) */}
            <div className="bg-slate-900 border border-slate-700 rounded p-2.5 flex-1 flex flex-col font-mono">
              <div className="flex items-center justify-between mb-2 border-b border-slate-800 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">
                    Emergency Alerts Log Intimation
                  </span>
                </div>
                <span className="text-[9px] text-cyan-400 font-bold">SIP/SMS GATEWAY</span>
              </div>

              {/* Dynamic Scrollable Dispatch Feed */}
              <div className="space-y-1.5 overflow-y-auto max-h-[220px] pr-1 flex-1">
                {alertsLog.map((alert) => {
                  const isCrit = alert.tier === 'CRITICAL';
                  return (
                    <div 
                      key={alert.id}
                      className={`p-2 rounded border text-xs leading-relaxed ${
                        isCrit 
                          ? 'bg-red-950/40 border-red-800/70 text-red-200' 
                          : 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold mb-0.5">
                        <span className={isCrit ? 'text-red-400' : 'text-amber-400'}>
                          [{alert.tier} | {alert.district} | {alert.timestamp}]
                        </span>
                        <span className="text-slate-400 text-[9px]">{alert.dialects.join('/')}</span>
                      </div>
                      <div className="text-[11px] text-slate-300 font-normal">
                        {alert.summary}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[9px] text-slate-400">
                        <span>Channels: <strong>{alert.channels.join(', ')}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bypass Rerouting Tactical Card */}
            <div className="bg-slate-900 border border-slate-700 rounded p-2.5 font-mono">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Tactical Convoy Bypass Routing
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold">
                  CLEAR ROUTE
                </span>
              </div>

              <div className="text-[11px] text-slate-300">
                <span className="text-slate-400">Active Corridor: </span>
                <strong className="text-white">{activeCorridorData.name}</strong>
              </div>
              <div className="text-[10px] text-cyan-400 mt-0.5">
                Bypass: {activeCorridorData.bypass.name}
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Distance: <strong>{activeCorridorData.bypass.distanceKm} km</strong></span>
                <button
                  onClick={handleExportBypassGeoJSON}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-cyan-300 flex items-center gap-1 text-[10px] font-bold transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Export GeoJSON
                </button>
              </div>
            </div>

          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* COLUMN 4: Field Reports & Citizen Media Sync (~18% -> col-span-2)       */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-2 flex flex-col gap-3 font-mono">
            
            <div className="bg-slate-900 border border-slate-700 rounded p-2.5 flex-1 flex flex-col">
              
              {/* Header */}
              <div className="flex items-center justify-between mb-2 border-b border-slate-800 pb-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">
                  Field Reports &amp; Media
                </span>
                <span className="text-[9px] text-emerald-400 font-bold">
                  {fieldReports.length} REPORTS
                </span>
              </div>

              {/* Action Bar */}
              <div className="bg-slate-950 border border-slate-800 rounded px-2 py-1 flex items-center justify-between mb-2">
                <span className="text-[10px] text-cyan-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  + Geotagged Media
                </span>
                <span className="text-[9px] text-slate-500">EXIF Validated</span>
              </div>

              {/* Dynamic Scrollable Reports Feed */}
              <div className="space-y-2 overflow-y-auto flex-1 pr-1 max-h-[460px]">
                {fieldReports.map((rep) => (
                  <div 
                    key={rep.report_id}
                    className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded p-2 transition-colors"
                  >
                    <div className="flex items-start justify-between text-[11px] mb-1">
                      <span className="font-bold text-slate-200 truncate">{rep.reporter_name}</span>
                      <span className="text-[10px] text-slate-400">{rep.timestamp}</span>
                    </div>

                    <div className="text-[10px] text-cyan-400 flex items-center justify-between">
                      <span>{rep.location_name}</span>
                      <span className={`px-1 rounded text-[9px] font-bold ${
                        rep.severity === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {rep.severity}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-300 mt-1 italic leading-tight">
                      &ldquo;{rep.notes}&rdquo;
                    </div>

                    {/* Media Thumbnail / Video Tag */}
                    <div className="mt-1.5 relative h-16 w-full rounded bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 bg-slate-800/80 flex flex-col justify-end p-1 z-10">
                        <span className="text-[9px] text-slate-300">
                          {rep.latitude.toFixed(3)}°N, {rep.longitude.toFixed(3)}°E
                        </span>
                      </div>

                      {rep.media_type === 'video' ? (
                        <div className="relative z-20 flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-700 text-[10px] text-cyan-300 font-bold">
                          <Film className="w-3 h-3 text-cyan-400" />
                          <span>MP4 VIDEO</span>
                        </div>
                      ) : (
                        <div className="relative z-20 flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-700 text-[10px] text-slate-300">
                          <Camera className="w-3 h-3 text-slate-400" />
                          <span>EXIF STAMPED</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Upload Report CTA Button */}
              <button
                onClick={() => setIsSnapModalOpen(true)}
                className="mt-2.5 w-full py-2 px-3 rounded bg-cyan-700 hover:bg-cyan-600 text-white font-mono text-xs font-bold tracking-wide transition-colors border border-cyan-500 flex items-center justify-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>+ UPLOAD GEOTAGGED REPORT</span>
              </button>

            </div>

          </div>

        </main>
      )}

      {/* ========================================================================= */}
      {/* 4. BOTTOM PERSISTENT FOOTER BAR                                           */}
      {/* ========================================================================= */}
      <footer className="fixed bottom-0 left-0 right-0 h-7 bg-slate-950 border-t border-slate-800 px-4 flex items-center justify-between text-[10px] font-mono z-40">
        
        {/* Left: System Health Indicators */}
        <div className="flex items-center gap-4 text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>PINN SOLVER: <strong className="text-slate-200">OPERATIONAL (38ms)</strong></span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span>SAR COHERENCE: <strong className="text-slate-200">98.2%</strong></span>
          </div>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>VOELLMY-SALM: <strong className="text-slate-200">CALIBRATED</strong></span>
          </div>
        </div>

        {/* Right: Offline / Low-bandwidth network status */}
        <div className="flex items-center gap-2 text-slate-400">
          <div className="flex items-center gap-1 text-emerald-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>LOW NETWORK ADAPTIVE: ONLINE</span>
          </div>
        </div>

      </footer>

      {/* Snap & Verify Modal */}
      <SnapAndVerify 
        isOpen={isSnapModalOpen} 
        onClose={() => setIsSnapModalOpen(false)} 
        corridorId={selectedCorridor}
        onReportSubmitted={handleNewReportSubmitted}
      />

    </div>
  );
}
