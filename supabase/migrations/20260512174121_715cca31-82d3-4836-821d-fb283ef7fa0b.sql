
-- Roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'pharmacist', 'patient');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  street TEXT,
  city TEXT,
  postcode TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'pharmacist') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'patient');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Medications
CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  active_ingredient TEXT,
  dosage TEXT,
  manufacturer TEXT,
  side_effects TEXT,
  image_url TEXT,
  requires_prescription BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active medications" ON public.medications FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'pharmacist') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff manage medications" ON public.medications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'pharmacist') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'pharmacist') OR public.has_role(auth.uid(), 'admin'));

-- Orders
CREATE TYPE public.order_status AS ENUM ('pending','confirmed','in_preparation','ready','completed','cancelled');
CREATE TYPE public.delivery_method AS ENUM ('pickup','delivery');

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  delivery_method delivery_method NOT NULL DEFAULT 'pickup',
  street TEXT,
  city TEXT,
  postcode TEXT,
  prescription_path TEXT,
  notes TEXT,
  pharmacist_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own orders" ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'pharmacist') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own orders" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff update orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'pharmacist') OR public.has_role(auth.uid(), 'admin'));

-- Order items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  medication_id UUID REFERENCES public.medications(id) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own order items" ON public.order_items FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND
      (o.user_id = auth.uid() OR public.has_role(auth.uid(), 'pharmacist') OR public.has_role(auth.uid(), 'admin')))
  );
CREATE POLICY "Insert own order items" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER medications_updated BEFORE UPDATE ON public.medications FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed medications
INSERT INTO public.medications (name, description, category, price, stock, active_ingredient, dosage, manufacturer, side_effects, requires_prescription) VALUES
('Paracetamol 500mg', 'Effective pain reliever and fever reducer for everyday aches.', 'Pain Relief', 3.49, 250, 'Paracetamol', '500mg, 1-2 tablets every 4-6 hours', 'Generic Pharma', 'Rare: skin rash, liver issues with overdose.', false),
('Ibuprofen 400mg', 'Anti-inflammatory for headaches, muscle pain and fever.', 'Pain Relief', 4.99, 180, 'Ibuprofen', '400mg up to 3 times daily with food', 'Generic Pharma', 'May cause stomach upset, dizziness.', false),
('Amoxicillin 500mg', 'Broad-spectrum antibiotic for bacterial infections.', 'Antibiotics', 12.50, 60, 'Amoxicillin', '500mg three times daily for 7 days', 'MediLab', 'Nausea, diarrhoea, allergic reactions possible.', true),
('Cetirizine 10mg', 'Once-a-day allergy relief for hay fever and skin allergies.', 'Allergy', 5.75, 140, 'Cetirizine HCl', '10mg once daily', 'AllergyCare', 'Drowsiness, dry mouth.', false),
('Omeprazole 20mg', 'Reduces stomach acid for heartburn and reflux.', 'Digestive Health', 8.20, 90, 'Omeprazole', '20mg once daily before food', 'GastroPharm', 'Headache, abdominal pain.', true),
('Vitamin D3 1000 IU', 'Daily vitamin D supplement for bone health.', 'Vitamins', 6.99, 300, 'Cholecalciferol', '1 capsule daily', 'WellLife', 'Generally well tolerated.', false),
('Salbutamol Inhaler', 'Quick-relief inhaler for asthma symptoms.', 'Respiratory', 14.00, 45, 'Salbutamol', '1-2 puffs as needed', 'BreathePlus', 'Tremor, fast heartbeat.', true),
('Loratadine 10mg', 'Non-drowsy antihistamine for allergies.', 'Allergy', 5.25, 160, 'Loratadine', '10mg once daily', 'AllergyCare', 'Headache, dry mouth.', false),
('Cough Syrup 200ml', 'Soothing syrup for dry and tickly coughs.', 'Cold & Flu', 7.50, 110, 'Dextromethorphan', '10ml every 6 hours', 'WellLife', 'Drowsiness possible.', false),
('Hand Sanitizer 250ml', '70% alcohol sanitizer, kills 99.9% of germs.', 'Personal Care', 3.99, 400, 'Ethanol', 'Apply as needed', 'CleanCo', 'Dry skin with frequent use.', false),
('Multivitamin Adults', '30-day supply of essential vitamins and minerals.', 'Vitamins', 9.99, 220, 'Vitamin & mineral blend', '1 tablet daily', 'WellLife', 'Generally well tolerated.', false),
('Insulin Glargine', 'Long-acting insulin for type 1 and 2 diabetes.', 'Diabetes', 28.00, 30, 'Insulin glargine', 'As prescribed', 'DiaCare', 'Hypoglycaemia, injection site reactions.', true);

-- Storage bucket for prescriptions (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('prescriptions', 'prescriptions', false);

CREATE POLICY "Users upload own prescriptions" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'prescriptions' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users view own prescriptions" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'prescriptions' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'pharmacist')
    OR public.has_role(auth.uid(), 'admin')
  ));
