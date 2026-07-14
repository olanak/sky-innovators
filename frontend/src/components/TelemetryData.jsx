import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { API_URL } from '../config.js';

function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => { if (position) map.flyTo(position, 15); }, [position, map]);
  return null;
}

export default function TelemetryData() {
  const [assets, setAssets] = useState([]);
  const [selectedPos, setSelectedPos] = useState(null);

  useEffect(() => {
    const fetchTelemetry = async () => {
      const token = sessionStorage.getItem('sky_token');
      const response = await fetch(`${API_URL}media`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setAssets(data.filter(a => a.latitude && a.longitude));
      }
    };
    fetchTelemetry();
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--sky-ink)' }}>Telemetry</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--sky-ink-soft)' }}>Geotagged drone assets mapped by capture location.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6" style={{ height: 'calc(100vh - 230px)', minHeight: 460 }}>
        {/* Sidebar list */}
        <div className="w-full lg:w-80 rounded-3xl p-4 overflow-y-auto shrink-0"
             style={{ background: 'var(--sky-card)', border: '1px solid var(--sky-line)' }}>
          <h3 className="font-bold mb-4 text-[15px]" style={{ fontFamily: 'var(--font-display)', color: 'var(--sky-ink)' }}>Geotagged Assets</h3>
          <div className="space-y-2">
            {assets.map(asset => (
              <div key={asset.id} onClick={() => setSelectedPos([asset.latitude, asset.longitude])}
                className="p-3 rounded-xl cursor-pointer transition-all"
                style={{ border: '1px solid var(--sky-line)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--sky-accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--sky-line)'}>
                <p className="text-xs font-bold truncate" style={{ color: 'var(--sky-ink)' }}>{asset.filename.split('_').pop()}</p>
                <p className="text-[10px] uppercase tracking-tighter" style={{ color: 'var(--sky-ink-soft)' }}>Alt: {asset.altitude?.toFixed(1)}m</p>
              </div>
            ))}
            {assets.length === 0 && <p className="text-xs" style={{ color: 'var(--sky-ink-soft)' }}>No GPS data found in library.</p>}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 rounded-3xl overflow-hidden z-0" style={{ border: '1px solid var(--sky-line)' }}>
          <MapContainer center={[9.03, 38.74]} zoom={6} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <RecenterMap position={selectedPos} />
            {assets.map((asset) => (
              <Marker key={asset.id} position={[asset.latitude, asset.longitude]}>
                <Popup>
                  <div className="text-xs font-sans">
                    <p className="font-bold">{asset.filename.split('_').pop()}</p>
                    <p>Altitude: {asset.altitude}m</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
