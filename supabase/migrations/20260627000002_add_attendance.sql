-- ============================================================
-- Migration: Add Attendance Logs Table + RLS Policies
-- ============================================================

CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    clock_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    clock_out TIMESTAMPTZ,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location_name TEXT,
    total_hours NUMERIC(5, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ BEGIN
    -- Read policy: User's own logs OR Managers/Admins in the organization
    CREATE POLICY "attendance_read" ON public.attendance_logs
        FOR SELECT USING (
            user_id = auth.uid() OR
            get_org_role(organization_id) IN ('super_admin', 'admin', 'manager')
        );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    -- Write policy: Only the user can clock in/out for themselves
    CREATE POLICY "attendance_insert" ON public.attendance_logs
        FOR INSERT WITH CHECK (
            user_id = auth.uid()
        );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    -- Update policy: Only the user can update their clock_out
    CREATE POLICY "attendance_update" ON public.attendance_logs
        FOR UPDATE USING (
            user_id = auth.uid()
        );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    -- Delete policy: Admins/Managers only
    CREATE POLICY "attendance_delete" ON public.attendance_logs
        FOR DELETE USING (
            get_org_role(organization_id) IN ('super_admin', 'admin', 'manager')
        );
EXCEPTION WHEN duplicate_object THEN null; END $$;
