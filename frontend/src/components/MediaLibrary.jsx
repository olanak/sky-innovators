import { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config.js';

// ── Progress steps (same as UploadZone) ──────────────────────────
const STEPS = [
  { key: 'uploading',    label: 'Saving file',        icon: '📁' },
  { key: 'metrics',      label: 'AI analysis',         icon: '🧠' },
  { key: 'segmentation', label: 'Generating overlays', icon: '🗺️'  },
  { key: 'saving',       label: 'Saving to database',  icon: '💾' },
  { key: 'done',         label: 'Complete',            icon: '✅' },
];

const MODULE_NAMES = {
  forestry:       '🌳 Forestry & Environment',
  land:           '🌾 Land & Vegetation Health',
  infrastructure: '🛣️ Infrastructure & Hydrology',
};

export default function MediaLibrary({ onAnalyze, onView }) {
  const [mediaFiles, setMediaFiles]   = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Analyze modal state
  const [activeModalFile, setActiveModalFile]   = useState(null);
  const [selectedModules, setSelectedModules]   = useState({
    forestry: false, land: false, infrastructure: false,
  });

  // SSE progress state (inside modal)
  const [progress, setProgress]     = useState(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analyseError, setAnalyseError] = useState('');
  const eventSourceRef              = useRef(null);

  // Delete modal state
  const [deleteModalFile, setDeleteModalFile] = useState(null);

  const fileInputRef = useRef(null);

  // ── Fetch media list ────────────────────────────────────────────
  const fetchMedia = async () => {
    try {
      const token = sessionStorage.getItem('sky_token');
      const res   = await fetch(`${API_URL}media`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load media.');
      setMediaFiles(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
    return () => eventSourceRef.current?.close();
  }, []);

  // ── Quick upload — saves file only, NO analysis ─────────────────
  const handleQuickUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const token = sessionStorage.getItem('sky_token');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('modules', JSON.stringify([])); // empty = no AI, just store

    try {
      const res = await fetch(`${API_URL}upload`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });
      if (!res.ok) throw new Error('Upload failed.');
    } catch (err) {
      console.error(err);
      alert('Failed to upload media. Please try again.');
    } finally {
      setIsUploading(false);
      fetchMedia();
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Open analyze modal ──────────────────────────────────────────
  const openAnalyzeModal = (file) => {
    setActiveModalFile(file);
    setSelectedModules({ forestry: false, land: false, infrastructure: false });
    setProgress(null);
    setIsAnalysing(false);
    setAnalyseError('');
  };

  const closeAnalyzeModal = () => {
    eventSourceRef.current?.close();
    setActiveModalFile(null);
    setProgress(null);
    setIsAnalysing(false);
    setAnalyseError('');
  };

  const toggleModule = (key) =>
    setSelectedModules(prev => ({ ...prev, [key]: !prev[key] }));

  const canAnalyse = Object.values(selectedModules).some(Boolean);

  // ── Run analysis with SSE progress ─────────────────────────────
  const handleRunAnalysis = async () => {
    if (!activeModalFile || !canAnalyse) return;

    const modulesToRun = Object.keys(selectedModules).filter(k => selectedModules[k]);
    const token        = sessionStorage.getItem('sky_token');

    setIsAnalysing(true);
    setAnalyseError('');
    setProgress({ pct: 5, step: 'uploading', message: 'Starting analysis…' });

    try {
      // Open SSE stream directly — file is already saved
      const modulesParam = encodeURIComponent(JSON.stringify(modulesToRun));
      const sseUrl = `${API_URL}upload/${activeModalFile.id}/analyze-stream?modules=${modulesParam}&token=${token}`;

      eventSourceRef.current?.close();
      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setProgress({ pct: data.pct, step: data.step, message: data.message });

        if (data.step === 'done') {
          es.close();
          setIsAnalysing(false);
          // Refresh list so status badge updates to "Processed"
          fetchMedia();
          // Brief delay so user sees 100% before modal closes
          setTimeout(() => {
            closeAnalyzeModal();
            onView({
              id:          activeModalFile.id,
              filename:    activeModalFile.filename,
              modules:     modulesToRun,
              isCompleted: true,
              aiResults:   data.aiResults,
            });
          }, 1200);
        }

        if (data.step === 'error') {
          es.close();
          setIsAnalysing(false);
          setAnalyseError(data.message || 'Analysis failed.');
          setProgress(null);
        }
      };

      es.onerror = () => {
        es.close();
        setIsAnalysing(false);
        setAnalyseError('Connection to analysis server lost.');
        setProgress(null);
      };

    } catch (err) {
      console.error(err);
      setIsAnalysing(false);
      setAnalyseError('Failed to start analysis.');
      setProgress(null);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteModalFile) return;
    try {
      const token = sessionStorage.getItem('sky_token');
      await fetch(`${API_URL}media/${deleteModalFile.id}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setMediaFiles(prev => prev.filter(f => f.id !== deleteModalFile.id));
    } catch (err) {
      console.error('Failed to delete', err);
    } finally {
      setDeleteModalFile(null);
    }
  };

  // ── View report ─────────────────────────────────────────────────
  const handleViewReport = async (file) => {
    const token = sessionStorage.getItem('sky_token');
    try {
      const res     = await fetch(`${API_URL}media/${file.id}/results`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const results = await res.json();
      onView({
        id:          file.id,
        filename:    file.filename,
        modules:     Object.keys(results),
        isCompleted: true,
        aiResults:   results,
      });
    } catch (err) {
      console.error('Failed to load results', err);
    }
  };

  const getFileIcon = (filename) => {
    if (/\.(mp4|mov)$/i.test(filename)) {
      return (
        <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
    );
  };

  // Progress step index
  const currentStepIdx = progress
    ? STEPS.findIndex(s => s.key === progress?.step)
    : -1;

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-8 animate-fade-in">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Media Library</h1>
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleQuickUpload}/>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-gray-900 dark:bg-cyan-600 hover:bg-gray-800 dark:hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-xl text-sm flex items-center gap-2 transition-colors disabled:opacity-70"
        >
          {isUploading
            ? <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"/>
            : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
          }
          {isUploading ? 'Uploading…' : 'Upload Media'}
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mt-20"/>
        </div>
      ) : mediaFiles.length === 0 ? (
        <p className="text-center text-gray-500 mt-20">No media found. Upload something to get started!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {mediaFiles.map((file) => (
            <div key={file.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm hover:border-cyan-300 dark:hover:border-cyan-800 transition-all">

              {/* Thumbnail */}
              <div className="h-32 bg-gray-50 dark:bg-gray-900 flex items-center justify-center border-b border-gray-100 dark:border-gray-700 relative">
                {/\.(mp4|mov)$/i.test(file.filename)
                  ? getFileIcon(file.filename)
                  : <img src={`${API_URL}static/${file.filename}`} className="w-full h-full object-cover opacity-80" alt="thumb"/>
                }
                <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                  file.status === 'Uploaded' || file.status === 'Processing'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {file.status}
                </span>
              </div>

              {/* Name */}
              <div className="p-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {file.filename.split('_').pop()}
                </h3>
              </div>

              {/* Actions */}
              <div className="px-4 pb-4 flex gap-2">
                {file.status === 'Uploaded' || file.status === 'Processing' ? (
                  <button
                    onClick={() => openAnalyzeModal(file)}
                    className="flex-1 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 font-bold text-xs py-2 rounded-lg transition-colors"
                  >
                    Analyze
                  </button>
                ) : (
                  <button
                    onClick={() => handleViewReport(file)}
                    className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 font-bold text-xs py-2 rounded-lg transition-colors"
                  >
                    View Report
                  </button>
                )}
                <button
                  onClick={() => setDeleteModalFile(file)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ANALYZE MODAL ──────────────────────────────────────────── */}
      {activeModalFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md border border-gray-100 dark:border-gray-700 shadow-2xl overflow-hidden">
            <div className="p-6">

              {/* Modal header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {getFileIcon(activeModalFile.filename)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white truncate w-52">
                      {activeModalFile.filename.split('_').pop()}
                    </h3>
                    <p className="text-xs text-gray-500">Select modules to analyse</p>
                  </div>
                </div>
                {!isAnalysing && (
                  <button onClick={closeAnalyzeModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* Module toggles — hidden while analysing */}
              {!isAnalysing && !progress && (
                <div className="space-y-2 mb-6">
                  {Object.entries(MODULE_NAMES).map(([key, name]) => (
                    <div key={key} onClick={() => toggleModule(key)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedModules[key]
                          ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-500'
                          : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-cyan-300'
                      }`}>
                      <span className={`text-sm font-medium select-none ${
                        selectedModules[key] ? 'text-cyan-900 dark:text-cyan-100' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {name}
                      </span>
                      <div className={`w-10 h-6 rounded-full p-1 transition-colors ${
                        selectedModules[key] ? 'bg-cyan-500' : 'bg-gray-200 dark:bg-gray-600'
                      }`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          selectedModules[key] ? 'translate-x-4' : 'translate-x-0'
                        }`}/>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Progress bar — shown while analysing */}
              {progress && (
                <div className="mb-6 animate-fade-in">

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate pr-4">
                      {progress.message}
                    </span>
                    <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex-shrink-0">
                      {progress.pct}%
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden mb-4">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${progress.pct}%`,
                        background: progress.step === 'done'
                          ? 'linear-gradient(90deg,#10b981,#059669)'
                          : progress.step === 'error'
                            ? '#ef4444'
                            : 'linear-gradient(90deg,#06b6d4,#0891b2)',
                      }}
                    />
                  </div>

                  {/* Step indicators */}
                  <div className="flex items-end justify-between">
                    {STEPS.map((step, idx) => {
                      const isDone   = idx < currentStepIdx || progress.step === 'done';
                      const isActive = step.key === progress.step && progress.step !== 'done';
                      return (
                        <div key={step.key} className="flex flex-col items-center gap-1 flex-1">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${
                            isDone   ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                            : isActive ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30 animate-pulse'
                            :            'bg-gray-200 dark:bg-gray-700 text-gray-400'
                          }`}>
                            {isDone ? '✓' : step.icon}
                          </div>
                          <span className={`text-[8px] font-semibold text-center leading-tight ${
                            isDone   ? 'text-emerald-600 dark:text-emerald-400'
                            : isActive ? 'text-cyan-600 dark:text-cyan-400'
                            :            'text-gray-400'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Connector lines */}
                  <div className="flex items-center mt-[-24px] mb-3 px-3.5">
                    {STEPS.slice(0, -1).map((_, idx) => (
                      <div key={idx} className="flex-1 flex items-center">
                        <div className="w-full h-[2px] mx-1 rounded-full transition-all duration-500"
                          style={{
                            background: idx < currentStepIdx || progress.step === 'done'
                              ? '#10b981' : '#e5e7eb',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error message */}
              {analyseError && (
                <p className="text-red-500 text-xs font-medium mb-4 text-center">{analyseError}</p>
              )}

              {/* Action button */}
              {!isAnalysing && !progress && (
                <button
                  onClick={handleRunAnalysis}
                  disabled={!canAnalyse}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                    canAnalyse
                      ? 'bg-cyan-600 text-white hover:bg-cyan-700 hover:scale-[1.02] shadow-lg shadow-cyan-500/20'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Begin AI Extraction
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE MODAL ───────────────────────────────────────────── */}
      {deleteModalFile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm border border-gray-100 dark:border-gray-700 shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Media</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 px-4">
                Are you sure you want to permanently delete{' '}
                <span className="font-bold text-gray-700 dark:text-gray-300">
                  "{deleteModalFile.filename.split('_').pop()}"
                </span>?
                This action cannot be undone.
              </p>
              <div className="flex gap-3 px-2">
                <button onClick={() => setDeleteModalFile(null)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button onClick={confirmDelete}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02]">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
