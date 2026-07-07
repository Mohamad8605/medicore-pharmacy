-- Performance indexes for frequently queried columns.
-- These reduce sequential scans as the dataset grows.

-- Orders are frequently looked up by user (profile page) and status (admin dashboard)
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);

-- Order items are always joined via order_id
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_medication_id ON public.order_items (medication_id);

-- Medications filtered by category and active status
CREATE INDEX IF NOT EXISTS idx_medications_category ON public.medications (category);
CREATE INDEX IF NOT EXISTS idx_medications_is_active ON public.medications (is_active);

-- User roles lookups on every authenticated request
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
