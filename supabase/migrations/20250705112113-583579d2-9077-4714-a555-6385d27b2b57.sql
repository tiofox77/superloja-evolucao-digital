-- Add active field to products table for deactivation feature
ALTER TABLE public.products 
ADD COLUMN active boolean DEFAULT true;

-- Add location fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN country text,
ADD COLUMN province text, 
ADD COLUMN city text,
ADD COLUMN street text;

-- Create settings table for system configuration
CREATE TABLE public.settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on settings table
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create policies for settings table
CREATE POLICY "Admins podem gerenciar configurações" 
ON public.settings 
FOR ALL 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Configurações são visíveis para admins" 
ON public.settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Add trigger for settings updated_at
CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.settings (key, value, description) VALUES
('store_info', '{"name": "SuperLoja", "description": "A melhor loja de eletrônicos de Angola", "logo_url": null}', 'Informações básicas da loja'),
('contact_info', '{"email": "contato@superloja.com", "phone": "+244 900 000 000", "address": "Luanda, Angola"}', 'Informações de contato'),
('system_settings', '{"notifications_enabled": true, "auto_backup": true, "maintenance_mode": false}', 'Configurações do sistema'),
('business_info', '{"business_hours": "9:00 - 18:00", "website": "", "social_media": {}}', 'Informações do negócio');