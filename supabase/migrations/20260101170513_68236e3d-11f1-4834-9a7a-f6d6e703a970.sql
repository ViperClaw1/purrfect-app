-- Update the handle_new_user function to not expose email addresses
-- Instead, generate a random anonymous username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  random_suffix TEXT;
BEGIN
  -- Generate a random 8-character suffix for the username
  random_suffix := substr(md5(random()::text), 1, 8);
  
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (
    NEW.id, 
    'user_' || random_suffix,  -- Anonymous username, not email
    'Cat Lover'  -- Generic display name, user can customize later
  );
  RETURN NEW;
END;
$$;

-- Update existing profiles to remove email addresses from username field
-- Replace email usernames with anonymous ones
UPDATE public.profiles 
SET username = 'user_' || substr(md5(user_id::text), 1, 8)
WHERE username LIKE '%@%';