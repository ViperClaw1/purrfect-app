-- Drop and recreate the public_profiles view with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  username,
  display_name,
  bio,
  avatar_url,
  is_premium,
  created_at,
  updated_at
FROM public.profiles;

-- Grant SELECT access to both anonymous and authenticated users
GRANT SELECT ON public.public_profiles TO anon, authenticated;