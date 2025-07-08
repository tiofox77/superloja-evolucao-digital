-- Criar tabelas para SEO e Analytics

-- Tabela para configurações SEO globais
CREATE TABLE public.seo_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_type TEXT NOT NULL, -- 'global', 'product', 'category', 'custom'
  page_slug TEXT,
  title TEXT,
  description TEXT,
  keywords TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  twitter_title TEXT,
  twitter_description TEXT,
  twitter_image TEXT,
  canonical_url TEXT,
  robots TEXT DEFAULT 'index,follow',
  schema_markup JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para analytics de visitantes
CREATE TABLE public.visitor_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL, -- ID único do visitante (gerado no frontend)
  session_id TEXT NOT NULL,
  page_url TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  country TEXT,
  region TEXT,
  city TEXT,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  browser TEXT,
  os TEXT,
  screen_resolution TEXT,
  language TEXT,
  visit_duration INTEGER DEFAULT 0, -- em segundos
  page_views INTEGER DEFAULT 1,
  is_bounce BOOLEAN DEFAULT false,
  conversion_event TEXT, -- 'purchase', 'signup', 'contact', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para eventos de analytics
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'page_view', 'click', 'scroll', 'purchase', etc.
  event_data JSONB,
  page_url TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para relatórios personalizados
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL, -- 'sales', 'traffic', 'products', 'users'
  parameters JSONB,
  schedule TEXT, -- 'daily', 'weekly', 'monthly'
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar campos SEO aos produtos existentes
ALTER TABLE public.products ADD COLUMN seo_title TEXT;
ALTER TABLE public.products ADD COLUMN seo_description TEXT;
ALTER TABLE public.products ADD COLUMN seo_keywords TEXT;
ALTER TABLE public.products ADD COLUMN og_image TEXT;

-- Criar índices para performance
CREATE INDEX idx_visitor_analytics_visitor_id ON public.visitor_analytics(visitor_id);
CREATE INDEX idx_visitor_analytics_created_at ON public.visitor_analytics(created_at);
CREATE INDEX idx_visitor_analytics_country ON public.visitor_analytics(country);
CREATE INDEX idx_analytics_events_visitor_id ON public.analytics_events(visitor_id);
CREATE INDEX idx_analytics_events_timestamp ON public.analytics_events(timestamp);
CREATE INDEX idx_seo_settings_page_type ON public.seo_settings(page_type);
CREATE INDEX idx_seo_settings_page_slug ON public.seo_settings(page_slug);

-- RLS Policies
ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Políticas para SEO (admins podem gerenciar)
CREATE POLICY "Admins podem gerenciar configurações SEO" 
ON public.seo_settings 
FOR ALL 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "SEO é visível para todos" 
ON public.seo_settings 
FOR SELECT 
USING (true);

-- Políticas para Analytics (público pode inserir, admins podem ver)
CREATE POLICY "Qualquer um pode inserir dados de analytics" 
ON public.visitor_analytics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins podem ver analytics" 
ON public.visitor_analytics 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Qualquer um pode inserir eventos" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins podem ver eventos" 
ON public.analytics_events 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Políticas para relatórios
CREATE POLICY "Admins podem gerenciar relatórios" 
ON public.reports 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_seo_settings_updated_at
  BEFORE UPDATE ON public.seo_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_visitor_analytics_updated_at
  BEFORE UPDATE ON public.visitor_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();