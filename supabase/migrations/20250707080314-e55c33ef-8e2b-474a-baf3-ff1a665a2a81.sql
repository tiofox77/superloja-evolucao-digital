-- Criar tabela para configurações do layout editável
CREATE TABLE IF NOT EXISTS public.layout_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_name TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.layout_settings ENABLE ROW LEVEL SECURITY;

-- Criar políticas
CREATE POLICY "Admins podem gerenciar layout" 
ON public.layout_settings 
FOR ALL 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Layout é visível para todos" 
ON public.layout_settings 
FOR SELECT 
USING (true);

-- Inserir configurações padrão
INSERT INTO public.layout_settings (section_name, content) VALUES
('hero', '{
  "title": "SuperLoja - Sua Evolução Digital",
  "subtitle": "Os melhores produtos tecnológicos com ofertas imperdíveis",
  "cta_text": "Ver Produtos",
  "cta_link": "/catalogo",
  "background_image": "/src/assets/hero-electronics.jpg",
  "show_stats": true
}'),
('footer', '{
  "company_description": "SuperLoja é sua parceira na evolução digital, oferecendo os melhores produtos tecnológicos de Angola.",
  "contact_info": {
    "address": "Luanda, Angola",
    "phone": "+244 942 705 533",
    "email": "contato@superloja.com"
  },
  "social_links": {
    "facebook": "",
    "instagram": "",
    "whatsapp": ""
  },
  "quick_links": [
    {"name": "Sobre Nós", "url": "/sobre"},
    {"name": "Contato", "url": "/contato"},
    {"name": "Termos", "url": "/termos"},
    {"name": "Privacidade", "url": "/privacidade"}
  ]
}'),
('about', '{
  "title": "Sobre a SuperLoja",
  "content": "Somos uma empresa angolana especializada em tecnologia, comprometida em oferecer os melhores produtos e serviços para nossos clientes.",
  "mission": "Democratizar o acesso à tecnologia em Angola",
  "vision": "Ser a principal referência em tecnologia do país",
  "values": ["Qualidade", "Inovação", "Compromisso", "Transparência"]
}'),
('contact', '{
  "title": "Fale Conosco",
  "subtitle": "Estamos aqui para ajudar você",
  "contact_methods": [
    {"type": "phone", "label": "Telefone", "value": "+244 942 705 533"},
    {"type": "email", "label": "Email", "value": "contato@superloja.com"},
    {"type": "whatsapp", "label": "WhatsApp", "value": "+244942705533"},
    {"type": "address", "label": "Endereço", "value": "Luanda, Angola"}
  ],
  "business_hours": {
    "weekdays": "08:00 - 18:00",
    "saturday": "08:00 - 14:00",
    "sunday": "Fechado"
  }
}');

-- Criar trigger para timestamp
CREATE TRIGGER update_layout_settings_updated_at
BEFORE UPDATE ON public.layout_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();