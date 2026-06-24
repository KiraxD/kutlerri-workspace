-- ============================================================
-- Migration: Add Stories layer + Enrich all hierarchy levels
-- Hierarchy: Initiative → Epic → Story → Task → Sub Task
-- ============================================================

-- Step 1: New work_priority enum (clean display values)
-- Used by stories, and for enriching initiatives/epics
DO $$ BEGIN
    CREATE TYPE work_priority AS ENUM ('None', 'Low', 'Medium', 'High', 'Urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create stories table
CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    epic_id UUID REFERENCES epics(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status task_status DEFAULT 'Backlog',
    priority work_priority DEFAULT 'None',
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    start_date TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    estimate INTEGER,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 3: Enrich initiatives table
ALTER TABLE initiatives
    ADD COLUMN IF NOT EXISTS priority work_priority DEFAULT 'None',
    ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);

-- Step 4: Enrich epics table
ALTER TABLE epics
    ADD COLUMN IF NOT EXISTS priority work_priority DEFAULT 'None',
    ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);

-- Step 5: Enrich tasks table — add story_id + date/progress fields
ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);

-- Step 6: Enrich sub_tasks table
ALTER TABLE sub_tasks
    ADD COLUMN IF NOT EXISTS priority work_priority DEFAULT 'None',
    ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Step 7: Enable RLS on stories
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Step 8: RLS Policies for stories (org-scoped, same pattern as initiatives/epics)
DO $$ BEGIN
    -- Story read: any org member
    CREATE POLICY "story_read" ON stories 
        FOR SELECT USING (get_org_role(organization_id) IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    -- Story insert: manager+
    CREATE POLICY "story_insert" ON stories 
        FOR INSERT WITH CHECK (get_org_role(organization_id) IN ('super_admin', 'admin', 'manager', 'employee'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    -- Story update: manager+
    CREATE POLICY "story_update" ON stories 
        FOR UPDATE USING (get_org_role(organization_id) IN ('super_admin', 'admin', 'manager', 'employee'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    -- Story delete: admin+
    CREATE POLICY "story_delete" ON stories 
        FOR DELETE USING (get_org_role(organization_id) IN ('super_admin', 'admin', 'manager'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Step 9: Progress calculation functions

-- Function: Update story progress from sub_tasks → tasks → story
CREATE OR REPLACE FUNCTION update_task_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_task_id UUID;
    v_total INTEGER;
    v_done INTEGER;
    v_progress INTEGER;
BEGIN
    -- Determine which task to update
    IF TG_OP = 'DELETE' THEN
        v_task_id := OLD.task_id;
    ELSE
        v_task_id := NEW.task_id;
    END IF;

    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'Done')
    INTO v_total, v_done
    FROM sub_tasks
    WHERE task_id = v_task_id;

    IF v_total > 0 THEN
        v_progress := ROUND((v_done::NUMERIC / v_total::NUMERIC) * 100);
    ELSE
        v_progress := 0;
    END IF;

    UPDATE tasks SET progress = v_progress, updated_at = NOW()
    WHERE id = v_task_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_task_progress ON sub_tasks;
CREATE TRIGGER trg_update_task_progress
AFTER INSERT OR UPDATE OF status OR DELETE ON sub_tasks
FOR EACH ROW EXECUTE FUNCTION update_task_progress();

-- Function: Update story progress from tasks
CREATE OR REPLACE FUNCTION update_story_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_story_id UUID;
    v_total INTEGER;
    v_done INTEGER;
    v_progress INTEGER;
BEGIN
    -- Determine story_id to update
    v_story_id := COALESCE(NEW.story_id, OLD.story_id);
    IF v_story_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'Done')
    INTO v_total, v_done
    FROM tasks
    WHERE story_id = v_story_id;

    IF v_total > 0 THEN
        v_progress := ROUND((v_done::NUMERIC / v_total::NUMERIC) * 100);
    ELSE
        v_progress := 0;
    END IF;

    UPDATE stories SET progress = v_progress, updated_at = NOW()
    WHERE id = v_story_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_story_progress ON tasks;
CREATE TRIGGER trg_update_story_progress
AFTER INSERT OR UPDATE OF status, story_id OR DELETE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_story_progress();

-- Function: Update epic progress from stories
CREATE OR REPLACE FUNCTION update_epic_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_epic_id UUID;
    v_total INTEGER;
    v_done INTEGER;
    v_progress INTEGER;
BEGIN
    v_epic_id := COALESCE(NEW.epic_id, OLD.epic_id);
    IF v_epic_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'Done')
    INTO v_total, v_done
    FROM stories
    WHERE epic_id = v_epic_id;

    IF v_total > 0 THEN
        v_progress := ROUND((v_done::NUMERIC / v_total::NUMERIC) * 100);
    ELSE
        v_progress := 0;
    END IF;

    UPDATE epics SET progress = v_progress, updated_at = NOW()
    WHERE id = v_epic_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_epic_progress ON stories;
CREATE TRIGGER trg_update_epic_progress
AFTER INSERT OR UPDATE OF status, epic_id OR DELETE ON stories
FOR EACH ROW EXECUTE FUNCTION update_epic_progress();

-- Function: Update initiative progress from epics
CREATE OR REPLACE FUNCTION update_initiative_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_initiative_id UUID;
    v_total INTEGER;
    v_done INTEGER;
    v_progress INTEGER;
BEGIN
    v_initiative_id := COALESCE(NEW.initiative_id, OLD.initiative_id);
    IF v_initiative_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'Done')
    INTO v_total, v_done
    FROM epics
    WHERE initiative_id = v_initiative_id;

    IF v_total > 0 THEN
        v_progress := ROUND((v_done::NUMERIC / v_total::NUMERIC) * 100);
    ELSE
        v_progress := 0;
    END IF;

    UPDATE initiatives SET progress = v_progress, updated_at = NOW()
    WHERE id = v_initiative_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_initiative_progress ON epics;
CREATE TRIGGER trg_update_initiative_progress
AFTER INSERT OR UPDATE OF status, initiative_id OR DELETE ON epics
FOR EACH ROW EXECUTE FUNCTION update_initiative_progress();

-- Step 10: Auto-set completed_at on sub_tasks when status → Done
CREATE OR REPLACE FUNCTION set_subtask_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Done' AND OLD.status != 'Done' THEN
        NEW.completed_at := NOW();
    ELSIF NEW.status != 'Done' THEN
        NEW.completed_at := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_subtask_completed_at ON sub_tasks;
CREATE TRIGGER trg_subtask_completed_at
BEFORE UPDATE OF status ON sub_tasks
FOR EACH ROW EXECUTE FUNCTION set_subtask_completed_at();
