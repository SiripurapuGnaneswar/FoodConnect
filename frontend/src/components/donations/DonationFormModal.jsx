import React, { useState, useEffect } from "react";

const INITIAL = {
  foodName: "",
  quantity: "",
  description: "",
  pickupInstructions: "",
  location: "",
  expiryTime: "",
};

export default function DonationFormModal({ donation, onSave, onClose, loading }) {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (donation) {
      const exp = donation.expiryTime
        ? new Date(donation.expiryTime).toISOString().slice(0, 16)
        : "";
      setForm({
        ...donation,
        expiryTime: exp,
        quantity: String(donation.quantity),
        pickupInstructions: donation.pickupInstructions || "",
      });
    } else {
      setForm(INITIAL);
    }
  }, [donation]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.foodName.trim()) e.foodName = "Food name is required";
    if (!form.quantity || isNaN(form.quantity) || Number(form.quantity) <= 0) e.quantity = "Enter a valid quantity";
    if (!form.location.trim()) e.location = "Location is required";
    if (!form.expiryTime) e.expiryTime = "Expiry time is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({ ...form, quantity: Number(form.quantity) });
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{donation?._id ? "Edit Donation" : "New Donation"}</span>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Food Name *</label>
            <input className="form-input" value={form.foodName} onChange={set("foodName")} placeholder="e.g. Rice and dal, Fresh bread..." />
            {errors.foodName && <span className="form-error">{errors.foodName}</span>}
          </div>

          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Quantity (servings) *</label>
              <input className="form-input" type="number" min="1" value={form.quantity} onChange={set("quantity")} placeholder="e.g. 20" />
              {errors.quantity && <span className="form-error">{errors.quantity}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Expires At *</label>
              <input className="form-input" type="datetime-local" value={form.expiryTime} onChange={set("expiryTime")} />
              {errors.expiryTime && <span className="form-error">{errors.expiryTime}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Pickup Location *</label>
            <input className="form-input" value={form.location} onChange={set("location")} placeholder="Street address or landmark" />
            {errors.location && <span className="form-error">{errors.location}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Pickup Instructions</label>
            <textarea className="form-textarea" value={form.pickupInstructions} onChange={set("pickupInstructions")} placeholder="e.g. Ring the bell, leave at reception, call ahead..." />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={set("description")} placeholder="Dietary info, packaging notes, special instructions..." />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving…" : donation?._id ? "Save changes" : "Post donation"}
          </button>
        </div>
      </div>
    </div>
  );
}
