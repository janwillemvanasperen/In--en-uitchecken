-- ─────────────────────────────────────────────
-- 1. Add all_day flag to calendar_events
-- ─────────────────────────────────────────────
ALTER TABLE public.calendar_events
  ADD COLUMN all_day boolean NOT NULL DEFAULT false;

-- ─────────────────────────────────────────────
-- 2. Meeting cycles (coach-owned scheduling rounds)
-- ─────────────────────────────────────────────
CREATE TABLE public.meeting_cycles (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text        NOT NULL,
  description      text,
  coach_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_from        date        NOT NULL,
  date_until       date        NOT NULL,
  -- 1=Mon … 7=Sun, stored as integer array
  days_of_week     integer[]   NOT NULL DEFAULT '{1,2,3,4,5}',
  day_start_time   time        NOT NULL DEFAULT '09:00',
  day_end_time     time        NOT NULL DEFAULT '17:00',
  slot_duration    integer     NOT NULL DEFAULT 30 CHECK (slot_duration > 0),
  status           text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.meeting_cycles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_meeting_cycles_updated_at
  BEFORE UPDATE ON public.meeting_cycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_meeting_cycles_coach_id ON public.meeting_cycles(coach_id);
CREATE INDEX idx_meeting_cycles_status   ON public.meeting_cycles(status);

-- Coaches manage their own cycles
CREATE POLICY "Coaches beheren eigen gesprekscycli"
  ON public.meeting_cycles FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Admins full access
CREATE POLICY "Admins beheren alle gesprekscycli"
  ON public.meeting_cycles FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─────────────────────────────────────────────
-- 3. Meeting slots (auto-generated time blocks)
-- ─────────────────────────────────────────────
CREATE TABLE public.meeting_slots (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id    uuid    NOT NULL REFERENCES public.meeting_cycles(id) ON DELETE CASCADE,
  slot_date   date    NOT NULL,
  start_time  time    NOT NULL,
  end_time    time    NOT NULL,
  -- Coach can block a slot (e.g. lunch, no-show buffer)
  available   boolean NOT NULL DEFAULT true,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.meeting_slots ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_meeting_slots_cycle_id  ON public.meeting_slots(cycle_id);
CREATE INDEX idx_meeting_slots_slot_date ON public.meeting_slots(slot_date);

-- Coaches manage slots for their own cycles
CREATE POLICY "Coaches beheren eigen gesprekslots"
  ON public.meeting_slots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.meeting_cycles
      WHERE id = meeting_slots.cycle_id AND coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meeting_cycles
      WHERE id = meeting_slots.cycle_id AND coach_id = auth.uid()
    )
  );

-- Admins full access
CREATE POLICY "Admins beheren alle gesprekslots"
  ON public.meeting_slots FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─────────────────────────────────────────────
-- 4. Meeting bookings (student reservations)
-- ─────────────────────────────────────────────
CREATE TABLE public.meeting_bookings (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id     uuid        NOT NULL REFERENCES public.meeting_slots(id) ON DELETE CASCADE,
  student_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booked_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(slot_id, student_id)
);

ALTER TABLE public.meeting_bookings ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_meeting_bookings_slot_id    ON public.meeting_bookings(slot_id);
CREATE INDEX idx_meeting_bookings_student_id ON public.meeting_bookings(student_id);

-- Students manage their own bookings
CREATE POLICY "Studenten beheren eigen boekingen"
  ON public.meeting_bookings FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Coaches see bookings for their own cycles' slots
CREATE POLICY "Coaches zien boekingen van hun gesprekslots"
  ON public.meeting_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meeting_slots ms
      JOIN public.meeting_cycles mc ON mc.id = ms.cycle_id
      WHERE ms.id = meeting_bookings.slot_id AND mc.coach_id = auth.uid()
    )
  );

-- Admins full access
CREATE POLICY "Admins beheren alle boekingen"
  ON public.meeting_bookings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
