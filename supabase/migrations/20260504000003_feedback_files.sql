-- Feedback requests: student vraagt feedback aan coach, medestudent of externe
-- Bestandsuploads: storage bucket voor portfolio bestanden

-- ============================================================
-- 1. portfolio_feedback_requests
-- ============================================================

CREATE TABLE IF NOT EXISTS portfolio_feedback_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id),
  request_type text NOT NULL CHECK (request_type IN ('coach', 'student', 'external')),
  target_user_id uuid REFERENCES auth.users(id),
  target_name text,
  target_email text,
  token text UNIQUE,
  response_text text,
  responded_by_name text,
  responded_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE portfolio_feedback_requests ENABLE ROW LEVEL SECURITY;

-- Student beheert eigen aanvragen
CREATE POLICY "pfr_student_manage" ON portfolio_feedback_requests
  FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Doelstudent leest aanvragen gericht aan hem/haar
CREATE POLICY "pfr_target_view" ON portfolio_feedback_requests
  FOR SELECT TO authenticated
  USING (target_user_id = auth.uid());

-- Coach leest en beheert alle aanvragen
CREATE POLICY "pfr_coach_all" ON portfolio_feedback_requests
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'coach'));

-- Externe respondent leest via token (service_role gebruikt admin client)
-- Token-based access wordt afgehandeld via de server action

-- ============================================================
-- 2. Storage bucket voor portfolio bestandsuploads
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-files',
  'portfolio-files',
  true,
  10485760, -- 10 MB
  ARRAY['image/jpeg','image/png','image/gif','image/webp','application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'video/mp4','video/quicktime','audio/mpeg','audio/mp4',
        'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users kunnen uploaden
CREATE POLICY "portfolio_files_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'portfolio-files');

-- Publiek leesbaar (bucket is public)
CREATE POLICY "portfolio_files_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio-files');

-- Student verwijdert eigen bestanden
CREATE POLICY "portfolio_files_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'portfolio-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
