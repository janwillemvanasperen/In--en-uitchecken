-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (is_admin());

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM public.users WHERE id = auth.uid())
  );

-- Admins can update any user
CREATE POLICY "Admins can update any user"
  ON public.users FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admins can insert users
CREATE POLICY "Admins can insert users"
  ON public.users FOR INSERT
  WITH CHECK (is_admin());

-- Admins can delete users
CREATE POLICY "Admins can delete users"
  ON public.users FOR DELETE
  USING (is_admin());

-- ============================================
-- LOCATIONS TABLE POLICIES
-- ============================================

-- Anyone authenticated can view locations
CREATE POLICY "Authenticated users can view locations"
  ON public.locations FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins can manage locations
CREATE POLICY "Admins can manage locations"
  ON public.locations FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- SCHEDULES TABLE POLICIES
-- ============================================

-- Users can view their own schedules
CREATE POLICY "Users can view own schedules"
  ON public.schedules FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all schedules
CREATE POLICY "Admins can view all schedules"
  ON public.schedules FOR SELECT
  USING (is_admin());

-- Users can create their own schedules (status will be pending)
CREATE POLICY "Users can create own schedules"
  ON public.schedules FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    status = 'pending'
  );

-- Users can update their own pending schedules
CREATE POLICY "Users can update own pending schedules"
  ON public.schedules FOR UPDATE
  USING (
    auth.uid() = user_id AND
    status = 'pending'
  )
  WITH CHECK (
    auth.uid() = user_id AND
    status = 'pending'
  );

-- Admins can update any schedule (including approval)
CREATE POLICY "Admins can update any schedule"
  ON public.schedules FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Users can delete their own pending schedules
CREATE POLICY "Users can delete own pending schedules"
  ON public.schedules FOR DELETE
  USING (
    auth.uid() = user_id AND
    status = 'pending'
  );

-- Admins can delete any schedule
CREATE POLICY "Admins can delete any schedule"
  ON public.schedules FOR DELETE
  USING (is_admin());

-- ============================================
-- CHECK-INS TABLE POLICIES
-- ============================================

-- Users can view their own check-ins
CREATE POLICY "Users can view own check-ins"
  ON public.check_ins FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all check-ins
CREATE POLICY "Admins can view all check-ins"
  ON public.check_ins FOR SELECT
  USING (is_admin());

-- Users can create their own check-ins
CREATE POLICY "Users can create own check-ins"
  ON public.check_ins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own check-ins (for check-out)
CREATE POLICY "Users can update own check-ins"
  ON public.check_ins FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can update any check-in
CREATE POLICY "Admins can update any check-in"
  ON public.check_ins FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- No one can delete check-ins (for audit trail)
-- Admins can delete if needed via direct database access

-- ============================================
-- LEAVE REQUESTS TABLE POLICIES
-- ============================================

-- Users can view their own leave requests
CREATE POLICY "Users can view own leave requests"
  ON public.leave_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all leave requests
CREATE POLICY "Admins can view all leave requests"
  ON public.leave_requests FOR SELECT
  USING (is_admin());

-- Users can create their own leave requests
CREATE POLICY "Users can create own leave requests"
  ON public.leave_requests FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    status = 'pending' AND
    reviewed_by IS NULL AND
    reviewed_at IS NULL
  );

-- Users can update their own pending leave requests
CREATE POLICY "Users can update own pending leave requests"
  ON public.leave_requests FOR UPDATE
  USING (
    auth.uid() = user_id AND
    status = 'pending'
  )
  WITH CHECK (
    auth.uid() = user_id AND
    status = 'pending' AND
    reviewed_by IS NULL
  );

-- Admins can update any leave request (for approval/rejection)
CREATE POLICY "Admins can update any leave request"
  ON public.leave_requests FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Users can delete their own pending leave requests
CREATE POLICY "Users can delete own pending leave requests"
  ON public.leave_requests FOR DELETE
  USING (
    auth.uid() = user_id AND
    status = 'pending'
  );

-- Admins can delete any leave request
CREATE POLICY "Admins can delete any leave request"
  ON public.leave_requests FOR DELETE
  USING (is_admin());

-- ============================================
-- SETTINGS TABLE POLICIES
-- ============================================

-- Anyone authenticated can view settings
CREATE POLICY "Authenticated users can view settings"
  ON public.settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can manage settings
CREATE POLICY "Admins can manage settings"
  ON public.settings FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- ADDITIONAL HELPER FUNCTIONS
-- ============================================

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
BEGIN
  RETURN (SELECT role FROM public.users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if schedule is valid for date
CREATE OR REPLACE FUNCTION is_schedule_valid(schedule_id UUID, check_date DATE)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.schedules
    WHERE id = schedule_id
      AND status = 'approved'
      AND valid_from <= check_date
      AND valid_until >= check_date
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get approved schedule for user on specific day
CREATE OR REPLACE FUNCTION get_user_schedule(p_user_id UUID, p_date DATE)
RETURNS TABLE(id UUID, start_time TIME, end_time TIME) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.start_time, s.end_time
  FROM public.schedules s
  WHERE s.user_id = p_user_id
    AND s.status = 'approved'
    AND s.valid_from <= p_date
    AND s.valid_until >= p_date
    AND s.day_of_week = EXTRACT(ISODOW FROM p_date)::INTEGER
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
