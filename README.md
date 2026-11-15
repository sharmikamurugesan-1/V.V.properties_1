<div align="center">

  <img src="public/logo.png" alt="V.V Properties Logo" width="120" height="120" style="border-radius: 24px; box-shadow: 0 12px 30px rgba(13,2,33,0.18);" />

  # V.V PROPERTIES
  ### Enterprise Luxury Real Estate Platform & Executive Management Suite

  [![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
  [![Framer Motion](https://img.shields.io/badge/Framer_Motion-11.11-FF0055?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
  [![License](https://img.shields.io/badge/License-Proprietary-0D0221?style=for-the-badge)](LICENSE)

  <p align="center">
    <b>An enterprise-grade, full-stack digital real estate ecosystem delivering ultra-luxury residential showcases, image-first listing architectures, interactive plot exploration, instant WhatsApp lead conversion, and an executive administration portal.</b>
  </p>

  [Live Platform Demo](http://localhost:3000) • [System Architecture](#-system-architecture) • [Core Capabilities](#-core-platform-capabilities) • [API Specification](#-rest-api-specification) • [Local Deployment](#-quickstart--local-development)

</div>

---

## 🌟 Executive Overview

**V.V Properties** is a comprehensive, production-grade digital real estate platform engineered specifically for high-value residential, beachfront villa, gated community, and prime commercial portfolios across Chennai, Coimbatore, and South India.

Built on **Next.js 14 App Router**, **TypeScript**, and **Tailwind CSS**, the platform merges high-touch buyer experiences with a data-driven administrative command center designed for real estate developers, brokers, and enterprise realty teams.

---

## 🏛️ System Architecture

```mermaid
graph TD
    A[V.V Properties Enterprise Core] --> B[Public Client Experience]
    A --> C[Executive Admin Portal]
    A --> D[Next.js Serverless Backend]

    B --> B1[Luxury Property Showcase]
    B --> B2[Dynamic Filtering & Search Engine]
    B --> B3[Mortgage & EMI Affordability Calculator]
    B --> B4[Direct WhatsApp Lead Dispatch]

    C --> C1[Executive Performance Analytics Engine]
    C --> C2[Image-First Property Management]
    C --> C3[Hero Carousel Slide Studio]
    C --> C4[Customer Enquiry Verification CRM]
    C --> C5[Activity Audit Logs & Admin Security]

    D --> D1[/api/properties - Listing Data]
    D --> D2[/api/leads - Enquiry Pipeline]
    D --> D3[/api/banners - Carousel Data]
    D --> D4[/api/analytics/traffic - Historical Visits]
```

---

## 💎 Core Platform Capabilities

### 1. 🏡 Image-First Property Portfolio
* **Clean, Uncluttered Visual Design**: Zero bottom card body or redundant action bars. Each listing is presented as a medium-height, proportional architectural showcase (`h-56` / `224px`).
* **Tactile Pointer Overlay**: Hovering or tapping any property triggers a smooth dark-gradient overlay revealing:
  * Property Title & Location with pin indicator
  * Package Price & Unit Rate (`₹ L / Cent` or `₹ L / Sq.ft`)
  * Configuration details (e.g. `Apartment · 2 BHK`, `Villa · 4 BHK`, `Residential Plot`)
  * Verified Government Compliance Badges (`DTCP Approved`, `CMDA Registered`, `New Launch`, `Special Offer`)
* **Contextual 3-Dots Action Menu (`⋮`)**:
  * ✏️ **Edit**: Direct modal access to update pricing, specifications, and media.
  * 🏷️ **Rename**: In-place real-time title renaming.
  * 🗑️ **Delete**: Confirmed listing deletion with real-time portfolio counter updates.
* **Anti-Autofill Protection**: Integrated `autocomplete="new-password"` and `data-lpignore="true"` attributes to prevent unwanted browser credential popups in search toolbars.

### 2. 🎯 Customer Enquiry & Lead Verification CRM
* **Real-Time Lead Tracking**: Tracks submissions categorized by lead status (`New`, `Contacted`, `Closed`).
* **1-Click WhatsApp Direct Dispatch**: Automatically parses phone numbers into standard international formats to launch pre-filled WhatsApp conversations with customer context and interested property details.
* **Customer Dossier Drawer**: Slide-out drawer with contact info, timestamp, property preference, and full message history.
* **CSV Export**: Instant export of verified leads for external CRM ingestion (Salesforce, HubSpot, Zoho).

### 3. 🖼️ Homepage Carousel & Banner Studio
* **Multi-Banner Repository**: Stores and manages up to 10 high-resolution carousel slides (defaulting to 5 curated luxury campaigns across ECR, OMR, Medavakkam, and Tambaram).
* **Direct Deactivation / Activation**: Instant toggling of banner visibility with clean status feedback.
* **Streamlined UI**: Completely uncluttered presentation without redundant "Active / Inactive" text badges.

### 4. 📊 Website Trafficking Analytics & Dynamic Date Horizons
* **Dynamic Date Horizons**: Interactive SVG analytics visualizing trends across `24 Hours`, `1 Week`, `1 Month`, `3 Months`, `6 Months`, `1 Year`, and `MAX` (all-time portfolio lifetime).
* **Anchor-Based 5-Point Date Milestones**: Automatically calculates 5 milestone dates (`DD/MM`) anchored to the active date (`14/11/2026`):
  * **1 Month (`1M`)**: Spans `14/10` to `14/11` (`14/10`, `22/10`, `30/10`, `07/11`, `14/11`).
  * **1 Week (`1W`)**: Spans `07/11` to `14/11` without day-of-week abbreviations.
  * **3 Months (`3M`)**: Spans `14/08` to `14/11`.
* **Dense Bezier Curve**: 15–20 undulating data points rendering real-time website outreach velocity without bottom caption clutter.
* **Custom Calendar Picker**: Integrated native HTML5 date picker for arbitrary start and end date ranges.

### 5. 🗄️ Centralized Catalog & Cross-Computer Sync
* **Persistent Portfolio Store**: All properties, cover images, descriptions, and gallery images are preserved in `vv_properties_catalog`.
* **1-Click JSON Backup & Import**: Download `vv_properties_catalog.json` and seamlessly load it on any other machine or deployment environment.
* **Apt Line Icons for Amenities**: Each facility (Bedrooms, Swimming Pool, Clubhouse & Gym, 24/7 Security, Covered Parking, Private Garden, Power Backup, Elevator, Water Supply, CCTV, Play Area, EV Charging) renders with its dedicated Lucide line icon.

### 6. 🛡️ Admin Security, Eye Toggle & Avatar Sync
* **Password Visibility Toggle**: Interactive eye icon (`👁` / `eye-off`) for seamless credential inspection.
* **Persistent Avatar Header Sync**: Uploaded administrator photos persist in `vv_admin_avatar` and immediately synchronize with the top-right header avatar and sidebar across all pages.
* **Exact Date & Time Audit Trail**: Activity logs record exact timestamps (e.g. `14 Nov 2026, 10:45:12 PM`) with attribution for all team members (`Victor Paul`, `Saran`, `Vibhkar`, `Umeshwar`, `Sharmika`).

---

## 🎨 Design Philosophy & Brand Palette

The user interface follows a modern luxury aesthetic powered by **Plus Jakarta Sans** and **Inter** typography, avoiding generic AI-generated templates:

| Color Role | Hex Value | Application |
| :--- | :--- | :--- |
| **Deep Executive Navy** | `#0D0221` | Contrast, authority, sidebar canvas, overlay depth |
| **Brand Royal Blue** | `#4062BB` | Primary CTAs, active states, focus indicators |
| **Crystal Ice Blue** | `#CDE6F5` | Subtle tags, pill borders, secondary badges |
| **Pure White** | `#FFFFFF` | Base canvas for dashboards, tables, and cards |
| **Subtle Slate** | `#E2E8F0` | Razor-sharp, clean enterprise dividing borders |
| **Emerald Green** | `#10B981` | Online indicators, published state, positive trends |
| **Coral Red** | `#EF4444` | High-priority leads, closed status, delete actions |

---

## 🛠️ Tech Stack & Dependencies

```json
{
  "framework": "Next.js 14.2 (App Router)",
  "language": "TypeScript 5.6",
  "styling": "Tailwind CSS 3.4 + PostCSS",
  "icons": "Lucide React (lucide-react & unpkg)",
  "animations": "Framer Motion 11.11 & GSAP 3.12",
  "smooth_scroll": "Lenis 1.1",
  "forms_validation": "React Hook Form 7.53 + Zod 3.23"
}
```

---

## 🚀 Quickstart & Local Development

### Prerequisites
* **Node.js**: `v18.18.0` or higher
* **npm** or **yarn** or **pnpm**
* **Git**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/sharmikamurugesan-1/v.v-properties.git
cd v.v-properties

# 2. Install dependencies
npm install

# 3. Launch development server
npm run dev

# 4. Or build and run production server
npm run build
npm run start -p 3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 REST API Specification

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/properties` | `GET` | Retrieve all active and draft property listings |
| `/api/properties` | `POST` | Create a new property record |
| `/api/leads` | `GET` | List customer enquiries with status filters |
| `/api/leads` | `PATCH` | Update lead status (`New` → `Contacted` → `Closed`) |
| `/api/banners` | `GET` | Retrieve carousel banners and active display order |
| `/api/analytics/traffic` | `GET` | Query historical traffic visits (`?range=1W\|1M\|3M\|6M\|1Y`) |
| `/api/admin/profile` | `GET` | Fetch administrator credentials and preferences |

---

## 📁 Repository Structure

```
vv-properties/
├── public/
│   ├── brand/               # Brand imagery and logo assets
│   ├── uploads/             # User-uploaded property galleries
│   ├── logo.png             # Official circular high-rise emblem
│   ├── index.html           # Standalone Executive Admin Suite
│   └── admin.html           # Synchronized admin portal
├── src/
│   ├── app/
│   │   ├── admin/           # Admin route handler & security wrapper
│   │   ├── api/             # Next.js Serverless API routes
│   │   ├── properties/      # Public property portfolio catalog
│   │   ├── layout.tsx       # Root layout with metadata and fonts
│   │   ├── page.tsx         # Portal entrypoint
│   │   └── globals.css      # Core Tailwind styling & tokens
│   ├── components/
│   │   ├── layout/          # Navbar, Footer, Drawers
│   │   ├── properties/      # PropertyCard (Image-first with overlay)
│   │   └── ui/              # Buttons, Badges, Modals
│   ├── data/                # Data stores (mockData, translations)
│   ├── types/               # TypeScript interfaces & schemas
│   └── lib/                 # Utility functions & WhatsApp formatters
├── data/                    # JSON persistent stores (banners, leads, props)
├── tailwind.config.ts       # Design system tokens and palette
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and build scripts
```

---

## 🔒 Security & Best Practices

- **Zero Inline Passwords**: Credentials are encrypted with secure session storage.
- **Strict Input Sanitization**: Form inputs are validated with Zod schemas to mitigate XSS vulnerabilities.
- **Autofill Mitigation**: Search components are protected against aggressive browser password managers.
- **Responsive Architecture**: Tested across mobile (390px), tablet (768px), and wide monitors (1600px+).

---

## 📄 License & Attribution

Copyright © 2026 **V.V Properties**. All rights reserved.  
Designed and engineered for enterprise real estate asset management.
