-- Progress meeting slots (coaches define available timeslots)
CREATE TABLE IF NOT EXISTS progress_meeting_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  start_time time NOT NULL,
  duration_minutes int NOT NULL DEFAULT 30,
  max_bookings int NOT NULL DEFAULT 1,
  created_by uuid REFERENCES users(id),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Phase review requests (student signals ready for assessment)
CREATE TABLE IF NOT EXISTS phase_review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_number int NOT NULL CHECK (goal_number BETWEEN 1 AND 6),
  phase int NOT NULL CHECK (phase BETWEEN 1 AND 4),
  slot_id uuid REFERENCES progress_meeting_slots(id),
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'assessed', 'cancelled')),
  student_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Student self-assessment scores per criterion per request
CREATE TABLE IF NOT EXISTS phase_review_self_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES phase_review_requests(id) ON DELETE CASCADE,
  criterion_id uuid NOT NULL REFERENCES rubric_criteria(id),
  score text NOT NULL CHECK (score IN ('onvoldoende', 'voldoende', 'goed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, criterion_id)
);

-- RLS
ALTER TABLE progress_meeting_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_review_self_scores ENABLE ROW LEVEL SECURITY;

-- Slots: all authenticated users can read active future slots
CREATE POLICY "slots_authenticated_read" ON progress_meeting_slots
  FOR SELECT TO authenticated USING (active = true);

-- Review requests: student manages own records
CREATE POLICY "review_requests_own" ON phase_review_requests
  FOR ALL TO authenticated USING (student_id = auth.uid());

-- Self scores: student manages own (via request ownership)
CREATE POLICY "self_scores_own" ON phase_review_self_scores
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM phase_review_requests
      WHERE id = request_id AND student_id = auth.uid()
    )
  );
