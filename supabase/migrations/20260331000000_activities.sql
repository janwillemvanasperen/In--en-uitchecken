-- Activities: events that students can sign up for (with optional spot limit & deadline)

CREATE TABLE public.activities (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  description      text,
  activity_date    date NOT NULL,
  start_time       time,
  end_time         time,
  location         text,
  max_participants int CHECK (max_participants > 0),
  signup_deadline  timestamptz,
  created_by       uuid NOT NULL REFERENCES auth.users(id),
  status           text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view active activities (+ creators see their own cancelled ones)
CREATE POLICY "View active activities"
  ON public.activities FOR SELECT TO authenticated
  USING (status = 'active' OR created_by = auth.uid());

-- Any authenticated user can create activities (role check happens at application level)
CREATE POLICY "Create activities"
  ON public.activities FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Update own activities"
  ON public.activities FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Delete own activities"
  ON public.activities FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- ─── Activity signups ──────────────────────────────────────────────────────────

CREATE TABLE public.activity_signups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  student_id  uuid NOT NULL REFERENCES auth.users(id),
  signed_up_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(activity_id, student_id)
);

ALTER TABLE public.activity_signups ENABLE ROW LEVEL SECURITY;

-- Students can see their own signups
CREATE POLICY "View own signups"
  ON public.activity_signups FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Students can sign up
CREATE POLICY "Sign up for activities"
  ON public.activity_signups FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Students can cancel their own signup
CREATE POLICY "Cancel own signup"
  ON public.activity_signups FOR DELETE TO authenticated
  USING (student_id = auth.uid());
