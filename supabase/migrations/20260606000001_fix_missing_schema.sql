-- FIX: Missing app_settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated visitors) can read
CREATE POLICY IF NOT EXISTS "Anyone can read app_settings"
  ON public.app_settings FOR SELECT
  USING (true);

-- Only admins can insert / update / delete
CREATE POLICY IF NOT EXISTS "Admins write app_settings"
  ON public.app_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Seed defaults
INSERT INTO public.app_settings (key, value) VALUES
  ('require_email_confirmation', '"true"')
ON CONFLICT (key) DO NOTHING;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS app_settings_updated ON public.app_settings;
CREATE TRIGGER app_settings_updated
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =============================================================
-- FIX: contact_messages INSERT RLS policy (re-create to ensure it exists)
-- =============================================================
DROP POLICY IF EXISTS "Anyone can submit a contact message" ON public.contact_messages;
CREATE POLICY "Anyone can submit a contact message"
ON public.contact_messages FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(name) BETWEEN 1 AND 120
  AND length(email) BETWEEN 3 AND 255
  AND length(subject) BETWEEN 1 AND 200
  AND length(message) BETWEEN 1 AND 4000
);

-- Also ensure staff can SELECT
DROP POLICY IF EXISTS "Staff read contact messages" ON public.contact_messages;
CREATE POLICY "Staff read contact messages"
ON public.contact_messages FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'pharmacist'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- =============================================================
-- FIX: Create prescriptions storage bucket
-- =============================================================
INSERT INTO storage.buckets (id, name, public)
SELECT 'prescriptions', 'prescriptions', false
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'prescriptions');

-- Re-create storage policies (idempotent)
DROP POLICY IF EXISTS "Users upload own prescriptions" ON storage.objects;
CREATE POLICY "Users upload own prescriptions"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'prescriptions' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users view own prescriptions" ON storage.objects;
CREATE POLICY "Users view own prescriptions"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'prescriptions' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'pharmacist')
    OR public.has_role(auth.uid(), 'admin')
  ));

-- =============================================================
-- FIX: Ensure has_role is executable by anon + authenticated
-- =============================================================
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;

-- =============================================================
-- FIX: Performance indexes
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_orders_user_status_created
  ON public.orders(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_medication
  ON public.order_items(order_id, medication_id);

CREATE INDEX IF NOT EXISTS idx_medications_category_active
  ON public.medications(category, is_active);

CREATE INDEX IF NOT EXISTS idx_user_roles_user
  ON public.user_roles(user_id);
