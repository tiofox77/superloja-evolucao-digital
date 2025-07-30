-- Adicionar informação sobre entregas na base de conhecimento
INSERT INTO public.ai_knowledge_base (category, question, answer, keywords, priority, active) 
VALUES 
  ('entregas', 'Vocês fazem entregas fora de Luanda?', 'Sim, fazemos entregas fora de Luanda, porém essas entregas têm custo adicional. Entregas gratuitas são apenas dentro de Luanda. Para entregas fora de Luanda, entre em contato conosco para calcular o custo do frete baseado na localização.', ARRAY['entrega', 'frete', 'luanda', 'fora', 'custo', 'grátis', 'gratuita'], 3, true),
  ('entregas', 'Qual o custo de entrega fora de Luanda?', 'As entregas fora de Luanda têm custo variável dependendo da distância e localização. Entre em contato conosco pelo WhatsApp ou telefone para calcularmos o valor exato do frete para sua região.', ARRAY['custo', 'entrega', 'frete', 'fora', 'luanda', 'valor'], 3, true),
  ('produtos', 'Diferença entre fones e cabos', 'Fones de ouvido são dispositivos de áudio para escutar música, fazer chamadas. Cabos são acessórios para conectar, carregar ou transferir dados entre dispositivos. Quando solicitar um produto, seja específico sobre o que deseja.', ARRAY['fones', 'cabos', 'diferença', 'áudio', 'conexão'], 2, true);

-- Criar tabela para feedback e aprendizado da IA
CREATE TABLE IF NOT EXISTS public.ai_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  conversation_id UUID,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  user_feedback TEXT,
  is_correct BOOLEAN DEFAULT NULL,
  correction_provided TEXT,
  learning_applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela de feedback
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

-- Criar políticas para feedback
CREATE POLICY "Sistema pode gerenciar feedback IA" 
ON public.ai_feedback 
FOR ALL 
USING (true);

CREATE POLICY "Admins podem ver feedback IA" 
ON public.ai_feedback 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Criar trigger para atualizar timestamp
CREATE TRIGGER update_ai_feedback_updated_at
BEFORE UPDATE ON public.ai_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();