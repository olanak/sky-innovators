import { useState, useEffect, useRef } from 'react';

export default function AnalysisReport({ analysisData }) {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [mediaUrl, setMediaUrl] = useState(null);
  
  // Zoom and Pan State for Images
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Setup the media and determine if we skip the loading screen
  useEffect(() => {
    // 1. If it's a file from the user's hard drive (just uploaded)
    if (analysisData?.file instanceof File) {
      setMediaUrl(URL.createObjectURL(analysisData.file));
    } 
    // 2. If it's a file from the Media Library Database
    else if (analysisData?.filename) {
      setMediaUrl(`http://127.0.0.1:8000/static/${analysisData.filename}`);
    }

    // 3. If it's already processed, skip the loading animation!
    if (analysisData?.isCompleted) {
      setIsComplete(true);
      setProgress(100);
      return;
    }

    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 100) {
          clearInterval(timer);
          setIsComplete(true);
          return 100;
        }
        return Math.min(oldProgress + (Math.floor(Math.random() * 15) + 5), 100);
      });
    }, 400);

    return () => clearInterval(timer);
  }, [analysisData]);

  // --- DYNAMIC REPORT GENERATOR ---
  const generateReport = () => {
    const modules = analysisData?.modules || ['forestry']; 
    
    let summaryText = "GeoNet 2.0 successfully processed the uploaded telemetry. ";
    let metrics = [];

    if (modules.includes('forestry')) {
      summaryText += "The scan identified healthy forest canopy and tracked specific deforestation zones. ";
      metrics.push({ id: 1, label: "Forest Canopy Cover", value: "68%", barValue: 68, color: "emerald" });
      metrics.push({ id: 2, label: "Recent Deforestation", value: "12 Hectares", color: "red" });
    }
    if (modules.includes('land')) {
      summaryText += "Vegetation density was calculated alongside exposed bare soil mapping. ";
      metrics.push({ id: 3, label: "Vegetation Density Score", value: "78/100", barValue: 78, color: "amber" });
      metrics.push({ id: 4, label: "Exposed Bare Soil", value: "18% of map", color: "amber" });
    }
    if (modules.includes('infrastructure')) {
      summaryText += "Road networks and natural water bodies were successfully detected and mapped. ";
      metrics.push({ id: 5, label: "Water Bodies Detected", value: "2 Streams", color: "blue" });
      metrics.push({ id: 6, label: "Road Networks Mapped", value: "14.2 km", color: "gray" });
    }

    return { summary: summaryText, metrics };
  };

  // --- ZOOM & PAN CONTROLS ---
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) setPanOffset({ x: 0, y: 0 }); 
      return newZoom;
    });
  };
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleDragStart = (e) => {
    const isVid = analysisData?.file?.type?.startsWith('video/') || analysisData?.filename?.endsWith('.mp4');
    if (zoomLevel <= 1 || isVid) return;
    
    setIsDragging(true);
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX, y: clientY });
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    e.preventDefault(); 

    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

    const dx = clientX - dragStart.x;
    const dy = clientY - dragStart.y;
    
    setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setDragStart({ x: clientX, y: clientY }); 
  };

  const handleDragEnd = () => setIsDragging(false);

  // --- VIEW 1: THE SCANNING PROGRESS SCREEN ---
  if (!isComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] animate-fade-in">
        <div className="w-24 h-24 mb-8 relative">
          <div className="absolute inset-0 border-4 border-gray-100 dark:border-gray-800 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-cyan-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
        </div>
        
        {/* UPDATED: Fallback to database filename during scan */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Analyzing {analysisData?.file?.name || analysisData?.filename || "Media"}...
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm text-center text-sm">
          Our AI is currently extracting data for: <span className="font-bold text-cyan-600 dark:text-cyan-400">{analysisData?.modules?.join(', ')}</span>.
        </p>

        <div className="w-full max-w-md bg-gray-200 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2.5 rounded-full transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="mt-3 text-sm font-bold text-gray-900 dark:text-white">{progress}% Complete</p>
      </div>
    );
  }

  // --- VIEW 2: THE COMPLETED REPORT SCREEN ---
  
  // UPDATED: Check for video using either the raw File object OR the database string
  const isVideo = analysisData?.file?.type?.startsWith('video/') || analysisData?.filename?.endsWith('.mp4') || analysisData?.filename?.endsWith('.mov');
  
  const reportData = generateReport();

  return (
    <div className="max-w-7xl mx-auto p-6 animate-fade-in">
      
      {/* Success Notification Banner */}
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mb-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 dark:bg-emerald-800 rounded-full p-1">
            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          </div>
          <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
            Analysis complete! This report has been automatically saved to your <span className="font-bold">Exported Reports</span> tab.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Download PDF
        </button>
      </div>

      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Extraction Report</h1>
          {/* UPDATED: Fallback to database filename for the title */}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            File: {analysisData?.file?.name || analysisData?.filename} • Scanned {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* LEFT COLUMN: Interactive Media Viewer */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm flex flex-col">
          <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-3 flex justify-between items-center relative z-20">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">AI Overlay Viewer</span>
            
            {!isVideo && (
              <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 shadow-sm">
                <button onClick={handleZoomOut} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300 transition-colors" title="Zoom Out">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                </button>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                <button onClick={handleZoomIn} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300 transition-colors" title="Zoom In">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                </button>
                <button onClick={handleResetZoom} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300 ml-1 border-l border-gray-200 dark:border-gray-700 transition-colors" title="Reset Zoom">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
              </div>
            )}
          </div>
          
          <div 
            className="relative w-full bg-black flex-1 min-h-[400px] flex items-center justify-center overflow-hidden"
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd} 
            onTouchStart={handleDragStart} 
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            {isVideo ? (
              <video 
                src={mediaUrl} 
                controls 
                autoPlay 
                muted 
                className="w-full h-full object-contain" 
              />
            ) : (
              <img 
                src={mediaUrl} 
                alt="Analyzed Media" 
                draggable={false}
                className="w-full h-full object-contain transition-transform duration-100 ease-out origin-center select-none" 
                style={{ 
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                }}
              />
            )}
            
            <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] mix-blend-overlay"></div>
          </div>
        </div>

        {/* RIGHT COLUMN: Dynamic Text Report */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">Executive Summary</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {reportData.summary}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm flex-1">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">Detailed Metrics</h3>
            
            <ul className="space-y-5">
              {reportData.metrics.map((metric) => (
                <li key={metric.id}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">{metric.label}</span>
                    <span className={`font-bold text-${metric.color}-600 dark:text-${metric.color}-400`}>{metric.value}</span>
                  </div>
                  {metric.barValue && (
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                      <div className={`bg-${metric.color}-500 h-1.5 rounded-full`} style={{width: `${metric.barValue}%`}}></div>
                    </div>
                  )}
                </li>
              ))}
              
              {reportData.metrics.length === 0 && (
                <p className="text-sm text-gray-500 italic">No specific metric modules were selected for this scan.</p>
              )}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}