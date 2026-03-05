import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Projects from './pro';
import UploadZone from './UploadZone';
import AIModels from './AImodel';
import TelemetryData from './TelemetryData';
import ExportedReports from './ExportedReports';
import AccountSettings from './AccountSettings';
import MediaLibrary from './MediaLibrary';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Home');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // NEW: Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // NEW: Apply dark mode to the HTML element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 font-sans text-gray-800 dark:text-gray-200 relative transition-colors duration-300">
      
      {/* 1. SIDEBAR */}
      <aside className="w-64 border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col justify-between overflow-y-auto transition-colors duration-300">
        <div>
          <div className="p-5 flex items-center gap-2 cursor-pointer">
            <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">SkyInnovators</span>
          </div>

          <div className="px-4 pb-4">
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="w-full bg-gray-900 dark:bg-cyan-600 hover:bg-gray-800 dark:hover:bg-cyan-700 text-white font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              New Analysis
            </button>
          </div>

          <nav className="px-3 space-y-1">
            <NavItem icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" label="Home" active={activeTab === 'Home'} onClick={() => setActiveTab('Home')} />
            <NavItem icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" label="Projects" active={activeTab === 'Projects'} onClick={() => setActiveTab('Projects')} />
            <NavItem icon="M13 10V3L4 14h7v7l9-11h-7z" label="AI Models" badge="Beta" active={activeTab === 'AI Models'} onClick={() => setActiveTab('AI Models')} />
          </nav>

          <div className="px-3 mt-6">
            <p className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Assets</p>
            <nav className="space-y-1">
              <NavItem icon="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" label="Media Library" active={activeTab === 'Media Library'} onClick={() => setActiveTab('Media Library')} />
              <NavItem icon="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" label="Telemetry Data" active={activeTab === 'Telemetry Data'} onClick={() => setActiveTab('Telemetry Data')} />
              <NavItem icon="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" label="Exported Reports" active={activeTab === 'Exported Reports'} onClick={() => setActiveTab('Exported Reports')} />
            </nav>
          </div>
        </div>

        {/* User Profile Area */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 relative">
          
          
          <div 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">O</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">olana@sky.com</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Free Tier</p>
            </div>
            <svg className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
            </svg>
          </div>

          {/* Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className="absolute bottom-full left-4 mb-2 w-56 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/50 overflow-hidden z-50 animate-fade-in">
              <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700">
                <p className="text-sm text-gray-900 dark:text-white font-medium">Olana Kenea</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">olana@sky.com</p>
              </div>
              <div className="py-2">
                <button 
                  onClick={() => { setActiveTab('Settings'); setIsProfileMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Account Settings
                </button>
              </div>
              <div className="border-t border-gray-50 dark:border-gray-700 py-2">
                <button 
                  onClick={() => navigate('/login')}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto bg-gray-50/30 dark:bg-gray-900 transition-colors duration-300">
        
        {/* Header with Dark Mode Toggle */}
        <header className="flex justify-between items-center px-8 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
          </div>
          <div className="flex items-center gap-3">
            
            {/* THEME TOGGLE BUTTON */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>

            <select className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-cyan-400">
              <option>EN</option>
            </select>
            <button className="border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium py-1.5 px-4 rounded-full text-sm transition-colors">
              Documentation
            </button>
          </div>
        </header>

        {activeTab === 'Projects' && <Projects />}
        {activeTab === 'Media Library' && <MediaLibrary />}
        {activeTab === 'AI Models' && <AIModels />}
        {activeTab === 'Telemetry Data' && <TelemetryData />}
        {activeTab === 'Exported Reports' && <ExportedReports />}
        {activeTab === 'Settings' && <AccountSettings />}

        {activeTab === 'Home' && (
          <div className="max-w-6xl mx-auto p-8 animate-fade-in">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-gray-800 rounded-2xl p-8 mb-10 border border-gray-200 dark:border-gray-700 flex justify-between items-center relative overflow-hidden transition-colors duration-300">
              <div className="max-w-lg relative z-10">
                <span className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs font-semibold px-2 py-1 rounded text-gray-600 dark:text-gray-300 mb-4 inline-block">New Feature</span>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                  Geospatial Analysis <br/> <span className="text-cyan-500">now with GeoNet 2.0</span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm leading-relaxed">
                  Our newest AI model is now available for drone footage. Automatically detect water, roads, and deforestation from scratch using the updated pipeline.
                </p>
                <button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="bg-gray-900 dark:bg-cyan-600 hover:bg-gray-800 dark:hover:bg-cyan-700 text-white font-medium py-2.5 px-5 rounded-full text-sm transition-colors flex items-center gap-2"
                >
                  Try it out <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-cyan-100/50 dark:from-cyan-900/20 to-transparent"></div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Analysis Tools</h2>
              <button className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1">See All <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ActionCard 
                icon="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" 
                iconColor="text-blue-500 dark:text-blue-400" iconBg="bg-blue-50 dark:bg-blue-500/10"
                title="Upload Footage" desc="Turn raw drone video into structured data" 
                onClick={() => setIsUploadModalOpen(true)}
              />
              <ActionCard 
                icon="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                iconColor="text-purple-500 dark:text-purple-400" iconBg="bg-purple-50 dark:bg-purple-500/10"
                title="Anomaly Detection" desc="Scan infrastructure for defects or damage" 
              />
              <ActionCard 
                icon="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                iconColor="text-emerald-500 dark:text-emerald-400" iconBg="bg-emerald-50 dark:bg-emerald-500/10"
                title="Land-Cover Mapping" desc="Generate GeoJSON polygons for terrain" 
              />
            </div>
          </div>
        )}
      </main>

      {/* 3. UPLOAD MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in p-4 transition-colors">
          <div className="absolute inset-0" onClick={() => setIsUploadModalOpen(false)}></div>
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl relative z-10 overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors">
            <button 
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-gray-500 dark:text-gray-400 transition-colors z-50"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="p-8">
              <UploadZone />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function NavItem({ icon, label, badge, active, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors ${
        active 
          ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
    >
      <div className="flex items-center gap-3">
        <svg className={`w-5 h-5 ${active ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
        </svg>
        <span className="text-sm">{label}</span>
      </div>
      {badge && <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">{badge}</span>}
    </div>
  )
}

function ActionCard({ icon, iconColor, iconBg, title, desc, onClick }) {
  return (
    <div onClick={onClick} className="border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 rounded-2xl p-4 flex gap-4 cursor-pointer hover:shadow-md hover:border-blue-100 dark:hover:border-blue-900/50 transition-all group">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
        </svg>
      </div>
      <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">{desc}</p>
      </div>
    </div>
  )
}