import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "donor" });
  const [err, setErr] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (form.password.length < 6) { setErr("Password must be at least 6 characters"); return; }
    const result = await register(form.name, form.email, form.password, form.role);
    if (result.ok) {
      toast.success("Account created — sign in to continue");
      navigate("/login");
    } else {
      setErr(result.message);
    }
  };

  const roles = [
    { value: "donor", label: "Food Provider", desc: "I have surplus food ready to share" },
    { value: "ngo",   label: "Community Partner",   desc: "I collect food for people in need" },
    { value: "admin", label: "Admin", desc: "I manage the platform" },
  ];

  return (
    <div className="auth-shell">
      <div className="auth-panel auth-brand">
        <div className="auth-brand-content">
          <span style={{
            display: "inline-block", background: "rgba(76,175,125,0.2)",
            color: "var(--sprout)", padding: "6px 14px", borderRadius: 99,
            fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase", marginBottom: 20,
          }}>
            Join FoodConnect
          </span>
          <h2 className="auth-brand-headline">
            Every meal<br />
            <strong>rescued is a</strong><br />
            life touched.
          </h2>
          <p className="auth-brand-body">
            Whether you're a restaurant, caterer, household, or community organization — there's a role for you in the food rescue chain.
          </p>
        </div>
      </div>

      <div className="auth-panel" style={{ background: "var(--ivory)" }}>
        <div className="auth-form-wrap">
          <h2 className="auth-form-title">Create account</h2>
          <p className="auth-form-sub">
            Already have an account? <Link to="/login" className="auth-form-link">Sign in</Link>
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name} onChange={set("name")} placeholder="Your name or organisation" required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={form.password} onChange={set("password")} placeholder="At least 6 characters" required />
            </div>

            <div className="form-group">
              <label className="form-label">I am a…</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {roles.map(({ value, label, desc }) => (
                  <label
                    key={value}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 14px", borderRadius: "var(--radius-sm)",
                      border: `1.5px solid ${form.role === value ? "var(--leaf)" : "var(--border)"}`,
                      background: form.role === value ? "var(--mist)" : "var(--white)",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    <input type="radio" name="role" value={value} checked={form.role === value} onChange={set("role")} style={{ accentColor: "var(--leaf)" }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--forest)" }}>{label}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--slate)" }}>{desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {err && (
              <div style={{
                background: "var(--rose-lt)", color: "var(--rose)",
                padding: "10px 14px", borderRadius: "var(--radius-sm)", fontSize: "0.875rem",
              }}>
                {err}
              </div>
            )}

            <button className="btn btn-primary btn-lg btn-full" type="submit" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
