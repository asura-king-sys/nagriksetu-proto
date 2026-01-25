import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Icon Fix
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// Helper component to center map when GPS updates
function RecenterMap({ coords }) {
  const map = useMap();
  useEffect(() => { if (coords) map.setView([coords.lat, coords.lng], 16); }, [coords]);
  return null;
}

function App() {
  const [tickets, setTickets] = useState([]);
  const [category, setCategory] = useState('Pothole');
  const [userLoc, setUserLoc] = useState(null);
  const [image, setImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchTickets();
    // Get live GPS location
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error("GPS Denied"),
      { enableHighAccuracy: true }
    );
  }, []);

  const fetchTickets = async () => {
    const res = await axios.get('http://localhost:5000/api/tickets');
    setTickets(res.data);
  };

  const handleCapture = (e) => {
  const file = e.target.files[0];
  if (file) {
    // Check if file is too large (more than 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Photo is too large. Try taking a lower resolution picture.");
      return;
    }
    // Don't use URL.createObjectURL if memory is an issue
    setImage(file); 
    alert("Photo captured!");
  }
};

  const handleReport = async () => {
    if (!userLoc) return alert("Need GPS to report!");
    
    try {
      await axios.post('http://localhost:5000/api/report', {
        category,
        description: "Mobile Report with Image",
        lat: userLoc.lat,
        lng: userLoc.lng
      });
      alert("Issue Uploaded via GPS!");
      setImage(null);
      fetchTickets();
    } catch (err) { alert("Upload failed"); }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
      
      {/* MOBILE HEADER */}
      <div style={{ padding: '15px', background: '#27ae60', color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
        NagrikSetu Mobile Reporter
      </div>

      {/* MAP VIEW */}
      <div style={{ flex: 1 }}>
        <MapContainer 
  center={userLoc || [28.7041, 77.1025]} 
  zoom={15} 
  scrollWheelZoom={false} // Saves memory
  fadeAnimation={false}   // Saves memory
  markerZoomAnimation={false} // Saves memory
  style={{ height: '100%', width: '100%' }}
>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {userLoc && <Marker position={[userLoc.lat, userLoc.lng]} icon={L.divIcon({className: 'user-loc', html: '🔵', iconSize: [20, 20]})} />}
          {tickets.map(t => (
            <Marker key={t.id} position={[parseFloat(t.lat), parseFloat(t.lng)]}>
              <Popup><strong>{t.category}</strong><br/>Reports: {t.report_count}</Popup>
            </Marker>
          ))}
          <RecenterMap coords={userLoc} />
        </MapContainer>
      </div>

      {/* BOTTOM MOBILE DRAWER */}
      <div style={{ padding: '20px', background: 'white', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', boxShadow: '0 -2px 10px rgba(0,0,0,0.2)' }}>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '10px' }}>
          <option value="Pothole">Pothole</option>
          <option value="Garbage">Garbage</option>
          <option value="Broken Pipe">Water Leak</option>
        </select>

        {/* Hidden File Input for Camera */}
        <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleCapture} style={{ display: 'none' }} />
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => fileInputRef.current.click()} style={{ flex: 1, padding: '15px', background: '#34495e', color: 'white', border: 'none', borderRadius: '8px' }}>
            {image ? "✅ Photo Ready" : "📸 Take Photo"}
          </button>
          
          <button onClick={handleReport} disabled={!image} style={{ flex: 1, padding: '15px', background: image ? '#27ae60' : '#bdc3c7', color: 'white', border: 'none', borderRadius: '8px' }}>
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;