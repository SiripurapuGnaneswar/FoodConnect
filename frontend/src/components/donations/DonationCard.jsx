import React from "react";
import { formatDistanceToNow, isPast, differenceInHours } from "date-fns";
import { useAuth } from "../../context/AuthContext";

function getFreshnessColor(expiryTime) {
  const hoursLeft = differenceInHours(new Date(expiryTime), new Date());
  if (hoursLeft <= 0) return { color: "#DC2626", pct: 0 };
  if (hoursLeft <= 6)  return { color: "#F97316", pct: 15 };
  if (hoursLeft <= 24) return { color: "#D97706", pct: 40 };
  if (hoursLeft <= 72) return { color: "#65A30D", pct: 70 };
  return { color: "#2D7A4F", pct: 100 };
}

const statusBadge = {
  Available: "badge-available",
  Requested: "badge-requested",
  Accepted:  "badge-accepted",
  "Picked Up": "badge-picked-up",
  Delivered: "badge-delivered",
};

export default function DonationCard({ donation, onRequest, onEdit, onDelete, onStatusChange }) {
  const { user } = useAuth();
  const expired = isPast(new Date(donation.expiryTime));
  const freshness = getFreshnessColor(donation.expiryTime);
  const userId = user?._id || user?.id;
  const isOwner = userId && (userId === donation.donorId?._id || userId === donation.donorId);
  const isNgo = user?.role === "ngo";
  const isAdmin = user?.role === "admin";

  return (
    <div className="donation-card">
      <div className="donation-card-freshness">
        <div
          className="donation-card-freshness-fill"
          style={{ width: `${freshness.pct}%`, background: freshness.color }}
        />
      </div>

      <div className="donation-card-body">
        <div className="donation-card-top">
          <div className="donation-food-name">{donation.foodName}</div>
          <span className={`badge ${statusBadge[donation.status] || "badge-available"}`}>
            {donation.status}
          </span>
        </div>

        <div className="donation-meta">
          <div className="donation-meta-row">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {donation.location}
          </div>
          <div className="donation-meta-row">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3v4M8 3v4"/>
            </svg>
            <span style={{ color: expired ? "var(--rose)" : "inherit" }}>
              {expired
                ? "Expired"
                : `Expires ${formatDistanceToNow(new Date(donation.expiryTime), { addSuffix: true })}`}
            </span>
          </div>
          <div className="donation-meta-row">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            Qty: <strong>{donation.quantity}</strong>
            {donation.donorId?.name && <>&nbsp;·&nbsp;By {donation.donorId.name}</>}
          </div>
          {donation.pickupInstructions && (
            <div className="donation-meta-row text-xs" style={{ marginTop: 2 }}>
              <strong>Pickup:</strong> {donation.pickupInstructions}
            </div>
          )}
          {donation.description && (
            <div className="donation-meta-row text-xs" style={{ marginTop: 2 }}>
              {donation.description}
            </div>
          )}
        </div>

        <div className="donation-card-actions">
          {isNgo && donation.status === "Available" && !expired && (
            <button className="btn btn-primary btn-sm" onClick={() => onRequest?.(donation._id)}>
              Request Pickup
            </button>
          )}
          {isOwner && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => onEdit?.(donation)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => onDelete?.(donation._id)}>Delete</button>
            </>
          )}
          {(isAdmin || isOwner) && (
            <select
              className="form-select"
              style={{ padding: "5px 10px", fontSize: "0.78rem", height: "auto" }}
              value={donation.status}
              onChange={(e) => onStatusChange?.(donation._id, e.target.value)}
            >
              {["Available","Requested","Accepted","Picked Up","Delivered"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
}
