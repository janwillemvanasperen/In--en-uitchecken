-- ============================================
-- RLS POLICIES: coach_notes, note_labels, notifications, coaches
-- ============================================

-- coach_notes
ALTER TABLE public.coach_notes ENABLE ROW LEVEL SECURITY;

-- Coaches can view own notes + colleague notes if visible_to_coaches=true
CREATE POLICY "Coaches can view own notes"
  ON public.coach_notes FOR SELECT
  USING (
    coach_id = auth.uid()
    OR (visible_to_coaches = true AND EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'coach'
    ))
  );

-- Students can view notes where visible_to_student=true for their own profile
CREATE POLICY "Students can view own visible notes"
  ON public.coach_notes FOR SELECT
  USING (
    student_id = auth.uid() AND visible_to_student = true
  );

-- Admins can view all notes
CREATE POLICY "Admins can view all notes"
  ON public.coach_notes FOR SELECT
  USING (is_admin());

-- Coaches can only create notes for their own assigned students
CREATE POLICY "Coaches can create notes for own students"
  ON public.coach_notes FOR INSERT
  WITH CHECK (
    coach_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = student_id AND role = 'student' AND coach_id = auth.uid()
    )
  );

-- Coaches can only update their own notes
CREATE POLICY "Coaches can update own notes"
  ON public.coach_notes FOR UPDATE
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Coaches can only delete their own notes
CREATE POLICY "Coaches can delete own notes"
  ON public.coach_notes FOR DELETE
  USING (coach_id = auth.uid());

-- Admins can manage all notes
CREATE POLICY "Admins can manage all notes"
  ON public.coach_notes FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- note_labels
-- ============================================
ALTER TABLE public.note_labels ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can view active labels
CREATE POLICY "Authenticated users can view labels"
  ON public.note_labels FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can manage labels
CREATE POLICY "Admins can manage labels"
  ON public.note_labels FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- notifications
-- ============================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Only server (service role) can insert notifications — no direct user inserts
-- This is enforced by the application using adminClient for inserts

-- ============================================
-- coaches (if table exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'coaches') THEN
    EXECUTE 'ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY';

    EXECUTE 'CREATE POLICY "Authenticated users can view coaches"
      ON public.coaches FOR SELECT
      USING (auth.uid() IS NOT NULL)';

    EXECUTE 'CREATE POLICY "Admins can manage coaches"
      ON public.coaches FOR ALL
      USING (is_admin())
      WITH CHECK (is_admin())';
  END IF;
END $$;
