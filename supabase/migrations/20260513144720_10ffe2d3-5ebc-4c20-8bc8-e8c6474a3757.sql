CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a contact message"
ON public.contact_messages FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(name) BETWEEN 1 AND 120
  AND length(email) BETWEEN 3 AND 255
  AND length(subject) BETWEEN 1 AND 200
  AND length(message) BETWEEN 1 AND 4000
);

CREATE POLICY "Staff read contact messages"
ON public.contact_messages FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'pharmacist'::app_role) OR has_role(auth.uid(), 'admin'::app_role));