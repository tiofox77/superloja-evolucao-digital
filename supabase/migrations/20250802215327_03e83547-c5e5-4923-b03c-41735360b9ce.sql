-- Criar tabela para configurações de redes sociais
CREATE TABLE IF NOT EXISTS public.social_media_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL UNIQUE, -- 'facebook', 'instagram'
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.social_media_settings ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Admins podem gerenciar configurações de redes sociais" 
ON public.social_media_settings 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Inserir configurações padrão
INSERT INTO public.social_media_settings (platform, settings, is_active) 
VALUES 
  ('facebook', '{"page_id": "", "access_token": "", "auto_post": false}'::jsonb, false),
  ('instagram', '{"business_id": "", "access_token": "", "auto_post": false}'::jsonb, false)
ON CONFLICT (platform) DO NOTHING;

-- Criar trigger para atualizar timestamps
CREATE TRIGGER update_social_media_settings_updated_at
BEFORE UPDATE ON public.social_media_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índice
CREATE INDEX idx_social_media_settings_platform ON public.social_media_settings(platform);
CREATE INDEX idx_social_media_settings_active ON public.social_media_settings(is_active);