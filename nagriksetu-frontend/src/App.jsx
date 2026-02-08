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

// Handles moving map to searched location
function SearchHandler({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo([coords.lat, coords.lon], 16, { animate: true });
    }
  }, [coords, map]);
  return null;
}

function MapFixer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => { map.invalidateSize(); }, 500);
  }, [map]);
  return null;
}

function MapController({ onMoveStart, onMoveEnd }) {
  useMapEvents({
    movestart: () => onMoveStart(),
    moveend: (e) => {
      const center = e.target.getCenter();
      onMoveEnd(center.lat, center.lng);
    }
  });
  return null;
}

function App() {
  const [category, setCategory] = useState('Pothole');
  const [image, setImage] = useState(null);
  const [address, setAddress] = useState("Pinpoint a location...");
  const [loading, setLoading] = useState(false);
  const [allReports, setAllReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); 
  const [searchCoords, setSearchCoords] = useState(null);
  const mapRef = useRef(null);

  const BACKEND_URL = "http://localhost:5000"; 

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/reports`);
      setAllReports(res.data);
    } catch (err) { console.error("Could not load reports"); }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchAddress = async (lat, lng) => {
    setLoading(true);
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      setAddress(res.data.display_name || "Location Found");
    } catch (err) { setAddress("Manual pinpoint selected"); }
    finally { setLoading(false); }
  };

  const handleLocationSearch = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim() !== "") {
      try {
        const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`);
        if (res.data.length > 0) {
          const { lat, lon } = res.data[0];
          setSearchCoords({ lat, lon });
        } else {
          alert("Location not found!");
        }
      } catch (err) { console.error("Search failed", err); }
    }
  };

  const handleReport = async () => {
    if (!image) return alert("Please capture a photo!");
    const center = mapRef.current.getCenter();
    
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('description', address);
      formData.append('lat', center.lat);
      formData.append('lng', center.lng);
      formData.append('image', image);

      await axios.post(`${BACKEND_URL}/api/report`, formData);
      alert("✅ Report Submitted!");
      setImage(null);
      fetchReports();
    } catch (err) { alert("Submission failed"); }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-section">
          <h1>NagrikSetu</h1>
          <span className="live-badge">LIVE PROTOTYPE</span>
        </div>
        <div className="search-section">
          <div className="search-input-wrapper">
            <input 
              type="text" 
              placeholder="Find an area (e.g. MP Nagar)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleLocationSearch}
            />
            <kbd>Enter ↵</kbd>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="map-panel">
          <MapContainer center={[23.2599, 77.4126]} zoom={15} ref={mapRef} className="main-map">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapFixer />
            <SearchHandler coords={searchCoords} />
            <MapController onMoveStart={() => setLoading(true)} onMoveEnd={fetchAddress} />
            
            {allReports.map(report => (
              <Marker key={report.id} position={[report.lat, report.lng]}>
                <Popup>
                  <div className="report-popup">
                    <img src={`${BACKEND_URL}/uploads/${report.image_path}`} alt="issue" />
                    <strong>{report.category}</strong>
                    <p>Status: Pending</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            <div className="map-center-target">🎯</div>
          </MapContainer>
        </div>

        <aside className="side-panel">
          <section className="side-section">
            <h3>📍 Current Location</h3>
            <div className="address-box">{loading ? "Updating..." : address}</div>
          </section>

          <section className="side-section report-form">
            <h3>📝 Report Issue</h3>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Pothole">Pothole</option>
              <option value="Garbage">Garbage Pile</option>
              <option value="Street Light">Broken Street Light</option>
              <option value="Water Leak">Water Leakage</option>
            </select>

            <div className="photo-box">
              <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} id="cam" hidden />
              {image ? (
                <div className="preview-wrap">
                  <img src={URL.createObjectURL(image)} alt="preview" />
                  <button className="remove-btn" onClick={() => setImage(null)}>✕</button>
                </div>
              ) : (
                <button className="btn-capture" onClick={() => document.getElementById('cam').click()}>📷 Capture Issue</button>
              )}
            </div>

            <button className="btn-submit" onClick={handleReport} disabled={!image}>Submit Report</button>
          </section>

          <section className="side-section">
            <h3>🗞 Recent Reports</h3>
            <div className="activity-list">
              {allReports.slice(0, 10).map(r => (
                <div key={r.id} className="activity-item">
                  <div className="item-info">
                    <strong>{r.category}</strong>
                    <small>{new Date(r.created_at).toLocaleDateString()}</small>
                  </div>
                  <div className="status-dot pending"></div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

export default App;