import { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config.js'; 

export default function MediaLibrary({ onAnalyze, onView }) {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  // Analyze Modal State
  const [activeModalFile, setActiveModalFile] = useState(null);
  const [selectedModules, setSelectedModules] = useState({ forestry: false, land: false, infrastructure: false });

  // Custom Delete Modal State
  const [deleteModalFile, setDeleteModalFile] = useState(null);

  const fetchMedia = async () => {
    try {
      const token = sessionStorage.getItem('sky_token');
      const response = await fetch(`${API_URL}media`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to load media.");
      const data = await response.json();
      setMediaFiles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMedia(); }, []);

  // --- ACTIONS ---

  const confirmDelete = async () => {
    if (!deleteModalFile) return;

    try {
      const token = sessionStorage.getItem('sky_token');
      await fetch(`${API_URL}media/${deleteModalFile.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      setMediaFiles(prev => prev.filter(f => f.id !== deleteModalFile.id));
    } catch (err) {
      console.error("Failed to delete", err);
    } finally {
      setDeleteModalFile(null);
    }
  };

  const handleQuickUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const token = sessionStorage.getItem('sky_token');

    const formData = new FormData();
    formData.append("file", file);
    formData.append("modules", JSON.stringify([]));

    try {
      const response = await fetch(`${API_URL}upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed. Check backend logs.");
      }

    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload media. Please try again.");
    } finally {
      setIsUploading(false);
      fetchMedia();
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 👉 FIXED: This now triggers the Dashboard's UploadZone modal 
  // instead of performing the analysis here.
  const handleStartAnalysis = () => {
    if (!activeModalFile) return;
    
    // Close this internal simple modal
    setActiveModalFile(null);

    // Pass the file to the parent (Dashboard)
    // This will open the UploadZone in "Analyze Existing Asset" mode
    onAnalyze(activeModalFile);
  };

  const getFileIcon = (filename) => {
    if (filename.endsWith('.mp4') || filename.endsWith('.mov')) {
      return <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
    }
    return <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-8 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Media Library</h1>
        </div>

        <input type="file" ref={fileInputRef} className="hidden" onChange={handleQuickUpload} />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-gray-900 dark:bg-cyan-600 hover:bg-gray-800 dark:hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-xl text-sm flex items-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          )}
          {isUploading ? 'Uploading...' : 'Upload Media'}
        </button>
      </div>

      {/* --- GRID --- */}
      {isLoading ? (
        <div className="flex justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mt-20"></div></div>
      ) : mediaFiles.length === 0 ? (
        <p className="text-center text-gray-500 mt-20">No media found. Upload something to get started!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {mediaFiles.map((file) => (
            <div key={file.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm group hover:border-cyan-300 dark:hover:border-cyan-800 transition-all">
              <div className="h-32 bg-gray-50 dark:bg-gray-900 flex items-center justify-center border-b border-gray-100 dark:border-gray-700 relative">
                {file.filename.endsWith('.mp4') || file.filename.endsWith('.mov') ? getFileIcon(file.filename) : (
                  <img src={`${API_URL}static/${file.filename}`} className="w-full h-full object-cover opacity-80" alt="thumb" />
                )}
                <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${file.status === 'Uploaded' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>{file.status}</span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate mb-1">{file.filename.split('_').pop()}</h3>
              </div>

              <div className="px-4 pb-4 flex gap-2">
                {file.status === 'Uploaded' ? (
                  <button
                    onClick={() => setActiveModalFile(file)}
                    className="flex-1 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 font-bold text-xs py-2 rounded-lg transition-colors"
                  >
                    Analyze
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      const token = sessionStorage.getItem('sky_token');
                      try {
                        const response = await fetch(`${API_URL}media/${file.id}/results`, {
                          headers: { "Authorization": `Bearer ${token}` }
                        });
                        const realResults = await response.json();

                        onView({
                          id: file.id,
                          filename: file.filename,
                          modules: Object.keys(realResults),
                          isCompleted: true,
                          aiResults: realResults
                        });
                      } catch (error) {
                        console.error("Failed to load results", error);
                      }
                    }}
                    className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 font-bold text-xs py-2 rounded-lg transition-colors"
                  >
                    View Report
                  </button>
                )}

                <button
                  onClick={() => setDeleteModalFile(file)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete File"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- ANALYZE POP-UP MODAL --- */}
      {activeModalFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-700 shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">{getFileIcon(activeModalFile.filename)}</div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white truncate w-48">{activeModalFile.filename.split('_').pop()}</h3>
                    <p className="text-xs text-gray-500">Ready for processing</p>
                  </div>
                </div>
                <button onClick={() => setActiveModalFile(null)} className="text-gray-400 hover:text-gray-600 transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>

              <div className="bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-100 dark:border-cyan-800 rounded-2xl p-4 mb-8">
                <p className="text-sm text-cyan-700 dark:text-cyan-300 leading-relaxed text-center font-medium">
                  Would you like to configure AI extraction for this asset?
                </p>
              </div>

              <button
                onClick={handleStartAnalysis}
                className="w-full bg-cyan-600 text-white font-bold py-3 rounded-xl transition-all hover:bg-cyan-700 hover:scale-[1.02] shadow-lg shadow-cyan-500/20"
              >
                Configure Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CUSTOM DELETE CONFIRMATION MODAL --- */}
      {deleteModalFile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-sm overflow-hidden border border-gray-100 dark:border-gray-700 shadow-2xl transform transition-all">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Media</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 px-2">
                Are you sure you want to permanently delete <span className="font-bold text-gray-700 dark:text-gray-300">"{deleteModalFile.filename.split('_').pop()}"</span>? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModalFile(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02]"
                >
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