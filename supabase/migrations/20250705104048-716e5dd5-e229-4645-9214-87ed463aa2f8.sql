-- Criar bucket para imagens se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Admins podem fazer upload de imagens" ON storage.objects;
DROP POLICY IF EXISTS "Imagens são públicas" ON storage.objects;
DROP POLICY IF EXISTS "Admins podem deletar imagens" ON storage.objects;

-- Políticas para upload de imagens
CREATE POLICY "Admins podem fazer upload de imagens" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'product-images' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Imagens são públicas" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Admins podem deletar imagens" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'product-images' AND 
  auth.uid() IS NOT NULL
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

DROP POLICY IF EXISTS "Promoções são visíveis para todos" ON public.promotions;
DROP POLICY IF EXISTS "Admins podem gerenciar promoções" ON public.promotions;

CREATE POLICY "Promoções são visíveis para todos" 
ON public.promotions 
FOR SELECT 
USING (true);

CREATE POLICY "Admins podem gerenciar promoções" 
ON public.promotions 
FOR ALL 
USING (auth.uid() IS NOT NULL);