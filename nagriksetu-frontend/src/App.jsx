import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import './App.css';

import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapRefresher({ view }) {
  const map = useMap();
  useEffect(() => { setTimeout(() => map.invalidateSize(), 400); }, [view, map]);
  return null;
}

function App() {
  const [view, setView] = useState('map'); 
  const [isAdmin, setIsAdmin] = useState(false);
  const [category, setCategory] = useState('Pothole');
  const [image, setImage] = useState(null);
  const [address, setAddress] = useState("Pinpoint a location on the map...");
  const [allReports, setAllReports] = useState([]);
  const mapRef = useRef(null);

  const BACKEND_URL = "http://localhost:5000";

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/reports`);
      setAllReports(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchReports(); }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.post(`${BACKEND_URL}/api/report/${id}/status`, { status: newStatus });
      setAllReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (err) { console.error("Update failed", err); }
  };

  const handleVote = async (id) => {
    try {
      await axios.post(`${BACKEND_URL}/api/report/${id}/vote`);
      setAllReports(prev => prev.map(r => r.id === id ? { ...r, upvotes: (r.upvotes || 0) + 1 } : r));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="modern-app">
      <header className="glass-nav">
        <div className="nav-left"><h1>NagrikSetu</h1></div>
        <div className="nav-center">
          <div className="segmented-control">
            <button onClick={() => setView('map')} className={view === 'map' ? 'active' : ''}>Map Explorer</button>
            <button onClick={() => setView('dashboard')} className={view === 'dashboard' ? 'active' : ''}>Insights</button>
          </div>
        </div>
        <div className="nav-right">
          <button className={`admin-pill ${isAdmin ? 'on' : ''}`} onClick={() => setIsAdmin(!isAdmin)}>
            {isAdmin ? "Admin: ON" : "Admin Login"}
          </button>
        </div>
      </header>

      <div className="content-shell">
        <main className="display-core">
          {view === 'map' ? (
            <div className="map-frame">
              <MapContainer center={[23.2599, 77.4126]} zoom={14} ref={mapRef} style={{height:"100%", width:"100%"}}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                <MapRefresher view={view} />
                {allReports.map(r => (
                  <Marker key={r.id} position={[r.lat, r.lng]}>
                    <Popup>
                      <div className="p-pop">
                        <img src={`${BACKEND_URL}/uploads/${r.image_path}`} width="100%" alt="issue" />
                        <p><strong>{r.category}</strong></p>
                        <button className="mini-vote-btn" onClick={() => handleVote(r.id)}>🔥 {r.upvotes || 0} Me Too</button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          ) : (
            <div className="dashboard-scroll">
              <div className="report-grid">
                {allReports.map(r => (
                  <div key={r.id} className={`modern-card ${r.status === 'Disputed' ? 'disputed-flare' : ''}`}>
                    <img src={`${BACKEND_URL}/uploads/${r.image_path}`} alt="issue" />
                    <div className="card-info">
                      <div className="card-header-row">
                        <span className={`status-badge ${(r.status || 'pending').toLowerCase().replace(/\s+/g, '-')}`}>{r.status || 'Pending'}</span>
                        <span className="vote-count">🔥 {r.upvotes || 0}</span>
                      </div>
                      <h4>{r.category}</h4>
                      <p className="card-location">📍 {r.description || "Location data unavailable"}</p>
                      <div className="admin-actions">
                        {isAdmin ? (
                          <>
                            <button className="btn-work" onClick={() => updateStatus(r.id, 'In Progress')}>Work</button>
                            <button className="btn-fix" onClick={() => updateStatus(r.id, 'Resolved')}>Resolve</button>
                          </>
                        ) : (
                          r.status === 'Resolved' ? (
                            <button className="btn-dispute" onClick={() => updateStatus(r.id, 'Disputed')}>⚠️ False Resolve? Complain</button>
                          ) : (
                            <button className="btn-vote-wide" onClick={() => handleVote(r.id)}>Upvote Issue</button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        <aside className="action-sidebar">
          <div className="sidebar-group">
            <label>📍 PINPOINT LOCATION</label>
            <div className="info-box">{address}</div>
          </div>
          <div className="sidebar-group">
            <label>📝 ISSUE CATEGORY</label>
            <select className="modern-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>Pothole</option>
              <option>Garbage Pile</option>
              <option>Water Leak</option>
              <option>Street Light</option>
            </select>
          </div>
          <div className="sidebar-group">
            <label>📸 EVIDENCE</label>
            <div className="upload-box" onClick={() => document.getElementById('cam').click()}>
              {image ? <img src={URL.createObjectURL(image)} /> : "Click to Upload Photo"}
              <input type="file" id="cam" hidden onChange={(e) => setImage(e.target.files[0])} />
            </div>
          </div>
          <button className="submit-btn" disabled={!image}>SUBMIT REPORT</button>
        </aside>
      </div>
    </div>
  );
}
export default App;