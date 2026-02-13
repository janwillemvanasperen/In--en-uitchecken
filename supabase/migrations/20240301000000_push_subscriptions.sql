-- Push subscription table to store Web Push API subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_endpoint UNIQUE (endpoint)
);

-- Notification log to track sent notifications and prevent duplicates
CREATE TABLE public.notification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  reference_id UUID,
  reference_date DATE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered BOOLEAN DEFAULT false
);

-- Indexes
CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX idx_notification_log_user_id ON public.notification_log(user_id);
CREATE INDEX idx_notification_log_lookup ON public.notification_log(user_id, notification_type, reference_date);

-- Apply updated_at trigger
CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

-- Push subscriptions: users manage their own
CREATE POLICY "Users can view own push subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own push subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions"
  ON public.push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Notification log: users can view their own
CREATE POLICY "Users can view own notification log"
  ON public.notification_log FOR SELECT
  USING (auth.uid() = user_id);
