-- Reassign existing medication categories to match homepage quick-pick links
-- This makes the 4 category links on the homepage actually filter products

UPDATE public.medications SET category = 'Pain & Fever' WHERE name IN ('Paracetamol 500mg', 'Ibuprofen 400mg');

UPDATE public.medications SET category = 'Cold & Flu' WHERE name IN ('Salbutamol Inhaler');

UPDATE public.medications SET category = 'Mother & Baby' WHERE name IN ('Omeprazole 20mg', 'Multivitamin Adults', 'Vitamin D3 1000 IU', 'Insulin Glargine');

UPDATE public.medications SET category = 'Skin & Wound Care' WHERE name IN ('Hand Sanitizer 250ml', 'Amoxicillin 500mg', 'Cetirizine 10mg', 'Loratadine 10mg');

-- Cough Syrup 200ml is already 'Cold & Flu' — no update needed
