import { useState } from 'react';

export default function MediaLibrary() {
  const [viewMode, setViewMode] = useState('grid'); 

  const dummyFiles = [
    { id: 1, name: 'Sector_7_Pipeline_Scan.mp4', type: 'Video', size: '1.2 GB', date: 'Oct 24, 2025', status: 'Completed', duration: '14:20' },
    { id: 2, name: 'Agricultural_Yield_Map.tiff', type: 'Image', size: '450 MB', date: 'Oct 22, 2025', status: 'Completed', duration: '--' },
    { id: 3, name: 'Urban_Expansion_Q3.mp4', type: 'Video', size: '3.4 GB', date: 'Oct 20, 2025', status: 'Processing', duration: '22:15' },
    { id: 4, name: 'Coastal_Erosion_Survey.png', type: 'Image', size: '85 MB', date: 'Oct 15, 2025', status: 'Completed', duration: '--' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-8 animate-fade-in w-full transition-colors duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight transition-colors">Media Library</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors">Manage and review all uploaded drone telemetry and footage.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search files..." className="pl-9 pr-4 py-2 bg-transparent dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:border-cyan-500 transition-all w-64 dark:placeholder-gray-500" />
          </div>
          
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg transition-colors">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {dummyFiles.map((file) => (
            <div key={file.id} className="border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden hover:shadow-lg hover:border-cyan-200 dark:hover:border-cyan-800 transition-all group cursor-pointer">
              <div className="h-32 bg-gray-100 dark:bg-gray-700 relative flex items-center justify-center overflow-hidden transition-colors">
                <div className="absolute inset-0 bg-gradient-to-tr from-gray-200 to-gray-50 dark:from-gray-700 dark:to-gray-800"></div>
                <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 relative z-10 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {file.type === 'Video' ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />}
                </svg>
                <div className="absolute top-2 right-2">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide transition-colors ${file.status === 'Completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 animate-pulse'}`}>
                    {file.status}
                  </span>
                </div>
              </div>
              
              <div className="p-4 transition-colors">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{file.name}</h3>
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400 transition-colors">
                  <span>{file.size}</span>
                  <span>{file.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden transition-colors">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                <th className="p-4 font-medium">File Name</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Size</th>
                <th className="p-4 font-medium">Duration</th>
                <th className="p-4 font-medium">Upload Date</th>
                <th className="p-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {dummyFiles.map((file) => (
                <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group cursor-pointer">
                  <td className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-900/30 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors">
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {file.type === 'Video' ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />}
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{file.name}</span>
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide transition-colors ${file.status === 'Completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                      {file.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500 dark:text-gray-400 transition-colors">{file.size}</td>
                  <td className="p-4 text-sm text-gray-500 dark:text-gray-400 transition-colors">{file.duration}</td>
                  <td className="p-4 text-sm text-gray-500 dark:text-gray-400 transition-colors">{file.date}</td>
                  <td className="p-4 text-right">
                    <button className="text-gray-400 dark:text-gray-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}