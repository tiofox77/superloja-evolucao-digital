-- Criar tabela para contexto de conversas
CREATE TABLE IF NOT EXISTS public.ai_conversation_context (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  platform VARCHAR NOT NULL DEFAULT 'facebook',
  context_data JSONB NOT NULL DEFAULT '{}',
  last_interaction TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  message_count INTEGER NOT NULL DEFAULT 0,
  user_preferences JSONB DEFAULT '{}',
  conversation_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para aprendizado automático
CREATE TABLE IF NOT EXISTS public.ai_learning_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insight_type VARCHAR NOT NULL, -- 'frequent_question', 'user_pattern', 'response_improvement', etc
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  confidence_score NUMERIC DEFAULT 0.5,
  usage_count INTEGER DEFAULT 1,
  effectiveness_score NUMERIC DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Criar tabela para padrões de conversas
CREATE TABLE IF NOT EXISTS public.ai_conversation_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_name VARCHAR NOT NULL,
  trigger_keywords TEXT[] DEFAULT '{}',
  response_template TEXT NOT NULL,
  context_requirements JSONB DEFAULT '{}',
  priority INTEGER DEFAULT 1,
  success_rate NUMERIC DEFAULT 0.5,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Habilitar RLS
ALTER TABLE public.ai_conversation_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_learning_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversation_patterns ENABLE ROW LEVEL SECURITY;

-- Políticas para ai_conversation_context
CREATE POLICY "Sistema pode gerenciar contexto de conversas" 
ON public.ai_conversation_context 
FOR ALL 
USING (true);

CREATE POLICY "Admins podem ver contexto de conversas" 
ON public.ai_conversation_context 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Políticas para ai_learning_insights
CREATE POLICY "Sistema pode gerenciar insights de aprendizado" 
ON public.ai_learning_insights 
FOR ALL 
USING (true);

CREATE POLICY "Admins podem ver insights de aprendizado" 
ON public.ai_learning_insights 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Políticas para ai_conversation_patterns
CREATE POLICY "Sistema pode gerenciar padrões de conversas" 
ON public.ai_conversation_patterns 
FOR ALL 
USING (true);

CREATE POLICY "Admins podem gerenciar padrões de conversas" 
ON public.ai_conversation_patterns 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Trigger para atualizar timestamps
CREATE TRIGGER update_ai_conversation_context_updated_at
  BEFORE UPDATE ON public.ai_conversation_context
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_learning_insights_updated_at
  BEFORE UPDATE ON public.ai_learning_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_conversation_patterns_updated_at
  BEFORE UPDATE ON public.ai_conversation_patterns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir alguns padrões iniciais de conversa
INSERT INTO public.ai_conversation_patterns (pattern_name, trigger_keywords, response_template, priority, is_active) VALUES
('saudacao_inicial', ARRAY['oi', 'olá', 'ola', 'hey', 'bom dia', 'boa tarde', 'boa noite'], 
'Olá! 😊 Que bom te ver aqui! Sou o assistente da SuperLoja e estou aqui para te ajudar. Como posso te auxiliar hoje?', 
10, true),

('pergunta_produtos', ARRAY['produto', 'produtos', 'vender', 'comprar', 'preço', 'precos'], 
'Temos uma variedade incrível de produtos! 🛒 Que tipo de produto você está procurando? Posso te ajudar a encontrar exatamente o que precisa!', 
8, true),

('despedida', ARRAY['tchau', 'obrigado', 'obrigada', 'valeu', 'até logo', 'bye'], 
'Foi um prazer te ajudar! 😊 Se precisar de mais alguma coisa, estarei sempre aqui. Até logo! 👋', 
7, true),

('duvida_geral', ARRAY['ajuda', 'dúvida', 'duvida', 'como', 'onde', 'quando'], 
'Claro, posso te ajudar! 🤔 Me conte mais detalhes sobre sua dúvida para que eu possa dar a melhor resposta possível.', 
5, true),

('elogio', ARRAY['ótimo', 'otimo', 'excelente', 'muito bom', 'perfeito', 'parabéns'], 
'Muito obrigado pelo feedback! 😊 Fico feliz em poder te ajudar. É sempre um prazer atender nossos clientes!', 
6, true);