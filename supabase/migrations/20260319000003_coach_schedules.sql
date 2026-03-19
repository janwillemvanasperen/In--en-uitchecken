-- ============================================================
-- COACH SCHEDULES: working days & times per coach
-- ============================================================

CREATE TABLE public.coach_schedules (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id     uuid        NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  day_of_week  integer     NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time   time        NOT NULL DEFAULT '09:00',
  end_time     time        NOT NULL DEFAULT '17:00',
  UNIQUE(coach_id, day_of_week)
);

ALTER TABLE public.coach_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view coach schedules"
  ON public.coach_schedules FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage coach schedules"
  ON public.coach_schedules FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());
