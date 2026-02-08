import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import './App.css';

import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function SearchHandler({ coords }) {
  const map = useMap();
  useEffect(() => { if (coords) map.flyTo([coords.lat, coords.lon], 16); }, [coords, map]);
  return null;
}

function App() {
  const [view, setView] = useState('map'); 
  const [category, setCategory] = useState('Pothole');
  const [image, setImage] = useState(null);
  const [address, setAddress] = useState("Pinpoint a location...");
  const [allReports, setAllReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCoords, setSearchCoords] = useState(null);
  const mapRef = useRef(null);

  const BACKEND_URL = "http://localhost:5000";

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/reports`);
      setAllReports(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleVote = async (id) => {
    try {
      await axios.post(`${BACKEND_URL}/api/report/${id}/vote`);
      fetchReports();
    } catch (err) { console.error("Vote failed"); }
  };

  const handleReport = async () => {
    if (!image) return alert("Capture photo!");
    const center = mapRef.current.getCenter();
    const formData = new FormData();
    formData.append('category', category);
    formData.append('description', address);
    formData.append('lat', center.lat);
    formData.append('lng', center.lng);
    formData.append('image', image);

    await axios.post(`${BACKEND_URL}/api/report`, formData);
    setImage(null);
    fetchReports();
    alert("Report Submitted!");
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <h1>NagrikSetu</h1>
          <span className="live-badge">LIVE PROTOTYPE</span>
          <nav className="view-nav">
            <button onClick={() => setView('map')} className={view === 'map' ? 'active' : ''}>Map View</button>
            <button onClick={() => setView('dashboard')} className={view === 'dashboard' ? 'active' : ''}>Dashboard</button>
          </nav>
        </div>
        <div className="search-section">
          <input 
            type="text" 
            placeholder="🔍 Search area (Press Enter)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`);
                if (res.data[0]) setSearchCoords({ lat: res.data[0].lat, lon: res.data[0].lon });
              }
            }}
          />
        </div>
      </header>

      <main className="main-content">
        <div className="content-area">
          {view === 'map' ? (
            <div className="map-wrapper">
              <MapContainer center={[23.2599, 77.4126]} zoom={15} ref={mapRef} style={{height: '100%', width: '100%'}}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <SearchHandler coords={searchCoords} />
                <div className="map-center-target">🎯</div>
                {allReports.map(r => (
                  <Marker key={r.id} position={[r.lat, r.lng]}>
                    <Popup>
                      <div className="popup-card">
                        <img src={`${BACKEND_URL}/uploads/${r.image_path}`} alt="issue" style={{width: '100px'}} />
                        <p><strong>{r.category}</strong></p>
                        <button onClick={() => handleVote(r.id)}>🔼 {r.upvotes || 0}</button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          ) : (
            <div className="dashboard-wrapper">
              <div className="status-legend">
                <div className="legend-item"><span className="dot yellow"></span> Reported</div>
                <div className="legend-item"><span className="dot blue"></span> In Progress</div>
                <div className="legend-item"><span className="dot green"></span> Resolved</div>
              </div>
              <div className="report-grid">
                {allReports.map(r => (
                  <div key={r.id} className="report-card">
                    <img src={`${BACKEND_URL}/uploads/${r.image_path}`} alt="issue" />
                    <div className="card-info">
                      <span className={`status-badge ${r.status?.toLowerCase() || 'pending'}`}>{r.status || 'Reported'}</span>
                      <h4>{r.category}</h4>
                      <p>{r.description.substring(0, 40)}...</p>
                      <div className="card-stats">
                        <button className="vote-btn" onClick={() => handleVote(r.id)}>🔼 {r.upvotes || 0}</button>
                        <small>{new Date(r.created_at).toLocaleDateString()}</small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="side-panel">
          <section className="side-group">
            <h3>📍 Pinpoint Location</h3>
            <div className="address-box">{address}</div>
          </section>

          <section className="side-group">
            <h3>📝 Report Issue</h3>
            <select className="full-select" onChange={(e) => setCategory(e.target.value)}>
              <option>Pothole</option>
              <option>Garbage</option>
              <option>Water Leak</option>
              <option>Street Light</option>
            </select>
            <div className="upload-area">
              <input type="file" id="cam" hidden onChange={(e) => setImage(e.target.files[0])} />
              {image ? (
                <div className="pre-box">
                  <img src={URL.createObjectURL(image)} alt="pre" />
                  <button className="rm-btn" onClick={() => setImage(null)}>✕</button>
                </div>
              ) : (
                <button className="btn-action blue" onClick={() => document.getElementById('cam').click()}>📷 Capture Photo</button>
              )}
            </div>
            <button className="btn-action green" onClick={handleReport} disabled={!image}>Submit Report</button>
          </section>
        </aside>
      </main>
    </div>
  );
}

export default App;