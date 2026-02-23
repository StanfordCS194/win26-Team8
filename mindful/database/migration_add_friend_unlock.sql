-- Migration: Add friend unlock functionality
-- Run this in your Supabase SQL Editor: https://mohgivduzthccoybnbnr.supabase.co/project/_/sql/new

-- Add friend unlock columns to items table if they don't exist
ALTER TABLE public.items 
ADD COLUMN IF NOT EXISTS friend_name TEXT,
ADD COLUMN IF NOT EXISTS friend_email TEXT,
ADD COLUMN IF NOT EXISTS unlock_password TEXT,
ADD COLUMN IF NOT EXISTS is_unlocked BOOLEAN DEFAULT FALSE;

-- Create friend_unlock_emails table to track email sending
CREATE TABLE IF NOT EXISTS public.friend_unlock_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  friend_email TEXT NOT NULL,
  unlock_password TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(item_id, friend_email)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_friend_unlock_emails_item_id ON public.friend_unlock_emails(item_id);
CREATE INDEX IF NOT EXISTS idx_friend_unlock_emails_friend_email ON public.friend_unlock_emails(friend_email);
CREATE INDEX IF NOT EXISTS idx_friend_unlock_emails_sent_at ON public.friend_unlock_emails(sent_at);

-- Enable RLS on friend_unlock_emails table
ALTER TABLE public.friend_unlock_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own friend unlock emails (via items they own)
CREATE POLICY "Users can view friend unlock emails for their items"
ON public.friend_unlock_emails
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.items
    WHERE items.id = friend_unlock_emails.item_id
    AND items.user_id = auth.uid()
  )
);

-- RLS Policy: Users can insert friend unlock emails for their items
CREATE POLICY "Users can insert friend unlock emails for their items"
ON public.friend_unlock_emails
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.items
    WHERE items.id = friend_unlock_emails.item_id
    AND items.user_id = auth.uid()
  )
);

-- RLS Policy: Users can update friend unlock emails for their items
CREATE POLICY "Users can update friend unlock emails for their items"
ON public.friend_unlock_emails
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.items
    WHERE items.id = friend_unlock_emails.item_id
    AND items.user_id = auth.uid()
  )
);

-- RLS Policy: Users can delete friend unlock emails for their items
CREATE POLICY "Users can delete friend unlock emails for their items"
ON public.friend_unlock_emails
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.items
    WHERE items.id = friend_unlock_emails.item_id
    AND items.user_id = auth.uid()
  )
);
