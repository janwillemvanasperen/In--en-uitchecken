-- Portfolio module: bewijs items, coach feedback en fase-beoordelingen
-- Vervangt Portflow als portfolio-systeem voor Scratch studenten

-- ============================================================
-- 1. portfolio_items — student uploadt bewijs per ontwikkeldoel
-- ============================================================

CREATE TABLE portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_number int NOT NULL CHECK (goal_number BETWEEN 1 AND 6),
  title text NOT NULL,
  description text,
  file_url text,
  link_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT portfolio_items_has_content CHECK (file_url IS NOT NULL OR link_url IS NOT NULL OR description IS NOT NULL)
);

ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- Student leest en beheert eigen items
CREATE POLICY "portfolio_items: student leest eigen" ON portfolio_items
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "portfolio_items: student maakt eigen" ON portfolio_items
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "portfolio_items: student verwijdert eigen" ON portfolio_items
  FOR DELETE USING (auth.uid() = student_id);

-- Coach leest items van eigen studenten
CREATE POLICY "portfolio_items: coach leest eigen studenten" ON portfolio_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN coaches c ON c.id = u.coach_id
      WHERE u.id = portfolio_items.student_id
        AND c.user_id = auth.uid()
    )
  );

-- Admin leest alles
CREATE POLICY "portfolio_items: admin leest alles" ON portfolio_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 2. portfolio_feedback — coach reageert op een specifiek item
-- ============================================================

CREATE TABLE portfolio_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES auth.users(id),
  feedback_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE portfolio_feedback ENABLE ROW LEVEL SECURITY;

-- Student leest feedback op eigen items
CREATE POLICY "portfolio_feedback: student leest eigen" ON portfolio_feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM portfolio_items pi
      WHERE pi.id = item_id AND pi.student_id = auth.uid()
    )
  );

-- Coach schrijft en leest eigen feedback
CREATE POLICY "portfolio_feedback: coach schrijft" ON portfolio_feedback
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "portfolio_feedback: coach leest eigen" ON portfolio_feedback
  FOR SELECT USING (auth.uid() = coach_id);

-- ============================================================
-- 3. portfolio_assessments — formele fase-beoordeling door coach
--    voldoende/goed → student_development_goals.goal_N_phase += 1
-- ============================================================

CREATE TABLE portfolio_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES auth.users(id),
  goal_number int NOT NULL CHECK (goal_number BETWEEN 1 AND 6),
  phase_assessed int NOT NULL CHECK (phase_assessed BETWEEN 0 AND 3),
  result text NOT NULL CHECK (result IN ('onvoldoende', 'voldoende', 'goed')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE portfolio_assessments ENABLE ROW LEVEL SECURITY;

-- Student leest eigen beoordelingen
CREATE POLICY "portfolio_assessments: student leest eigen" ON portfolio_assessments
  FOR SELECT USING (auth.uid() = student_id);

-- Coach schrijft beoordelingen voor eigen studenten
CREATE POLICY "portfolio_assessments: coach schrijft" ON portfolio_assessments
  FOR INSERT WITH CHECK (
    auth.uid() = coach_id
    AND EXISTS (
      SELECT 1 FROM users u
      JOIN coaches c ON c.id = u.coach_id
      WHERE u.id = portfolio_assessments.student_id
        AND c.user_id = auth.uid()
    )
  );

-- Coach leest beoordelingen voor eigen studenten
CREATE POLICY "portfolio_assessments: coach leest eigen studenten" ON portfolio_assessments
  FOR SELECT USING (
    auth.uid() = coach_id
    OR EXISTS (
      SELECT 1 FROM users u
      JOIN coaches c ON c.id = u.coach_id
      WHERE u.id = portfolio_assessments.student_id
        AND c.user_id = auth.uid()
    )
  );

-- Admin leest alles
CREATE POLICY "portfolio_assessments: admin leest alles" ON portfolio_assessments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 4. Indexes voor veelgebruikte queries
-- ============================================================

CREATE INDEX portfolio_items_student_id_idx ON portfolio_items (student_id);
CREATE INDEX portfolio_items_goal_number_idx ON portfolio_items (student_id, goal_number);
CREATE INDEX portfolio_feedback_item_id_idx ON portfolio_feedback (item_id);
CREATE INDEX portfolio_assessments_student_goal_idx ON portfolio_assessments (student_id, goal_number);

-- ============================================================
-- 5. updated_at trigger voor portfolio_items
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER portfolio_items_updated_at
  BEFORE UPDATE ON portfolio_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
