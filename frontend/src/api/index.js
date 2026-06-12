import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || " https://foodconnect-ge8s.onrender.com/api";

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fc_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("fc_token");
      localStorage.removeItem("fc_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
};

// ── Donations ─────────────────────────────────────────────────────────────────
export const donationsAPI = {
  getAll: () => api.get("/donations"),
  getById: (id) => api.get(`/donations/${id}`),
  create: (data) => api.post("/donations", data),
  update: (id, data) => api.put(`/donations/${id}`, data),
  delete: (id) => api.delete(`/donations/${id}`),
  updateStatus: (id, status) => api.put(`/donations/${id}/status`, { status }),
};

// ── Requests ──────────────────────────────────────────────────────────────────
export const requestsAPI = {
  getAll: () => api.get("/requests"),
  create: (donationId) => api.post("/requests", { donationId }),
  accept: (id) => api.put(`/requests/${id}/accept`),
};

export default api;
