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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem('sky_token');
        const headers = { "Authorization": `Bearer ${token}` };

        const [projRes, mediaRes] = await Promise.all([
          fetch(`${API_URL}projects`, { headers }),
          fetch(`${API_URL}media`, { headers })
        ]);

        if (projRes.ok && mediaRes.ok) {
          const projData = await projRes.json();
          const mediaData = await mediaRes.json();
          setProjects(projData);
          setMediaLibrary(mediaData);
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
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(newProject)
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

  const handleAddMedia = async (file) => {
    const token = sessionStorage.getItem('sky_token');
    try {
      const response = await fetch(`${API_URL}projects/${activeProject.id}/media/${file.id}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        setMediaLibrary(prev => prev.map(m => m.id === file.id ? { ...m, project_id: activeProject.id } : m));
      }
    } catch (error) {
      console.error("Failed to link media", error);
    }
  };

  // 👉 NEW: Logic to download all analysis data for this project
  const handleExportMasterCSV = async () => {
    const token = sessionStorage.getItem('sky_token');
    try {
      const response = await fetch(`${API_URL}projects/${activeProject.id}/export/csv`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Master_Report_${activeProject.title.replace(/\s+/g, '_')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error("Master Export Error:", error);
      alert("Could not generate master report.");
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Processed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
      case 'Uploaded': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getProjectAssets = (projectId) => {
    return mediaLibrary.filter(m => m.project_id === projectId);
  };

  if (isLoading) {
    return <div className="flex justify-center h-[80vh] items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div></div>;
  }

  if (activeProject) {
    const activeAssets = getProjectAssets(activeProject.id);

    return (
      <div className="max-w-7xl mx-auto p-6 lg:p-8 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => setActiveProject(null)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-cyan-600 dark:text-gray-400 dark:hover:text-cyan-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Projects
          </button>
          
          <div className="flex gap-3">
            {/* 👉 MASTER REPORT BUTTON */}
            <button 
              onClick={handleExportMasterCSV}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-gray-700 dark:text-gray-200 font-medium py-2 px-4 rounded-xl text-sm transition-all flex items-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Master Report
            </button>
            <button 
                onClick={() => setIsMediaSelectorOpen(true)}
                className="bg-gray-900 dark:bg-cyan-600 hover:bg-gray-800 dark:hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-xl text-sm transition-colors flex items-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              Add Media
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 md:p-8 mb-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusColor(activeProject.status)}`}>
                {activeProject.status}
              </span>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                📍 {activeProject.location}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{activeProject.title}</h1>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-2">🏢 Client: {activeProject.client}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl">{activeProject.description}</p>
          </div>
        </div>

        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Project Workspace</h2>
        
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
            <h3 className="font-bold text-gray-900 dark:text-white">Assigned Media</h3>
          </div>
          <div className="p-4">
            {activeAssets.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                    {activeAssets.map(asset => {
                        const isVideo = asset.filename.endsWith('.mp4') || asset.filename.endsWith('.mov');
                        const isProcessed = asset.status === 'Processed';
                        
                        return (
                            <div key={asset.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-700">
                               <div className="flex items-center gap-3">
                                   <span className="text-xl">{isVideo ? '📽️' : '🖼️'}</span>
                                   <div>
                                       <p className="text-sm font-bold text-gray-900 dark:text-white">{asset.filename.split('_').pop()}</p>
                                       <div className="flex items-center gap-2">
                                          <p className="text-[10px] text-gray-500 uppercase">{asset.file_size_mb} MB</p>
                                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${getStatusColor(asset.status)}`}>{asset.status}</span>
                                       </div>
                                   </div>
                               </div>
                               
                               <button 
                                  onClick={() => isProcessed ? onView(asset) : onAnalyze(asset)}
                                  className={`text-xs font-bold py-1.5 px-4 rounded-lg transition-all ${
                                    isProcessed 
                                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100' 
                                    : 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20 hover:bg-cyan-100'
                                  }`}
                               >
                                 {isProcessed ? 'View Result' : 'Analyze'}
                               </button>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="p-12 text-center text-sm text-gray-500 flex flex-col items-center gap-3">
                    <p>No media assigned. Click "Add Media" to select files.</p>
                </div>
            )}
          </div>
        </div>

        {isMediaSelectorOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md border border-gray-100 dark:border-gray-700 shadow-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                        <h3 className="font-bold text-gray-900 dark:text-white">Add From Library</h3>
                        <button onClick={() => setIsMediaSelectorOpen(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                    <div className="p-4 max-h-[400px] overflow-y-auto space-y-2">
                        {mediaLibrary.map(file => {
                            const isAdded = file.project_id === activeProject.id;
                            return (
                                <div key={file.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{file.filename.endsWith('.mp4') ? '📽️' : '🖼️'}</span>
                                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate w-32">{file.filename.split('_').pop()}</p>
                                    </div>
                                    <button 
                                        disabled={isAdded}
                                        onClick={() => handleAddMedia(file)}
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase ${isAdded ? 'bg-emerald-100 text-emerald-600' : 'bg-cyan-600 text-white hover:bg-cyan-700'}`}
                                    >
                                        {isAdded ? 'Linked' : 'Add File'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                        <button onClick={() => setIsMediaSelectorOpen(false)} className="w-full py-2.5 bg-gray-900 dark:bg-gray-700 text-white rounded-xl text-sm font-bold">Done</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects Workspace</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Organize your media, analyses, and client reports.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gray-900 dark:bg-cyan-600 hover:bg-gray-800 dark:hover:bg-cyan-700 text-white font-medium py-2.5 px-5 rounded-xl text-sm flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div 
            key={project.id} 
            onClick={() => setActiveProject(project)} 
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 hover:shadow-xl hover:border-cyan-300 dark:hover:border-cyan-800 transition-all cursor-pointer group flex flex-col h-full"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-gray-50 dark:bg-gray-900 rounded-xl flex items-center justify-center text-2xl border border-gray-100 dark:border-gray-700">📁</div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{project.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 line-clamp-2">{project.description}</p>
            <div className="mt-auto border-t border-gray-100 dark:border-gray-700 pt-3 flex justify-between items-center text-xs text-gray-500">
               <span>🏢 {project.client}</span>
               <span>📍 {project.location}</span>
            </div>
          </div>
        ))}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700 shadow-2xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create New Project</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Project Title</label>
                  <input required type="text" value={newProject.title} onChange={(e) => setNewProject({...newProject, title: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Client</label>
                    <input required type="text" value={newProject.client} onChange={(e) => setNewProject({...newProject, client: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Location</label>
                    <input required type="text" value={newProject.location} onChange={(e) => setNewProject({...newProject, location: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Description</label>
                  <textarea rows="3" value={newProject.description} onChange={(e) => setNewProject({...newProject, description: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm resize-none"></textarea>
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-cyan-600 text-white rounded-xl font-bold">Create</button>
              </div>
            </form> 
          </div>
        </div>
      )}
    </div>
  );   
}