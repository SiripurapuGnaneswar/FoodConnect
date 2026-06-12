import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { donationsAPI, requestsAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([donationsAPI.getAll(), requestsAPI.getAll()])
      .then(([d, r]) => { setDonations(d.data); setRequests(r.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const available  = donations.filter((d) => d.status === "Available").length;
  const requested  = donations.filter((d) => d.status === "Requested").length;
  const delivered  = donations.filter((d) => d.status === "Delivered").length;
  const myDonations = donations.filter((d) =>
    d.donorId?._id === user?._id || d.donorId === user?._id
  );
  const pendingRequests = requests.filter((r) => r.status === "Requested");

  const recentActivity = [...donations]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const statusBadgeMap = {
    Available: "badge-available", Requested: "badge-requested",
    Accepted: "badge-accepted", "Picked Up": "badge-picked-up", Delivered: "badge-delivered",
  };

  if (loading) return (
    <div>
      <div className="page-header"><div className="page-title">Dashboard</div></div>
      <div className="page-body"><div className="spinner-page"><div className="spinner" /></div></div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},{" "}
            {user?.name?.split(" ")[0]} 👋
          </div>
          <div className="page-subtitle">Track surplus food, pickup requests, and community impact in one place.</div>
        </div>
        {(user?.role === "donor" || user?.role === "admin") && (
          <button className="btn btn-primary" onClick={() => navigate("/donations/new")}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Post Donation
          </button>
        )}
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-label">Total Donations</span>
            <span className="stat-value">{donations.length}</span>
            <span className="stat-sub">All time</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Available Now</span>
            <span className="stat-value" style={{ color: "var(--leaf)" }}>{available}</span>
            <span className="stat-sub">Ready for pickup</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Pending Requests</span>
            <span className="stat-value" style={{ color: "var(--amber)" }}>{pendingRequests.length}</span>
            <span className="stat-sub">Awaiting acceptance</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Meals Delivered</span>
            <span className="stat-value" style={{ color: "var(--canopy)" }}>{delivered}</span>
            <span className="stat-sub">Successfully rescued</span>
          </div>
          {user?.role === "donor" && (
            <div className="stat-card">
              <span className="stat-label">My Donations</span>
              <span className="stat-value">{myDonations.length}</span>
              <span className="stat-sub">Posted by you</span>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Recent donations */}
          <div className="card">
            <div className="card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--forest)" }}>Recent Donations</span>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate("/donations")}>View all</button>
            </div>
            <div>
              {recentActivity.length === 0 && (
                <div className="empty-state" style={{ padding: 32 }}>
                  <div className="empty-state-icon">🍱</div>
                  <div className="empty-state-title">No donations yet</div>
                </div>
              )}
              {recentActivity.map((d) => (
                <div key={d._id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 20px", borderTop: "1px solid var(--border)", gap: 12,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {d.foodName}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--slate)" }}>
                      {d.location} · {formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  <span className={`badge ${statusBadgeMap[d.status] || "badge-available"}`}>{d.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending requests */}
          <div className="card">
            <div className="card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--forest)" }}>Pending Requests</span>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate("/requests")}>View all</button>
            </div>
            <div>
              {pendingRequests.length === 0 && (
                <div className="empty-state" style={{ padding: 32 }}>
                  <div className="empty-state-icon">📋</div>
                  <div className="empty-state-title">No pending requests</div>
                </div>
              )}
              {pendingRequests.slice(0, 5).map((r) => (
                <div key={r._id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 20px", borderTop: "1px solid var(--border)", gap: 12,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      {r.donationId?.foodName || "Donation"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--slate)" }}>
                      By {r.ngoId?.name || "NGO"} · {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  <span className="badge badge-requested">Pending</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
