import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import './App.css';

import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- CRITICAL: Fixes Grey Map by forcing a redraw ---
function MapFixer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 500);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function MapController({ onMoveStart, onMoveEnd, setUserLoc }) {
  const map = useMap();
  useMapEvents({
    movestart: () => onMoveStart(),
    moveend: (e) => {
      const center = e.target.getCenter();
      onMoveEnd(center.lat, center.lng);
      map.invalidateSize(); 
    },
    locationfound: (e) => {
      setUserLoc([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, 17);
    }
  });
  return null;
}

function App() {
  const [tickets, setTickets] = useState([]);
  const [category, setCategory] = useState('Pothole');
  const [image, setImage] = useState(null);
  const [address, setAddress] = useState("Move map to pinpoint location...");
  const [loading, setLoading] = useState(false);
  const [userLoc, setUserLoc] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const mapRef = useRef(null);

  const BACKEND_URL = "http://localhost:5000";

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/tickets`);
      setTickets(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchAddress = async (lat, lng) => {
    setLoading(true);
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      setAddress(res.data.display_name || "Location Found");
    } catch (err) { setAddress("Manual pinpoint selected"); }
    finally { setLoading(false); }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      if (res.data.length > 0) {
        const { lat, lon } = res.data[0];
        mapRef.current.flyTo([lat, lon], 16);
        fetchAddress(lat, lon);
      }
    } catch (err) { console.error(err); }
  };

  const handleReport = async () => {
    if (!image) return alert("Capture a photo first!");
    const center = mapRef.current.getCenter();
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('description', `Address: ${address}`);
      formData.append('lat', center.lat);
      formData.append('lng', center.lng);
      formData.append('image', image);
      await axios.post(`${BACKEND_URL}/api/report`, formData);
      alert("Submitted!");
      setImage(null);
      fetchTickets();
    } catch (err) { alert("Failed."); }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>NagrikSetu</h1>
        <p>Civic Issue Reporting System</p>
      </header>

      <main className="main-content">
        <div className="map-panel">
          <MapContainer center={[23.2599, 77.4126]} zoom={15} ref={mapRef} className="main-map">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapFixer />
            <MapController onMoveStart={() => setLoading(true)} onMoveEnd={fetchAddress} setUserLoc={setUserLoc} />
            <div className="map-center-target">🎯</div>
            <button className="btn-locate" onClick={() => mapRef.current.locate()}>📍 Find Me</button>
          </MapContainer>
        </div>

        <aside className="side-panel">
          <form className="search-box" onSubmit={handleSearch}>
            <input type="text" placeholder="Search city..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <button type="submit">🔍</button>
          </form>

          <div className="address-card">
            <strong>📍 Location:</strong>
            {loading ? <div className="spinner"></div> : <p>{address}</p>}
          </div>

          <div className="form-group">
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Pothole">Pothole</option>
              <option value="Garbage">Garbage</option>
              <option value="Street Light">Street Light</option>
            </select>
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} id="cam" style={{display:'none'}} />
            <button className="btn-photo" onClick={() => document.getElementById('cam').click()}>
              {image ? "✅ Captured" : "📷 Take Photo"}
            </button>
            <button className="btn-submit" onClick={handleReport}>Submit Report</button>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;