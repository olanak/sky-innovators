import { useState, useEffect } from 'react';
import { API_URL } from '../config.js';

export default function ExportedReports() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch only processed media from the database
  useEffect(() => {
    const fetchReports = async () => {
      const token = sessionStorage.getItem('sky_token');
      try {
        const response = await fetch(`${API_URL}media`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          // We only want to show files that actually have analysis results
          setReports(data.filter(f => f.status === 'Processed'));
        }
      } catch (error) {
        console.error("Failed to fetch reports", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  // 2. Professional Blob Download (Fixes "Not Authenticated" error)
  const handleDownloadCSV = async (id, originalFilename) => {
    const token = sessionStorage.getItem('sky_token');
    try {
      const response = await fetch(`${API_URL}media/${id}/export/csv`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Export failed");

      // Create a binary blob from the server response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Trigger the browser download
      const a = document.createElement('a');
      a.href = url;
      // Clean up the filename for the user
      const cleanName = originalFilename.split('_').pop().split('.')[0];
      a.download = `SkyInnovators_Data_${cleanName}.csv`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup memory
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error("Download Error:", error);
      alert("Could not generate CSV. Please check if the analysis is fully complete.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Exports</h1>
        <p className="text-sm text-gray-500 mt-1">Download raw analysis metrics for offline processing.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700">
              <th className="px-6 py-5">Source Asset</th>
              <th className="px-6 py-5">File Type</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {reports.map((report) => (
              <tr key={report.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate max-w-[200px]">
                      {report.filename.split('_').pop()}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-mono text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">CSV / RAW DATA</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">Generated</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleDownloadCSV(report.id, report.filename)}
                    className="inline-flex items-center gap-2 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 text-xs font-bold transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download CSV
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {isLoading ? (
          <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500"></div></div>
        ) : reports.length === 0 && (
          <div className="p-20 text-center">
            <svg className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            <p className="text-sm text-gray-400">No analyzed assets found. Process a file in the Media Library to generate a report.</p>
          </div>
        )}
      </div>
    </div>
  );
}