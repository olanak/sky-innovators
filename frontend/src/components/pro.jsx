import { useState } from 'react';

export default function Projects() {
  const [activeSubTab, setActiveSubTab] = useState('My Projects');

  return (
    <div className="w-full max-w-6xl mx-auto p-8 animate-fade-in transition-colors duration-300">
      
      {/* Top Header & Tabs */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 transition-colors">Projects</h1>
        <div className="flex border-b border-gray-200 dark:border-gray-700 gap-8 transition-colors">
          <button 
            onClick={() => setActiveSubTab('My Projects')}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeSubTab === 'My Projects' ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            My Projects
            {activeSubTab === 'My Projects' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500 rounded-t-md"></span>
            )}
          </button>
          <button 
            onClick={() => setActiveSubTab('Public Datasets')}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeSubTab === 'Public Datasets' ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Public Datasets
            {activeSubTab === 'Public Datasets' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500 rounded-t-md"></span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="text-center mb-10 transition-colors">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create Your First Project</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">No matter how you start, your project will deliver high-precision geospatial insights.</p>
      </div>

      {/* The Two Large "Create" Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        
        {/* Card 1: Video Analysis */}
        <div className="border-2 border-cyan-100 dark:border-cyan-900/50 rounded-3xl p-8 bg-white dark:bg-gray-800 hover:shadow-xl hover:border-cyan-300 dark:hover:border-cyan-700 transition-all cursor-pointer relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">Full Video Analysis</h3>
                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">Most Detailed</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-left max-w-xs leading-relaxed transition-colors">
                Use a raw drone video to create a comprehensive map with anomaly detection and object tracking over time.
              </p>
            </div>
          </div>
          
          <div className="mt-8 h-40 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-2xl border border-cyan-100/50 dark:border-cyan-800/30 flex items-center justify-center group-hover:scale-105 transition-all duration-500">
             <svg className="w-16 h-16 text-cyan-400 dark:text-cyan-500 opacity-50 dark:opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </div>
        </div>

        {/* Card 2: Image Scan */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-3xl p-8 bg-white dark:bg-gray-800 hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-700 transition-all relative overflow-hidden group">
           <div className="mb-4 relative z-10">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-left transition-colors">Static Image Scan</h3>
              <p className="text-sm text-gray-400 dark:text-gray-500 text-left max-w-xs leading-relaxed transition-colors">
                Bring a single aerial photo or orthomosaic to life with rapid semantic segmentation and density mapping.
              </p>
          </div>
          
          <div className="mt-8 h-40 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center gap-3 relative overflow-hidden transition-colors">
             <div className="absolute inset-0 opacity-10 dark:opacity-5" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
             <button className="relative z-10 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow text-gray-700 dark:text-gray-200 font-medium py-2 px-6 rounded-full text-sm flex items-center gap-2 transition-all">
                <svg className="w-4 h-4 text-cyan-500 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Upload photo
             </button>
             <button className="relative z-10 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow text-gray-700 dark:text-gray-200 font-medium py-2 px-6 rounded-full text-sm flex items-center gap-2 transition-all">
                <svg className="w-4 h-4 text-purple-500 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                Scan with AI
             </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Sample Datasets */}
      <div className="transition-colors">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Start with a sample dataset</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Test the AI pipeline using one of our high-quality, pre-annotated aerial maps.</p>
        
        <div className="flex gap-4 overflow-x-auto pb-4">
          <SampleCard title="Urban Infrastructure" />
          <SampleCard title="Coastal Erosion" />
          <SampleCard title="Agricultural Yield" />
          <SampleCard title="Forest Density" />
        </div>
      </div>

    </div>
  );
}

function SampleCard({ title }) {
  return (
    <div className="min-w-[160px] h-24 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-end p-3 cursor-pointer hover:border-cyan-300 dark:hover:border-cyan-600 hover:shadow-md transition-all relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 dark:from-black/80 to-transparent z-0"></div>
      <span className="relative z-10 text-white text-xs font-bold truncate w-full">{title}</span>
    </div>
  )
}