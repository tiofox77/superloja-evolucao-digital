-- Criar tabela para armazenar banners gerados automaticamente
CREATE TABLE public.generated_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id),
  banner_data JSONB NOT NULL,
  post_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed BOOLEAN DEFAULT false,
  image_url TEXT
);

-- Criar índices para melhor performance
CREATE INDEX idx_generated_banners_product_id ON public.generated_banners(product_id);
CREATE INDEX idx_generated_banners_created_at ON public.generated_banners(created_at);
CREATE INDEX idx_generated_banners_processed ON public.generated_banners(processed);

-- Habilitar RLS
ALTER TABLE public.generated_banners ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS (admin only)
CREATE POLICY "Admin can manage generated banners" 
ON public.generated_banners 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Comentários
COMMENT ON TABLE public.generated_banners IS 'Armazena banners gerados automaticamente para posts de redes sociais';
COMMENT ON COLUMN public.generated_banners.banner_data IS 'Dados JSON contendo HTML, configurações e informações do banner';
COMMENT ON COLUMN public.generated_banners.post_type IS 'Tipo de post: product, promotional, engagement, custom';
COMMENT ON COLUMN public.generated_banners.processed IS 'Indica se o banner foi processado e convertido em imagem';
COMMENT ON COLUMN public.generated_banners.image_url IS 'URL da imagem final do banner após processamento';