import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    const result = await login(form.email, form.password);
    if (result.ok) {
      toast.success("Welcome back!");
      navigate("/dashboard");
    } else {
      setErr(result.message);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-panel auth-brand">
        <div className="auth-brand-content">
          <div style={{ marginBottom: 32 }}>
            <span style={{
              display: "inline-block", background: "rgba(76,175,125,0.2)",
              color: "var(--sprout)", padding: "6px 14px", borderRadius: 99,
              fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", marginBottom: 20,
            }}>
              FoodConnect
            </span>
            <h2 className="auth-brand-headline">
              Share surplus<br />
              <strong>food locally</strong><br />
              before it goes to waste.
            </h2>
            <p className="auth-brand-body">
              Food providers post available meals and local communities discover pickup-ready offers in minutes.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { icon: "🌾", label: "Food providers share surplus meals easily" },
              { icon: "🤝", label: "Community partners discover nearby offers" },
              { icon: "🚚", label: "Pickup details and instructions are visible up front" },
            ].map(({ icon, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: "1.2rem" }}>{icon}</span>
                <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.75)" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-panel" style={{ background: "var(--ivory)" }}>
        <div className="auth-form-wrap">
          <h2 className="auth-form-title">Sign in</h2>
          <p className="auth-form-sub">
            New here? <Link to="/register" className="auth-form-link">Create an account</Link>
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={form.password} onChange={set("password")} placeholder="••••••••" required />
            </div>
            {err && (
              <div style={{
                background: "var(--rose-lt)", color: "var(--rose)",
                padding: "10px 14px", borderRadius: "var(--radius-sm)",
                fontSize: "0.875rem",
              }}>
                {err}
              </div>
            )}
            <button className="btn btn-primary btn-lg btn-full" type="submit" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
