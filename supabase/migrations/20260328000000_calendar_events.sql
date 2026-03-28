-- Calendar feature: two variants of calendar events
-- Variant 'coach': created by coaches, read-only for students, with labels + optional action buttons
-- Variant 'shared': created by coaches or students, both can edit

-- ─────────────────────────────────────────────
-- Table: calendar_event_labels
-- ─────────────────────────────────────────────
CREATE TABLE public.calendar_event_labels (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  color       text        NOT NULL DEFAULT '#6366f1',
  active      boolean     NOT NULL DEFAULT true,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_event_labels ENABLE ROW LEVEL SECURITY;

-- Everyone can read active labels
CREATE POLICY "Iedereen kan kalender labels zien"
  ON public.calendar_event_labels FOR SELECT
  USING (true);

-- Only admins manage labels
CREATE POLICY "Admins beheren kalender labels"
  ON public.calendar_event_labels FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ─────────────────────────────────────────────
-- Table: calendar_events
-- ─────────────────────────────────────────────
CREATE TABLE public.calendar_events (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text        NOT NULL,
  description   text,
  event_date    date        NOT NULL,
  start_time    time,
  end_time      time,
  -- 'coach' = coach-owned, read-only for students
  -- 'shared' = both coach and student can create/edit
  variant       text        NOT NULL CHECK (variant IN ('coach', 'shared')),
  created_by    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- For coach events: NULL = all students of this coach; set = specific student only
  -- For shared events: always required (the student this event belongs to)
  student_id    uuid        REFERENCES public.users(id) ON DELETE CASCADE,
  -- Label (only meaningful for coach events)
  label_id      uuid        REFERENCES public.calendar_event_labels(id) ON DELETE SET NULL,
  -- Optional action button shown to the student
  -- submit_schedule   → navigates to /student/schedule
  -- submit_leave_request → navigates to /student/leave-requests
  -- check_in          → navigates to /student/check-in
  action_type   text        CHECK (action_type IN ('submit_schedule', 'submit_leave_request', 'check_in')),
  -- Overrides the default Dutch button label when set
  action_label  text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Updated-at trigger (reuses existing trigger function)
CREATE TRIGGER set_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Performance indexes
CREATE INDEX idx_calendar_events_event_date  ON public.calendar_events(event_date);
CREATE INDEX idx_calendar_events_created_by  ON public.calendar_events(created_by);
CREATE INDEX idx_calendar_events_student_id  ON public.calendar_events(student_id);

-- ─────────────────────────────────────────────
-- RLS: Admin — full access
-- ─────────────────────────────────────────────
CREATE POLICY "Admins beheren alle kalenderitems"
  ON public.calendar_events FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ─────────────────────────────────────────────
-- RLS: Coach — SELECT
-- Own events + shared events belonging to their students
-- ─────────────────────────────────────────────
CREATE POLICY "Coaches zien eigen kalenderitems en gedeelde items van hun studenten"
  ON public.calendar_events FOR SELECT
  USING (
    -- Is a coach
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'coach')
    AND (
      -- Own events (both variants)
      created_by = auth.uid()
      -- Shared events of assigned students (created by the student)
      OR (
        variant = 'shared'
        AND EXISTS (
          SELECT 1 FROM public.users
          WHERE id = student_id AND coach_id = auth.uid()
        )
      )
    )
  );

-- ─────────────────────────────────────────────
-- RLS: Coach — INSERT
-- ─────────────────────────────────────────────
CREATE POLICY "Coaches maken kalenderitems aan"
  ON public.calendar_events FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'coach')
  );

-- ─────────────────────────────────────────────
-- RLS: Coach — UPDATE
-- Own events + shared events of their students
-- ─────────────────────────────────────────────
CREATE POLICY "Coaches bewerken eigen items en gedeelde items van hun studenten"
  ON public.calendar_events FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'coach')
    AND (
      created_by = auth.uid()
      OR (
        variant = 'shared'
        AND EXISTS (
          SELECT 1 FROM public.users
          WHERE id = student_id AND coach_id = auth.uid()
        )
      )
    )
  );

-- ─────────────────────────────────────────────
-- RLS: Coach — DELETE
-- Own events + shared events of their students
-- ─────────────────────────────────────────────
CREATE POLICY "Coaches verwijderen eigen items en gedeelde items van hun studenten"
  ON public.calendar_events FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'coach')
    AND (
      created_by = auth.uid()
      OR (
        variant = 'shared'
        AND EXISTS (
          SELECT 1 FROM public.users
          WHERE id = student_id AND coach_id = auth.uid()
        )
      )
    )
  );

-- ─────────────────────────────────────────────
-- RLS: Student — SELECT
-- Coach events targeting them (specific or via coach assignment) + own shared events
-- ─────────────────────────────────────────────
CREATE POLICY "Studenten zien relevante kalenderitems"
  ON public.calendar_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'student')
    AND (
      -- Own shared event
      (variant = 'shared' AND student_id = auth.uid())
      -- Coach event targeted at this student specifically
      OR (variant = 'coach' AND student_id = auth.uid())
      -- Coach event targeted at all students of this coach (student_id IS NULL)
      OR (
        variant = 'coach'
        AND student_id IS NULL
        AND EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid() AND coach_id = calendar_events.created_by
        )
      )
    )
  );

-- ─────────────────────────────────────────────
-- RLS: Student — INSERT (shared events only, for themselves)
-- ─────────────────────────────────────────────
CREATE POLICY "Studenten maken eigen gedeelde kalenderitems aan"
  ON public.calendar_events FOR INSERT
  WITH CHECK (
    variant = 'shared'
    AND student_id = auth.uid()
    AND created_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'student')
  );

-- ─────────────────────────────────────────────
-- RLS: Student — UPDATE (own shared events only)
-- ─────────────────────────────────────────────
CREATE POLICY "Studenten bewerken eigen gedeelde kalenderitems"
  ON public.calendar_events FOR UPDATE
  USING (
    variant = 'shared'
    AND student_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'student')
  );

-- ─────────────────────────────────────────────
-- RLS: Student — DELETE (own shared events only)
-- ─────────────────────────────────────────────
CREATE POLICY "Studenten verwijderen eigen gedeelde kalenderitems"
  ON public.calendar_events FOR DELETE
  USING (
    variant = 'shared'
    AND student_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'student')
  );

-- ─────────────────────────────────────────────
-- Seed: a few default labels
-- ─────────────────────────────────────────────
INSERT INTO public.calendar_event_labels (name, color, sort_order) VALUES
  ('Deadline',    '#ef4444', 1),
  ('Gesprek',     '#3b82f6', 2),
  ('Workshop',    '#f59e0b', 3),
  ('Herinnering', '#8b5cf6', 4),
  ('Overig',      '#6b7280', 5);
