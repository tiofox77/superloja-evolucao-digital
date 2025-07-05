-- Adicionar campos de variantes e produtos digitais à tabela products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'physical';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_digital BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS digital_file_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS license_key TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS download_limit INTEGER;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '[]';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS material TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight DECIMAL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dimensions TEXT;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_products_product_type ON public.products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_is_digital ON public.products(is_digital);
CREATE INDEX IF NOT EXISTS idx_products_variants ON public.products USING GIN(variants);
CREATE INDEX IF NOT EXISTS idx_products_colors ON public.products USING GIN(colors);

-- Comentários para documentação
COMMENT ON COLUMN public.products.product_type IS 'Tipo do produto: physical, digital, service';
COMMENT ON COLUMN public.products.is_digital IS 'Se o produto é digital (download)';
COMMENT ON COLUMN public.products.digital_file_url IS 'URL do arquivo digital para download';
COMMENT ON COLUMN public.products.license_key IS 'Chave de licença para produtos digitais';
COMMENT ON COLUMN public.products.download_limit IS 'Limite de downloads para produtos digitais';
COMMENT ON COLUMN public.products.variants IS 'Variantes do produto (JSON array)';
COMMENT ON COLUMN public.products.colors IS 'Cores disponíveis (JSON array)';
COMMENT ON COLUMN public.products.sizes IS 'Tamanhos disponíveis (JSON array)';
COMMENT ON COLUMN public.products.material IS 'Material do produto';
COMMENT ON COLUMN public.products.weight IS 'Peso do produto em kg';
COMMENT ON COLUMN public.products.dimensions IS 'Dimensões do produto (ex: 10x20x30cm)';