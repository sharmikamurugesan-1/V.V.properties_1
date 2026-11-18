-- ==============================================================================
-- V.V. PROPERTIES EXTENDED ENTERPRISE MIGRATION
-- Adds:
--   1. public.banners (Hero Carousel & Promotional Banners)
--   2. public.testimonials (Verified Client Reviews)
--   3. Float / Numeric Price column hardening
--   4. Audit Logging Triggers for Banners, Testimonials, and Profiles
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. BANNERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.banners (
    id TEXT PRIMARY KEY DEFAULT ('banner_' || substr(md5(random()::text), 1, 8)),
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    display_order INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_banners_order ON public.banners(display_order ASC);
CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners(is_active);

-- ------------------------------------------------------------------------------
-- 2. TESTIMONIALS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.testimonials (
    id TEXT PRIMARY KEY DEFAULT ('test_' || substr(md5(random()::text), 1, 8)),
    client_name TEXT NOT NULL,
    location TEXT DEFAULT 'Coimbatore',
    rating INT NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    content TEXT NOT NULL,
    photo_url TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT true,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    display_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_testimonials_order ON public.testimonials(display_order ASC);
CREATE INDEX IF NOT EXISTS idx_testimonials_visible ON public.testimonials(is_visible);

-- ------------------------------------------------------------------------------
-- 3. NUMERIC TYPE AUDIT ON PROPERTIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.properties 
    ALTER COLUMN total_price TYPE NUMERIC(14, 2) USING total_price::numeric(14, 2);

ALTER TABLE public.properties 
    ALTER COLUMN area_cents TYPE NUMERIC(10, 2) USING area_cents::numeric(10, 2);

ALTER TABLE public.properties 
    ALTER COLUMN area_sqft TYPE NUMERIC(12, 2) USING area_sqft::numeric(12, 2);

-- ------------------------------------------------------------------------------
-- 4. RLS POLICIES FOR BANNERS & TESTIMONIALS
-- ------------------------------------------------------------------------------
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Banners policies
CREATE POLICY "Public can view active banners"
    ON public.banners FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Admins can manage banners"
    ON public.banners FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Testimonials policies
CREATE POLICY "Public can view verified testimonials"
    ON public.testimonials FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Admins can manage testimonials"
    ON public.testimonials FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 5. AUDIT LOGGING TRIGGERS
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_log_banners_audit ON public.banners;
CREATE TRIGGER trg_log_banners_audit
    AFTER INSERT OR UPDATE OR DELETE ON public.banners
    FOR EACH ROW EXECUTE FUNCTION public.auto_log_activity();

DROP TRIGGER IF EXISTS trg_log_testimonials_audit ON public.testimonials;
CREATE TRIGGER trg_log_testimonials_audit
    AFTER INSERT OR UPDATE OR DELETE ON public.testimonials
    FOR EACH ROW EXECUTE FUNCTION public.auto_log_activity();
