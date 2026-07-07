-- Remove "patient" role from users who also have "admin" or "pharmacist"
DELETE FROM user_roles
WHERE role = 'patient'
  AND user_id IN (
    SELECT user_id FROM user_roles
    WHERE role IN ('admin', 'pharmacist')
  );

-- Update "Admin User" profile to a real name if it still exists
UPDATE profiles
SET first_name = 'Sarah', last_name = 'Müller'
WHERE first_name = 'Admin' AND last_name = 'User';
