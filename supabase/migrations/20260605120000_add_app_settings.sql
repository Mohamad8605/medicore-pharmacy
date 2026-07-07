-- App settings — key-value config read by the app at runtime.
-- Anyone can read (needed by the unauthenticated login page),
-- only admins can write.

CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated visitors) can read — needed so the
-- login page knows whether email confirmation is required.
CREATE POLICY "Anyone can read app_settings"
  ON public.app_settings FOR SELECT
  USING (true);

-- Only admins can insert / update / delete.
CREATE POLICY "Admins write app_settings"
  ON public.app_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Seed defaults
INSERT INTO public.app_settings (key, value) VALUES
  ('require_email_confirmation', '"true"')
ON CONFLICT (key) DO NOTHING;

CREATE TRIGGER app_settings_updated
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
