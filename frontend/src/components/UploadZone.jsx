import { useState, useRef } from 'react';

export default function UploadZone() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setUploadComplete(false);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadComplete(false);
    }
  };

  const onButtonClick = () => {
    inputRef.current.click();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      if (data.status === "success") {
        setUploadComplete(true);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to connect to the server.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 mb-12 animate-fade-in transition-colors duration-300">
      <div className="flex justify-between items-center mb-4 transition-colors">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Secure Media Upload</h2>
        <span className="text-xs font-medium text-gray-400 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md uppercase tracking-wide transition-colors">Max Size: 5GB</span>
      </div>

      <div 
        className={`relative flex flex-col items-center justify-center w-full h-72 border-2 border-dashed rounded-3xl transition-all duration-300 ease-in-out ${
          dragActive 
            ? 'border-cyan-400 dark:border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 shadow-inner' 
            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-cyan-200 dark:hover:border-cyan-500 shadow-sm dark:shadow-black/20'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          ref={inputRef}
          type="file" 
          className="hidden" 
          onChange={handleChange} 
          accept="video/mp4, image/jpeg, image/png" 
        />
        
        <div className="flex flex-col items-center justify-center space-y-4 text-center pointer-events-none z-10 transition-colors">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-2 transition-colors ${dragActive ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-700 dark:text-gray-200 transition-colors">Drag and drop drone footage</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 transition-colors">Supports High-Res MP4, JPEG, and PNG</p>
          </div>
        </div>

        <button 
          onClick={onButtonClick}
          className="mt-6 px-6 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-cyan-300 dark:hover:border-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-full shadow-sm transition-all duration-200 z-20"
        >
          Browse Files
        </button>
        
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      </div>

      {selectedFile && (
        <div className="mt-6 p-5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl flex items-center justify-between shadow-lg shadow-gray-100/50 dark:shadow-black/50 animate-fade-in transition-colors">
          <div className="flex items-center space-x-4 overflow-hidden">
            <div className="p-3 bg-cyan-50 dark:bg-cyan-900/30 rounded-xl border border-cyan-100 dark:border-cyan-800/50 transition-colors">
              <svg className="w-6 h-6 text-cyan-500 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div className="truncate pr-4 transition-colors">
              <p className="text-sm font-bold text-gray-800 dark:text-white truncate transition-colors">{selectedFile.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                <span className={`text-xs font-medium ${uploadComplete ? 'text-blue-500 dark:text-blue-400' : 'text-green-500 dark:text-green-400'}`}>
                  {uploadComplete ? 'Queued for Analysis' : 'Ready for processing'}
                </span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleUpload}
            disabled={isUploading || uploadComplete}
            className={`flex-shrink-0 px-5 py-2.5 text-sm font-semibold rounded-xl shadow-md transition-all duration-200 flex items-center space-x-2 group ${
              uploadComplete 
                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 shadow-none cursor-default' 
                : isUploading
                  ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-wait'
                  : 'bg-gray-900 dark:bg-cyan-600 hover:bg-gray-800 dark:hover:bg-cyan-700 text-white'
            }`}
          >
            {isUploading ? (
              <span>Uploading...</span>
            ) : uploadComplete ? (
              <>
                <span>Success</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </>
            ) : (
              <>
                <span>Run AI Pipeline</span>
                <svg className="w-4 h-4 text-cyan-400 dark:text-cyan-200 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}