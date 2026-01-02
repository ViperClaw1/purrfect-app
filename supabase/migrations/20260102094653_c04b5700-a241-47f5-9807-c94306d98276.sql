-- Create lightning_stickers table for premium users to give posts lightning stickers
CREATE TABLE public.lightning_stickers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, post_id)
);

-- Enable Row Level Security
ALTER TABLE public.lightning_stickers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Lightning stickers are viewable by everyone" 
ON public.lightning_stickers 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own lightning stickers" 
ON public.lightning_stickers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lightning stickers" 
ON public.lightning_stickers 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add is_premium column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_premium BOOLEAN NOT NULL DEFAULT false;

-- Add stripe_customer_id to profiles for tracking
ALTER TABLE public.profiles
ADD COLUMN stripe_customer_id TEXT;