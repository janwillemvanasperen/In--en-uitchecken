-- Add submission_group to schedules to group a weekly submission together
ALTER TABLE public.schedules
  ADD COLUMN submission_group UUID DEFAULT uuid_generate_v4();

-- Index for efficient group lookups
CREATE INDEX idx_schedules_submission_group ON public.schedules(submission_group);
