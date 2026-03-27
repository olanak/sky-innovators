import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { API_URL } from '../config.js';

// Helper component to move the map when a list item is clicked
function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 15);
  }, [position, map]);
  return null;
}

export default function TelemetryData() {
  const [assets, setAssets] = useState([]);
  const [selectedPos, setSelectedPos] = useState(null);

  useEffect(() => {
    const fetchTelemetry = async () => {
      const token = sessionStorage.getItem('sky_token');
      const response = await fetch(`${API_URL}media`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAssets(data.filter(a => a.latitude && a.longitude));
      }
    };
    fetchTelemetry();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 h-[calc(100vh-100px)] flex flex-col lg:flex-row gap-6">
      
      {/* 📋 SIDEBAR: The "Selector" List */}
      <div className="w-full lg:w-80 bg-white dark:bg-gray-800 rounded-3xl p-4 border border-gray-100 dark:border-gray-700 overflow-y-auto">
        <h3 className="font-bold mb-4 dark:text-white">Geotagged Assets</h3>
        <div className="space-y-2">
          {assets.map(asset => (
            <div 
              key={asset.id}
              onClick={() => setSelectedPos([asset.latitude, asset.longitude])}
              className="p-3 rounded-xl border border-gray-50 dark:border-gray-700 hover:border-cyan-500 cursor-pointer transition-all"
            >
              <p className="text-xs font-bold truncate dark:text-gray-200">{asset.filename.split('_').pop()}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Alt: {asset.altitude?.toFixed(1)}m</p>
            </div>
          ))}
          {assets.length === 0 && <p className="text-xs text-gray-400">No GPS data found in library.</p>}
        </div>
      </div>

      {/* 🗺️ THE MAP */}
      <div className="flex-1 rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm z-0">
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
  );
}