-- 1. Helper function for task progress (triggered by sub_tasks status change)
CREATE OR REPLACE FUNCTION public.update_task_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_task_id UUID;
    v_total INTEGER;
    v_done INTEGER;
    v_progress INTEGER;
    v_status TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_task_id := OLD.task_id;
    ELSE
        v_task_id := NEW.task_id;
    END IF;

    IF v_task_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'Done')
    INTO v_total, v_done
    FROM public.sub_tasks
    WHERE task_id = v_task_id;

    IF v_total > 0 THEN
        v_progress := ROUND((v_done::NUMERIC / v_total::NUMERIC) * 100);
    ELSE
        SELECT status INTO v_status FROM public.tasks WHERE id = v_task_id;
        IF v_status = 'Done' THEN
            v_progress := 100;
        ELSIF v_status IN ('In Progress', 'Review', 'Testing') THEN
            v_progress := 50;
        ELSE
            v_progress := 0;
        END IF;
    END IF;

    UPDATE public.tasks SET progress = v_progress, updated_at = NOW()
    WHERE id = v_task_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger function on tasks to set its own progress BEFORE insert/update of status if no subtasks
CREATE OR REPLACE FUNCTION public.handle_task_status_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_has_subtasks BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM public.sub_tasks WHERE task_id = NEW.id) INTO v_has_subtasks;
    IF NOT v_has_subtasks THEN
        IF NEW.status = 'Done' THEN
            NEW.progress := 100;
        ELSIF NEW.status IN ('In Progress', 'Review', 'Testing') THEN
            NEW.progress := 50;
        ELSE
            NEW.progress := 0;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_handle_task_status_progress ON public.tasks;
CREATE TRIGGER trg_handle_task_status_progress
BEFORE INSERT OR UPDATE OF status ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.handle_task_status_progress();


-- 3. Update story progress: average progress of tasks, or fallback to status if no tasks
CREATE OR REPLACE FUNCTION public.update_story_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_story_id UUID;
    v_total INTEGER;
    v_avg_progress NUMERIC;
    v_progress INTEGER;
    v_status TEXT;
BEGIN
    v_story_id := COALESCE(NEW.story_id, OLD.story_id);
    IF v_story_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

    SELECT COUNT(*), COALESCE(AVG(COALESCE(progress, 0)), 0)
    INTO v_total, v_avg_progress
    FROM public.tasks
    WHERE story_id = v_story_id;

    IF v_total > 0 THEN
        v_progress := ROUND(v_avg_progress);
    ELSE
        SELECT status INTO v_status FROM public.stories WHERE id = v_story_id;
        IF v_status = 'Done' THEN
            v_progress := 100;
        ELSIF v_status IN ('In Progress', 'Review', 'Testing') THEN
            v_progress := 50;
        ELSE
            v_progress := 0;
        END IF;
    END If;

    UPDATE public.stories SET progress = v_progress, updated_at = NOW()
    WHERE id = v_story_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger function on stories to set its own progress BEFORE insert/update of status if no tasks
CREATE OR REPLACE FUNCTION public.handle_story_status_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_has_tasks BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM public.tasks WHERE story_id = NEW.id) INTO v_has_tasks;
    IF NOT v_has_tasks THEN
        IF NEW.status = 'Done' THEN
            NEW.progress := 100;
        ELSIF NEW.status IN ('In Progress', 'Review', 'Testing') THEN
            NEW.progress := 50;
        ELSE
            NEW.progress := 0;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_handle_story_status_progress ON public.stories;
CREATE TRIGGER trg_handle_story_status_progress
BEFORE INSERT OR UPDATE OF status ON public.stories
FOR EACH ROW EXECUTE FUNCTION public.handle_story_status_progress();


-- 5. Update epic progress: average progress of stories, or fallback to status if no stories
CREATE OR REPLACE FUNCTION public.update_epic_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_epic_id UUID;
    v_total INTEGER;
    v_avg_progress NUMERIC;
    v_progress INTEGER;
    v_status TEXT;
BEGIN
    v_epic_id := COALESCE(NEW.epic_id, OLD.epic_id);
    IF v_epic_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

    SELECT COUNT(*), COALESCE(AVG(COALESCE(progress, 0)), 0)
    INTO v_total, v_avg_progress
    FROM public.stories
    WHERE epic_id = v_epic_id;

    IF v_total > 0 THEN
        v_progress := ROUND(v_avg_progress);
    ELSE
        SELECT status INTO v_status FROM public.epics WHERE id = v_epic_id;
        IF v_status = 'Done' THEN
            v_progress := 100;
        ELSIF v_status IN ('In Progress', 'Review', 'Testing') THEN
            v_progress := 50;
        ELSE
            v_progress := 0;
        END IF;
    END IF;

    UPDATE public.epics SET progress = v_progress, updated_at = NOW()
    WHERE id = v_epic_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger function on epics to set its own progress BEFORE insert/update of status if no stories
CREATE OR REPLACE FUNCTION public.handle_epic_status_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_has_stories BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM public.stories WHERE epic_id = NEW.id) INTO v_has_stories;
    IF NOT v_has_stories THEN
        IF NEW.status = 'Done' THEN
            NEW.progress := 100;
        ELSIF NEW.status IN ('In Progress', 'Review', 'Testing') THEN
            NEW.progress := 50;
        ELSE
            NEW.progress := 0;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_handle_epic_status_progress ON public.epics;
CREATE TRIGGER trg_handle_epic_status_progress
BEFORE INSERT OR UPDATE OF status ON public.epics
FOR EACH ROW EXECUTE FUNCTION public.handle_epic_status_progress();


-- 7. Update initiative progress: average progress of epics, or fallback to status if no epics
CREATE OR REPLACE FUNCTION public.update_initiative_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_initiative_id UUID;
    v_total INTEGER;
    v_avg_progress NUMERIC;
    v_progress INTEGER;
    v_status TEXT;
BEGIN
    v_initiative_id := COALESCE(NEW.initiative_id, OLD.initiative_id);
    IF v_initiative_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

    SELECT COUNT(*), COALESCE(AVG(COALESCE(progress, 0)), 0)
    INTO v_total, v_avg_progress
    FROM public.epics
    WHERE initiative_id = v_initiative_id;

    IF v_total > 0 THEN
        v_progress := ROUND(v_avg_progress);
    ELSE
        SELECT status INTO v_status FROM public.initiatives WHERE id = v_initiative_id;
        IF v_status = 'Done' THEN
            v_progress := 100;
        ELSIF v_status IN ('In Progress', 'Review', 'Testing') THEN
            v_progress := 50;
        ELSE
            v_progress := 0;
        END IF;
    END IF;

    UPDATE public.initiatives SET progress = v_progress, updated_at = NOW()
    WHERE id = v_initiative_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger function on initiatives to set its own progress BEFORE insert/update of status if no epics
CREATE OR REPLACE FUNCTION public.handle_initiative_status_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_has_epics BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM public.epics WHERE initiative_id = NEW.id) INTO v_has_epics;
    IF NOT v_has_epics THEN
        IF NEW.status = 'Done' THEN
            NEW.progress := 100;
        ELSIF NEW.status IN ('In Progress', 'Review', 'Testing') THEN
            NEW.progress := 50;
        ELSE
            NEW.progress := 0;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_handle_initiative_status_progress ON public.initiatives;
CREATE TRIGGER trg_handle_initiative_status_progress
BEFORE INSERT OR UPDATE OF status ON public.initiatives
FOR EACH ROW EXECUTE FUNCTION public.handle_initiative_status_progress();


-- 9. Recreate propagation triggers with progress column tracked
DROP TRIGGER IF EXISTS trg_update_story_progress ON public.tasks;
CREATE TRIGGER trg_update_story_progress
AFTER INSERT OR UPDATE OF status, story_id, progress OR DELETE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.update_story_progress();

DROP TRIGGER IF EXISTS trg_update_epic_progress ON public.stories;
CREATE TRIGGER trg_update_epic_progress
AFTER INSERT OR UPDATE OF status, epic_id, progress OR DELETE ON public.stories
FOR EACH ROW EXECUTE FUNCTION public.update_epic_progress();

DROP TRIGGER IF EXISTS trg_update_initiative_progress ON public.epics;
CREATE TRIGGER trg_update_initiative_progress
AFTER INSERT OR UPDATE OF status, initiative_id, progress OR DELETE ON public.epics
FOR EACH ROW EXECUTE FUNCTION public.update_initiative_progress();
