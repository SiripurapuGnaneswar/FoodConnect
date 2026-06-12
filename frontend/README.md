# FoodConnect Frontend

A full React frontend for the FoodConnect food rescue platform, wired to all backend controllers.

## Project Structure

```
src/
├── api/
│   └── index.js              ← All API calls (auth, donations, requests)
├── context/
│   └── AuthContext.jsx       ← JWT auth state, login/register/logout
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.jsx
│   ├── layout/
│   │   ├── Sidebar.jsx       ← Role-aware navigation
│   │   └── AppLayout.jsx
│   └── donations/
│       ├── DonationCard.jsx  ← Freshness meter, CRUD actions
│       └── DonationFormModal.jsx
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── DashboardPage.jsx     ← Stats + recent activity
│   ├── DonationsPage.jsx     ← Browse, filter, CRUD
│   ├── RequestsPage.jsx      ← NGO requests + donor accept
│   └── MapSearchPage.jsx     ← Leaflet map, GPS, radius search
├── App.jsx                   ← Routes
├── index.js
└── index.css                 ← Design tokens + all styles
```

## Backend API Coverage

| Controller         | Endpoint                        | Frontend              |
|--------------------|---------------------------------|------------------------|
| authController     | POST /auth/register             | RegisterPage           |
| authController     | POST /auth/login                | LoginPage              |
| donationController | GET  /donations                 | DonationsPage, Map     |
| donationController | POST /donations                 | DonationFormModal      |
| donationController | GET  /donations/:id             | DonationCard           |
| donationController | PUT  /donations/:id             | DonationFormModal      |
| donationController | DELETE /donations/:id           | DonationCard           |
| donationController | PUT  /donations/:id/status      | DonationCard dropdown  |
| requestController  | GET  /requests                  | RequestsPage           |
| requestController  | POST /requests                  | DonationCard + Map     |
| requestController  | PUT  /requests/:id/accept       | RequestsPage           |

## Setup

```bash
cd foodconnect
cp .env.example .env          # set REACT_APP_API_URL
npm install
npm start
```

## Map Search Features

- **GPS** — uses browser Geolocation API
- **Search by name** — geocodes via OpenStreetMap Nominatim
- **Click to pin** — click anywhere on the map to set search centre  
- **Radius slider** — 1–100 km adjustable search radius
- **Live radius circle** — visual overlay on map
- **Status filter** — filter markers by donation status
- **Colour-coded markers** — green=Available, amber=Requested, blue=Accepted, purple=Picked Up, grey=Delivered
- **Popup with Request button** — NGOs can request directly from the map popup
- **Sorted results table** — below the map, sorted by distance

## Role-Based Access

| Feature              | Donor | NGO | Admin |
|----------------------|-------|-----|-------|
| Post donation        | ✅    | ❌  | ✅    |
| Edit/delete donation | own   | ❌  | ✅    |
| Update status        | own   | ❌  | ✅    |
| Request pickup       | ❌    | ✅  | ❌    |
| Accept request       | ✅    | ❌  | ✅    |

## Design System

- **Palette:** Deep forest green (#0F2D1F) + warm ivory (#F9F7F2) + sprout (#4CAF7D)
- **Fonts:** Fraunces (display) + DM Sans (UI)
- **Signature:** Donation freshness meter — a 4px colour bar that shifts from green → amber → red as expiry approaches
