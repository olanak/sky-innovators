import { useState, useRef } from 'react';
import { API_URL } from '../config.js';

// 👉 Added existingFile to the props
export default function UploadZone({ preselectedModule, onUploadSuccess, projectId, existingFile }) {
  const [isDragging, setIsDragging] = useState(false);
  // 👉 Initialize file state with existingFile if it exists
  const [file, setFile] = useState(existingFile || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); 
  const fileInputRef = useRef(null);

  const [selectedModules, setSelectedModules] = useState({
    forestry: false,
    land: false,
    infrastructure: false
  });

  const moduleNames = {
    forestry: "🌳 Forestry & Environment",
    land: "🌾 Land & Vegetation Health",
    infrastructure: "🛣️ Infrastructure & Hydrology"
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => { setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) setFile(e.dataTransfer.files[0]);
  };
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) setFile(e.target.files[0]);
  };

  const toggleModule = (key) => {
    setSelectedModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleUpload = async () => {
    // 👉 Check if we are analyzing an already uploaded file
    const isExisting = !!existingFile;
    if (!file && !isExisting) return;

    setIsUploading(true);
    setUploadStatus(null);

    const modulesToRun = preselectedModule 
      ? [preselectedModule] 
      : Object.keys(selectedModules).filter(k => selectedModules[k]);

    const token = localStorage.getItem('sky_token');
    
    // 👉 BRANCH LOGIC: Different endpoints and bodies based on file status
    let url = `${API_URL}upload`;
    let method = "POST";
    let body;
    let headers = { "Authorization": `Bearer ${token}` };

    if (isExisting) {
      // ANALYZE EXISTING: Use the dedicated analyze endpoint
      url = `${API_URL}media/${existingFile.id}/analyze`;
      method = "PUT";
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      body = new URLSearchParams();
      body.append("modules", JSON.stringify(modulesToRun));
    } else {
      // UPLOAD NEW: Use traditional FormData
      body = new FormData();
      body.append("file", file);
      body.append("modules", JSON.stringify(modulesToRun));
      if (projectId) body.append("project_id", projectId);
    }

    try {
      const response = await fetch(url, {
        method: method,
        headers: headers,
        body: body,
      });

      if (response.ok) {
        const result = await response.json();
        
        onUploadSuccess({
          id: isExisting ? existingFile.id : result.file.id,
          filename: isExisting ? existingFile.filename : result.file.filename,
          modules: modulesToRun,
          isCompleted: true,
          // Handle slight naming difference in backend response for existing vs new
          aiResults: isExisting ? result.results : result.aiResults 
        });
      } else {
        setUploadStatus('error');
      }
    } catch (error) {
      console.error("Analysis failed", error);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  // 👉 Updated canUpload check
  const canUpload = (file || existingFile) && (preselectedModule || Object.values(selectedModules).some(v => v));

  return (
    <div className="w-full flex flex-col items-center">
      {/* --- DYNAMIC MODULE SELECTION UI --- */}
      <div className="w-full max-w-xl mb-6">
        {preselectedModule ? (
          <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl p-3 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-cyan-100 dark:bg-cyan-800 rounded-full flex items-center justify-center text-cyan-600 dark:text-cyan-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
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
              <div 
                key={key} 
                onClick={() => toggleModule(key)}
                className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                  selectedModules[key] 
                    ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-500 dark:border-cyan-500' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-cyan-300'
                }`}
              >
                <span className={`text-sm font-medium select-none ${selectedModules[key] ? 'text-cyan-900 dark:text-cyan-100' : 'text-gray-700 dark:text-gray-300'}`}>
                  {name}
                </span>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${selectedModules[key] ? 'bg-cyan-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${selectedModules[key] ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- DRAG AND DROP ZONE / EXISTING FILE INFO --- */}
      {existingFile ? (
        // 👉 NEW UI: Show this when an existing file is being analyzed
        <div className="w-full max-w-xl p-6 bg-cyan-50 dark:bg-cyan-900/10 border-2 border-cyan-500 rounded-2xl flex items-center gap-4 animate-fade-in">
          <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-cyan-100 dark:border-cyan-800">
            {existingFile.filename.endsWith('.mp4') ? '📽️' : '🖼️'}
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest mb-1">Asset Ready</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {existingFile.filename.split('_').pop()}
            </p>
          </div>
        </div>
      ) : (
        // TRADITIONAL UPLOAD ZONE
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full max-w-xl border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
            isDragging 
              ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/10 scale-[1.02]' 
              : file 
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10'
                : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
          {file ? (
            <div className="text-center animate-fade-in">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{file.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-12 h-12 bg-white dark:bg-gray-700 shadow-sm rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-100 dark:border-gray-600">
                <svg className="w-6 h-6 text-gray-400 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Click to upload or drag and drop</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">.mp4, .mov, .tif, .geojson (Max 5GB)</p>
            </div>
          )}
        </div>
      )}

      {uploadStatus === 'error' && (
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
        }`}
      >
        {isUploading ? (
          <>
            <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
            Running Analysis...
          </>
        ) : 'Begin AI Extraction'}
      </button>
    </div>
  );
}