-- Add product_url to items for duplicate-URL detection when adding to cart
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS product_url TEXT;

COMMENT ON COLUMN public.items.product_url IS 'Product/page URL when item was added; used to detect duplicates.';
