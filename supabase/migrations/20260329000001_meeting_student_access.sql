-- ─────────────────────────────────────────────────────────────────────────────
-- Student SELECT access for meeting_cycles and meeting_slots
-- Without this, students cannot see cycles/slots via the regular (anon) client.
-- The application already uses adminClient in most places, but these policies
-- also guard future direct access and make intent explicit.
-- ─────────────────────────────────────────────────────────────────────────────

-- Students can see active meeting cycles from their coach that target them
-- (target_student_ids IS NULL = all students; or array contains their id)
-- Uses coaches join because meeting_cycles.coach_id = auth user id,
-- but users.coach_id = coaches entity id (coaches.id).
CREATE POLICY "Studenten zien gesprekscycli van hun coach"
  ON public.meeting_cycles FOR SELECT
  USING (
    status = 'active'
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'student')
    AND (target_student_ids IS NULL OR auth.uid() = ANY(target_student_ids))
    AND EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.coaches c ON c.id = u.coach_id
      WHERE u.id = auth.uid()
      AND c.user_id = meeting_cycles.coach_id
    )
  );

-- Students can see available slots for their eligible cycles
CREATE POLICY "Studenten zien beschikbare gesprekslots"
  ON public.meeting_slots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meeting_cycles mc
      JOIN public.users u ON TRUE
      JOIN public.coaches c ON c.id = u.coach_id
      WHERE mc.id = meeting_slots.cycle_id
        AND mc.status = 'active'
        AND u.id = auth.uid()
        AND c.user_id = mc.coach_id
        AND (mc.target_student_ids IS NULL OR auth.uid() = ANY(mc.target_student_ids))
    )
  );
