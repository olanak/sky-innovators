export default function AIModels() {
  return (
    <div className="max-w-6xl mx-auto p-8 animate-fade-in w-full transition-colors duration-300">
      <div className="mb-8 transition-colors">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">AI Models</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and deploy custom neural networks for your drone footage.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="border border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-900/20 rounded-2xl p-6 relative overflow-hidden transition-colors">
          <div className="absolute top-4 right-4 bg-cyan-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">Active</div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 transition-colors">GeoNet 2.0</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 transition-colors">Core semantic segmentation model. Detects water, roads, infrastructure, and bare land.</p>
          <button className="text-sm font-semibold text-cyan-700 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 transition-colors">View Documentation &rarr;</button>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl p-6 hover:shadow-md transition-all cursor-pointer border-dashed flex flex-col items-center justify-center text-center min-h-[160px] group">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3 text-gray-400 dark:text-gray-500 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-900/30 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          </div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white transition-colors">Import Custom Model</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">Upload a PyTorch or TensorFlow model.</p>
        </div>
      </div>
    </div>
  );
}