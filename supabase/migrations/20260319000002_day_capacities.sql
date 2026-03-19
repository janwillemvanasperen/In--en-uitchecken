-- ============================================================
-- DAY CAPACITIES: max spots per day of week
-- ============================================================

CREATE TABLE public.day_capacities (
  day_of_week INTEGER PRIMARY KEY CHECK (day_of_week BETWEEN 1 AND 7),
  max_spots   INTEGER NOT NULL DEFAULT 50 CHECK (max_spots >= 0),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Initialize with 50 spots per day
INSERT INTO public.day_capacities (day_of_week, max_spots) VALUES
  (1, 50), (2, 50), (3, 50), (4, 50), (5, 50), (6, 50), (7, 50);

-- RLS
ALTER TABLE public.day_capacities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view day capacities"
  ON public.day_capacities FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage day capacities"
  ON public.day_capacities FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());
