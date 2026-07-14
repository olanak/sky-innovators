import { useState, useEffect } from 'react';
import { API_URL } from '../config.js';

export default function Projects({ onAnalyze, onView }) {
  const [projects, setProjects] = useState([]);
  const [mediaLibrary, setMediaLibrary] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeProject, setActiveProject] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', client: '', location: '', description: '' });
  const [deleteModalProject, setDeleteModalProject] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem('sky_token');
        const headers = { Authorization: `Bearer ${token}` };
        const [projRes, mediaRes] = await Promise.all([
          fetch(`${API_URL}projects`, { headers }),
          fetch(`${API_URL}media`, { headers }),
        ]);
        if (projRes.ok && mediaRes.ok) {
          setProjects(await projRes.json());
          setMediaLibrary(await mediaRes.json());
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem('sky_token');
    try {
      const response = await fetch(`${API_URL}projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newProject),
      });
      if (response.ok) {
        const addedProject = await response.json();
        setProjects([addedProject, ...projects]);
        setIsCreateModalOpen(false);
        setNewProject({ title: '', client: '', location: '', description: '' });
      }
    } catch (error) {
      console.error("Failed to create project", error);
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteModalProject) return;
    const token = sessionStorage.getItem('sky_token');
    try {
      const response = await fetch(`${API_URL}projects/${deleteModalProject.id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setProjects(prev => prev.filter(p => p.id !== deleteModalProject.id));
        setDeleteModalProject(null);
      } else {
        console.error("Server refused to delete project");
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const handleAddMedia = async (file) => {
    const token = sessionStorage.getItem('sky_token');
    try {
      const response = await fetch(`${API_URL}projects/${activeProject.id}/media/${file.id}`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setMediaLibrary(prev => prev.map(m => m.id === file.id ? { ...m, project_id: activeProject.id } : m));
      }
    } catch (error) {
      console.error("Failed to link media", error);
    }
  };

  const handleExportMasterCSV = async () => {
    const token = sessionStorage.getItem('sky_token');
    try {
      const response = await fetch(`${API_URL}projects/${activeProject.id}/export/csv`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Master_Report_${activeProject.title.replace(/\s+/g, '_')}.csv`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); a.remove();
    } catch (error) {
      console.error("Master Export Error:", error);
      alert("Could not generate master report.");
    }
  };

  const statusStyle = (status) => {
    if (status === 'Processed') return { background: 'rgba(34,197,94,0.15)', color: '#22c55e' };
    if (status === 'Uploaded') return { background: 'rgba(99,102,241,0.15)', color: 'var(--sky-accent)' };
    return { background: 'var(--sky-pill)', color: 'var(--sky-ink-soft)' };
  };
  const getProjectAssets = (projectId) => mediaLibrary.filter(m => m.project_id === projectId);
  const isVid = (fn) => fn.endsWith('.mp4') || fn.endsWith('.mov');

  const inputStyle = { background: 'var(--sky-bg-soft)', border: '1px solid var(--sky-line)', color: 'var(--sky-ink)', borderRadius: 12, padding: '10px 12px', fontSize: 14, width: '100%', outline: 'none' };
  const modalBg = { background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' };

  if (isLoading) {
    return <div className="flex justify-center h-[80vh] items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--sky-accent)' }} /></div>;
  }

  // ── ACTIVE PROJECT WORKSPACE ────────────────────────────────────────────────
  if (activeProject) {
    const activeAssets = getProjectAssets(activeProject.id);
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-8 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => setActiveProject(null)}
            className="flex items-center gap-2 text-sm font-semibold transition-colors" style={{ color: 'var(--sky-ink-soft)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--sky-accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--sky-ink-soft)'}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Projects
          </button>
          <div className="flex gap-3">
            <button onClick={handleExportMasterCSV}
              className="font-medium py-2 px-4 rounded-full text-sm transition-all flex items-center gap-2"
              style={{ background: 'var(--sky-card)', border: '1px solid var(--sky-line)', color: 'var(--sky-ink)' }}>
              <svg className="w-4 h-4" style={{ color: '#22c55e' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Master Report
            </button>
            <button onClick={() => setIsMediaSelectorOpen(true)}
              className="text-white font-medium py-2 px-4 rounded-full text-sm flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, var(--sky-accent), var(--sky-accent-2))' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              Add Media
            </button>
          </div>
        </div>

        <div className="rounded-3xl p-6 md:p-8 mb-8 flex flex-col md:flex-row justify-between gap-6" style={{ background: 'var(--sky-card)', border: '1px solid var(--sky-line)' }}>
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider" style={statusStyle(activeProject.status)}>{activeProject.status}</span>
              <span className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--sky-ink-soft)' }}>📍 {activeProject.location}</span>
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--sky-ink)' }}>{activeProject.title}</h1>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--sky-ink-soft)' }}>🏢 Client: {activeProject.client}</p>
            <p className="text-sm max-w-xl" style={{ color: 'var(--sky-ink-soft)' }}>{activeProject.description}</p>
          </div>
        </div>

        <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--sky-ink)' }}>Project Workspace</h2>

        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--sky-card)', border: '1px solid var(--sky-line)' }}>
          <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--sky-line)', background: 'var(--sky-bg-soft)' }}>
            <h3 className="font-bold" style={{ color: 'var(--sky-ink)' }}>Assigned Media</h3>
          </div>
          <div className="p-4">
            {activeAssets.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {activeAssets.map(asset => {
                  const processed = asset.status === 'Processed';
                  return (
                    <div key={asset.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--sky-bg-soft)', border: '1px solid var(--sky-line)' }}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{isVid(asset.filename) ? '📽️' : '🖼️'}</span>
                        <div>
                          <p className="text-sm font-bold" style={{ color: 'var(--sky-ink)' }}>{asset.filename.split('_').pop()}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] uppercase" style={{ color: 'var(--sky-ink-soft)' }}>{asset.file_size_mb} MB</p>
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase" style={statusStyle(asset.status)}>{asset.status}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => processed ? onView(asset) : onAnalyze(asset)}
                        className="text-xs font-bold py-1.5 px-4 rounded-lg transition-all"
                        style={processed ? { background: 'rgba(34,197,94,0.12)', color: '#22c55e' } : { background: 'rgba(99,102,241,0.12)', color: 'var(--sky-accent)' }}>
                        {processed ? 'View Result' : 'Analyze'}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-sm" style={{ color: 'var(--sky-ink-soft)' }}>No media assigned. Click "Add Media" to select files.</div>
            )}
          </div>
        </div>

        {/* Media selector modal */}
        {isMediaSelectorOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" style={modalBg}>
            <div className="rounded-3xl w-full max-w-md overflow-hidden" style={{ background: 'var(--sky-card)', border: '1px solid var(--sky-line)' }}>
              <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--sky-line)', background: 'var(--sky-bg-soft)' }}>
                <h3 className="font-bold" style={{ color: 'var(--sky-ink)' }}>Add From Library</h3>
                <button onClick={() => setIsMediaSelectorOpen(false)} style={{ color: 'var(--sky-ink-soft)' }}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <div className="p-4 max-h-[400px] overflow-y-auto space-y-2">
                {mediaLibrary.map(file => {
                  const isAdded = file.project_id === activeProject.id;
                  return (
                    <div key={file.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--sky-bg-soft)', border: '1px solid var(--sky-line)' }}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{isVid(file.filename) ? '📽️' : '🖼️'}</span>
                        <p className="text-xs font-bold truncate w-32" style={{ color: 'var(--sky-ink)' }}>{file.filename.split('_').pop()}</p>
                      </div>
                      <button disabled={isAdded} onClick={() => handleAddMedia(file)}
                        className="px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase"
                        style={isAdded ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e' } : { background: 'linear-gradient(135deg, var(--sky-accent), var(--sky-accent-2))', color: '#fff' }}>
                        {isAdded ? 'Linked' : 'Add File'}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="p-4" style={{ borderTop: '1px solid var(--sky-line)' }}>
                <button onClick={() => setIsMediaSelectorOpen(false)} className="w-full py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'var(--sky-ink)' }}>Done</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── PROJECTS LIST ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--sky-ink)' }}>Projects Workspace</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--sky-ink-soft)' }}>Organize your media, analyses, and client reports.</p>
        </div>
        <button onClick={() => setIsCreateModalOpen(true)}
          className="text-white font-medium py-2.5 px-5 rounded-full text-sm flex items-center gap-2"
          style={{ background: 'linear-gradient(135deg, var(--sky-accent), var(--sky-accent-2))' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center rounded-3xl p-16" style={{ background: 'var(--sky-card)', border: '1px solid var(--sky-line)', minHeight: '46vh' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-6" style={{ background: 'var(--sky-bg-soft)', border: '1px solid var(--sky-line)' }}>📁</div>
          <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--sky-ink)' }}>No Projects Yet</h3>
          <p className="text-sm max-w-sm leading-relaxed" style={{ color: 'var(--sky-ink-soft)' }}>Create your first project to start organizing aerial assets and generating intelligence reports.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} onClick={() => setActiveProject(project)}
              className="rounded-2xl p-5 transition-all cursor-pointer flex flex-col h-full"
              style={{ background: 'var(--sky-card)', border: '1px solid var(--sky-line)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--sky-accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--sky-line)'}>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: 'var(--sky-bg-soft)', border: '1px solid var(--sky-line)' }}>📁</div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider" style={statusStyle(project.status)}>{project.status}</span>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteModalProject(project); }}
                    className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--sky-ink-soft)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--sky-ink-soft)'; e.currentTarget.style.background = 'transparent'; }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--sky-ink)' }}>{project.title}</h3>
              <p className="text-sm mb-6 line-clamp-2" style={{ color: 'var(--sky-ink-soft)' }}>{project.description}</p>
              <div className="mt-auto pt-3 flex justify-between items-center text-xs" style={{ borderTop: '1px solid var(--sky-line)', color: 'var(--sky-ink-soft)' }}>
                <span>🏢 {project.client}</span>
                <span>📍 {project.location}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteModalProject && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in" style={modalBg}>
          <div className="rounded-3xl w-full max-w-sm overflow-hidden" style={{ background: 'var(--sky-card)', border: '1px solid var(--sky-line)' }}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171' }}>
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--sky-ink)' }}>Delete Project?</h3>
              <p className="text-sm mb-6 px-4" style={{ color: 'var(--sky-ink-soft)' }}>This will permanently remove <b style={{ color: 'var(--sky-ink)' }}>"{deleteModalProject.title}"</b>. Media will remain in your library but will be unlinked.</p>
              <div className="flex gap-3 px-2">
                <button onClick={() => setDeleteModalProject(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: 'var(--sky-pill)', color: 'var(--sky-ink)' }}>Cancel</button>
                <button onClick={handleDeleteProject} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#ef4444' }}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create project modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={modalBg}>
          <div className="rounded-3xl w-full max-w-lg overflow-hidden" style={{ background: 'var(--sky-card)', border: '1px solid var(--sky-line)' }}>
            <div className="flex justify-between items-center px-6 py-4" style={{ borderBottom: '1px solid var(--sky-line)' }}>
              <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--sky-ink)' }}>Create New Project</h3>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ color: 'var(--sky-ink-soft)' }}>✕</button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--sky-ink-soft)' }}>Project Title</label>
                  <input required type="text" value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} style={inputStyle} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--sky-ink-soft)' }}>Client</label>
                    <input required type="text" value={newProject.client} onChange={(e) => setNewProject({ ...newProject, client: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--sky-ink-soft)' }}>Location</label>
                    <input required type="text" value={newProject.location} onChange={(e) => setNewProject({ ...newProject, location: e.target.value })} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--sky-ink-soft)' }}>Description</label>
                  <textarea rows="3" value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} style={{ ...inputStyle, resize: 'none' }} />
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold" style={{ background: 'var(--sky-pill)', color: 'var(--sky-ink)' }}>Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-xl font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--sky-accent), var(--sky-accent-2))' }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
