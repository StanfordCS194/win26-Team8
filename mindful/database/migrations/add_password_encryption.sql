-- Migration: Add password encryption using pgcrypto
-- Run in Supabase SQL Editor

-- 1. Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Update set_unlock_password to hash the password before storing
CREATE OR REPLACE FUNCTION public.set_unlock_password(
  p_token UUID,
  p_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record RECORD;
  v_hashed TEXT;
BEGIN
  -- Look up the friend_unlock_emails record by token
  SELECT id, item_id, password_set_at
  INTO v_record
  FROM public.friend_unlock_emails
  WHERE friend_token = p_token;

  -- Token not found
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired link');
  END IF;

  -- Validate password length
  IF p_password IS NULL OR length(trim(p_password)) < 4 THEN
    RETURN json_build_object('success', false, 'error', 'Password must be at least 4 characters');
  END IF;

  -- Hash the password using bcrypt
  v_hashed := crypt(trim(p_password), gen_salt('bf'));

  -- Save hashed password to friend_unlock_emails
  UPDATE public.friend_unlock_emails
  SET unlock_password = v_hashed,
      password_set_at = now()
  WHERE friend_token = p_token;

  -- Save hashed password to items table
  UPDATE public.items
  SET unlock_password = v_hashed
  WHERE id = v_record.item_id;

  RETURN json_build_object('success', true);
END;
$$;

-- 3. Create verify_unlock_password function for server-side comparison
CREATE OR REPLACE FUNCTION public.verify_unlock_password(
  p_item_id UUID,
  p_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stored_hash TEXT;
BEGIN
  -- Look up the stored hash from items table
  SELECT unlock_password
  INTO v_stored_hash
  FROM public.items
  WHERE id = p_item_id;

  -- Item not found
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Item not found');
  END IF;

  -- No password set yet
  IF v_stored_hash IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No password has been set yet');
  END IF;

  -- Compare using crypt: if crypt(input, stored_hash) = stored_hash, it matches
  IF crypt(trim(p_password), v_stored_hash) = v_stored_hash THEN
    RETURN json_build_object('success', true);
  ELSE
    RETURN json_build_object('success', false, 'error', 'Incorrect password');
  END IF;
END;
$$;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION public.verify_unlock_password(UUID, TEXT) TO authenticated;
