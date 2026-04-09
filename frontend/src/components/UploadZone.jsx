import { useState, useRef, useEffect } from 'react';
import { API_URL } from '../config.js';

// ── Progress step definitions ─────────────────────────────────────
const STEPS = [
  { key: 'uploading',    label: 'Saving file',          icon: '📁' },
  { key: 'metrics',      label: 'AI analysis',           icon: '🧠' },
  { key: 'segmentation', label: 'Generating overlays',   icon: '🗺️'  },
  { key: 'saving',       label: 'Saving to database',    icon: '💾' },
  { key: 'done',         label: 'Complete',              icon: '✅' },
];

export default function UploadZone({ preselectedModule, onUploadSuccess, projectId, existingFile }) {
  const [isDragging, setIsDragging]       = useState(false);
  const [file, setFile]                   = useState(existingFile || null);
  const [isUploading, setIsUploading]     = useState(false);
  const [uploadStatus, setUploadStatus]   = useState(null);

  // Progress state
  const [progress, setProgress]           = useState(null);
  // { pct: 0-100, step: 'uploading'|'metrics'|..., message: '...' }

  const fileInputRef = useRef(null);
  const eventSourceRef = useRef(null);

  const [selectedModules, setSelectedModules] = useState({
    forestry: false,
    land: false,
    infrastructure: false
  });

  const moduleNames = {
    forestry:       '🌳 Forestry & Environment',
    land:           '🌾 Land & Vegetation Health',
    infrastructure: '🛣️ Infrastructure & Hydrology',
  };

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => eventSourceRef.current?.close();
  }, []);

  const handleDragOver  = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files?.length) setFile(e.dataTransfer.files[0]);
  };
  const handleFileSelect = (e) => {
    if (e.target.files?.length) setFile(e.target.files[0]);
  };
  const toggleModule = (key) =>
    setSelectedModules(prev => ({ ...prev, [key]: !prev[key] }));

  const handleUpload = async () => {
    const isExisting = !!existingFile;
    if (!file && !isExisting) return;

    setIsUploading(true);
    setUploadStatus(null);
    setProgress({ pct: 5, step: 'uploading', message: 'Uploading file…' });

    const modulesToRun = preselectedModule
      ? [preselectedModule]
      : Object.keys(selectedModules).filter(k => selectedModules[k]);

    const token = sessionStorage.getItem('sky_token');

    try {
      // ── Phase 1: upload file / trigger analyze ─────────────────
      let mediaId, filename;

      if (isExisting) {
        // Existing file — use the old analyze endpoint which we keep unchanged
        const body = new FormData();
        body.append('modules', JSON.stringify(modulesToRun));

        const res = await fetch(`${API_URL}media/${existingFile.id}/analyze`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body,
        });

        if (!res.ok) { setUploadStatus('error'); setIsUploading(false); return; }
        const result = await res.json();

        // Existing file analyze endpoint returns results synchronously
        // (no SSE needed — it's re-analyzing something already stored)
        setProgress({ pct: 100, step: 'done', message: 'Analysis complete' });
        setIsUploading(false);
        onUploadSuccess({
          id:         existingFile.id,
          filename:   existingFile.filename,
          modules:    modulesToRun,
          isCompleted: true,
          aiResults:  result.results,
        });
        return;
      }

      // New file upload — Phase 1: save file, get media_id back instantly
      const body = new FormData();
      body.append('file', file);
      body.append('modules', JSON.stringify(modulesToRun));
      if (projectId) body.append('project_id', projectId);

      setProgress({ pct: 8, step: 'uploading', message: 'Uploading file to server…' });

      const uploadRes = await fetch(`${API_URL}upload`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });

      if (!uploadRes.ok) { setUploadStatus('error'); setIsUploading(false); return; }
      const uploadData = await uploadRes.json();
      mediaId  = uploadData.file.id;
      filename = uploadData.file.filename;

      setProgress({ pct: 12, step: 'uploading', message: 'File saved — starting AI analysis…' });

      // ── Phase 2: open SSE stream for AI progress ───────────────
      const modulesParam = encodeURIComponent(JSON.stringify(modulesToRun));
      const sseUrl = `${API_URL}upload/${mediaId}/analyze-stream?modules=${modulesParam}&token=${token}`;

      // Close any existing connection
      eventSourceRef.current?.close();
      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        const data = JSON.parse(event.data);

        setProgress({ pct: data.pct, step: data.step, message: data.message });

        if (data.step === 'done') {
          es.close();
          setIsUploading(false);
          onUploadSuccess({
            id:          mediaId,
            filename:    filename,
            modules:     modulesToRun,
            isCompleted: true,
            aiResults:   data.aiResults,
          });
        }

        if (data.step === 'error') {
          es.close();
          setIsUploading(false);
          setUploadStatus('error');
          setProgress(null);
          console.error('Analysis error:', data.message);
        }
      };

      es.onerror = () => {
        es.close();
        setIsUploading(false);
        setUploadStatus('error');
        setProgress(null);
      };

    } catch (error) {
      console.error('Upload failed', error);
      setUploadStatus('error');
      setIsUploading(false);
      setProgress(null);
    }
  };

  const canUpload = (file || existingFile) &&
    (preselectedModule || Object.values(selectedModules).some(v => v));

  // Which step index are we on?
  const currentStepIdx = progress
    ? STEPS.findIndex(s => s.key === progress.step)
    : -1;

  return (
    <div className="w-full flex flex-col items-center">

      {/* Module selection */}
      <div className="w-full max-w-xl mb-6">
        {preselectedModule ? (
          <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl p-3 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-cyan-100 dark:bg-cyan-800 rounded-full flex items-center justify-center text-cyan-600 dark:text-cyan-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Target Analysis</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{moduleNames[preselectedModule]}</p>
              </div>
            </div>
            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/40 px-2 py-1 rounded-md font-semibold">Locked</span>
          </div>
        ) : (
          <div className="space-y-2 animate-fade-in">
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Select Analysis Modules:</p>
            {Object.entries(moduleNames).map(([key, name]) => (
              <div key={key} onClick={() => toggleModule(key)}
                className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                  selectedModules[key]
                    ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-500'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-cyan-300'
                }`}>
                <span className={`text-sm font-medium select-none ${selectedModules[key] ? 'text-cyan-900 dark:text-cyan-100' : 'text-gray-700 dark:text-gray-300'}`}>
                  {name}
                </span>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${selectedModules[key] ? 'bg-cyan-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${selectedModules[key] ? 'translate-x-4' : 'translate-x-0'}`}/>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drop zone / existing file */}
      {existingFile ? (
        <div className="w-full max-w-xl p-6 bg-cyan-50 dark:bg-cyan-900/10 border-2 border-cyan-500 rounded-2xl flex items-center gap-4 animate-fade-in">
          <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-cyan-100 dark:border-cyan-800">
            {existingFile.filename.endsWith('.mp4') || existingFile.filename.endsWith('.mov') ? '📽️' : '🖼️'}
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest mb-1">Asset Ready</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {existingFile.filename.split('_').pop()}
            </p>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full max-w-xl border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
            isDragging
              ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/10 scale-[1.02]'
              : file
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10'
                : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect}/>
          {file ? (
            <div className="text-center animate-fade-in">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{file.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-12 h-12 bg-white dark:bg-gray-700 shadow-sm rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-100 dark:border-gray-600">
                <svg className="w-6 h-6 text-gray-400 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Click to upload or drag and drop</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">.mp4, .mov, .tif, .geojson (Max 5GB)</p>
            </div>
          )}
        </div>
      )}

      {/* ── REAL-TIME PROGRESS BAR ────────────────────────────────── */}
      {progress && (
        <div className="w-full max-w-xl mt-6 animate-fade-in">

          {/* Percentage bar */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate pr-4">
              {progress.message}
            </span>
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex-shrink-0">
              {progress.pct}%
            </span>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress.pct}%`,
                background: progress.step === 'done'
                  ? 'linear-gradient(90deg, #10b981, #059669)'
                  : progress.step === 'error'
                    ? '#ef4444'
                    : 'linear-gradient(90deg, #06b6d4, #0891b2)',
              }}
            />
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-between mt-4">
            {STEPS.map((step, idx) => {
              const isDone    = idx < currentStepIdx || progress.step === 'done';
              const isActive  = step.key === progress.step && progress.step !== 'done';
              const isPending = idx > currentStepIdx && progress.step !== 'done';
              return (
                <div key={step.key} className="flex flex-col items-center gap-1 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 ${
                    isDone
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                      : isActive
                        ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30 animate-pulse'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                  }`}>
                    {isDone ? '✓' : step.icon}
                  </div>
                  <span className={`text-[9px] font-semibold text-center leading-tight ${
                    isDone    ? 'text-emerald-600 dark:text-emerald-400' :
                    isActive  ? 'text-cyan-600 dark:text-cyan-400' :
                                'text-gray-400 dark:text-gray-600'
                  }`}>
                    {step.label}
                  </span>
                  {/* Connector line between steps */}
                  {idx < STEPS.length - 1 && (
                    <div className={`absolute hidden`}/>
                  )}
                </div>
              );
            })}
          </div>

          {/* Connector lines between step circles */}
          <div className="flex items-center mt-[-28px] mb-4 px-4">
            {STEPS.slice(0, -1).map((_, idx) => (
              <div key={idx} className="flex-1 flex items-center">
                <div className="w-full h-[2px] mx-1 rounded-full transition-all duration-500"
                  style={{
                    background: idx < currentStepIdx || progress.step === 'done'
                      ? '#10b981'
                      : '#e5e7eb',
                  }}
                />
              </div>
            ))}
          </div>

        </div>
      )}

      {uploadStatus === 'error' && !progress && (
        <p className="text-red-500 text-xs font-medium mt-3 animate-pulse">
          Analysis failed. Please check your backend connection.
        </p>
      )}

      <button
        onClick={handleUpload}
        disabled={!canUpload || isUploading}
        className={`mt-6 w-full max-w-sm py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
          canUpload && !isUploading
            ? 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-lg shadow-cyan-500/20 hover:scale-[1.02]'
            : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
        }`}>
        {isUploading ? (
          <>
            <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"/>
            Analysing…
          </>
        ) : 'Begin AI Extraction'}
      </button>
    </div>
  );
}
