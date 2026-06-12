import React, { useEffect, useState, useCallback } from "react";
import { requestsAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

const statusBadgeMap = {
  Requested: "badge-requested",
  Accepted:  "badge-accepted",
  Rejected:  "badge-danger",
};

export default function RequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState("all");

  const fetchRequests = useCallback(() => {
    setLoading(true);
    requestsAPI.getAll()
      .then((r) => setRequests(r.data))
      .catch(() => toast.error("Failed to load requests"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAccept = async (id) => {
    try {
      await requestsAPI.accept(id);
      toast.success("Request accepted! Donation marked as accepted.");
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept");
    }
  };

  const filtered = requests.filter((r) => {
    if (tab === "all") return true;
    if (tab === "mine" && user?.role === "ngo") return r.ngoId?._id === user?._id || r.ngoId === user?._id;
    if (tab === "pending") return r.status === "Requested";
    if (tab === "accepted") return r.status === "Accepted";
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Pickup Requests</div>
          <div className="page-subtitle">Community partners request to collect nearby food offers.</div>
        </div>
      </div>

      <div className="page-body">
        <div className="tabs">
          {[
            { key: "all",      label: "All Requests" },
            { key: "pending",  label: "Pending" },
            { key: "accepted", label: "Accepted" },
            ...(user?.role === "ngo" ? [{ key: "mine", label: "My Requests" }] : []),
          ].map(({ key, label }) => (
            <button key={key} className={`tab-btn${tab === key ? " active" : ""}`} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {loading && <div className="spinner-page"><div className="spinner" /></div>}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No requests found</div>
            <div className="empty-state-body">
              {user?.role === "ngo"
                ? "Browse available donations and request a pickup to get started."
                : "No requests have been made yet."}
            </div>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Food Item</th>
                  <th>Location</th>
                  <th>Requested By</th>
                  <th>Status</th>
                  <th>Requested</th>
                  {user?.role === "donor" || user?.role === "admin" ? <th>Action</th> : null}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.donationId?.foodName || "—"}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--slate)" }}>
                        Qty: {r.donationId?.quantity ?? "—"}
                      </div>
                    </td>
                    <td style={{ color: "var(--slate)", fontSize: "0.875rem" }}>
                      {r.donationId?.location || "—"}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{r.ngoId?.name || "—"}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--slate)" }}>{r.ngoId?.email}</div>
                    </td>
                    <td>
                      <span className={`badge ${statusBadgeMap[r.status] || "badge-available"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "var(--slate)" }}>
                      {r.createdAt ? formatDistanceToNow(new Date(r.createdAt), { addSuffix: true }) : "—"}
                    </td>
                    {(user?.role === "donor" || user?.role === "admin") && (
                      <td>
                        {r.status === "Requested" && (
                          <button className="btn btn-primary btn-sm" onClick={() => handleAccept(r._id)}>
                            Accept
                          </button>
                        )}
                        {r.status !== "Requested" && (
                          <span style={{ fontSize: "0.8rem", color: "var(--slate-lt)" }}>—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
