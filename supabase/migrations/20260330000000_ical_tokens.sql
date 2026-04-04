-- Add a secret iCal subscription token per user.
-- This token is used as a URL secret to expose a read-only iCal feed
-- without requiring the user to be logged in.
ALTER TABLE public.users
  ADD COLUMN ical_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX idx_users_ical_token ON public.users(ical_token);
