-- Allow anon/authenticated to execute has_role (referenced in the medications SELECT policy)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;