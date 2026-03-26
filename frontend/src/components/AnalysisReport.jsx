import { useState, useEffect } from 'react';
import { API_URL } from '../config.js';

// 👉 Added onBack prop to handle returning to the previous view
export default function AnalysisReport({ analysisData, onBack }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [isExporting, setIsExporting] = useState(false);

  // 1. Helper to clean up filenames for display
  const displayFilename = analysisData?.filename?.split('_').pop() || "Untitled Asset";

  // 2. CSV Export Logic (Professional Blob Method)
  const handleExportCSV = async () => {
    const mediaId = analysisData?.id; 
    if (!mediaId) {
      alert("Error: Analysis ID missing. Try refreshing your library.");
      return;
    }

    setIsExporting(true);
    const token = localStorage.getItem('sky_token');
    
    try {
      const response = await fetch(`${API_URL}media/${mediaId}/export/csv`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Filename formatting: SkyInnovators_Metrics_ImageName.csv
      const cleanName = displayFilename.split('.')[0];
      a.download = `SkyInnovators_Metrics_${cleanName}.csv`;
      
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error("Export Error:", error);
      alert("Failed to generate CSV file.");
    } finally {
      setIsExporting(false);
    }
  };

  if (!analysisData) return <div className="p-20 text-center text-gray-500">No analysis selected.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-8 animate-fade-in">
      
      {/* 👉 NEW: BACK BUTTON (Similar to Projects) */}
      <div className="mb-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-cyan-600 dark:text-gray-400 dark:hover:text-cyan-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </div>

      {/* --- REPORT HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-100 dark:border-gray-800 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">
              AI Insight Report
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analysis Results</h1>
          <p className="text-sm text-gray-500 font-medium">Source: {displayFilename}</p>
        </div>

        {/* 📊 EXPORT ACTION */}
        <button 
          onClick={handleExportCSV}
          disabled={isExporting}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/10 active:scale-95 disabled:opacity-50"
        >
          {isExporting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )}
          Export Metrics (.csv)
        </button>
      </div>

      {/* --- QUICK STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {Object.entries(analysisData.aiResults || {}).map(([module, data]) => (
          <div key={module} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-5 rounded-2xl shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider">{module}</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {Object.values(data)[0]} 
              </span>
              <span className="text-xs text-gray-500 mb-1">Detected</span>
            </div>
          </div>
        ))}
      </div>

      {/* --- DETAILED METRICS VIEW --- */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 dark:text-white mb-6">Detailed Metric Extraction</h3>
        
        <div className="space-y-8">
          {Object.entries(analysisData.aiResults || {}).map(([module, data]) => (
            <div key={module} className="animate-slide-up">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 capitalize">{module} Analysis</span>
                <span className="text-xs font-mono text-emerald-500">98.2% Confidence</span>
              </div>
              
              <div className="space-y-4">
                {Object.entries(data).map(([key, val]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-500 dark:text-gray-400 font-medium capitalize">{key.replace('_', ' ')}</span>
                      <span className="font-bold dark:text-white">{val}</span>
                    </div>
                    {/* Progress Bar UI */}
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan-500 rounded-full transition-all duration-1000" 
                        style={{ width: typeof val === 'number' ? `${val}%` : '75%' }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- FOOTER NOTE --- */}
      <div className="mt-8 text-center">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
          Securely generated by Sky Innovators AI Engine • 2026
        </p>
      </div>
    </div>
  );
}