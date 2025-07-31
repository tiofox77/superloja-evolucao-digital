-- Atualizar informações incorretas na base de conhecimento
UPDATE public.ai_knowledge_base SET 
  answer = 'Nosso WhatsApp é 939729902. Link direto: https://wa.me/244939729902. Estamos localizados no Kilamba J13, Luanda.',
  keywords = ARRAY['whatsapp', 'contacto', 'contato', 'telefone', '939729902']
WHERE question ILIKE '%contacto%' OR question ILIKE '%whatsapp%';

-- Atualizar informações sobre entrega em Luanda
UPDATE public.ai_knowledge_base SET 
  answer = 'Entrega GRÁTIS em Luanda! Nossa loja fica no Kilamba J13, você também pode recolher diretamente.',
  keywords = ARRAY['entrega', 'luanda', 'gratis', 'gratuita', 'custo', 'valor']
WHERE question ILIKE '%entrega%' AND question ILIKE '%luanda%' AND NOT question ILIKE '%fora%';

-- Atualizar informações sobre entrega fora de Luanda
UPDATE public.ai_knowledge_base SET 
  answer = 'Para entrega fora de Luanda (outras províncias), fazemos orçamento personalizado. Contacte 939729902 para mais detalhes.',
  keywords = ARRAY['entrega', 'provincia', 'fora', 'luanda', 'orcamento', 'custo']
WHERE (question ILIKE '%fora%' AND question ILIKE '%luanda%') OR (question ILIKE '%provincia%' AND question ILIKE '%entrega%');

-- Adicionar entrada específica para WhatsApp se não existir
INSERT INTO public.ai_knowledge_base (category, question, answer, keywords, priority, active)
SELECT 'contactos', 'qual vosso whatsapp', 'Nosso WhatsApp é 939729902. Link direto: https://wa.me/244939729902. Estamos localizados no Kilamba J13, Luanda.', ARRAY['whatsapp', 'qual', 'vosso', 'numero', '939729902'], 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.ai_knowledge_base WHERE question = 'qual vosso whatsapp');

-- Adicionar entrada específica para entrega Luanda se não existir
INSERT INTO public.ai_knowledge_base (category, question, answer, keywords, priority, active)
SELECT 'entrega', 'quanto custa entrega em luanda', 'Entrega GRÁTIS em Luanda! Nossa loja fica no Kilamba J13, você também pode recolher diretamente.', ARRAY['entrega', 'luanda', 'gratis', 'quanto', 'custa'], 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.ai_knowledge_base WHERE question = 'quanto custa entrega em luanda');

-- Adicionar entrada específica para entrega província se não existir
INSERT INTO public.ai_knowledge_base (category, question, answer, keywords, priority, active)
SELECT 'entrega', 'quanto custa entrega fora de luanda nas provincia', 'Para entrega fora de Luanda (outras províncias), fazemos orçamento personalizado. Contacte 939729902 para mais detalhes.', ARRAY['entrega', 'provincia', 'fora', 'luanda', 'orcamento'], 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.ai_knowledge_base WHERE question = 'quanto custa entrega fora de luanda nas provincia');