'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  Radio, 
  Camera, 
  Clock, 
  RotateCcw,
  Download,
  CloudRain,
  CloudLightning,
  Droplets,
  Wind,
  ChevronDown,
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
import s from './CommandCenter.module.css';

// ─── Interfaces (unchanged) ─────────────────────────────────────────────────

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

// ─── Seed Data (unchanged) ──────────────────────────────────────────────────

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

// ─── Component ──────────────────────────────────────────────────────────────

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

  const [alertsLog, setAlertsLog] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [fieldReports, setFieldReports] = useState<FieldReportItem[]>(INITIAL_FIELD_REPORTS);

  const activeCorridorData: CorridorData = CORRIDORS_DATA[selectedCorridor] || CORRIDORS_DATA['NH-10'];
  const isHighwayBlocked = isSimulatingStorm || blockedRoadSegments.includes(selectedCorridor);

  // ─── Effects (all unchanged) ──────────────────────────────────────────

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

  // ─── Handlers (all unchanged) ─────────────────────────────────────────

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

  const handleNewReportSubmitted = (newReport: FieldReportItem) => {
    setFieldReports((prev) => [newReport, ...prev]);
  };

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className={s.shell}>
      
      {/* ================================================================= */}
      {/* HEADER                                                             */}
      {/* ================================================================= */}
      <header className={s.header}>
        
        {/* Left: Logo + Subtitle */}
        <div className={s.headerLeft}>
          <div className={s.logoBox}>
            <Radio className="w-4 h-4" style={{ color: 'var(--cyan-400)' }} />
          </div>
          <span className={s.logoText}>TERRACAST-NER</span>
          <div className={s.headerDivider} />
          <span className={s.headerSubtitle}>
            Disaster Early Warning &amp; Lifeline Command Center
          </span>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className={s.nav}>
          {(['DASHBOARD', 'GIS MAP', 'FIELD SYNC', 'ALERTS', 'RESOURCES'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? s.navTabActive : s.navTab}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* Right: Alert Badge + Admin */}
        <div className={s.headerRight}>
          <div className={s.alertsBadge}>
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{alertsCount} DISPATCH ALERTS</span>
          </div>

          <div style={{ position: 'relative' }}>
            <button onClick={() => setAdminDropdownOpen(!adminDropdownOpen)} className={s.adminBtn}>
              <span>👤</span>
              <span>NER HQ | Gangtok</span>
              <ChevronDown className="w-3 h-3" style={{ color: 'var(--slate-400)' }} />
            </button>

            {adminDropdownOpen && (
              <div className={s.dropdown}>
                <div className={s.dropdownHeader}>
                  Command Agency: <strong style={{ color: 'var(--slate-200)', display: 'block' }}>SDRF / NDRF NER Joint Cell</strong>
                </div>
                <div className={s.dropdownLabel}>Monitored State Sector</div>
                {Object.keys(CORRIDORS_DATA).map((cid) => (
                  <button
                    key={cid}
                    onClick={() => { setSelectedCorridor(cid); setAdminDropdownOpen(false); }}
                    className={selectedCorridor === cid ? s.dropdownItemActive : s.dropdownItem}
                  >
                    <span>{cid}</span>
                    <span className={s.textTiny} style={{ color: 'var(--slate-400)' }}>{CORRIDORS_DATA[cid].district}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      </header>

      {/* ================================================================= */}
      {/* TAB: FIELD SYNC (full-screen view)                                 */}
      {/* ================================================================= */}
      {activeTab === 'FIELD SYNC' ? (
        <main className={s.tabView}>
          <div className={s.tabHeader}>
            <button onClick={() => setActiveTab('DASHBOARD')} className={s.backBtn}>
              <ArrowLeft className="w-4 h-4" />
              <span>← Back to Command Center</span>
            </button>
            <span className={s.tabMeta}>
              Corridor: <strong style={{ color: 'var(--slate-200)' }}>{selectedCorridor} ({activeCorridorData.district})</strong>
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
        /* ================================================================= */
        /* TAB: GIS MAP (full-screen view)                                   */
        /* ================================================================= */
        <main className={s.tabViewWide}>
          <div className={s.tabHeader}>
            <button onClick={() => setActiveTab('DASHBOARD')} className={s.backBtn}>
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
            <span className={s.tabMeta}>
              Full-Screen GIS | Corridor: <strong style={{ color: 'var(--slate-200)' }}>{selectedCorridor}</strong>
            </span>
          </div>
          <div className={s.fullMapContainer}>
            <GoogleMapsGis corridorId={selectedCorridor} isBlocked={isHighwayBlocked} />
          </div>
        </main>

      ) : (
        /* ================================================================= */
        /* DASHBOARD: Vertical Hero Map + 3-Column Data Grid                 */
        /* ================================================================= */
        <main className={s.main}>

          {/* ── HERO: Full-Width GIS Map (58vh landscape) ──────────────── */}
          <div className={s.heroMap}>
            <GoogleMapsGis 
              corridorId={selectedCorridor} 
              isBlocked={isHighwayBlocked}
            />
          </div>

          {/* ── DATA DASHBOARD: 3-Column Grid ─────────────────────────── */}
          <div className={s.dataGrid}>

            {/* ── COLUMN 1: Station Metadata & Weather ─────────────────── */}
            <div className={s.column}>

              {/* Station Clock */}
              <div className={s.card}>
                <div className={s.cardHeader}>
                  <span className={s.cardTitle}>Station Clock</span>
                  <span className={`${s.dot} ${s.dotGreen}`} />
                </div>
                <div className={s.clockRow} data-mono="">
                  <Clock className="w-3.5 h-3.5" style={{ color: 'var(--cyan-400)' }} />
                  <span>{currentTime}</span>
                </div>
                <div className={s.clockSub}>Indian Standard Time (UTC+05:30)</div>
              </div>

              {/* Operational Mode */}
              <div className={s.card}>
                <div className={s.cardHeader}>
                  <span className={s.cardTitle}>Operation Mode</span>
                  <span className={s.opModeTag}>MONSOON SURGE</span>
                </div>
                <div className={s.opModeStatus}>
                  HIGHWAY PASSABILITY: {isHighwayBlocked ? 'CRITICAL SEVERANCE' : 'CONTROLLED OPEN'}
                </div>
                <div className={s.metaRow}>
                  <span>Current Basin:</span>
                  <span className={s.textWhite}>{activeCorridorData.district}</span>
                </div>
              </div>

              {/* NER Corridor Selector */}
              <div className={s.card}>
                <div className={s.cardHeader}>
                  <span className={s.cardTitle}>NER Corridor Selection</span>
                  <span className={s.badgeCyan}>8 CORRIDORS</span>
                </div>
                <div className={s.corridorGrid}>
                  {Object.keys(CORRIDORS_DATA).map((cid) => {
                    const isSel = selectedCorridor === cid;
                    const item = CORRIDORS_DATA[cid];
                    return (
                      <button
                        key={cid}
                        onClick={() => setSelectedCorridor(cid)}
                        className={isSel ? s.corridorBtnActive : s.corridorBtn}
                      >
                        <div className={s.corridorBtnLabel}>{cid}</div>
                        <div className={s.corridorBtnSub}>{item.district}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Weather / Precipitation Feed */}
              <div className={s.card}>
                <div className={s.cardHeader}>
                  <span className={s.cardTitle}>Precipitation &amp; GPM Feed</span>
                  <span className={s.textEmerald} style={{ fontSize: '9px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className={`${s.dotSm} ${s.dotGreen}`} />
                    IMD / NASA GPM
                  </span>
                </div>
                <div className={s.weatherGrid}>
                  <div className={s.weatherCell}>
                    <div className={s.weatherCellHead}>
                      <CloudRain className="w-3.5 h-3.5" style={{ color: 'var(--cyan-400)' }} />
                      <span>Dima Hasao</span>
                    </div>
                    <div className={s.weatherVal}>48.5 mm/h</div>
                    <div className={`${s.weatherSat} ${s.weatherSatDanger}`}>Saturation 91.2%</div>
                  </div>
                  <div className={s.weatherCell}>
                    <div className={s.weatherCellHead}>
                      <CloudLightning className="w-3.5 h-3.5" style={{ color: 'var(--amber-400)' }} />
                      <span>East Khasi</span>
                    </div>
                    <div className={s.weatherVal}>62.0 mm/h</div>
                    <div className={`${s.weatherSat} ${s.weatherSatDanger}`}>Saturation 94.8%</div>
                  </div>
                  <div className={s.weatherCell}>
                    <div className={s.weatherCellHead}>
                      <Droplets className="w-3.5 h-3.5" style={{ color: 'var(--sky-400)' }} />
                      <span>N. Sikkim</span>
                    </div>
                    <div className={s.weatherVal}>38.0 mm/h</div>
                    <div className={`${s.weatherSat} ${s.weatherSatWarn}`}>Saturation 89.5%</div>
                  </div>
                  <div className={s.weatherCell}>
                    <div className={s.weatherCellHead}>
                      <Wind className="w-3.5 h-3.5" style={{ color: 'var(--emerald-400)' }} />
                      <span>Aizawl</span>
                    </div>
                    <div className={s.weatherVal}>32.5 mm/h</div>
                    <div className={`${s.weatherSat} ${s.weatherSatOk}`}>Saturation 86.4%</div>
                  </div>
                </div>
              </div>

              {/* Storm Simulation */}
              <button
                onClick={handleToggleStormSimulation}
                className={isSimulatingStorm ? s.simBtnActive : s.simBtnIdle}
              >
                {isSimulatingStorm ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>RESET MONSOON SIMULATION</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-3.5 h-3.5" style={{ color: 'var(--amber-400)' }} />
                    <span>SIMULATE STORM SURGE</span>
                  </>
                )}
              </button>

            </div>

            {/* ── COLUMN 2: PINN Charts & Bypass Routing ───────────────── */}
            <div className={s.column}>

              {/* Predictive PINN Chart */}
              <div className={s.card}>
                <div className={s.cardHeader}>
                  <span className={s.cardTitle}>Predictive PINN Geotech Chart</span>
                  <span className={s.badgeRed}>MDoNER 26001</span>
                </div>
                <PredictiveChart />
              </div>

              {/* Bypass Routing */}
              <div className={s.card}>
                <div className={s.cardHeader}>
                  <span className={s.cardTitle}>Tactical Convoy Bypass Routing</span>
                  <span className={s.badgeEmerald}>CLEAR ROUTE</span>
                </div>
                <div className={s.textXs}>
                  <span className={s.textMuted}>Active Corridor: </span>
                  <strong className={s.textWhite}>{activeCorridorData.name}</strong>
                </div>
                <div className={s.textCyan} style={{ fontSize: '10px', marginTop: '2px' }}>
                  Bypass: {activeCorridorData.bypass.name}
                </div>
                <div className={s.bypassRow}>
                  <span className={s.textMuted}>
                    Distance: <strong>{activeCorridorData.bypass.distanceKm} km</strong>
                  </span>
                  <button onClick={handleExportBypassGeoJSON} className={s.bypassExportBtn}>
                    <Download className="w-3 h-3" />
                    Export GeoJSON
                  </button>
                </div>
              </div>

            </div>

            {/* ── COLUMN 3: Alerts & Field Reports ─────────────────────── */}
            <div className={s.column}>

              {/* Emergency Alerts Log */}
              <div className={s.card} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className={`${s.cardHeader} ${s.sectionDivider}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={`${s.dot} ${s.dotRed}`} />
                    <span className={s.cardTitle}>Emergency Alerts Log Intimation</span>
                  </div>
                  <span className={s.badgeCyan}>SIP/SMS GATEWAY</span>
                </div>

                <div className={s.alertFeed}>
                  {alertsLog.map((alert) => {
                    const isCrit = alert.tier === 'CRITICAL';
                    return (
                      <div key={alert.id} className={isCrit ? s.alertItemCritical : s.alertItemHigh}>
                        <div className={s.alertMeta}>
                          <span style={{ color: isCrit ? 'var(--red-400)' : 'var(--amber-400)' }}>
                            [{alert.tier} | {alert.district} | {alert.timestamp}]
                          </span>
                          <span className={s.textTiny} style={{ color: 'var(--slate-400)' }}>
                            {alert.dialects.join('/')}
                          </span>
                        </div>
                        <div className={s.alertSummary}>{alert.summary}</div>
                        <div className={s.alertChannels}>
                          <span>Channels: <strong>{alert.channels.join(', ')}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Field Reports & Media */}
              <div className={s.card} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className={`${s.cardHeader} ${s.sectionDivider}`}>
                  <span className={s.cardTitle}>Field Reports &amp; Media</span>
                  <span className={s.textEmerald} style={{ fontSize: '9px' }}>
                    {fieldReports.length} REPORTS
                  </span>
                </div>

                {/* Action Bar */}
                <div style={{
                  background: 'var(--slate-950)',
                  border: '1px solid var(--slate-800)',
                  borderRadius: '3px',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                }}>
                  <span className={s.textCyan} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin className="w-3 h-3" />
                    + Geotagged Media
                  </span>
                  <span className={s.textTiny} style={{ color: 'var(--slate-500)' }}>EXIF Validated</span>
                </div>

                {/* Reports Feed */}
                <div className={s.reportsFeed}>
                  {fieldReports.map((rep) => (
                    <div key={rep.report_id} className={s.reportCard}>
                      <div className={s.reportHeader}>
                        <span className={s.reportName}>{rep.reporter_name}</span>
                        <span className={s.reportTime}>{rep.timestamp}</span>
                      </div>
                      <div className={s.reportLocation}>
                        <span>{rep.location_name}</span>
                        <span className={rep.severity === 'CRITICAL' ? s.severityCritical : s.severityHigh}>
                          {rep.severity}
                        </span>
                      </div>
                      <div className={s.reportNotes}>&ldquo;{rep.notes}&rdquo;</div>
                      <div className={s.reportThumb}>
                        <div className={s.reportThumbOverlay}>
                          <span className={s.reportCoords}>
                            {rep.latitude.toFixed(3)}°N, {rep.longitude.toFixed(3)}°E
                          </span>
                        </div>
                        {rep.media_type === 'video' ? (
                          <div className={s.mediaVideo}>
                            <Film className="w-3 h-3" />
                            <span>MP4 VIDEO</span>
                          </div>
                        ) : (
                          <div className={s.mediaImage}>
                            <Camera className="w-3 h-3" />
                            <span>EXIF STAMPED</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Upload CTA */}
                <button onClick={() => setIsSnapModalOpen(true)} className={s.uploadBtn}>
                  <Camera className="w-3.5 h-3.5" />
                  <span>+ UPLOAD GEOTAGGED REPORT</span>
                </button>
              </div>

            </div>

          </div>
        </main>
      )}

      {/* ================================================================= */}
      {/* FOOTER                                                             */}
      {/* ================================================================= */}
      <footer className={s.footer}>
        <div className={s.footerLeft}>
          <div className={s.footerIndicator}>
            <span className={`${s.dotSm} ${s.dotGreen}`} />
            <span>PINN SOLVER: <strong className={s.textWhite}>OPERATIONAL (38ms)</strong></span>
          </div>
          <span className={s.footerDivider}>|</span>
          <div className={s.footerIndicator}>
            <span className={`${s.dotSm} ${s.dotCyan}`} />
            <span>SAR COHERENCE: <strong className={s.textWhite}>98.2%</strong></span>
          </div>
          <span className={s.footerDivider}>|</span>
          <div className={s.footerIndicator}>
            <span className={`${s.dotSm} ${s.dotGreen}`} />
            <span>VOELLMY-SALM: <strong className={s.textWhite}>CALIBRATED</strong></span>
          </div>
        </div>
        <div className={s.footerRight}>
          <div className={s.footerIndicator} style={{ color: 'var(--emerald-400)', fontWeight: 600 }}>
            <span className={`${s.dotSm} ${s.dotGreen}`} />
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
