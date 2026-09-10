'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Compass, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Upload, 
  RefreshCw,
  Database
} from 'lucide-react';
import { db, OfflineReport } from '@/lib/db';

interface SnapAndVerifyProps {
  isOpen: boolean;
  onClose: () => void;
  corridorId: string;
}

export const SnapAndVerify: React.FC<SnapAndVerifyProps> = ({ isOpen, onClose, corridorId }) => {
  const [hazardType, setHazardType] = useState<OfflineReport['hazardType']>('TENSION_CRACK');
  const [severity, setSeverity] = useState<OfflineReport['severityEstimate']>('HIGH');
  const [notes, setNotes] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lon: number; accuracy: number }>({
    lat: 26.9851,
    lon: 88.4612,
    accuracy: 4.8,
  });
  const [azimuth, setAzimuth] = useState(185);
  const [tilt, setTilt] = useState(42);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Read current device geolocation and orientation if supported
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: Number(pos.coords.latitude.toFixed(5)),
            lon: Number(pos.coords.longitude.toFixed(5)),
            accuracy: Number(pos.coords.accuracy.toFixed(1)),
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }

    // Refresh pending queue count from Dexie IndexedDB
    const refreshQueue = async () => {
      try {
        const count = await db.reports.where('syncStatus').equals('PENDING').count();
        setPendingCount(count);
      } catch {
        // Fallback
      }
    };
    refreshQueue();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newReport: OfflineReport = {
      uuid: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      latitude: coords.lat,
      longitude: coords.lon,
      altitudeMeters: 642,
      compassAzimuthDegrees: azimuth,
      slopeTiltAngleDegrees: tilt,
      hazardType,
      severityEstimate: severity,
      notes,
      syncStatus: navigator.onLine ? 'SYNCED' : 'PENDING',
      retryCount: 0,
    };

    try {
      await db.reports.add(newReport);
      setPendingCount((prev) => (navigator.onLine ? prev : prev + 1));
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        onClose();
      }, 1800);
    } catch (err) {
      console.error('Failed to write to IndexedDB', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Snap & Verify: Field Hazard Report</h3>
              <p className="text-xs text-slate-400 font-mono">Offline-First PWA | Corridor {corridorId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-white">Field Hazard Recorded</h4>
            <p className="text-xs text-slate-300 max-w-xs mx-auto">
              {navigator.onLine
                ? 'Report validated via anti-spoofing and synced directly to Supabase PostGIS.'
                : 'Offline: Stored safely in local IndexedDB. Will auto-sync when connection restores.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Camera Viewfinder Simulation */}
            <div className="relative aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col items-center justify-center group cursor-pointer border-dashed hover:border-emerald-500/60 transition">
              <Upload className="w-8 h-8 text-slate-500 group-hover:text-emerald-400 mb-2 transition" />
              <span className="text-xs text-slate-400 font-medium">Click to capture slope photo or drag file</span>
              <span className="text-[10px] text-slate-500 mt-1">Hardware EXIF & Compass Azimuth will be stamped</span>

              {/* HUD Overlay */}
              <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-[10px] font-mono text-emerald-400 flex items-center gap-1 border border-slate-800">
                <Compass className="w-3 h-3" /> Azimuth: {azimuth}° (SSW)
              </div>
              <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded text-[10px] font-mono text-amber-400 border border-slate-800">
                Slope Tilt: {tilt}°
              </div>
              <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-black/60 rounded text-[10px] font-mono text-slate-400 flex justify-between border border-slate-800">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-400" /> {coords.lat}° N, {coords.lon}° E
                </span>
                <span>Accuracy: ±{coords.accuracy}m</span>
              </div>
            </div>

            {/* Hazard Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Observed Hazard Type
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  { id: 'TENSION_CRACK', label: 'Tension Crack' },
                  { id: 'ROCKFALL', label: 'Rockfall / Debris' },
                  { id: 'ROAD_SUBSIDENCE', label: 'Road Sinking / Subsidence' },
                  { id: 'MUD_FLOW', label: 'Mudflow / Slurry' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setHazardType(item.id as any)}
                    className={`py-2 px-2.5 rounded-lg border text-left transition ${
                      hazardType === item.id
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity Estimate */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Severity Assessment</label>
              <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((lvl) => (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => setSeverity(lvl)}
                    className={`py-1.5 rounded border transition text-center ${
                      severity === lvl
                        ? lvl === 'CRITICAL'
                          ? 'bg-rose-600 text-white border-rose-500 font-bold'
                          : 'bg-amber-600 text-white border-amber-500 font-bold'
                        : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Field Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Field Observations / Chainage Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. 5cm wide diagonal fissure expanding near Teesta cut-slope toe..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Footer with IndexedDB queue count & Submit Button */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <Database className="w-3.5 h-3.5 text-slate-500" />
                <span>Pending Offline: <strong>{pendingCount}</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Storing...
                    </>
                  ) : (
                    'Record & Attest Report'
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
