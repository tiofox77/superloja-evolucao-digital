-- Update the orders table constraint to allow web orders
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_source_check;

-- Add new constraint that allows both 'pos' and 'web' values
ALTER TABLE public.orders ADD CONSTRAINT orders_order_source_check 
CHECK (order_source IN ('pos', 'web'));

-- Update the default value to be more appropriate for web orders
ALTER TABLE public.orders ALTER COLUMN order_source SET DEFAULT 'web';