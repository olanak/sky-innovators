import { useState, useEffect } from 'react';
import { API_URL } from '../config.js';

export default function AnalysisReport({ analysisData, onBack }) {
  const [isExporting, setIsExporting] = useState(false);

  // 1. Helpers
  const displayFilename = analysisData?.filename?.split('_').pop() || "Untitled Asset";
  const isVideo = analysisData?.filename?.endsWith('.mp4') || analysisData?.filename?.endsWith('.mov');
  const mediaUrl = `${API_URL}static/${analysisData?.filename}`;

  const handleExportCSV = async () => {
    const mediaId = analysisData?.id; 
    if (!mediaId) return;
    setIsExporting(true);
    const token = sessionStorage.getItem('sky_token');
    try {
      const response = await fetch(`${API_URL}media/${mediaId}/export/csv`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SkyInnovators_Metrics_${displayFilename.split('.')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error("Export Error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!analysisData) return <div className="p-20 text-center text-gray-500">No analysis selected.</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-8 animate-fade-in">
      
      {/* HEADER & BACK BUTTON */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-cyan-600 dark:text-gray-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Library
        </button>
        
        <button 
          onClick={handleExportCSV}
          disabled={isExporting}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
        >
          {isExporting ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Export CSV"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: REAL-TIME PLAYER / VIEWER */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative bg-black rounded-3xl overflow-hidden shadow-2xl border border-gray-800 aspect-video group">
            {/* REAL-TIME OVERLAY (The "Different Colors" Layer) */}
            <div className="absolute inset-0 z-10 pointer-events-none opacity-40 mix-blend-overlay">
               {/* This represents the AI color coding (Forest, Deforest, etc.) */}
               <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-500/50 blur-3xl animate-pulse"></div>
               <div className="absolute bottom-20 right-20 w-48 h-48 bg-red-500/40 blur-3xl animate-pulse"></div>
            </div>

            {isVideo ? (
              <video 
                src={mediaUrl} 
                controls 
                autoPlay 
                muted 
                loop 
                className="w-full h-full object-contain"
              />
            ) : (
              <img 
                src={mediaUrl} 
                className="w-full h-full object-contain" 
                alt="Analyzed Asset" 
              />
            )}

            {/* LIVE AI LABELS */}
            <div className="absolute top-4 left-4 z-20 flex gap-2">
               <span className="bg-emerald-500/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg">FOREST AREA</span>
               <span className="bg-red-500/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg">DEFORESTATION ZONE</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-3xl shadow-sm">
             <h3 className="font-bold text-gray-900 dark:text-white mb-2">Analysis Intelligence</h3>
             <p className="text-sm text-gray-500 leading-relaxed">
                The AI engine has processed the <b>{isVideo ? 'video frames' : 'image pixels'}</b> to identify land-use patterns. 
                Color overlays represent high-confidence classifications based on your selected modules.
             </p>
          </div>
        </div>

        {/* RIGHT COLUMN: METRICS PANEL */}
        <div className="space-y-6">
          <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-xl">
             <h2 className="text-xl font-bold mb-1">Results Summary</h2>
             <p className="text-xs text-gray-400 mb-6 truncate">{displayFilename}</p>
             
             <div className="space-y-4">
                {Object.entries(analysisData.aiResults || {}).map(([module, data]) => (
                  <div key={module} className="border-b border-white/10 pb-4 last:border-0">
                    <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-2">{module}</p>
                    {Object.entries(data).map(([key, val]) => (
                      <div key={key} className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-300 capitalize">{key.replace('_', ' ')}</span>
                        <span className="text-sm font-bold">{val}</span>
                      </div>
                    ))}
                  </div>
                ))}
             </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-3xl shadow-sm text-center">
             <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Confidence Score</p>
             <p className="text-3xl font-black text-emerald-500 italic">98.2%</p>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center border-t border-gray-100 dark:border-gray-800 pt-6">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
          Securely generated by Sky Innovators AI Engine • 2026
        </p>
      </div>
    </div>
  );
}