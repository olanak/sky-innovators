import { useState, useEffect } from 'react';
import { API_URL } from '../config.js';

export default function Projects() {
  // --- STATES ---
  const [projects, setProjects] = useState([]);
  const [mediaLibrary, setMediaLibrary] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeProject, setActiveProject] = useState(null); 
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false); 
  const [newProject, setNewProject] = useState({ title: '', client: '', location: '', description: '' });

  // --- FETCH DATA FROM POSTGRESQL ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('sky_token');
        const headers = { "Authorization": `Bearer ${token}` };

        // Fetch both Projects and Media Library at the same time
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

  // --- ACTIONS ---
  const handleCreateProject = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('sky_token');
    
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
        // Add it to the top of the list in the UI
        setProjects([addedProject, ...projects]);
        setIsCreateModalOpen(false);
        setNewProject({ title: '', client: '', location: '', description: '' });
      }
    } catch (error) {
      console.error("Failed to create project", error);
    }
  };

  const handleAddMedia = async (file) => {
    const token = localStorage.getItem('sky_token');
    
    try {
      const response = await fetch(`${API_URL}projects/${activeProject.id}/media/${file.id}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        // Update the media file locally so it immediately shows up in the project
        setMediaLibrary(prev => prev.map(m => m.id === file.id ? { ...m, project_id: activeProject.id } : m));
      }
    } catch (error) {
      console.error("Failed to link media", error);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
      case 'Processed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
      case 'In Progress': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  // Helper to dynamically calculate files for a project
  const getProjectAssets = (projectId) => {
    return mediaLibrary.filter(m => m.project_id === projectId);
  };


  if (isLoading) {
    return <div className="flex justify-center h-[80vh] items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div></div>;
  }

  // ==========================================
  // VIEW 1: SINGLE PROJECT WORKSPACE
  // ==========================================
  if (activeProject) {
    const activeAssets = getProjectAssets(activeProject.id);

    return (
      <div className="max-w-7xl mx-auto p-6 lg:p-8 animate-fade-in">
        
        {/* Back Button & Top Actions */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => setActiveProject(null)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-cyan-600 dark:text-gray-400 dark:hover:text-cyan-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Projects
          </button>
          
          <div className="flex gap-3">
            <button className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-cyan-300 dark:hover:border-cyan-700 text-gray-700 dark:text-gray-200 font-medium py-2 px-4 rounded-xl text-sm transition-all flex items-center gap-2 shadow-sm">
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

        {/* Project Header Banner */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 md:p-8 mb-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-50 dark:bg-cyan-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusColor(activeProject.status)}`}>
                {activeProject.status}
              </span>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {activeProject.location}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{activeProject.title}</h1>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-2">
              <span className="w-5 h-5 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs">🏢</span>
              Client: {activeProject.client}
            </p>
            {activeProject.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl">{activeProject.description}</p>
            )}
          </div>

          <div className="w-full md:w-64 relative z-10">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total Progress</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{activeProject.progress}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div className={`h-2 rounded-full transition-all duration-1000 ${activeProject.progress === 100 ? 'bg-emerald-500' : 'bg-cyan-500'}`} style={{ width: `${activeProject.progress}%` }}></div>
            </div>
          </div>
        </div>

        {/* Aggregated Stats Row */}
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Aggregated Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg></div>
            <div><p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</p><p className="text-lg font-bold text-gray-900 dark:text-white">{activeProject.status}</p></div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg></div>
            <div><p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Project Files</p><p className="text-xl font-bold text-gray-900 dark:text-white">{activeAssets.length}</p></div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-500 rounded-full flex items-center justify-center"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></div>
            <div><p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Storage Used</p><p className="text-xl font-bold text-gray-900 dark:text-white">
                {activeAssets.reduce((sum, file) => sum + file.file_size_mb, 0).toFixed(1)} MB
            </p></div>
          </div>
        </div>

        {/* Assets List View */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
            <h3 className="font-bold text-gray-900 dark:text-white">Project Media Assets</h3>
          </div>
          <div className="p-4">
            {activeAssets.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                    {activeAssets.map(asset => {
                        const isVideo = asset.filename.endsWith('.mp4') || asset.filename.endsWith('.mov');
                        return (
                            <div key={asset.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-700">
                               <div className="flex items-center gap-3">
                                   <span className="text-xl">{isVideo ? '📽️' : '🖼️'}</span>
                                   <div>
                                       <p className="text-sm font-bold text-gray-900 dark:text-white">{asset.filename.split('_').pop()}</p>
                                       <p className="text-[10px] text-gray-500 uppercase">{asset.file_size_mb} MB</p>
                                   </div>
                               </div>
                               <button className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline">View Result</button>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="p-12 text-center text-sm text-gray-500 flex flex-col items-center gap-3">
                    <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    No media assigned yet. Click "Add Media" to select files from your library.
                </div>
            )}
          </div>
        </div>

        {/* MEDIA SELECTOR MODAL */}
        {isMediaSelectorOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md border border-gray-100 dark:border-gray-700 shadow-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                        <h3 className="font-bold text-gray-900 dark:text-white">Add From Library</h3>
                        <button onClick={() => setIsMediaSelectorOpen(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                    <div className="p-4 max-h-[400px] overflow-y-auto space-y-2">
                        {mediaLibrary.length === 0 && <p className="text-center text-sm text-gray-500">Your library is empty.</p>}
                        
                        {mediaLibrary.map(file => {
                            const isAdded = file.project_id === activeProject.id;
                            const isVideo = file.filename.endsWith('.mp4') || file.filename.endsWith('.mov');
                            return (
                                <div key={file.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{isVideo ? '📽️' : '🖼️'}</span>
                                        <div>
                                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate w-32">{file.filename.split('_').pop()}</p>
                                            <p className="text-[10px] text-gray-500 uppercase">{file.file_size_mb} MB</p>
                                        </div>
                                    </div>
                                    <button 
                                        disabled={isAdded}
                                        onClick={() => handleAddMedia(file)}
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${isAdded ? 'bg-emerald-100 text-emerald-600 cursor-not-allowed' : 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-lg shadow-cyan-500/20'}`}
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

  // ==========================================
  // VIEW 2: PROJECTS GRID (Default)
  // ==========================================
  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-8 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects Workspace</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Organize your media, analyses, and client reports.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gray-900 dark:bg-cyan-600 hover:bg-gray-800 dark:hover:bg-cyan-700 text-white font-medium py-2.5 px-5 rounded-xl text-sm flex items-center gap-2 transition-colors shadow-sm hover:shadow"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          New Project
        </button>
      </div>

      {/* PROJECTS GRID */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
           <span className="text-4xl mb-4">📁</span>
           <h3 className="text-lg font-bold text-gray-900 dark:text-white">No projects yet</h3>
           <p className="text-sm text-gray-500 mt-2 max-w-sm">Create your first project workspace to start organizing your drone media and AI reports.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const projectFilesCount = getProjectAssets(project.id).length;
            
            return (
              <div 
                key={project.id} 
                onClick={() => setActiveProject(project)} 
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1 hover:border-cyan-300 dark:hover:border-cyan-800 transition-all cursor-pointer group flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-gray-50 dark:bg-gray-900 rounded-xl flex items-center justify-center text-2xl border border-gray-100 dark:border-gray-700 shadow-sm group-hover:scale-110 transition-transform">
                    📁
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-1" title={project.title}>
                  {project.title}
                </h3>
                
                <div className="flex flex-col gap-1.5 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <span className="truncate">{project.client}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="truncate">{project.location}</span>
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Project Progress</span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mb-4 overflow-hidden">
                    <div className={`h-1.5 rounded-full transition-all duration-1000 ${project.progress === 100 ? 'bg-emerald-500' : 'bg-cyan-500'}`} style={{ width: `${project.progress}%` }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-3">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                      {projectFilesCount} Assets
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">ID: #{project.id}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700 shadow-2xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create New Project</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Project Title</label>
                  <input required type="text" value={newProject.title} onChange={(e) => setNewProject({...newProject, title: e.target.value})} placeholder="e.g. Q3 Forest Audit" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 block p-3 text-sm transition-colors" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Client / Org</label>
                    <input required type="text" value={newProject.client} onChange={(e) => setNewProject({...newProject, client: e.target.value})} placeholder="e.g. Ministry of Env." className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 block p-3 text-sm transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Location</label>
                    <input required type="text" value={newProject.location} onChange={(e) => setNewProject({...newProject, location: e.target.value})} placeholder="e.g. Bursa, TR" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 block p-3 text-sm transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Description (Optional)</label>
                  <textarea rows="3" value={newProject.description} onChange={(e) => setNewProject({...newProject, description: e.target.value})} placeholder="Brief overview of the mission objectives..." className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 block p-3 text-sm transition-colors resize-none"></textarea>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 rounded-xl font-bold text-white bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-500/20 transition-all">
                  Create Project
                </button>
              </div>
            </form>   
          </div>
        </div>
      )}
    </div>
  );   
}