-- ============================================================
-- SCHEDULE PUSH: admin can push schedule requests to students
-- ============================================================

-- admin_note on schedules (may already exist in live DB)
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- ============================================================
-- schedule_push_requests: the push sent by an admin
-- ============================================================
CREATE TABLE public.schedule_push_requests (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  valid_from  DATE        NOT NULL,
  valid_until DATE        NOT NULL,
  message     TEXT,
  created_by  UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT push_date_range CHECK (valid_from <= valid_until)
);

-- ============================================================
-- schedule_push_recipients: which students received the push
-- ============================================================
CREATE TABLE public.schedule_push_recipients (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  push_request_id UUID        NOT NULL REFERENCES public.schedule_push_requests(id) ON DELETE CASCADE,
  student_id      UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  responded       BOOLEAN     NOT NULL DEFAULT FALSE,
  responded_at    TIMESTAMPTZ,
  CONSTRAINT unique_push_recipient UNIQUE (push_request_id, student_id)
);

-- Link a schedule submission back to the push request that triggered it
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS push_request_id UUID REFERENCES public.schedule_push_requests(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_push_requests_created_by ON public.schedule_push_requests(created_by);
CREATE INDEX idx_push_recipients_push_id  ON public.schedule_push_recipients(push_request_id);
CREATE INDEX idx_push_recipients_student  ON public.schedule_push_recipients(student_id);
CREATE INDEX idx_push_recipients_unresponded ON public.schedule_push_recipients(student_id, responded) WHERE responded = FALSE;
CREATE INDEX idx_schedules_push_request   ON public.schedules(push_request_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.schedule_push_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_push_recipients ENABLE ROW LEVEL SECURITY;

-- push_requests: admins manage; students see pushes they are a recipient of
CREATE POLICY "Admins can manage push requests"
  ON public.schedule_push_requests FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Students can view their push requests"
  ON public.schedule_push_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.schedule_push_recipients
      WHERE push_request_id = id AND student_id = auth.uid()
    )
  );

-- push_recipients: admins manage; students see own
CREATE POLICY "Admins can manage push recipients"
  ON public.schedule_push_recipients FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Students can view own push recipients"
  ON public.schedule_push_recipients FOR SELECT
  USING (student_id = auth.uid());
