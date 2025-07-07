-- Criar tabela para configurações PWA
CREATE TABLE IF NOT EXISTS public.pwa_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'SuperLoja',
  short_name TEXT NOT NULL DEFAULT 'SuperLoja',
  description TEXT NOT NULL DEFAULT 'Sua loja moderna de tecnologia',
  theme_color TEXT NOT NULL DEFAULT '#4F46E5',
  background_color TEXT NOT NULL DEFAULT '#ffffff',
  display TEXT NOT NULL DEFAULT 'standalone',
  orientation TEXT NOT NULL DEFAULT 'portrait-primary',
  start_url TEXT NOT NULL DEFAULT '/',
  scope TEXT NOT NULL DEFAULT '/',
  lang TEXT NOT NULL DEFAULT 'pt-BR',
  categories TEXT[] DEFAULT ARRAY['shopping', 'business'],
  icon_192 TEXT,
  icon_512 TEXT,
  icon_maskable TEXT,
  offline_page_enabled BOOLEAN DEFAULT true,
  offline_cache_strategy TEXT DEFAULT 'cache-first',
  push_notifications_enabled BOOLEAN DEFAULT false,
  app_shortcuts JSONB DEFAULT '[]',
  share_target JSONB DEFAULT '{}',
  screenshots JSONB DEFAULT '[]',
  install_prompt_enabled BOOLEAN DEFAULT true,
  install_prompt_delay INTEGER DEFAULT 3000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pwa_settings ENABLE ROW LEVEL SECURITY;

-- Criar políticas
CREATE POLICY "Admins podem gerenciar PWA" 
ON public.pwa_settings 
FOR ALL 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "PWA configurações são visíveis para todos" 
ON public.pwa_settings 
FOR SELECT 
USING (true);

-- Inserir configuração PWA padrão
INSERT INTO public.pwa_settings DEFAULT VALUES;

-- Criar trigger para timestamp
CREATE TRIGGER update_pwa_settings_updated_at
BEFORE UPDATE ON public.pwa_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();