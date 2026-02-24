-- Rollback: remove product_url from items (undo add_product_url.sql)
-- Run this in Supabase SQL Editor if you want to revert the duplicate-URL feature.

ALTER TABLE public.items
DROP COLUMN IF EXISTS product_url;
