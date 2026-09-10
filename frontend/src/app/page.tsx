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
  Download
} from 'lucide-react';
import { useHazardStore } from '@/stores/useHazardStore';
import { subscribeToHazardEvents } from '@/lib/supabase';
import { CORRIDORS_DATA } from '@/lib/corridors';
import { InteractiveMap } from '@/components/gis/InteractiveMap';
import { SnapAndVerify } from '@/components/field/SnapAndVerify';

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

  const [isOnline, setIsOnline] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'khasi' | 'mizo' | 'assamese' | 'bodo' | 'garo'>('en');
  const [isSimulatingStorm, setIsSimulatingStorm] = useState(false);
  const [isSnapModalOpen, setIsSnapModalOpen] = useState(false);
  const [factorOfSafety, setFactorOfSafety] = useState(1.35);
  const [porePressure, setPorePressure] = useState(14.2);
  const [recentAlert, setRecentAlert] = useState<string | null>(null);

  const activeCorridorData = CORRIDORS_DATA[selectedCorridor] || CORRIDORS_DATA['NH-10'];
  const isHighwayBlocked = isSimulatingStorm || blockedRoadSegments.includes(selectedCorridor);

  // Network online/offline monitor
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
        setRecentAlert(`CRITICAL: ${alert.location_name} (FS=${alert.factor_of_safety})`);
        updateCriticalCount((c) => c + 1);
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
      setPorePressure(48.2);
      setFactorOfSafety(0.88);
      addBlockedSegment(selectedCorridor);
      updateCriticalCount((c) => c + 1);
      setRecentAlert(`CRITICAL SEVERANCE: ${selectedCorridor} KM 29.4 (Teesta Gorge) severed by 5,200 m³ debris runout!`);
    } else {
      setIsSimulatingStorm(false);
      setPorePressure(14.2);
      setFactorOfSafety(1.35);
      setRecentAlert(null);
    }
  };

  // Export tactical convoy bypass coordinates as GeoJSON
  const handleExportBypassGeoJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify(activeCorridorData.bypass, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${selectedCorridor}_safe_convoy_bypass.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const regionalDict = {
    en: {
      title: 'TerraCast-NER Command Center',
      sub: 'All-Weather InSAR & Physics-Informed Landslide Early Warning System',
      status: 'Live Realtime Feed',
      criticalAlert: 'CRITICAL: Imminent Slope Shear Failure (FS < 1.0) | Highway Severance Active',
      normalStatus: 'Normal Corridor Clearance | Real-Time Pore Pressure Stable',
      fieldReport: 'Snap & Verify (Offline PWA)',
      simulateBtn: isSimulatingStorm ? 'Reset Simulation' : 'Simulate Monsoon Storm & KM 29.4 Cutoff',
    },
    khasi: {
      title: 'TerraCast-NER: Ka Ktem Pynpeit',
      sub: 'Ka lad ai jingmut mardor halor ka jingtwad khyndew',
      status: 'Jingtip beit beit',
      criticalAlert: 'JINGMAH KABA JUR: Ka jingtwad khyndew kala sdang (FS < 1.0) | Ka Surok kala sahkut',
      normalStatus: 'Ka surok kaba shngain | Ka jingshngain ka paka',
      fieldReport: 'Shon Dur & Pynshisha (Offline PWA)',
      simulateBtn: isSimulatingStorm ? 'Pynphai biang' : 'Pynshongdur ia ka jingtwa khyndew',
    },
    mizo: {
      title: 'TerraCast-NER: Control Center',
      sub: 'Leimin chhiatna laka invenna leh hriattirna hmanrua',
      status: 'A takin a in connect e',
      criticalAlert: 'HLUAWHNA LIAN: Leimin hlauhawm (FS < 1.0) | Kawng a ping mek',
      normalStatus: 'Kawng tluang takin a kal e | Hlauhawm a awm lo',
      fieldReport: 'Thlalak & Hriattirna (Offline PWA)',
      simulateBtn: isSimulatingStorm ? 'Siambha leh rawh' : 'Ruahpui vanga leimin chhinna',
    },
    assamese: {
      title: 'টেৰাকাস্ট-উত্তৰ-পূব নিয়ন্ত্ৰণ কেন্দ্ৰ',
      sub: 'ভূমিস্খলনৰ প্ৰাক-সতৰ্কতা আৰু সুৰক্ষিত যাত্ৰাপথ নিৰ্ণয় প্ৰণালী',
      status: 'প্ৰত্যক্ষ সম্প্ৰচাৰিত তথ্য',
      criticalAlert: 'জৰুৰী সতৰ্কতা: ২৯.৪ কি.মি.ত ভূমিস্খলন আৰু পথ অৱৰোধ',
      normalStatus: 'ঘাইপথ চলাচলৰ উপযোগী | বিপদৰ আশংকা নাই',
      fieldReport: 'চিত্ৰ সংগ্ৰহ আৰু প্ৰেৰণ (PWA)',
      simulateBtn: isSimulatingStorm ? 'পূৰ্বৰ অৱস্থালৈ নিয়ক' : 'বৰষুণ আৰু ভূমিস্খলন অনুকৰণ কৰক',
    },
    bodo: {
      title: 'TerraCast-NER Control Hub',
      sub: 'हा दैखांनायनि गिथावना जाथाय सिगां खौरां',
      status: 'थाब खौरां',
      criticalAlert: 'गोख्रों खौरां: लामा बन्द जाबाय (FS < 1.0)',
      normalStatus: 'लामा मोजां',
      fieldReport: 'PWA खौरां फोरमाय',
      simulateBtn: isSimulatingStorm ? 'गिबि महर' : 'दैखांनाय जाथाय',
    },
    garo: {
      title: 'TerraCast-NER Mikrakani',
      sub: 'A·a be·ani a·bachengengaha mikrakani',
      status: 'Re·baenggipa kobor',
      criticalAlert: 'KENBEGNIGIPA: Rama chipaha (FS < 1.0)',
      normalStatus: 'Rama nambea',
      fieldReport: 'A·dokko watbo PWA',
      simulateBtn: isSimulatingStorm ? 'Gitalatbo' : 'A·a be·ani dakmesokani',
    },
  };

  const t = regionalDict[selectedLanguage];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-600/30">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-lg text-white">TerraCast<span className="text-rose-500">-NER</span></span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">MDoNER 26001</span>
            </div>
            <p className="text-xs text-slate-400 font-medium">{t.sub}</p>
          </div>
        </div>

        {/* Center: Regional Dialect & Connectivity Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            {(['en', 'khasi', 'mizo', 'assamese', 'bodo', 'garo'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-2 py-1 rounded capitalize font-medium transition text-[11px] ${
                  selectedLanguage === lang 
                    ? 'bg-rose-600 text-white shadow-sm font-bold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/80">
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-semibold">{t.status}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300">Offline Caching</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Critical Alert Banner */}
      <div className={`border-b px-6 py-2.5 flex items-center justify-between transition-colors duration-500 ${
        isHighwayBlocked
          ? 'bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 border-rose-700/60'
          : 'bg-slate-900/80 border-slate-800'
      }`}>
        <div className="flex items-center gap-2.5 text-sm font-medium">
          {isHighwayBlocked ? (
            <>
              <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
              <span className="text-rose-200">{recentAlert || t.criticalAlert}</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300">{t.normalStatus}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className={`px-2 py-0.5 rounded border font-bold ${
            factorOfSafety <= 1.0 ? 'bg-rose-800/80 text-rose-200 border-rose-600/60 animate-pulse' : 'bg-slate-800 text-emerald-400 border-slate-700'
          }`}>
            FS: {factorOfSafety.toFixed(2)}
          </span>
          <span className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 text-amber-300">
            u_w: {porePressure.toFixed(1)} kPa
          </span>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4">
        {/* Left Column: Corridor Selector & Telemetry Cards */}
        <div className="space-y-4 flex flex-col">
          {/* Corridor Selection */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-sm">
            <h2 className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-rose-500" /> Target Highway Corridor
            </h2>
            <div className="space-y-2">
              {Object.values(CORRIDORS_DATA).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCorridor(c.id)}
                  className={`w-full text-left p-3 rounded-lg border transition flex items-center justify-between ${
                    selectedCorridor === c.id
                      ? 'bg-rose-600/10 border-rose-500/80 text-white shadow-sm'
                      : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm flex items-center gap-2">
                      <span>{c.id}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        {c.state}
                      </span>
                    </div>
                    <div className="text-xs opacity-75 mt-0.5">{c.name}</div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition ${selectedCorridor === c.id ? 'text-rose-400 translate-x-0.5' : 'text-slate-600'}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Scenario Trigger */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
            <h2 className="text-xs uppercase font-mono tracking-wider text-amber-400 mb-2 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-amber-500" /> Geotechnical Physics Simulator
            </h2>
            <p className="text-[11px] text-slate-400 mb-3">
              Couples 1D Green-Ampt infiltration and pore-water pressure mechanics to trigger Mohr-Coulomb failure.
            </p>
            <button
              onClick={handleToggleStormSimulation}
              className={`w-full py-2.5 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition shadow-md ${
                isSimulatingStorm
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/40'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
              }`}
            >
              {isSimulatingStorm ? <RotateCcw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{t.simulateBtn}</span>
            </button>
          </div>

          {/* Snap & Verify PWA Field Action Button */}
          <button
            onClick={() => setIsSnapModalOpen(true)}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition"
          >
            <Camera className="w-4 h-4" />
            <span>{t.fieldReport}</span>
          </button>
        </div>

        {/* Center: Interactive Geospatial Vector Map Area */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-xl relative overflow-hidden flex flex-col">
          {/* Map Header HUD */}
          <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
            <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs font-mono text-slate-300 pointer-events-auto shadow-md">
              <span className="text-slate-400">Corridor Focus:</span> <strong className="text-white">{selectedCorridor}</strong> | Total: {activeCorridorData.totalLengthKm} km
            </div>
            
            {/* Layer Controls */}
            <div className="bg-slate-900/90 backdrop-blur-md p-1.5 rounded-lg border border-slate-700/60 flex items-center gap-1 pointer-events-auto shadow-md">
              {(['cartoDem', 'insarVelocity', 'factorOfSafety', 'safeCorridor'] as const).map((layer) => (
                <button
                  key={layer}
                  onClick={() => toggleLayer(layer)}
                  className={`text-[11px] px-2 py-1 rounded font-mono transition ${
                    activeLayers[layer]
                      ? 'bg-slate-700 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {layer === 'cartoDem' && '3D Contour'}
                  {layer === 'insarVelocity' && 'SAR InSAR'}
                  {layer === 'factorOfSafety' && 'FS Heatmap'}
                  {layer === 'safeCorridor' && 'Safe Route'}
                </button>
              ))}
            </div>
          </div>

          {/* Core Interactive Map Canvas */}
          <div className="flex-1 w-full h-full min-h-[440px] relative">
            <InteractiveMap
              corridorId={selectedCorridor}
              activeLayers={activeLayers}
              isBlocked={isHighwayBlocked}
            />
          </div>

          {/* Bottom Timeline Playback Scrubber */}
          <div className="border-t border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 py-2.5 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Time State:</span>
              <span className="text-white font-semibold">
                {isSimulatingStorm ? 'T + 18m [Highway Cutoff Active]' : 'T - 0h [Continuous InSAR Monitoring]'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Rainfall: {isSimulatingStorm ? '48.5 mm/h' : '4.2 mm/h'}</span>
              <div className="w-32 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-700 ${isSimulatingStorm ? 'w-full bg-rose-500' : 'w-1/4 bg-emerald-500'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Safe Corridor Rerouting & Logistics */}
        <div className="space-y-4 flex flex-col">
          {/* Dynamic Convoy Reroute */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs uppercase font-mono tracking-wider text-emerald-400 flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5 text-emerald-500" /> Safe Bypass Corridor
              </h2>
              <button
                onClick={handleExportBypassGeoJSON}
                title="Export GeoJSON route for tactical GPS"
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 font-mono transition"
              >
                <Download className="w-3 h-3" /> GPX
              </button>
            </div>

            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-3 space-y-2">
              <div className="text-xs text-emerald-300 font-semibold">{activeCorridorData.bypass.name}</div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-1">
                <div>Distance: <strong className="text-white">{activeCorridorData.bypass.distanceKm} km</strong></div>
                <div>Est. Time: <strong className="text-white">{Math.floor(activeCorridorData.bypass.timeMinutes / 60)}h {activeCorridorData.bypass.timeMinutes % 60}m</strong></div>
              </div>
              <div className="text-[10px] text-emerald-400/90 pt-1 border-t border-emerald-500/20">
                Standard highway status: <span className={isHighwayBlocked ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                  {isHighwayBlocked ? 'BLOCKED by Debris Runout' : 'Passable'}
                </span>
              </div>
            </div>

            <div className="mt-3 space-y-1.5 text-xs text-slate-400 font-mono">
              {activeCorridorData.bypass.checkpoints.map((cp, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-800/60 last:border-0">
                  <span className="text-slate-300">{cp.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    cp.status === 'OPEN' ? 'text-emerald-400 bg-emerald-950/50' : 'text-amber-400 bg-amber-950/50'
                  }`}>
                    {cp.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Automated Outbound Dissemination */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex-1">
            <h2 className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <PhoneCall className="w-3.5 h-3.5 text-rose-400" /> Multi-Lingual Early Warning
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 rounded bg-slate-950/40 border border-slate-800">
                <span className="text-slate-300">Outbound IVRS Calls</span>
                <span className="font-mono font-bold text-white">{isSimulatingStorm ? '4,812' : '0 (Standby)'}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-950/40 border border-slate-800">
                <span className="text-slate-300">Geofenced Cell Broadcast</span>
                <span className="font-mono font-bold text-white">{isSimulatingStorm ? '18,940' : '0 (Standby)'}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-950/40 border border-slate-800">
                <span className="text-slate-300">Regional Audio Synthesis</span>
                <span className="font-mono text-rose-400">Khasi, Mizo, Asm, Bodo</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Snap & Verify Offline PWA Modal */}
      <SnapAndVerify
        isOpen={isSnapModalOpen}
        onClose={() => setIsSnapModalOpen(false)}
        corridorId={selectedCorridor}
      />
    </div>
  );
}
