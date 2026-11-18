# V.V. Properties — Supabase Enterprise Backend Integration Guide

This directory contains the production-grade PostgreSQL migration scripts and schema definitions for the **V.V. Properties Platform** (`https://v-v-properties-1.onrender.com`).

---

## 1. Architecture Overview

| Module | Core Database Artifacts | Primary Access / Enforcement |
| :--- | :--- | :--- |
| **RBAC Security** | `user_role` enum, `profiles` table, `current_user_role()` | Supabase Auth + Row Level Security (RLS) |
| **Site Visits** | `site_visits` table, `check_site_visit_conflict()` trigger | Automated conflict prevention & appointment tracking |
| **AI Matchmaking** | `match_properties()` RPC function, `ai_embedding` support | Weighted preference scoring (budget, location, bedrooms) |
| **Lead Generation** | `inquiries` table, Dynamic WhatsApp URL generator | Structured lead capture + instant Click-to-Chat routing |
| **Audit Logging** | `activity_logs` table, `auto_log_activity()` trigger | Tamper-proof, append-only security audit trail |

---

## 2. Applying the Migration

### Option A: Via the Supabase Cloud Console (Fastest)
1. Navigate to your Supabase Project: **[https://supabase.com/dashboard](https://supabase.com/dashboard)**.
2. In the left navigation, click on the **SQL Editor** tab.
3. Open `supabase/migrations/20261118000000_enterprise_architecture.sql`.
4. Paste the entire SQL script into the query editor and click **Run**.
5. All tables, custom types, triggers, stored functions, and RLS policies will be created immediately.

### Option B: Via the Supabase CLI
```bash
# Link your project
supabase link --project-ref <your-project-ref>

# Run migrations
supabase db push
```

---

## 3. Environment Variables Configuration

In Render or your local `.env.local`, set the following keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
NEXT_PUBLIC_WHATSAPP_NUMBER=919840012345
```

---

## 4. Role-Based Access Control (RBAC) Structure

The system recognizes four distinct hierarchical roles:

1. **`super_admin` (e.g., Victor Paul)**
   - Complete platform control.
   - Can promote/demote user roles, delete property listings, and review full immutable audit logs.
2. **`portfolio_director` (e.g., Sharmika Murugesan)**
   - Directs inventory, creates/updates listings, and oversees the lead pipeline.
   - Assigns field agents to inquiries and site visit bookings.
3. **`agent` (Property Consultant)**
   - Field view restricted strictly to their assigned leads and escorted site visit appointments.
4. **`regular_user` (Client / Prospective Buyer)**
   - Public listing explorer, submits site visits, and communicates directly over WhatsApp.

### Seeding Administrators
When Victor Paul or Sharmika Murugesan registers via Supabase Auth:
- `victor@vvproperties.com` or `admin@vvproperties.com` is automatically provisioned as `super_admin`.
- Any email matching `sharmika` (e.g. `sharmika@vvproperties.com`) is automatically provisioned as `portfolio_director`.
- Other signups default to `regular_user`.

To manually promote an existing profile via SQL:
```sql
UPDATE public.profiles
SET role = 'super_admin'
WHERE email = 'victor@vvproperties.com';

UPDATE public.profiles
SET role = 'portfolio_director'
WHERE email = 'sharmika@vvproperties.com';
```

---

## 5. API Endpoints Reference

### Site Visits (`/api/site-visits`)
- **`GET /api/site-visits`**: Fetches appointments (filtered by current user role).
- **`POST /api/site-visits`**: Books an appointment with agent conflict checking.
  ```json
  {
    "propertyId": "prop_001",
    "clientName": "Suresh Kumar",
    "clientPhone": "9840123456",
    "clientEmail": "suresh@example.com",
    "visitDate": "2026-11-25",
    "timeSlot": "10:00 AM - 11:30 AM",
    "cabRequired": true,
    "pickupLocation": "Adyar, Chennai"
  }
  ```
- **`PATCH /api/site-visits`**: Updates status (`Confirmed`, `Completed`, `Cancelled`) or assigns an agent.

### AI Property Matchmaking (`/api/ai/matchmaking`)
- **`POST /api/ai/matchmaking`**: Evaluates preferences against listings and returns match score:
  ```json
  {
    "minBudget": 80,
    "maxBudget": 200,
    "preferredLocation": "Medavakkam",
    "propertyType": "Plot",
    "minBedrooms": 0,
    "limit": 5
  }
  ```

### AI Description Generator (`/api/ai/generate-description`)
- **`POST /api/ai/generate-description`**: Generates high-converting editorial copy, elevator pitch, investment thesis, and WhatsApp snippets.
  ```json
  {
    "title": "The Azure Crown",
    "location": "ECR, Chennai",
    "corridor": "East Coast Road Luxury Belt",
    "propertyType": "Villa",
    "bedrooms": 4,
    "areaSqft": 4500,
    "priceDisplay": "₹4.80 Cr",
    "amenities": ["Infinity Pool", "Private Beach Access", "Home Automation"]
  }
  ```

### Inquiries & Leads Pipeline (`/api/inquiries`)
- **`POST /api/inquiries`**: Records leads with property context and triggers notifications.
- **`PATCH /api/inquiries`**: Updates pipeline status (`New` → `Contacted` → `Visit Scheduled` → `Closed`).

### Activity & Audit Logs (`/api/audit-logs`)
- **`GET /api/audit-logs`**: Restricted strictly to Super Admin and Portfolio Director.
