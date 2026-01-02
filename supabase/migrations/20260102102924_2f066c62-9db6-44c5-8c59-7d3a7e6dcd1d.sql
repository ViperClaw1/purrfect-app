-- Create a public view that excludes sensitive stripe_customer_id
CREATE OR REPLACE VIEW public.public_profiles AS
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

-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a new policy that only allows users to view their own full profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Allow public read access to the view (which excludes stripe_customer_id)
GRANT SELECT ON public.public_profiles TO anon, authenticated;