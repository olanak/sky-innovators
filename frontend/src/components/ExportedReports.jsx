export default function ExportedReports() {
  return (
    <div className="max-w-6xl mx-auto p-8 animate-fade-in w-full flex flex-col items-center justify-center h-[80vh] text-center transition-colors duration-300">
      <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mb-6 text-orange-500 dark:text-orange-400 transition-colors">
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-2 transition-colors">Your Reports are Empty</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6 transition-colors">
        Generate PDF summaries or CSV data exports from your completed AI analysis projects to see them stored here securely.
      </p>
    </div>
  );
}