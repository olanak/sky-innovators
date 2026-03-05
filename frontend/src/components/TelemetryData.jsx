export default function TelemetryData() {
  return (
    <div className="max-w-6xl mx-auto p-8 animate-fade-in w-full flex flex-col items-center justify-center h-[80vh] text-center transition-colors duration-300">
      <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6 text-indigo-500 dark:text-indigo-400 transition-colors">
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-2 transition-colors">No Telemetry Data Found</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6 transition-colors">
        Once you upload drone footage containing GPS metadata or flight logs, interactive maps and flight paths will appear here.
      </p>
      <button className="bg-gray-900 dark:bg-cyan-600 hover:bg-gray-800 dark:hover:bg-cyan-700 text-white font-medium py-2.5 px-6 rounded-full text-sm transition-colors">
        Upload Flight Log
      </button>
    </div>
  );
}