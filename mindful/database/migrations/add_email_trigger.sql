-- Migration: Add pg_net trigger to send friend unlock emails server-side
-- This avoids CORS issues by sending emails from PostgreSQL, not the browser
-- Run in Supabase SQL Editor

-- 1. Enable pg_net extension (may already be enabled)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Add columns to store email content (needed by the trigger)
ALTER TABLE public.friend_unlock_emails
ADD COLUMN IF NOT EXISTS friend_name TEXT;

ALTER TABLE public.friend_unlock_emails
ADD COLUMN IF NOT EXISTS user_name TEXT;

ALTER TABLE public.friend_unlock_emails
ADD COLUMN IF NOT EXISTS item_name TEXT;

-- 3. Create trigger function that sends email via Resend API using pg_net
CREATE OR REPLACE FUNCTION public.send_friend_unlock_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_friend_name TEXT;
  v_user_name TEXT;
  v_item_name TEXT;
  v_password TEXT;
  v_subject TEXT;
  v_html TEXT;
  v_request_id BIGINT;
BEGIN
  v_friend_name := COALESCE(NEW.friend_name, 'there');
  v_user_name := COALESCE(NEW.user_name, 'Your friend');
  v_item_name := COALESCE(NEW.item_name, 'an item');
  v_password := COALESCE(NEW.unlock_password, '');
  v_subject := v_user_name || ' needs your help with a goal!';

  v_html := '<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">'
    || '<h1 style="color: #255736; font-size: 24px;">Hi ' || v_friend_name || '!</h1>'
    || '<p style="color: #333; line-height: 1.6;">'
    || '<strong>' || v_user_name || '</strong> is using <strong>Second Thought</strong> to practice '
    || 'mindful consumption. They''ve set a goal they need to complete before purchasing '
    || '<strong>' || v_item_name || '</strong>.</p>'
    || '<p style="color: #333; line-height: 1.6;">'
    || 'They''ve chosen you as their accountability partner! Here is the unlock password '
    || 'that they''ll need to enter once they''ve completed their goal:</p>'
    || '<div style="text-align: center; margin: 32px 0; padding: 20px; background-color: #f0f5f1; border-radius: 12px; border: 2px solid #255736;">'
    || '<p style="color: #666; font-size: 14px; margin: 0 0 8px 0;">Unlock Password</p>'
    || '<p style="color: #255736; font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 0;">'
    || v_password || '</p></div>'
    || '<p style="color: #666; font-size: 14px; line-height: 1.5;">'
    || 'Please share this password with ' || v_user_name || ' only after they''ve '
    || 'completed their goal.</p>'
    || '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />'
    || '<p style="color: #999; font-size: 12px;">'
    || 'This email was sent by Second Thought. If you didn''t expect this, you can ignore it.</p>'
    || '</div>';

  -- Send email via Resend API using pg_net
  SELECT net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.resend_api_key', true)
    ),
    body := jsonb_build_object(
      'from', 'Second Thought <noreply@secondthoughtcart.com>',
      'to', jsonb_build_array(NEW.friend_email),
      'subject', v_subject,
      'html', v_html
    )
  ) INTO v_request_id;

  -- Mark as sent
  UPDATE public.friend_unlock_emails
  SET sent_at = now()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- 4. Create trigger on INSERT
DROP TRIGGER IF EXISTS trigger_send_friend_email ON public.friend_unlock_emails;
CREATE TRIGGER trigger_send_friend_email
  AFTER INSERT ON public.friend_unlock_emails
  FOR EACH ROW
  EXECUTE FUNCTION public.send_friend_unlock_email();

-- 5. Store the Resend API key as a database setting
-- IMPORTANT: Replace 'your_resend_api_key' with your actual Resend API key
ALTER DATABASE postgres SET app.resend_api_key = 'your_resend_api_key';
