-- Create function to calculate weekly hours for a student
-- This aggregates all check-ins within a week and sums their durations
-- Check-ins without check-out are counted as 0 hours

CREATE OR REPLACE FUNCTION get_weekly_hours(
  student_id UUID,
  week_start DATE
)
RETURNS DECIMAL AS $$
DECLARE
  total_hours DECIMAL := 0;
BEGIN
  SELECT COALESCE(SUM(
    CASE
      WHEN check_out_time IS NULL THEN 0
      ELSE EXTRACT(EPOCH FROM (check_out_time - check_in_time)) / 3600
    END
  ), 0)
  INTO total_hours
  FROM check_ins
  WHERE user_id = student_id
    AND check_in_time >= week_start
    AND check_in_time < week_start + INTERVAL '7 days';

  RETURN total_hours;
END;
$$ LANGUAGE plpgsql;
