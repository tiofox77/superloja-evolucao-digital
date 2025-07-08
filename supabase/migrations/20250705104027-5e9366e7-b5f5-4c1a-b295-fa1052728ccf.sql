-- Criar bucket para imagens se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para upload de imagens
CREATE POLICY IF NOT EXISTS "Admins podem fazer upload de imagens" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'product-images' AND 
  (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'
);

CREATE POLICY IF NOT EXISTS "Imagens são públicas" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY IF NOT EXISTS "Admins podem deletar imagens" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'product-images' AND 
  (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'
);

-- Tabela de promoções
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')) DEFAULT 'percentage',
  discount_value DECIMAL(10,2) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para promoções
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Promoções são visíveis para todos" 
ON public.promotions 
FOR SELECT 
USING (true);

CREATE POLICY IF NOT EXISTS "Admins podem gerenciar promoções" 
ON public.promotions 
FOR ALL 
USING ((SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin');

-- Tabela de configurações da loja
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para configurações
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Configurações são visíveis para admins" 
ON public.store_settings 
FOR SELECT 
USING ((SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin');

CREATE POLICY IF NOT EXISTS "Admins podem gerenciar configurações" 
ON public.store_settings 
FOR ALL 
USING ((SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin');

-- Inserir configurações padrão
INSERT INTO public.store_settings (setting_key, setting_value, description) VALUES
('store_name', '"SuperLoja"', 'Nome da loja'),
('store_email', '"contato@superloja.com"', 'Email da loja'),
('store_phone', '"+244 XXX XXX XXX"', 'Telefone da loja'),
('currency', '"AOA"', 'Moeda padrão'),
('tax_rate', '14', 'Taxa de imposto em %')
ON CONFLICT (setting_key) DO NOTHING;