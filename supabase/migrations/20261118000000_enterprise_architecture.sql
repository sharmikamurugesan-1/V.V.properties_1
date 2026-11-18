-- ==============================================================================
-- V.V. PROPERTIES ENTERPRISE DATABASE ARCHITECTURE (SUPABASE POSTGRESQL)
-- Version: 2.0.0
-- Modules:
--   1. Role-Based Access Control (RBAC) & Multi-Admin Security
--   2. Automated Site Visit & Appointment Scheduling System
--   3. AI Property Matchmaking & Metadata Engine
--   4. Lead Generation & Inquiry Pipeline
--   5. Immutable Activity & Audit Logging Engine
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. ENUMS & ROLES
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'super_admin',        -- Full platform control (e.g., Victor Paul)
        'portfolio_director', -- Inventory, agent assignments, lead oversight (e.g., Sharmika Murugesan)
        'agent',              -- Field property manager, assigned lead & visit handler
        'regular_user'        -- Prospective buyer / client
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE site_visit_status AS ENUM (
        'Pending',
        'Confirmed',
        'Rescheduled',
        'Completed',
        'Cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE inquiry_status AS ENUM (
        'New',
        'Contacted',
        'Visit Scheduled',
        'Negotiation',
        'Closed',
        'Archived'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE property_listing_status AS ENUM (
        'Available',
        'Fast Selling',
        'Selected Plots',
        'Ready to Construct',
        'Sold Out',
        'New Launch',
        'Draft'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 2. USER PROFILES TABLE (Linked with Supabase Auth)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'regular_user',
    designation TEXT,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ------------------------------------------------------------------------------
-- 3. PROPERTIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.properties (
    id TEXT PRIMARY KEY DEFAULT ('prop_' || substr(md5(random()::text), 1, 8)),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    project_title TEXT,
    project_slug TEXT,
    type TEXT NOT NULL DEFAULT 'Plot', -- Plot, Villa, Apartment, Farmland, Commercial
    location TEXT NOT NULL,
    corridor TEXT,
    price_per_cent NUMERIC(12, 2), -- in Lakhs or INR
    total_price NUMERIC(14, 2) NOT NULL, -- Total in Lakhs
    price_display TEXT, -- e.g., "₹1.25 Cr" or "₹45 Lakhs"
    area_cents NUMERIC(10, 2),
    area_sqft NUMERIC(12, 2),
    bedrooms INTEGER DEFAULT 0,
    bathrooms INTEGER DEFAULT 0,
    status property_listing_status NOT NULL DEFAULT 'Available',
    badge TEXT, -- Featured, Special Offer, New Launch, Hot Deal
    facing TEXT, -- North, East, South, West, North-East, etc.
    road_width_ft NUMERIC(6, 2) DEFAULT 30,
    approvals JSONB DEFAULT '["DTCP Approved", "RERA Registered"]'::jsonb,
    dtcp_number TEXT,
    rera_number TEXT,
    cover_image TEXT NOT NULL,
    gallery JSONB DEFAULT '[]'::jsonb,
    amenities JSONB DEFAULT '[]'::jsonb,
    highlights JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    ai_generated_summary TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties(location);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(total_price);
CREATE INDEX IF NOT EXISTS idx_properties_slug ON public.properties(slug);

-- ------------------------------------------------------------------------------
-- 4. SITE VISITS TABLE (Automated Appointment Booking)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id TEXT NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_email TEXT,
    agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    visit_date DATE NOT NULL,
    time_slot TEXT NOT NULL, -- e.g. "10:00 AM - 11:30 AM", "02:00 PM - 03:30 PM"
    status site_visit_status NOT NULL DEFAULT 'Pending',
    cab_required BOOLEAN NOT NULL DEFAULT false,
    pickup_location TEXT,
    notes TEXT,
    admin_feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT check_visit_future_or_today CHECK (visit_date >= CURRENT_DATE)
);

CREATE INDEX IF NOT EXISTS idx_site_visits_date ON public.site_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_site_visits_property ON public.site_visits(property_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_agent ON public.site_visits(agent_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_status ON public.site_visits(status);

-- ------------------------------------------------------------------------------
-- 5. INQUIRIES & LEAD PIPELINE TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id TEXT REFERENCES public.properties(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    inquiry_type TEXT NOT NULL DEFAULT 'general', -- general, site-visit, plot-reservation, brochure, cost-sheet
    budget_range TEXT,
    preferred_date DATE,
    preferred_time TEXT,
    need_cab_pickup BOOLEAN DEFAULT false,
    message TEXT,
    source TEXT NOT NULL DEFAULT 'Website Direct Form',
    status inquiry_status NOT NULL DEFAULT 'New',
    assigned_agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    admin_notes TEXT,
    whatsapp_click_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_agent ON public.inquiries(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_property ON public.inquiries(property_id);

-- ------------------------------------------------------------------------------
-- 6. IMMUTABLE ACTIVITY & AUDIT LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL DEFAULT 'System Action',
    user_role TEXT NOT NULL DEFAULT 'system',
    action TEXT NOT NULL, -- e.g. PROPERTY_CREATED, PROPERTY_DELETED, STATUS_CHANGED, VISIT_CONFIRMED
    entity_type TEXT NOT NULL, -- property, site_visit, inquiry, profile, system
    entity_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);

-- ------------------------------------------------------------------------------
-- 7. HELPER FUNCTIONS & TRIGGERS
-- ------------------------------------------------------------------------------

-- Helper: Get current authenticated user's role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Trigger: Automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_site_visits_updated_at
    BEFORE UPDATE ON public.site_visits
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_inquiries_updated_at
    BEFORE UPDATE ON public.inquiries
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger: Prevent Agent Double Booking for Site Visits
CREATE OR REPLACE FUNCTION public.check_site_visit_conflict()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if agent is already booked for this date and time slot
    IF NEW.agent_id IS NOT NULL AND NEW.status IN ('Pending', 'Confirmed') THEN
        IF EXISTS (
            SELECT 1 FROM public.site_visits
            WHERE agent_id = NEW.agent_id
              AND visit_date = NEW.visit_date
              AND time_slot = NEW.time_slot
              AND status IN ('Pending', 'Confirmed')
              AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        ) THEN
            RAISE EXCEPTION 'Agent is already scheduled for another site visit during the % slot on %.', NEW.time_slot, NEW.visit_date;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_check_visit_conflict
    BEFORE INSERT OR UPDATE OF agent_id, visit_date, time_slot, status ON public.site_visits
    FOR EACH ROW EXECUTE FUNCTION public.check_site_visit_conflict();

-- Trigger: Automatically log property, site visit, and lead mutations into activity_logs
CREATE OR REPLACE FUNCTION public.auto_log_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_user_name TEXT := 'Automated Trigger';
    v_user_role TEXT := 'system';
    v_action TEXT;
    v_entity_type TEXT := TG_TABLE_NAME;
    v_entity_id TEXT;
    v_details JSONB;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NOT NULL THEN
        SELECT full_name, role::text INTO v_user_name, v_user_role
        FROM public.profiles
        WHERE id = v_user_id;
    END IF;

    IF (TG_OP = 'INSERT') THEN
        v_action := TG_TABLE_NAME || '_CREATED';
        v_entity_id := NEW.id::text;
        v_details := to_jsonb(NEW);
    ELSIF (TG_OP = 'UPDATE') THEN
        v_action := TG_TABLE_NAME || '_UPDATED';
        v_entity_id := NEW.id::text;
        v_details := jsonb_build_object(
            'old', to_jsonb(OLD),
            'new', to_jsonb(NEW)
        );
    ELSIF (TG_OP = 'DELETE') THEN
        v_action := TG_TABLE_NAME || '_DELETED';
        v_entity_id := OLD.id::text;
        v_details := to_jsonb(OLD);
    END IF;

    INSERT INTO public.activity_logs (
        user_id,
        user_name,
        user_role,
        action,
        entity_type,
        entity_id,
        details
    ) VALUES (
        v_user_id,
        COALESCE(v_user_name, 'System'),
        COALESCE(v_user_role, 'system'),
        v_action,
        v_entity_type,
        v_entity_id,
        v_details
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_log_properties_audit
    AFTER INSERT OR UPDATE OR DELETE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION public.auto_log_activity();

CREATE OR REPLACE TRIGGER trg_log_site_visits_audit
    AFTER INSERT OR UPDATE OR DELETE ON public.site_visits
    FOR EACH ROW EXECUTE FUNCTION public.auto_log_activity();

CREATE OR REPLACE TRIGGER trg_log_inquiries_audit
    AFTER INSERT OR UPDATE OR DELETE ON public.inquiries
    FOR EACH ROW EXECUTE FUNCTION public.auto_log_activity();

-- Trigger: Automatically create Profile on auth.users Signup
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role user_role := 'regular_user';
    v_name TEXT;
BEGIN
    -- Derive assigned role from raw_user_meta_data if present
    IF NEW.raw_user_meta_data->>'role' = 'super_admin' THEN
        v_role := 'super_admin';
    ELSIF NEW.raw_user_meta_data->>'role' = 'portfolio_director' THEN
        v_role := 'portfolio_director';
    ELSIF NEW.raw_user_meta_data->>'role' = 'agent' THEN
        v_role := 'agent';
    END IF;

    -- Victor Paul default assignment
    IF lower(NEW.email) = 'victor@vvproperties.com' OR lower(NEW.email) = 'admin@vvproperties.com' THEN
        v_role := 'super_admin';
    END IF;

    -- Sharmika Murugesan default assignment
    IF lower(NEW.email) LIKE '%sharmika%' THEN
        v_role := 'portfolio_director';
    END IF;

    v_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        phone,
        role,
        avatar_url,
        designation
    ) VALUES (
        NEW.id,
        NEW.email,
        v_name,
        NEW.raw_user_meta_data->>'phone',
        v_role,
        NEW.raw_user_meta_data->>'avatar_url',
        CASE 
            WHEN v_role = 'super_admin' THEN 'Super Administrator'
            WHEN v_role = 'portfolio_director' THEN 'Portfolio Director'
            WHEN v_role = 'agent' THEN 'Property Consultant'
            ELSE 'Client Member'
        END
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ------------------------------------------------------------------------------
-- 8. AI PROPERTY MATCHMAKING STORED FUNCTION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.match_properties(
    p_min_budget NUMERIC DEFAULT NULL,
    p_max_budget NUMERIC DEFAULT NULL,
    p_preferred_location TEXT DEFAULT NULL,
    p_property_type TEXT DEFAULT NULL,
    p_min_bedrooms INTEGER DEFAULT NULL,
    p_limit INTEGER DEFAULT 6
)
RETURNS TABLE (
    id TEXT,
    title TEXT,
    slug TEXT,
    type TEXT,
    location TEXT,
    total_price NUMERIC,
    price_display TEXT,
    bedrooms INTEGER,
    status property_listing_status,
    cover_image TEXT,
    amenities JSONB,
    match_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.slug,
        p.type,
        p.location,
        p.total_price,
        p.price_display,
        p.bedrooms,
        p.status,
        p.cover_image,
        p.amenities,
        (
            -- Score calculation out of 100
            COALESCE(
                CASE 
                    -- Budget Match (40 pts)
                    WHEN p_min_budget IS NOT NULL AND p_max_budget IS NOT NULL AND p.total_price BETWEEN p_min_budget AND p_max_budget THEN 40
                    WHEN p_max_budget IS NOT NULL AND p.total_price <= p_max_budget THEN 35
                    WHEN p_max_budget IS NOT NULL AND p.total_price <= (p_max_budget * 1.15) THEN 20
                    ELSE 10
                END, 20
            ) +
            COALESCE(
                CASE 
                    -- Location Match (30 pts)
                    WHEN p_preferred_location IS NOT NULL AND (
                        p.location ILIKE ('%' || p_preferred_location || '%') OR 
                        p.corridor ILIKE ('%' || p_preferred_location || '%')
                    ) THEN 30
                    ELSE 0
                END, 0
            ) +
            COALESCE(
                CASE 
                    -- Property Type Match (20 pts)
                    WHEN p_property_type IS NOT NULL AND p.type ILIKE ('%' || p_property_type || '%') THEN 20
                    ELSE 5
                END, 5
            ) +
            COALESCE(
                CASE 
                    -- Bedroom Match (10 pts)
                    WHEN p_min_bedrooms IS NOT NULL AND p.bedrooms >= p_min_bedrooms THEN 10
                    WHEN p_min_bedrooms IS NULL THEN 10
                    ELSE 0
                END, 10
            )
        )::INTEGER AS match_score
    FROM public.properties p
    WHERE p.status IN ('Available', 'Fast Selling', 'Ready to Construct', 'New Launch')
    ORDER BY match_score DESC, p.is_featured DESC, p.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ---------------- PROFILES POLICIES ----------------
CREATE POLICY "Public profiles are readable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own personal profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Super Admins can manage all profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.current_user_role() = 'super_admin');

-- ---------------- PROPERTIES POLICIES ----------------
CREATE POLICY "Public properties read access"
    ON public.properties FOR SELECT
    TO public
    USING (status != 'Draft' OR public.current_user_role() IN ('super_admin', 'portfolio_director', 'agent'));

CREATE POLICY "Management can insert properties"
    ON public.properties FOR INSERT
    TO authenticated
    WITH CHECK (public.current_user_role() IN ('super_admin', 'portfolio_director'));

CREATE POLICY "Management can update properties"
    ON public.properties FOR UPDATE
    TO authenticated
    USING (public.current_user_role() IN ('super_admin', 'portfolio_director'))
    WITH CHECK (public.current_user_role() IN ('super_admin', 'portfolio_director'));

CREATE POLICY "Super Admin can delete properties"
    ON public.properties FOR DELETE
    TO authenticated
    USING (public.current_user_role() = 'super_admin');

-- ---------------- SITE VISITS POLICIES ----------------
CREATE POLICY "Users can view their own booked visits"
    ON public.site_visits FOR SELECT
    TO authenticated
    USING (
        client_id = auth.uid() OR
        agent_id = auth.uid() OR
        public.current_user_role() IN ('super_admin', 'portfolio_director')
    );

CREATE POLICY "Clients can book their own site visits"
    ON public.site_visits FOR INSERT
    TO authenticated
    WITH CHECK (client_id = auth.uid());

CREATE POLICY "Public can submit site visit request"
    ON public.site_visits FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Staff and client can update site visits"
    ON public.site_visits FOR UPDATE
    TO authenticated
    USING (
        public.current_user_role() IN ('super_admin', 'portfolio_director') OR
        agent_id = auth.uid() OR
        (client_id = auth.uid() AND status = 'Pending')
    )
    WITH CHECK (
        public.current_user_role() IN ('super_admin', 'portfolio_director') OR
        agent_id = auth.uid() OR
        (client_id = auth.uid() AND status = 'Cancelled')
    );

CREATE POLICY "Super Admin can delete site visits"
    ON public.site_visits FOR DELETE
    TO authenticated
    USING (public.current_user_role() = 'super_admin');

-- ---------------- INQUIRIES POLICIES ----------------
CREATE POLICY "Anyone can submit inquiries"
    ON public.inquiries FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Staff can view inquiries"
    ON public.inquiries FOR SELECT
    TO authenticated
    USING (
        public.current_user_role() IN ('super_admin', 'portfolio_director') OR
        assigned_agent_id = auth.uid()
    );

CREATE POLICY "Staff can update inquiries"
    ON public.inquiries FOR UPDATE
    TO authenticated
    USING (
        public.current_user_role() IN ('super_admin', 'portfolio_director') OR
        assigned_agent_id = auth.uid()
    );

CREATE POLICY "Super Admin can delete inquiries"
    ON public.inquiries FOR DELETE
    TO authenticated
    USING (public.current_user_role() = 'super_admin');

-- ---------------- ACTIVITY LOGS POLICIES ----------------
CREATE POLICY "Only executive leadership can view activity logs"
    ON public.activity_logs FOR SELECT
    TO authenticated
    USING (public.current_user_role() IN ('super_admin', 'portfolio_director'));

CREATE POLICY "Activity logs are append-only"
    ON public.activity_logs FOR INSERT
    TO authenticated
    WITH CHECK (public.current_user_role() IN ('super_admin', 'portfolio_director', 'agent'));

-- Disallow manual UPDATE or DELETE on activity logs (Immutable Audit Trail)
CREATE POLICY "Disallow activity log updates"
    ON public.activity_logs FOR UPDATE
    TO public
    USING (false);

CREATE POLICY "Disallow activity log deletions"
    ON public.activity_logs FOR DELETE
    TO public
    USING (false);

-- ------------------------------------------------------------------------------
-- 10. INITIAL SEEDING (Idempotent Default Records)
-- ------------------------------------------------------------------------------
INSERT INTO public.properties (
    id, title, slug, project_title, type, location, corridor, 
    total_price, price_display, area_cents, area_sqft, bedrooms, 
    status, badge, cover_image, description
) VALUES 
(
    'prop_001',
    'Garden County Phase II - Luxury Plotted Enclave',
    'garden-county-phase-2-medavakkam',
    'Garden County',
    'Plot',
    'Medavakkam, Chennai',
    'OMR-Medavakkam Link',
    125.00,
    '₹1.25 Cr',
    5.5,
    2400,
    0,
    'Fast Selling',
    'Special Offer',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200',
    'DTCP & RERA approved premium residential plots featuring blacktop roads, underground cabling, and landscaped avenues.'
),
(
    'prop_002',
    'The Azure Crown - Beachfront Signature Villa',
    'the-azure-crown-beachfront-ecr',
    'The Azure Crown',
    'Villa',
    'ECR, Chennai',
    'East Coast Road Luxury Belt',
    480.00,
    '₹4.80 Cr',
    8.2,
    4500,
    4,
    'Available',
    'Featured',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1200',
    'Architectural masterpiece with panoramic Bay of Bengal vistas, private infinity plunge pool, and bespoke Italian marble finishes.'
),
(
    'prop_003',
    'Tech Valley Executive Suites & Smart Residences',
    'tech-valley-executive-suites-guindy',
    'Tech Valley',
    'Apartment',
    'Guindy, Chennai',
    'Mount Poonamallee Corridor',
    165.00,
    '₹1.65 Cr',
    0.0,
    1850,
    3,
    'New Launch',
    'New Launch',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1200',
    'Sophisticated high-rise residence walking distance from Olympia Tech Park with EV charging bays and clubhouse access.'
)
ON CONFLICT (id) DO NOTHING;
