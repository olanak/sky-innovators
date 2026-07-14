import { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config.js';

// Media Library — grid of assets with quick upload, delete, and actions.
// "Analyze" hands the file to the New Analysis workspace via onAnalyze(file)
// (the Dashboard wires this to open NewAnalysis with the existing file).
// "View Report" loads results and opens AnalysisReport via onView(asset).
export default function MediaLibrary({ onAnalyze, onView }) {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [deleteModalFile, setDeleteModalFile] = useState(null);
  const fileInputRef = useRef(null);

  const fetchMedia = async () => {
    try {
      const token = sessionStorage.getItem('sky_token');
      const res = await fetch(`${API_URL}media`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to load media.');
      setMediaFiles(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMedia(); }, []);

  // Quick upload — saves file only, no analysis (empty modules)
  const handleQuickUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const token = sessionStorage.getItem('sky_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('modules', JSON.stringify([]));
    try {
      const res = await fetch(`${API_URL}upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
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

  const confirmDelete = async () => {
    if (!deleteModalFile) return;
    try {
      const token = sessionStorage.getItem('sky_token');
      await fetch(`${API_URL}media/${deleteModalFile.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setMediaFiles(prev => prev.filter(f => f.id !== deleteModalFile.id));
    } catch (err) {
      console.error('Failed to delete', err);
    } finally {
      setDeleteModalFile(null);
    }
  };

  const handleViewReport = async (file) => {
    const token = sessionStorage.getItem('sky_token');
    try {
      const res = await fetch(`${API_URL}media/${file.id}/results`, { headers: { Authorization: `Bearer ${token}` } });
      const results = await res.json();
      onView({ id: file.id, filename: file.filename, modules: Object.keys(results), isCompleted: true, aiResults: results });
    } catch (err) {
      console.error('Failed to load results', err);
    }
  };

  const isVid = (fn) => /\.(mp4|mov)$/i.test(fn);

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--sky-ink)' }}>Media Library</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--sky-ink-soft)' }}>Your uploaded drone images and videos.</p>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleQuickUpload} />
        <button onClick={() => fileInputRef.current?.click()} disabled={isUploading}
          className="text-white font-semibold py-2.5 px-5 rounded-full text-sm flex items-center gap-2 transition-all"
          style={{ background: 'linear-gradient(135deg, var(--sky-accent), var(--sky-accent-2))', opacity: isUploading ? 0.7 : 1 }}>
          {isUploading
            ? <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
            : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}
          {isUploading ? 'Uploading…' : 'Upload Media'}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 mt-20" style={{ borderColor: 'var(--sky-accent)' }} /></div>
      ) : mediaFiles.length === 0 ? (
        <div className="rounded-3xl p-16 text-center" style={{ background: 'var(--sky-card)', border: '1px solid var(--sky-line)' }}>
          <p style={{ color: 'var(--sky-ink-soft)' }}>No media found. Upload something to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {mediaFiles.map((file) => {
            const processed = file.status === 'Processed';
            return (
              <div key={file.id} className="rounded-2xl overflow-hidden transition-all"
                   style={{ background: 'var(--sky-card)', border: '1px solid var(--sky-line)' }}
                   onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--sky-accent)'}
                   onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--sky-line)'}>
                <div className="h-32 flex items-center justify-center relative" style={{ background: 'var(--sky-bg-soft)', borderBottom: '1px solid var(--sky-line)' }}>
                  {isVid(file.filename)
                    ? <svg className="w-8 h-8" style={{ color: 'var(--sky-accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    : <img src={`${API_URL}static/${file.filename}`} className="w-full h-full object-cover" alt="thumb" />}
                  <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider"
                        style={processed ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e' } : { background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                    {file.status}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--sky-ink)' }}>{file.filename.split('_').pop()}</h3>
                </div>
                <div className="px-4 pb-4 flex gap-2">
                  {processed ? (
                    <button onClick={() => handleViewReport(file)}
                      className="flex-1 font-bold text-xs py-2 rounded-lg transition-colors"
                      style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>View Report</button>
                  ) : (
                    <button onClick={() => onAnalyze(file)}
                      className="flex-1 font-bold text-xs py-2 rounded-lg transition-colors"
                      style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--sky-accent)' }}>Analyze</button>
                  )}
                  <button onClick={() => setDeleteModalFile(file)}
                    className="p-2 rounded-lg transition-colors" style={{ color: '#f87171' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'} title="Delete">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteModalFile && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-3xl w-full max-w-sm overflow-hidden" style={{ background: 'var(--sky-card)', border: '1px solid var(--sky-line)' }}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full grid place-items-center mx-auto mb-4" style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171' }}>
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--sky-ink)' }}>Delete media?</h3>
              <p className="text-sm mb-6 px-2" style={{ color: 'var(--sky-ink-soft)' }}>This permanently removes <b style={{ color: 'var(--sky-ink)' }}>{deleteModalFile.filename.split('_').pop()}</b> and its analysis.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModalFile(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: 'var(--sky-pill)', color: 'var(--sky-ink)' }}>Cancel</button>
                <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#ef4444' }}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
