import { useState, useRef, useEffect } from 'react';
import { API_URL } from '../config.js';

// Sequential upload workspace: Upload → Analyzing → (hands off to results).
// Preserves the exact two-phase upload + SSE logic from the original UploadZone.
// `onComplete(data)` fires when analysis is done, so the Dashboard can switch
// to the AnalysisReport view (same handoff the modal used).

const STEPS = [
  { key: 'uploading',    label: 'Saving file' },
  { key: 'metrics',      label: 'AI analysis' },
  { key: 'segmentation', label: 'Generating overlays' },
  { key: 'saving',       label: 'Saving results' },
  { key: 'done',         label: 'Complete' },
];

const MODULES = [
  { key: 'forestry',       title: 'Forestry & Environment', desc: 'Healthy canopy, dead trees, health score', color: '#22c55e', bg: 'rgba(34,197,94,0.12)',
    icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'land',           title: 'Land & Vegetation', desc: 'Low vegetation and bare soil coverage', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { key: 'infrastructure', title: 'Infrastructure & Hydrology', desc: 'Roads, buildings, water bodies', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',
    icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
];

export default function NewAnalysis({ existingFile, preselectedModule, onComplete }) {
  // phase: 'upload' | 'analyzing'
  const [phase, setPhase] = useState('upload');
  const [file, setFile] = useState(existingFile || null);
  const [isDragging, setIsDragging] = useState(false);
  const [selected, setSelected] = useState(() => {
    const init = { forestry: false, land: false, infrastructure: false };
    if (preselectedModule) init[preselectedModule] = true;
    return init;
  });
  const [progress, setProgress] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const fileInputRef = useRef(null);
  const esRef = useRef(null);
  const previewUrl = file && !existingFile ? URL.createObjectURL(file) : null;

  useEffect(() => () => esRef.current?.close(), []);

  const toggle = (k) => setSelected(p => ({ ...p, [k]: !p[k] }));
  const canRun = (file || existingFile) &&
    (preselectedModule || Object.values(selected).some(Boolean));

  const onDrop = (e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.length) setFile(e.dataTransfer.files[0]); };
  const onPick = (e) => { if (e.target.files?.length) setFile(e.target.files[0]); };

  // ── EXACT upload logic preserved from the original UploadZone ──────────────
  const run = async () => {
    const isExisting = !!existingFile;
    if (!file && !isExisting) return;

    setPhase('analyzing');
    setErrorMsg(null);
    setProgress({ pct: 5, step: 'uploading', message: 'Uploading file…' });

    const modulesToRun = preselectedModule
      ? [preselectedModule]
      : Object.keys(selected).filter(k => selected[k]);
    const token = sessionStorage.getItem('sky_token');
    const modelChoice = localStorage.getItem('sky_model') || 'segformer';

    try {
      let mediaId, filename;

      if (isExisting) {
        // Existing library file — use the SSE stream (same as fresh uploads)
        // so segmentation masks are generated too, not just metrics.
        // (The old PUT /analyze endpoint only produced metrics, which left the
        // overlay, legend, and layer toggles empty on the report.)
        mediaId = existingFile.id;
        filename = existingFile.filename;
      } else {
        // New file — phase 1: save, get media_id
        const body = new FormData();
        body.append('file', file);
        body.append('modules', JSON.stringify(modulesToRun));
        body.append('model', modelChoice);
        setProgress({ pct: 8, step: 'uploading', message: 'Uploading file to server…' });

        const uploadRes = await fetch(`${API_URL}upload`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}` }, body,
        });
        if (!uploadRes.ok) {
          let m = 'Upload failed. Please check the file.';
          try { const d = await uploadRes.json(); m = d.detail || d.error || m; } catch (_) {}
          setErrorMsg(m); setProgress(null); setPhase('upload'); return;
        }
        const uploadData = await uploadRes.json();
        mediaId = uploadData.file.id;
        filename = uploadData.file.filename;
        setProgress({ pct: 12, step: 'uploading', message: 'File saved — starting AI analysis…' });
      }

      // Phase 2: SSE stream (used for BOTH new and existing files, so both
      // get metrics + segmentation and the report overlay renders correctly)
      const modulesParam = encodeURIComponent(JSON.stringify(modulesToRun));
      const sseUrl = `${API_URL}upload/${mediaId}/analyze-stream?modules=${modulesParam}&model=${modelChoice}&token=${token}`;
      esRef.current?.close();
      const es = new EventSource(sseUrl);
      esRef.current = es;

      es.onmessage = (event) => {
        if (event.data === ": ping") return;
        const data = JSON.parse(event.data);
        setProgress({ pct: data.pct, step: data.step, message: data.message });

        if (data.step === 'done') {
          es.close();
          onComplete({ id: mediaId, filename, modules: modulesToRun, isCompleted: true, aiResults: data.aiResults });
        }
        if (data.step === 'error') {
          es.close();
          const raw = data.message || 'An error occurred during AI analysis.';
          setErrorMsg(raw.replace(/\s*\(\d+% confidence\)/g, ''));
          setProgress(null); setPhase('upload');
        }
      };
      es.onerror = () => {
        es.close();
        setErrorMsg('Lost connection to the analysis stream.');
        setProgress(null); setPhase('upload');
      };
    } catch (error) {
      const msg = error.message === 'Failed to fetch' ? 'Network error: Could not reach the server.' : error.message;
      setErrorMsg(msg); setProgress(null); setPhase('upload');
    }
  };

  const currentIdx = progress ? STEPS.findIndex(s => s.key === progress.step) : -1;

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE: ANALYZING
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === 'analyzing') {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 animate-fade-in">
        <span className="inline-block text-[12px] font-bold px-3 py-1.5 rounded-full mb-4"
              style={{ color: 'var(--sky-accent)', background: 'var(--sky-pill)', border: '1px solid var(--sky-line)' }}>Analyzing</span>
        <h1 className="text-[30px] font-bold tracking-tight mb-1.5" style={{ fontFamily: 'var(--font-display)', color: 'var(--sky-ink)' }}>Analyzing footage…</h1>
        <p className="text-[15px] mb-8" style={{ color: 'var(--sky-ink-soft)' }}>Your file is being processed. This usually takes a few seconds.</p>

        <div className="rounded-3xl p-8 flex flex-col sm:flex-row gap-8 items-center"
             style={{ background: 'var(--sky-card)', border: '1px solid var(--sky-line)' }}>
          <div className="relative rounded-2xl overflow-hidden shrink-0"
               style={{ width: 220, height: 150, background: 'var(--sky-pill)' }}>
            {(previewUrl) ? (
              <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center" style={{ color: 'var(--sky-ink-soft)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
            )}
            <div className="absolute left-0 right-0 h-[3px] animate-[scan_2s_ease-in-out_infinite]"
                 style={{ background: 'var(--sky-accent)', boxShadow: '0 0 16px var(--sky-accent)', top: '10%' }} />
          </div>

          <div className="flex-1 w-full">
            {STEPS.slice(0, 4).map((s, idx) => {
              const done = progress && (idx < currentIdx || progress.step === 'done');
              const active = progress && s.key === progress.step && progress.step !== 'done';
              return (
                <div key={s.key} className="flex items-center gap-3 py-1.5 text-[14px]">
                  <span className="w-[22px] h-[22px] rounded-full grid place-items-center text-[12px] shrink-0"
                        style={done ? { background: 'var(--sky-accent)', color: '#fff' }
                              : active ? { background: 'var(--sky-pill)', border: '2px solid var(--sky-accent)', color: 'var(--sky-accent)' }
                              : { background: 'var(--sky-pill)', border: '1px solid var(--sky-line)', color: 'var(--sky-ink-soft)' }}>
                    {done ? '✓' : idx + 1}
                  </span>
                  <span style={{ color: (done || active) ? 'var(--sky-ink)' : 'var(--sky-ink-soft)', fontWeight: active ? 600 : 400 }}>
                    {active && progress ? progress.message : s.label}
                  </span>
                </div>
              );
            })}
            <div className="h-1.5 rounded-full mt-5 overflow-hidden" style={{ background: 'var(--sky-pill)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                   style={{ width: `${progress?.pct ?? 0}%`, background: 'linear-gradient(90deg, var(--sky-accent), var(--sky-accent-2))' }} />
            </div>
          </div>
        </div>
        <style>{`@keyframes scan { 0%,100% { top: 8%; } 50% { top: 88%; } }`}</style>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE: UPLOAD
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 animate-fade-in">
      <span className="inline-block text-[12px] font-bold px-3 py-1.5 rounded-full mb-4"
            style={{ color: 'var(--sky-accent)', background: 'var(--sky-pill)', border: '1px solid var(--sky-line)' }}>New Analysis</span>
      <h1 className="text-[30px] font-bold tracking-tight mb-1.5" style={{ fontFamily: 'var(--font-display)', color: 'var(--sky-ink)' }}>
        {existingFile ? 'Analyze asset' : 'New Analysis'}
      </h1>
      <p className="text-[15px] mb-7" style={{ color: 'var(--sky-ink-soft)' }}>Choose what to measure, then {existingFile ? 'run the analysis' : 'drop in your drone footage'}.</p>

      {/* Module cards (hidden when a module is preselected) */}
      {!preselectedModule && (
        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          {MODULES.map(m => {
            const on = selected[m.key];
            return (
              <button key={m.key} onClick={() => toggle(m.key)}
                className="text-left rounded-2xl p-5 transition-all"
                style={{ background: on ? 'linear-gradient(135deg, rgba(177,77,255,0.12), rgba(232,56,200,0.06))' : 'var(--sky-card)',
                         border: `1px solid ${on ? 'var(--sky-accent)' : 'var(--sky-line)'}` }}>
                <div className="w-[38px] h-[38px] rounded-[10px] grid place-items-center mb-3" style={{ background: m.bg, color: m.color }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={m.icon} /></svg>
                </div>
                <h4 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--sky-ink)' }}>{m.title}</h4>
                <p className="text-[12.5px] leading-snug" style={{ color: 'var(--sky-ink-soft)' }}>{m.desc}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Drop zone / existing file */}
      {existingFile ? (
        <div className="rounded-3xl p-6 flex items-center gap-4" style={{ background: 'var(--sky-card)', border: '1px solid var(--sky-accent)' }}>
          <div className="w-12 h-12 rounded-xl grid place-items-center text-2xl" style={{ background: 'var(--sky-pill)' }}>
            {/\.(mp4|mov)$/i.test(existingFile.filename) ? '📽️' : '🖼️'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--sky-accent)' }}>Asset ready</p>
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--sky-ink)' }}>{existingFile.filename.split('_').pop()}</p>
          </div>
        </div>
      ) : (
        <div onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={onDrop}
             onClick={() => fileInputRef.current?.click()}
             className="rounded-3xl px-8 py-16 text-center cursor-pointer transition-all"
             style={{ border: `2px dashed ${isDragging ? 'var(--sky-accent)' : file ? '#22c55e' : 'var(--sky-line)'}`,
                      background: 'var(--sky-card)' }}>
          <input type="file" ref={fileInputRef} className="hidden" onChange={onPick} />
          {file ? (
            <div className="animate-fade-in">
              <div className="w-14 h-14 rounded-2xl grid place-items-center mx-auto mb-4" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-[16px] font-semibold" style={{ color: 'var(--sky-ink)' }}>{file.name}</p>
              <p className="text-[13px] mt-1" style={{ color: 'var(--sky-ink-soft)' }}>{(file.size / (1024 * 1024)).toFixed(2)} MB · click to replace</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-[18px] grid place-items-center mx-auto mb-5" style={{ background: 'var(--sky-pill)', color: 'var(--sky-accent)' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4M4 20h16" /></svg>
              </div>
              <h3 className="text-[20px] font-semibold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--sky-ink)' }}>Drop drone footage here</h3>
              <p className="text-[14px]" style={{ color: 'var(--sky-ink-soft)' }}>JPG, PNG or MP4 · or click to browse</p>
            </>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="mt-4 p-3.5 rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in"
             style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {errorMsg}
        </div>
      )}

      <button onClick={run} disabled={!canRun}
        className="mt-6 w-full sm:w-auto text-[15px] font-semibold px-8 py-3.5 rounded-full text-white transition-all"
        style={{ background: canRun ? 'linear-gradient(135deg, var(--sky-accent), var(--sky-accent-2))' : 'var(--sky-pill)',
                 color: canRun ? '#fff' : 'var(--sky-ink-soft)', cursor: canRun ? 'pointer' : 'not-allowed' }}>
        Start analysis
      </button>
    </div>
  );
}
