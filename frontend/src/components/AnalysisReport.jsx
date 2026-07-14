import { useState, useEffect, useRef, useCallback } from 'react';
import { API_URL } from '../config.js';

// ─── CLASS_CONFIG ─────────────────────────────────────────────────────────────
const CLASS_CONFIG = {
  HealthyTree:   { label: 'Healthy Trees',   color: '#228b22', rgba: 'rgba(34,139,34,0.55)'   },
  DeadTree:      { label: 'Dead / Stressed', color: '#8b5a2b', rgba: 'rgba(139,90,43,0.55)'   },
  LowVegetation: { label: 'Low Vegetation',  color: '#9acd32', rgba: 'rgba(154,205,50,0.55)'  },
  BareSoil:      { label: 'Bare Soil',       color: '#cd853f', rgba: 'rgba(205,133,63,0.55)'  },
  Water:         { label: 'Water Bodies',    color: '#1e90ff', rgba: 'rgba(30,144,255,0.55)'  },
  Road:          { label: 'Roads',           color: '#a9a9a9', rgba: 'rgba(169,169,169,0.55)' },
  Building:      { label: 'Buildings',       color: '#dc5050', rgba: 'rgba(220,80,80,0.55)'   },
};

// ─── RLE decode ───────────────────────────────────────────────────────────────
function decodeRLE(rle, width, height) {
  const mask = new Uint8Array(width * height);
  let pos = 0, val = 0;
  for (const count of rle) {
    for (let i = 0; i < count; i++) mask[pos++] = val;
    val = val === 0 ? 1 : 0;
  }
  return mask;
}

// ─── Get actual rendered content rect of <img> or <video> ────────────────────
// object-contain adds black bars — this finds the real pixel content area.
function getMediaContentRect(mediaEl, containerEl) {
  const containerRect = containerEl.getBoundingClientRect();
  const elRect        = mediaEl.getBoundingClientRect();

  const elW  = elRect.width;
  const elH  = elRect.height;
  const natW = mediaEl.videoWidth  || mediaEl.naturalWidth  || elW;
  const natH = mediaEl.videoHeight || mediaEl.naturalHeight || elH;

  if (!natW || !natH) {
    // Fallback — fill the element box
    return { left: elRect.left - containerRect.left, top: elRect.top - containerRect.top, width: elW, height: elH };
  }

  const scale   = Math.min(elW / natW, elH / natH);
  const rendW   = natW * scale;
  const rendH   = natH * scale;
  const offsetX = (elW - rendW) / 2;
  const offsetY = (elH - rendH) / 2;

  return {
    left:   elRect.left - containerRect.left + offsetX,
    top:    elRect.top  - containerRect.top  + offsetY,
    width:  rendW,
    height: rendH,
  };
}

// ─── Nearest frame lookup ─────────────────────────────────────────────────────
function findNearestFrame(frames, ms) {
  if (!frames?.length) return null;
  let nearest = frames[0], minDiff = Math.abs(frames[0].timestamp_ms - ms);
  for (const f of frames) {
    const d = Math.abs(f.timestamp_ms - ms);
    if (d < minDiff) { minDiff = d; nearest = f; }
  }
  return nearest;
}

// ─── OverlayCanvas ────────────────────────────────────────────────────────────
function OverlayCanvas({ mediaRef, containerRef, isVideo, segmentationFrames, activeClasses }) {
  const canvasRef = useRef(null);

  // Position canvas exactly over the rendered media content (not black bars)
  const positionCanvas = useCallback(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    const media     = mediaRef.current;
    if (!canvas || !container || !media) return false;

    const rect = getMediaContentRect(media, container);
    const w    = Math.round(rect.width);
    const h    = Math.round(rect.height);
    if (!w || !h) return false;

    canvas.style.position = 'absolute';
    canvas.style.left     = `${rect.left}px`;
    canvas.style.top      = `${rect.top}px`;
    canvas.style.width    = `${w}px`;
    canvas.style.height   = `${h}px`;

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width  = w;
      canvas.height = h;
    }
    return true;
  }, [mediaRef, containerRef]);

  // Paint all active classes — each on its own offscreen canvas so layers
  // stack correctly (drawImage respects alpha, putImageData does not)
  const renderFrame = useCallback((frameData) => {
    if (!positionCanvas()) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!frameData?.segments) return;

    for (const seg of frameData.segments) {
      if (!activeClasses.includes(seg.class)) continue;
      const cfg = CLASS_CONFIG[seg.class];
      if (!cfg || !seg.mask_rle) continue;

      const mW   = seg.width  ?? canvas.width;
      const mH   = seg.height ?? canvas.height;
      const mask = decodeRLE(seg.mask_rle, mW, mH);

      const offscreen    = document.createElement('canvas');
      offscreen.width    = mW;
      offscreen.height   = mH;
      const offCtx       = offscreen.getContext('2d');
      const imageData    = offCtx.createImageData(mW, mH);
      const m            = cfg.rgba.match(/[\d.]+/g).map(Number);
      const [r, g, b, a] = [m[0], m[1], m[2], Math.round(m[3] * 255)];

      for (let i = 0; i < mask.length; i++) {
        if (mask[i] === 1) {
          imageData.data[i * 4]     = r;
          imageData.data[i * 4 + 1] = g;
          imageData.data[i * 4 + 2] = b;
          imageData.data[i * 4 + 3] = a;
        }
      }
      offCtx.putImageData(imageData, 0, 0);
      ctx.drawImage(offscreen, 0, 0, canvas.width, canvas.height);
    }
  }, [activeClasses, positionCanvas]);

  // Convenience — get the current frame for the video's current time
  const renderCurrentVideoFrame = useCallback(() => {
    const video = mediaRef.current;
    if (!video || !segmentationFrames) return;
    renderFrame(findNearestFrame(segmentationFrames, video.currentTime * 1000));
  }, [mediaRef, segmentationFrames, renderFrame]);

  // ── VIDEO event listeners ─────────────────────────────────────────────────
  useEffect(() => {
    const video = mediaRef.current;
    if (!isVideo || !video) return;

    // timeupdate — fires ~4× per second while playing — main sync event
    const onTimeUpdate = () =>
      renderFrame(findNearestFrame(segmentationFrames, video.currentTime * 1000));

    // FIX 1: 'seeked' fires after the loop resets currentTime to 0.
    // Without this the canvas stays blank until the next timeupdate fires.
    const onSeeked = () =>
      renderFrame(findNearestFrame(segmentationFrames, video.currentTime * 1000));

    // 'playing' fires when playback resumes after pause/buffer/loop-restart.
    // Guarantees the overlay is painted even if timeupdate is slow to fire.
    const onPlaying = () =>
      renderFrame(findNearestFrame(segmentationFrames, video.currentTime * 1000));

    // 'loadeddata' — fires when the video is ready (covers media library navigation)
    const onLoaded = () =>
      renderFrame(findNearestFrame(segmentationFrames, video.currentTime * 1000));

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('seeked',     onSeeked);
    video.addEventListener('playing',    onPlaying);
    video.addEventListener('loadeddata', onLoaded);

    // Paint immediately if video is already playing when this effect runs
    if (!video.paused) onPlaying();

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('seeked',     onSeeked);
      video.removeEventListener('playing',    onPlaying);
      video.removeEventListener('loadeddata', onLoaded);
    };
  }, [isVideo, mediaRef, segmentationFrames, renderFrame]);

  // ── IMAGE render ─────────────────────────────────────────────────────────
  // FIX 2: This effect runs whenever segmentationFrames arrives (including
  // the case where the image was already loaded before the fetch finished).
  // We check img.complete so we never miss the window where the image loaded
  // before data was ready.
  useEffect(() => {
    if (isVideo) return;
    const img = mediaRef.current;
    if (!img) return;

    const doRender = () => {
      // Only render if data is actually available
      if (segmentationFrames) renderFrame(segmentationFrames[0]);
    };

    if (img.complete && img.naturalWidth) {
      doRender();
    } else {
      img.addEventListener('load', doRender, { once: true });
    }
  // Re-runs when segmentationFrames arrives OR activeClasses changes
  }, [isVideo, mediaRef, segmentationFrames, activeClasses, renderFrame]);

  // ── ResizeObserver + scroll ───────────────────────────────────────────────
  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const rerender = () => {
      if (isVideo) renderCurrentVideoFrame();
      else if (segmentationFrames) renderFrame(segmentationFrames[0]);
    };

    const ro = new ResizeObserver(rerender);
    ro.observe(media);
    window.addEventListener('scroll', rerender, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', rerender);
    };
  }, [mediaRef, isVideo, segmentationFrames, renderFrame, renderCurrentVideoFrame]);

  return (
    <canvas
      ref={canvasRef}
      style={{ pointerEvents: 'none', zIndex: 10 }}
    />
  );
}

// ─── Main Report Component ────────────────────────────────────────────────────
export default function AnalysisReport({ analysisData, onBack }) {
  const [isExporting, setIsExporting]      = useState(false);
  const [activeClasses, setActiveClasses]  = useState(Object.keys(CLASS_CONFIG));
  const [segmentationFrames, setSegFrames] = useState(null);
  const [loadingMasks, setLoadingMasks]    = useState(true);
  const [opacity, setOpacity]              = useState(70);

  const mediaRef     = useRef(null);
  const containerRef = useRef(null);

  const displayFilename = analysisData?.filename?.split('_').pop() || 'Untitled Asset';
  const isVideo = /\.(mp4|mov|webm|avi)$/i.test(analysisData?.filename ?? '');
  const mediaUrl = `${API_URL}static/${analysisData?.filename}`;

  // Reset state when a different media item is opened (media library navigation)
  useEffect(() => {
    setSegFrames(null);
    setLoadingMasks(true);
    setActiveClasses(Object.keys(CLASS_CONFIG));
  }, [analysisData?.id]);

  // Fetch segmentation frames
  useEffect(() => {
    if (!analysisData?.id) return;
    const token = sessionStorage.getItem('sky_token');

    fetch(`${API_URL}media/${analysisData.id}/segmentation`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => setSegFrames(data?.frames ?? null))
      .catch(() => setSegFrames(null))
      .finally(() => setLoadingMasks(false));
  }, [analysisData?.id]);

  const toggleClass = (cls) =>
    setActiveClasses(prev =>
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    );

  const handleExportCSV = async () => {
    const mediaId = analysisData?.id;
    if (!mediaId) return;
    setIsExporting(true);
    const token = sessionStorage.getItem('sky_token');
    try {
      const r = await fetch(`${API_URL}media/${mediaId}/export/csv`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error('Export failed');
      const blob = await r.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `SkyInnovators_${displayFilename.split('.')[0]}.csv`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); a.remove();
    } catch (e) { console.error(e); }
    finally { setIsExporting(false); }
  };

  if (!analysisData) return (
    <div className="p-20 text-center text-gray-500">No analysis selected.</div>
  );

  const detectedClasses = segmentationFrames
    ? [...new Set(segmentationFrames.flatMap(f => f.segments?.map(s => s.class) ?? []))]
    : Object.keys(CLASS_CONFIG);

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-8 animate-fade-in">

      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold transition-colors"
          style={{ color: 'var(--sky-ink-soft)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--sky-accent)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--sky-ink-soft)'}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Back
        </button>
        <button onClick={handleExportCSV} disabled={isExporting}
          className="flex items-center gap-2 text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, var(--sky-accent), var(--sky-accent-2))' }}>
          {isExporting
            ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
            : 'Export report'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">

          <div
            ref={containerRef}
            className="relative bg-black rounded-3xl overflow-hidden shadow-2xl border border-gray-800 aspect-video"
          >
            {loadingMasks && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"/>
                  <span className="text-xs text-cyan-400 font-semibold tracking-widest uppercase">
                    Loading Segmentation…
                  </span>
                </div>
              </div>
            )}

            {!loadingMasks && segmentationFrames && (
              <div
                className="absolute inset-0 z-10 pointer-events-none"
                style={{ opacity: opacity / 100 }}
              >
                <OverlayCanvas
                  mediaRef={mediaRef}
                  containerRef={containerRef}
                  isVideo={isVideo}
                  segmentationFrames={segmentationFrames}
                  activeClasses={activeClasses}
                />
              </div>
            )}

            {isVideo ? (
              <video ref={mediaRef} src={mediaUrl}
                controls autoPlay muted loop crossOrigin="anonymous"
                className="w-full h-full object-contain"
              />
            ) : (
              <img ref={mediaRef} src={mediaUrl}
                alt="Analyzed Asset" crossOrigin="anonymous"
                className="w-full h-full object-contain"
              />
            )}

            <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-1.5">
              {detectedClasses.filter(cls => activeClasses.includes(cls)).map(cls => (
                <span key={cls}
                  className="backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg"
                  style={{ backgroundColor: CLASS_CONFIG[cls]?.color + 'cc' }}>
                  {CLASS_CONFIG[cls]?.label ?? cls}
                </span>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="p-5 rounded-3xl space-y-4" style={{ background: 'var(--sky-card)', border: '1px solid var(--sky-line)' }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--sky-ink-soft)' }}>
                Layer Visibility
              </p>
              <div className="flex flex-wrap gap-2">
                {detectedClasses.map(cls => {
                  const cfg    = CLASS_CONFIG[cls];
                  const active = activeClasses.includes(cls);
                  return (
                    <button key={cls} onClick={() => toggleClass(cls)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        active
                          ? 'text-white border-transparent shadow-md'
                          : 'bg-transparent text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-600'
                      }`}
                      style={active ? { backgroundColor: cfg?.color } : {}}>
                      <span className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: active ? 'white' : cfg?.color }}/>
                      {cfg?.label ?? cls}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--sky-ink-soft)' }}>
                Overlay Opacity — {opacity}%
              </p>
              <input type="range" min={0} max={100} value={opacity}
                onChange={e => setOpacity(Number(e.target.value))}
                className="w-full h-1.5 rounded-full"
                style={{ accentColor: 'var(--sky-accent)' }}/>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: 'var(--sky-ink-soft)' }}>
              Segmentation overlay for{' '}
              {isVideo ? 'video frames (synced to playback)' : 'image pixels'}.
              Toggle classes or adjust opacity to inspect specific zones.
            </p>
          </div>
        </div>

        {/* RIGHT: Metrics */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl" style={{ background: 'var(--sky-card)', border: '1px solid var(--sky-line)' }}>
            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--sky-ink)' }}>Results Summary</h2>
            <p className="text-xs mb-6 truncate" style={{ color: 'var(--sky-ink-soft)' }}>{displayFilename}</p>
            <div className="space-y-4">
              {Object.entries(analysisData.aiResults || {}).map(([module, data]) => (
                <div key={module} className="pb-4 last:pb-0" style={{ borderBottom: '1px solid var(--sky-line)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--sky-accent)' }}>
                    {module}
                  </p>
                  {Object.entries(data).map(([key, val]) => (
                    <div key={key} className="flex justify-between items-baseline mb-1.5 gap-3">
                      <span className="text-xs capitalize" style={{ color: 'var(--sky-ink-soft)' }}>{key}</span>
                      <span className="text-sm font-semibold text-right" style={{ color: 'var(--sky-ink)' }}>{val}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-3xl" style={{ background: 'var(--sky-card)', border: '1px solid var(--sky-line)' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--sky-ink-soft)' }}>
              Colour Legend
            </p>
            <div className="space-y-2">
              {detectedClasses.map(cls => (
                <div key={cls} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: CLASS_CONFIG[cls]?.color }}/>
                  <span className="text-xs" style={{ color: 'var(--sky-ink-soft)' }}>
                    {CLASS_CONFIG[cls]?.label ?? cls}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center pt-6" style={{ borderTop: '1px solid var(--sky-line)' }}>
        <p className="text-[10px] uppercase tracking-widest font-medium" style={{ color: 'var(--sky-ink-soft)' }}>
          Generated by SkyInnovators AI Engine · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
