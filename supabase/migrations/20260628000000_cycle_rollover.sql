-- ============================================================
-- Migration: Cycle Rollover Helpers
-- Adds pgplsql function to roll over active tasks from one cycle to another
-- ============================================================

CREATE OR REPLACE FUNCTION public.rollover_cycle_tasks(from_cycle_id UUID, to_cycle_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.issues
    SET cycle_id = to_cycle_id,
        updated_at = NOW()
    WHERE cycle_id = from_cycle_id
      AND status NOT IN ('Done', 'Cancelled');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
