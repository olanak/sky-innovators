import { useState, useEffect } from 'react';
import { API_URL } from '../config.js';

export default function ExportedReports() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      const token = sessionStorage.getItem('sky_token');
      try {
        const response = await fetch(`${API_URL}media`, { headers: { Authorization: `Bearer ${token}` } });
        if (response.ok) {
          const data = await response.json();
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

  const handleDownloadCSV = async (id, originalFilename) => {
    const token = sessionStorage.getItem('sky_token');
    try {
      const response = await fetch(`${API_URL}media/${id}/export/csv`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanName = originalFilename.split('_').pop().split('.')[0];
      a.download = `SkyInnovators_Data_${cleanName}.csv`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); a.remove();
    } catch (error) {
      console.error("Download Error:", error);
      alert("Could not generate CSV. Please check if the analysis is fully complete.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--sky-ink)' }}>Data Exports</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--sky-ink-soft)' }}>Download raw analysis metrics for offline processing.</p>
      </div>

      <div className="rounded-3xl overflow-hidden" style={{ background: 'var(--sky-card)', border: '1px solid var(--sky-line)' }}>
        {reports.length > 0 && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-widest" style={{ background: 'var(--sky-bg-soft)', color: 'var(--sky-ink-soft)', borderBottom: '1px solid var(--sky-line)' }}>
                <th className="px-6 py-4">Source Asset</th>
                <th className="px-6 py-4">File Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} style={{ borderBottom: '1px solid var(--sky-line)' }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: 'var(--sky-pill)', color: 'var(--sky-ink-soft)' }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <span className="text-sm font-medium truncate max-w-[220px]" style={{ color: 'var(--sky-ink)' }}>{report.filename.split('_').pop()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-mono px-2 py-1 rounded" style={{ background: 'var(--sky-pill)', color: 'var(--sky-ink-soft)' }}>CSV / RAW DATA</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
                      <span className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: '#22c55e' }}>Generated</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDownloadCSV(report.id, report.filename)}
                      className="inline-flex items-center gap-2 text-xs font-bold transition-colors"
                      style={{ color: 'var(--sky-accent)' }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Download CSV
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {isLoading ? (
          <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: 'var(--sky-accent)' }} /></div>
        ) : reports.length === 0 && (
          <div className="p-20 text-center">
            <svg className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--sky-line)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            <p className="text-sm" style={{ color: 'var(--sky-ink-soft)' }}>No analyzed assets found. Process a file in the Media Library to generate a report.</p>
          </div>
        )}
      </div>
    </div>
  );
}
