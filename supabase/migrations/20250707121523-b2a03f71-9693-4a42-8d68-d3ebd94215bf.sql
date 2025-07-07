-- Criar tabela para páginas estáticas
CREATE TABLE public.static_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  meta_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.static_pages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Páginas estáticas são visíveis para todos" 
ON public.static_pages 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins podem gerenciar páginas estáticas" 
ON public.static_pages 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE TRIGGER update_static_pages_updated_at
BEFORE UPDATE ON public.static_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar campo icon para categorias
ALTER TABLE public.categories 
ADD COLUMN icon TEXT;

-- Inserir páginas padrão
INSERT INTO public.static_pages (page_key, title, content, meta_description) VALUES
('about', 'Sobre Nós', 'A SuperLoja é uma empresa angolana especializada em tecnologia e eletrônicos. Oferecemos os melhores produtos com qualidade garantida e preços acessíveis para todo o território nacional.', 'Conheça a SuperLoja Angola - sua loja de confiança em tecnologia'),
('contact', 'Contato', 'Entre em contato conosco através dos nossos canais de atendimento. Estamos sempre prontos para ajudar você com suas dúvidas e necessidades.', 'Entre em contato com a SuperLoja Angola'),
('faq', 'Perguntas Frequentes', 'Encontre respostas para as principais dúvidas sobre nossos produtos, entregas, pagamentos e políticas da loja.', 'FAQ - Perguntas frequentes da SuperLoja'),
('terms', 'Termos de Uso', 'Ao utilizar nosso site, você concorda com os termos e condições estabelecidos. Leia atentamente todas as cláusulas antes de finalizar suas compras.', 'Termos de uso da SuperLoja Angola'),
('privacy', 'Política de Privacidade', 'Respeitamos sua privacidade. Esta política explica como coletamos, usamos e protegemos suas informações pessoais ao utilizar nossos serviços.', 'Política de privacidade da SuperLoja'),
('returns', 'Política de Devolução', 'Saiba como realizar devoluções e trocas de produtos. Temos políticas claras para garantir sua satisfação e tranquilidade nas compras.', 'Política de devolução da SuperLoja Angola');