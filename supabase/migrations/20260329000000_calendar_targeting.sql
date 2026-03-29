-- ─────────────────────────────────────────────────────────────────────────────
-- Multi-student targeting for calendar events and meeting cycles
-- NULL = all students of this coach; array = specific students
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add target_student_ids to calendar_events
ALTER TABLE public.calendar_events
  ADD COLUMN target_student_ids uuid[];

-- Migrate existing coach events that targeted a single student:
-- move student_id into target_student_ids array
UPDATE public.calendar_events
SET target_student_ids = ARRAY[student_id]
WHERE variant = 'coach' AND student_id IS NOT NULL;

-- Drop and replace the student SELECT policy to understand target_student_ids
-- NOTE: users.coach_id references coaches.id (entity), not auth.users.id
-- So we must join through coaches to match calendar_events.created_by (= auth.users.id)
DROP POLICY IF EXISTS "Studenten zien relevante kalenderitems" ON public.calendar_events;

CREATE POLICY "Studenten zien relevante kalenderitems"
  ON public.calendar_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'student')
    AND (
      -- Own shared event
      (variant = 'shared' AND student_id = auth.uid())

      -- Coach event targeting all students of this coach (no target restriction)
      OR (
        variant = 'coach'
        AND target_student_ids IS NULL
        AND EXISTS (
          SELECT 1 FROM public.users u
          JOIN public.coaches c ON c.id = u.coach_id
          WHERE u.id = auth.uid()
          AND c.user_id = calendar_events.created_by
        )
      )

      -- Coach event targeting specific students (this student is in the list)
      OR (
        variant = 'coach'
        AND auth.uid() = ANY(target_student_ids)
      )
    )
  );

-- 2. Add target_student_ids to meeting_cycles
ALTER TABLE public.meeting_cycles
  ADD COLUMN target_student_ids uuid[];
-- NULL = all students of this coach; array = specific students
