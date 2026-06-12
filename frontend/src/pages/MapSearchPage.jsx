import React, { useEffect, useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { donationsAPI, requestsAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow, isPast } from "date-fns";
import toast from "react-hot-toast";

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom coloured icons
function coloredIcon(color) {
  return L.divIcon({
    html: `<div style="
      width:28px;height:28px;
      background:${color};
      border:3px solid white;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

const iconMap = {
  Available:  coloredIcon("#2D7A4F"),
  Requested:  coloredIcon("#D97706"),
  Accepted:   coloredIcon("#1D4ED8"),
  "Picked Up": coloredIcon("#7C3AED"),
  Delivered:  coloredIcon("#64748B"),
};

const myLocationIcon = L.divIcon({
  html: `<div style="
    width:20px;height:20px;
    background:#3B82F6;
    border:3px solid white;
    border-radius:50%;
    box-shadow:0 0 0 6px rgba(59,130,246,0.25);
  "></div>`,
  className: "",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// haversine distance in km
function haversineKm([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// parse "lat,lon" or "lon,lat" from location string — fallback to geocode
function parseCoords(locationStr) {
  if (!locationStr) return null;
  const m = locationStr.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
  if (m) return [parseFloat(m[1]), parseFloat(m[2])];
  return null;
}

// Geocode via Nominatim
async function geocodeLocation(locationStr) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationStr)}&format=json&limit=1`
    );
    const data = await res.json();
    if (data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch { /* silent */ }
  return null;
}

// Component that handles map click for location selection
function MapClickHandler({ onMapClick, placing }) {
  useMapEvents({
    click(e) {
      if (placing) onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

// Fly to location
function FlyTo({ center, zoom = 13 }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, map, zoom]);
  return null;
}

const STATUS_COLORS = ["All", "Available", "Requested", "Accepted", "Picked Up", "Delivered"];

export default function MapSearchPage() {
  const { user } = useAuth();
  const [donations, setDonations]         = useState([]);
  const [geocoded, setGeocoded]           = useState([]); // [{...donation, coords}]
  const [userLocation, setUserLocation]   = useState(null);
  const [flyTarget, setFlyTarget]         = useState(null);
  const [radius, setRadius]               = useState(10);   // km
  const [statusFilter, setStatusFilter]   = useState("All");
  const [placing, setPlacing]             = useState(false);
  const [loading, setLoading]             = useState(true);
  const [geocoding, setGeocoding]         = useState(false);
  const [searchText, setSearchText]       = useState("");
  const geocodeCache = useRef({});

  // Fetch donations
  useEffect(() => {
    donationsAPI.getAll()
      .then((r) => setDonations(r.data))
      .catch(() => toast.error("Failed to load donations"))
      .finally(() => setLoading(false));
  }, []);

  // Geocode all donations
  useEffect(() => {
    if (!donations.length) return;
    setGeocoding(true);

    async function geocodeAll() {
      const results = await Promise.all(
        donations.map(async (d) => {
          let coords = parseCoords(d.location);
          if (!coords) {
            if (geocodeCache.current[d.location]) {
              coords = geocodeCache.current[d.location];
            } else {
              coords = await geocodeLocation(d.location);
              if (coords) geocodeCache.current[d.location] = coords;
            }
          }
          return { ...d, coords };
        })
      );
      setGeocoded(results.filter((d) => d.coords));
      setGeocoding(false);
    }

    geocodeAll();
  }, [donations]);

  // Get user's GPS location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setFlyTarget(coords);
        toast.success("Location found!");
      },
      () => toast.error("Could not get your location. Click the map to set it manually.")
    );
  }, []);

  const handleMapClick = useCallback((coords) => {
    setUserLocation(coords);
    setFlyTarget(coords);
    setPlacing(false);
    toast.success("Search centre set!");
  }, []);

  const handleSearchLocation = async () => {
    if (!searchText.trim()) return;
    const coords = await geocodeLocation(searchText);
    if (coords) {
      setUserLocation(coords);
      setFlyTarget(coords);
      toast.success("Jumped to location");
    } else {
      toast.error("Location not found");
    }
  };

  const handleRequest = async (donationId) => {
    try {
      await requestsAPI.create(donationId);
      toast.success("Pickup requested!");
      const r = await donationsAPI.getAll();
      setDonations(r.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to request");
    }
  };

  // Filter donations
  const visibleDonations = geocoded.filter((d) => {
    const matchStatus = statusFilter === "All" || d.status === statusFilter;
    if (!matchStatus) return false;
    if (!userLocation || !d.coords) return true; // show all if no location set
    return haversineKm(userLocation, d.coords) <= radius;
  });

  const defaultCenter = userLocation || [20.5937, 78.9629]; // India center fallback

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Map Search</div>
          <div className="page-subtitle">
            {userLocation
              ? `Showing ${visibleDonations.length} food offer${visibleDonations.length !== 1 ? "s" : ""} within ${radius} km`
              : "Set your location to find nearby surplus food offers"}
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Controls panel */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body">
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              {/* Location search */}
              <div className="form-group" style={{ flex: "1 1 220px" }}>
                <label className="form-label">Search Location</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="form-input"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="e.g. Andheri, Mumbai"
                    onKeyDown={(e) => e.key === "Enter" && handleSearchLocation()}
                  />
                  <button className="btn btn-ghost" onClick={handleSearchLocation} style={{ flexShrink: 0 }}>
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* GPS button */}
              <div className="form-group" style={{ flexShrink: 0 }}>
                <label className="form-label">My Location</label>
                <button className="btn btn-primary" onClick={getUserLocation}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                  </svg>
                  Use GPS
                </button>
              </div>

              {/* Click to place */}
              <div className="form-group" style={{ flexShrink: 0 }}>
                <label className="form-label">Or Pin on Map</label>
                <button
                  className={`btn ${placing ? "btn-amber" : "btn-ghost"}`}
                  onClick={() => setPlacing((p) => !p)}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {placing ? "Click the map…" : "Pin Location"}
                </button>
              </div>

              {/* Radius */}
              <div className="form-group" style={{ flex: "1 1 200px" }}>
                <label className="form-label">
                  Search Radius: <strong style={{ color: "var(--leaf)" }}>{radius} km</strong>
                </label>
                <input
                  type="range" min="1" max="100" step="1"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="radius-slider"
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--slate-lt)", marginTop: 2 }}>
                  <span>1 km</span><span>50 km</span><span>100 km</span>
                </div>
              </div>

              {/* Status filter */}
              <div className="form-group" style={{ flexShrink: 0 }}>
                <label className="form-label">Status</label>
                <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  {STATUS_COLORS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
              {[
                { label: "Available",  color: "#2D7A4F" },
                { label: "Requested",  color: "#D97706" },
                { label: "Accepted",   color: "#1D4ED8" },
                { label: "Picked Up",  color: "#7C3AED" },
                { label: "Delivered",  color: "#64748B" },
                { label: "You",        color: "#3B82F6" },
              ].map(({ label, color }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "var(--slate)" }}>
                  <div style={{ width: 12, height: 12, background: color, borderRadius: "50%", border: "2px solid white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map */}
        {(loading || geocoding) && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, color: "var(--slate)", fontSize: "0.875rem" }}>
            <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
            {loading ? "Loading donations…" : "Geocoding locations…"}
          </div>
        )}

        <div className="map-container" style={{ height: "520px", cursor: placing ? "crosshair" : "grab" }}>
          <MapContainer
            center={defaultCenter}
            zoom={userLocation ? 11 : 5}
            style={{ height: "100%", width: "100%" }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {flyTarget && <FlyTo center={flyTarget} zoom={userLocation ? 12 : 5} />}
            <MapClickHandler onMapClick={handleMapClick} placing={placing} />

            {/* User location marker + radius circle */}
            {userLocation && (
              <>
                <Marker position={userLocation} icon={myLocationIcon}>
                  <Popup>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 13, minWidth: 120 }}>
                      <strong>📍 You are here</strong>
                      <br />
                      <span style={{ color: "#666" }}>{userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}</span>
                    </div>
                  </Popup>
                </Marker>
                <Circle
                  center={userLocation}
                  radius={radius * 1000}
                  pathOptions={{
                    color: "#2D7A4F",
                    fillColor: "#2D7A4F",
                    fillOpacity: 0.06,
                    weight: 1.5,
                    dashArray: "6 4",
                  }}
                />
              </>
            )}

            {/* Donation markers */}
            {visibleDonations.map((d) => (
              <Marker
                key={d._id}
                position={d.coords}
                icon={iconMap[d.status] || iconMap["Available"]}
              >
                <Popup maxWidth={280}>
                  <DonationPopup
                    donation={d}
                    userLocation={userLocation}
                    onRequest={handleRequest}
                    userRole={user?.role}
                    userId={user?._id}
                  />
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Results list below map */}
        {visibleDonations.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 12, color: "var(--forest)" }}>
              {visibleDonations.length} result{visibleDonations.length !== 1 ? "s" : ""} in view
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Food</th>
                    <th>Location</th>
                    <th>Distance</th>
                    <th>Expires</th>
                    <th>Status</th>
                    {user?.role === "ngo" && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {visibleDonations
                    .sort((a, b) => {
                      if (!userLocation) return 0;
                      return haversineKm(userLocation, a.coords) - haversineKm(userLocation, b.coords);
                    })
                    .map((d) => (
                      <tr key={d._id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{d.foodName}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--slate)" }}>Qty: {d.quantity}</div>
                        </td>
                        <td style={{ fontSize: "0.875rem", color: "var(--slate)" }}>{d.location}</td>
                        <td style={{ fontSize: "0.875rem" }}>
                          {userLocation && d.coords
                            ? <span style={{ fontWeight: 600, color: "var(--leaf)" }}>
                                {haversineKm(userLocation, d.coords).toFixed(1)} km
                              </span>
                            : "—"}
                        </td>
                        <td style={{ fontSize: "0.8rem", color: isPast(new Date(d.expiryTime)) ? "var(--rose)" : "var(--slate)" }}>
                          {isPast(new Date(d.expiryTime))
                            ? "Expired"
                            : formatDistanceToNow(new Date(d.expiryTime), { addSuffix: true })}
                        </td>
                        <td>
                          <span className={`badge badge-${d.status === "Available" ? "available" : d.status === "Requested" ? "requested" : "accepted"}`}>
                            {d.status}
                          </span>
                        </td>
                        {user?.role === "ngo" && (
                          <td>
                            {d.status === "Available" && !isPast(new Date(d.expiryTime)) && (
                              <button className="btn btn-primary btn-sm" onClick={() => handleRequest(d._id)}>
                                Request
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && !geocoding && visibleDonations.length === 0 && (
          <div className="empty-state" style={{ marginTop: 24 }}>
            <div className="empty-state-icon">🗺️</div>
            <div className="empty-state-title">No donations in this area</div>
            <div className="empty-state-body">Try increasing the search radius or moving the map centre.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function DonationPopup({ donation: d, userLocation, onRequest, userRole, userId }) {
  const expired = isPast(new Date(d.expiryTime));
  const dist = userLocation && d.coords ? haversineKm(userLocation, d.coords) : null;
  const isNgo = userRole === "ngo";

  return (
    <div style={{ fontFamily: "DM Sans, system-ui, sans-serif", fontSize: 13, minWidth: 200 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: "#0F2D1F" }}>{d.foodName}</div>
      <div style={{ color: "#475569", marginBottom: 2 }}>📍 {d.location}</div>
      {dist !== null && (
        <div style={{ color: "#2D7A4F", fontWeight: 600, marginBottom: 2 }}>📏 {dist.toFixed(1)} km away</div>
      )}
      <div style={{ color: expired ? "#DC2626" : "#475569", marginBottom: 6 }}>
        🕐 {expired ? "Expired" : `Expires ${formatDistanceToNow(new Date(d.expiryTime), { addSuffix: true })}`}
      </div>
      {d.pickupInstructions && (
        <div style={{ color: "#475569", marginBottom: 6, fontSize: 12 }}>
          📌 {d.pickupInstructions}
        </div>
      )}
      <div style={{ marginBottom: 6 }}>
        <span style={{
          display: "inline-block", padding: "2px 8px", borderRadius: 99,
          fontSize: 11, fontWeight: 700,
          background: d.status === "Available" ? "#E8F5EE" : "#FEF3C7",
          color: d.status === "Available" ? "#2D7A4F" : "#D97706",
        }}>
          {d.status}
        </span>
      </div>
      <div style={{ color: "#475569", fontSize: 12, marginBottom: 8 }}>Qty: {d.quantity}</div>
      {isNgo && d.status === "Available" && !expired && (
        <button
          onClick={() => onRequest(d._id)}
          style={{
            background: "#2D7A4F", color: "white", border: "none", borderRadius: 6,
            padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", width: "100%",
          }}
        >
          Request Pickup
        </button>
      )}
    </div>
  );
}
