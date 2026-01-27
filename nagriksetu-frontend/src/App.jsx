import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Leaflet Icon Fix
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

// Sub-component to track map movement
function MapEvents({ onMoveStart, onMoveEnd }) {
  useMapEvents({
    movestart: () => onMoveStart(),
    moveend: (e) => {
      const center = e.target.getCenter();
      onMoveEnd(center.lat, center.lng);
    },
  });
  return null;
}

function App() {
  const [tickets, setTickets] = useState([]);
  const [category, setCategory] = useState('Pothole');
  const [image, setImage] = useState(null);
  const [address, setAddress] = useState("Move map to pinpoint...");
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);
  const fileInputRef = useRef(null);

  // Update this with your Laptop's IP
  const BACKEND_URL = "http://10.241.58.226:5000";

  useEffect(() => {
    fetchTickets();
    fetchAddress(23.2599, 77.4126); // Default center (Bhopal)
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/tickets`);
      setTickets(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const fetchAddress = async (lat, lng) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      setAddress(res.data.display_name || "Location Found");
    } catch (err) {
      setAddress("Location selected (Manual Pin)");
    } finally {
      setLoading(false);
    }
  };

  const handleReport = () => {
    if (!image) return alert("Please capture/select a photo first!");

    navigator.geolocation.getCurrentPosition(
      (pos) => sendData(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        console.warn("GPS blocked, using map center.");
        const center = mapRef.current.getCenter();
        sendData(center.lat, center.lng);
      },
      { timeout: 5000 }
    );
  };

  const sendData = async (lat, lng) => {
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('description', `Address: ${address}`);
      formData.append('lat', lat);
      formData.append('lng', lng);
      formData.append('image', image);

      await axios.post(`${BACKEND_URL}/api/report`, formData);
      alert("🎉 Report Submitted!");
      setImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchTickets();
    } catch (err) {
      alert("Submission failed. Check backend connection.");
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>NagrikSetu</h1>
        <p>Civic Issue Reporting</p>
      </header>

      <div className="map-wrapper">
        <MapContainer 
          center={[23.2599, 77.4126]} 
          zoom={15} 
          ref={mapRef} 
          className="main-map"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapEvents onMoveStart={() => setLoading(true)} onMoveEnd={fetchAddress} />
          
          {tickets.map(t => (
            <Marker key={t.id} position={[t.lat, t.lng]}>
              <Popup>{t.category}</Popup>
            </Marker>
          ))}
        </MapContainer>
        <div className="map-center-target">🎯</div>
      </div>

      <div className="form-section">
        <div className="address-box">
          <strong>📍 Selected Location:</strong>
          {loading ? (
            <div className="loader-container">
              <div className="spinner"></div>
              <span>Fetching address...</span>
            </div>
          ) : (
            <p>{address}</p>
          )}
        </div>

        <div className="controls">
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="Pothole">Pothole</option>
            <option value="Garbage">Garbage</option>
            <option value="Street Light">Street Light</option>
            <option value="Water Leak">Water Leak</option>
          </select>

          <input 
            type="file" accept="image/*" 
            onChange={(e) => setImage(e.target.files[0])} 
            ref={fileInputRef} id="cam" style={{ display: 'none' }} 
          />
          
          <button className="btn-photo" onClick={() => document.getElementById('cam').click()}>
            {image ? "✅ Photo Ready" : "📷 Take Photo"}
          </button>

          <button className="btn-submit" onClick={handleReport}>
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;