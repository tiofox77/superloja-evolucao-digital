-- Create table for product requests
CREATE TABLE public.product_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  estimated_price NUMERIC,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  additional_notes TEXT,
  images TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.product_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for product requests
CREATE POLICY "Anyone can create product requests" 
ON public.product_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all product requests" 
ON public.product_requests 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update product requests" 
ON public.product_requests 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_product_requests_updated_at
BEFORE UPDATE ON public.product_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();