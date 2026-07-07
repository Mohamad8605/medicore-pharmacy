-- Seed additional medications for homepage category quick-pick links
-- Ensures each of the four categories has at least 3 products

INSERT INTO public.medications (name, description, category, price, stock, active_ingredient, dosage, manufacturer, side_effects, requires_prescription) VALUES
-- Pain & Fever (4 new + 0 existing)
('Naproxen 250mg', 'Anti-inflammatory pain relief for muscle and joint aches.', 'Pain & Fever', 8.50, 118, 'Naproxen', '250mg twice daily with food', 'Generic Pharma', 'Stomach upset, heartburn, dizziness.', false),
('Aspirin 500mg', 'Fast-acting pain relief and fever reducer.', 'Pain & Fever', 5.90, 196, 'Acetylsalicylic acid', '500mg every 4-6 hours as needed', 'Bayer', 'Stomach irritation, prolonged bleeding time.', false),
('Panadol 665mg', 'Extended-release paracetamol for longer-lasting pain relief.', 'Pain & Fever', 7.20, 173, 'Paracetamol', '665mg every 6-8 hours', 'Haleon', 'Rare: skin rash, liver issues with overdose.', false),
('Diclofenac Gel 1%', 'Topical gel for localized joint and muscle pain.', 'Pain & Fever', 11.00, 88, 'Diclofenac diethylamine', 'Apply 3-4 times daily', 'Novartis', 'Mild skin irritation at application site.', false),

-- Cold & Flu (3 new + 1 existing = 4 total)
('Cold & Flu Tablets', 'Multi-symptom relief for runny nose, fever and body aches.', 'Cold & Flu', 9.50, 147, 'Paracetamol, Phenylephrine, Vitamin C', '1-2 tablets every 6 hours', 'WellLife', 'Drowsiness, dry mouth, mild headache.', false),
('Nasal Spray Xylometazoline', 'Fast decongestant spray for blocked nose.', 'Cold & Flu', 6.80, 203, 'Xylometazoline HCl', '1 spray per nostril up to 3 times daily', 'BreathePlus', 'Local irritation, rebound congestion with overuse.', false),
('Echinacea Drops', 'Herbal immune support to reduce cold duration.', 'Cold & Flu', 8.90, 127, 'Echinacea purpurea extract', '20 drops 3 times daily', 'HerbaNord', 'Mild allergic reaction in sensitive individuals.', false),

-- Mother & Baby (4 new + 0 existing)
('Baby Paracetamol 125mg', 'Gentle fever and pain relief for infants 3-12 months.', 'Mother & Baby', 6.50, 178, 'Paracetamol', '2.5ml every 4-6 hours', 'WellLife', 'Rare allergic reaction.', false),
('Nappy Rash Cream', 'Protective barrier cream soothes and prevents nappy rash.', 'Mother & Baby', 7.90, 218, 'Zinc oxide, Panthenol', 'Apply at each nappy change', 'Bepanthen', 'Generally well tolerated.', false),
('Baby Multivitamin Drops', 'Essential vitamins A, C, D for healthy growth.', 'Mother & Baby', 12.00, 159, 'Vitamins A, C, D', '1ml daily', 'WellLife', 'Generally well tolerated.', false),
('Pregnancy Multivitamin', 'Folic acid, iron, omega-3 for before and during pregnancy.', 'Mother & Baby', 14.00, 97, 'Folic acid, Iron, DHA, Vitamins B12, D', '1 tablet daily', 'Elevit', 'Mild nausea, constipation possible.', false),

-- Skin & Wound Care (4 new + 0 existing)
('Wound Healing Ointment', 'Antiseptic cream for cuts, scrapes and minor wounds.', 'Skin & Wound Care', 8.50, 139, 'Dexpanthenol, Chlorhexidine', 'Apply thin layer 1-2 times daily', 'Bepanthen', 'Rare skin irritation.', false),
('Hydrocortisone Cream 1%', 'Anti-itch treatment for eczema, dermatitis and rashes.', 'Skin & Wound Care', 9.00, 108, 'Hydrocortisone', 'Apply thin layer up to 2 times daily', 'Novartis', 'Skin thinning with prolonged use.', false),
('Burn Relief Gel', 'Cooling gel for minor burns and sunburn relief.', 'Skin & Wound Care', 7.50, 92, 'Lidocaine, Aloe vera', 'Apply as needed', 'BurnShield', 'Temporary stinging on application.', false),
('Zinc Oxide Ointment', 'Protective treatment for irritated and chapped skin.', 'Skin & Wound Care', 6.90, 199, 'Zinc oxide', 'Apply as needed', 'Desitin', 'Generally well tolerated.', false);
