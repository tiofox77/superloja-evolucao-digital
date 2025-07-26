-- Add order number sequence and improve order organization
ALTER TABLE public.orders ADD COLUMN order_number SERIAL;
ALTER TABLE public.orders ADD COLUMN order_date DATE DEFAULT CURRENT_DATE;

-- Update existing orders to have sequential numbers and proper dates
UPDATE public.orders 
SET order_date = created_at::date 
WHERE order_date IS NULL;

-- Create index for better performance
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_order_date ON public.orders(order_date);