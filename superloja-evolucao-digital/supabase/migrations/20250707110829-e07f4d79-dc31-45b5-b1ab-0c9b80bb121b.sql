-- Estender tabela products para incluir funcionalidades de leilão
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_auction BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS auction_start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS auction_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS starting_bid NUMERIC;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS current_bid NUMERIC;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS bid_increment NUMERIC DEFAULT 1.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS reserve_price NUMERIC;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS auto_extend_minutes INTEGER DEFAULT 5;

-- Criar tabela de lances
CREATE TABLE public.auction_bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  bidder_name TEXT NOT NULL,
  bidder_email TEXT NOT NULL,
  bidder_phone TEXT,
  bid_amount NUMERIC NOT NULL,
  bid_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_winning BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para configurações do Meta/Facebook
CREATE TABLE public.meta_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pixel_id TEXT,
  access_token TEXT,
  app_id TEXT,
  app_secret TEXT,
  catalog_id TEXT,
  page_id TEXT,
  instagram_id TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para sincronização de produtos com Facebook
CREATE TABLE public.facebook_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  facebook_product_id TEXT,
  sync_status TEXT DEFAULT 'pending',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_products ENABLE ROW LEVEL SECURITY;

-- Políticas para auction_bids
CREATE POLICY "Qualquer um pode criar lances" 
ON public.auction_bids 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Lances são visíveis para todos" 
ON public.auction_bids 
FOR SELECT 
USING (true);

CREATE POLICY "Admins podem gerenciar lances" 
ON public.auction_bids 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Políticas para meta_settings
CREATE POLICY "Admins podem gerenciar configurações Meta" 
ON public.meta_settings 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Políticas para facebook_products
CREATE POLICY "Admins podem gerenciar produtos Facebook" 
ON public.facebook_products 
FOR ALL 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Produtos Facebook são visíveis para admins" 
ON public.facebook_products 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_products_is_auction ON public.products(is_auction);
CREATE INDEX IF NOT EXISTS idx_products_auction_end_date ON public.products(auction_end_date);
CREATE INDEX IF NOT EXISTS idx_auction_bids_product_id ON public.auction_bids(product_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_bid_time ON public.auction_bids(bid_time);
CREATE INDEX IF NOT EXISTS idx_facebook_products_product_id ON public.facebook_products(product_id);

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_auction_bids_updated_at
BEFORE UPDATE ON public.auction_bids
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meta_settings_updated_at
BEFORE UPDATE ON public.meta_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_facebook_products_updated_at
BEFORE UPDATE ON public.facebook_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para atualizar lance vencedor
CREATE OR REPLACE FUNCTION public.update_winning_bid()
RETURNS TRIGGER AS $$
BEGIN
  -- Resetar todos os lances como não vencedores para este produto
  UPDATE public.auction_bids 
  SET is_winning = false 
  WHERE product_id = NEW.product_id;
  
  -- Marcar o lance atual como vencedor
  UPDATE public.auction_bids 
  SET is_winning = true 
  WHERE id = NEW.id;
  
  -- Atualizar o lance atual no produto
  UPDATE public.products 
  SET current_bid = NEW.bid_amount 
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar lance vencedor
CREATE TRIGGER update_winning_bid_trigger
AFTER INSERT ON public.auction_bids
FOR EACH ROW
EXECUTE FUNCTION public.update_winning_bid();