import React, { useEffect, useState, useCallback } from "react";
import { donationsAPI, requestsAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import DonationCard from "../components/donations/DonationCard";
import DonationFormModal from "../components/donations/DonationFormModal";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";

const STATUSES = ["All", "Available", "Requested", "Accepted", "Picked Up", "Delivered"];

export default function DonationsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [modal, setModal]         = useState(null); // null | "new" | donation object
  const [filter, setFilter]       = useState("All");
  const [search, setSearch]       = useState("");

  const fetchDonations = useCallback(() => {
    setLoading(true);
    donationsAPI.getAll()
      .then((r) => setDonations(r.data))
      .catch(() => toast.error("Failed to load donations"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchDonations(); }, [fetchDonations]);

  // auto-open new modal if navigated to /donations/new
  useEffect(() => {
    if (location.pathname === "/donations/new") {
      setModal("new");
    }
  }, [location.pathname]);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (form._id) {
        await donationsAPI.update(form._id, form);
        toast.success("Donation updated");
      } else {
        await donationsAPI.create(form);
        toast.success("Donation posted!");
      }
      fetchDonations();
      setModal(null);
      if (location.pathname === "/donations/new") navigate("/donations");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this donation?")) return;
    try {
      await donationsAPI.delete(id);
      toast.success("Donation deleted");
      fetchDonations();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleRequest = async (donationId) => {
    try {
      await requestsAPI.create(donationId);
      toast.success("Pickup requested!");
      fetchDonations();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to request");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await donationsAPI.updateStatus(id, status);
      toast.success("Status updated");
      fetchDonations();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const filtered = donations.filter((d) => {
    const matchStatus = filter === "All" || d.status === filter;
    const matchSearch = !search || d.foodName.toLowerCase().includes(search.toLowerCase()) || d.location.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const closeModal = () => {
    setModal(null);
    if (location.pathname === "/donations/new") navigate("/donations");
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Food Offers</div>
          <div className="page-subtitle">Share or discover nearby surplus meals and pickup-ready offers.</div>
        </div>
        {(user?.role === "donor" || user?.role === "admin") && (
          <button className="btn btn-primary" onClick={() => setModal("new")}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Post Donation
          </button>
        )}
      </div>

      <div className="page-body">
        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <input
            className="form-input"
            style={{ maxWidth: 260 }}
            placeholder="Search food or location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="tabs" style={{ marginBottom: 0, borderBottom: "none", gap: 4 }}>
            {STATUSES.map((s) => (
              <button
                key={s}
                className={`tab-btn${filter === s ? " active" : ""}`}
                onClick={() => setFilter(s)}
                style={{ padding: "6px 14px", fontSize: "0.8rem" }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="spinner-page"><div className="spinner" /></div>}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🍱</div>
            <div className="empty-state-title">No donations found</div>
            <div className="empty-state-body">
              {filter !== "All" ? `No donations with status "${filter}".` : "Try adjusting your search."}
            </div>
          </div>
        )}

        {!loading && (
          <div className="grid-cards">
            {filtered.map((d) => (
              <DonationCard
                key={d._id}
                donation={d}
                onRequest={handleRequest}
                onEdit={(don) => setModal(don)}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>

      {modal !== null && (
        <DonationFormModal
          donation={modal === "new" ? null : modal}
          onSave={handleSave}
          onClose={closeModal}
          loading={saving}
        />
      )}
    </div>
  );
}
