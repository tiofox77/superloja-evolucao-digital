-- Criar tabela para posts agendados
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL, -- 'facebook', 'instagram', 'both'
  content TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'custom', -- 'product', 'promotional', 'engagement', 'custom'
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'posted', 'failed', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  posted_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Criar tabela para histórico de posts publicados
CREATE TABLE IF NOT EXISTS public.social_posts_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL,
  content TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id),
  post_type TEXT NOT NULL DEFAULT 'custom',
  results JSONB DEFAULT '[]'::jsonb, -- Resultados das APIs
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts_history ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Admins podem gerenciar posts agendados" 
ON public.scheduled_posts 
FOR ALL 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins podem ver histórico de posts" 
ON public.social_posts_history 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Sistema pode inserir histórico" 
ON public.social_posts_history 
FOR INSERT 
WITH CHECK (true);

-- Criar função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_scheduled_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar timestamps
CREATE TRIGGER update_scheduled_posts_updated_at
BEFORE UPDATE ON public.scheduled_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_scheduled_posts_updated_at();

-- Criar índices para performance
CREATE INDEX idx_scheduled_posts_platform ON public.scheduled_posts(platform);
CREATE INDEX idx_scheduled_posts_status ON public.scheduled_posts(status);
CREATE INDEX idx_scheduled_posts_scheduled_for ON public.scheduled_posts(scheduled_for);
CREATE INDEX idx_social_posts_history_platform ON public.social_posts_history(platform);
CREATE INDEX idx_social_posts_history_posted_at ON public.social_posts_history(posted_at);