-- Adicionar tabelas para personalização e aprendizado avançado do IA
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'facebook',
  preferences JSONB DEFAULT '{}',
  interaction_history JSONB DEFAULT '{}',
  sentiment_profile JSONB DEFAULT '{}',
  purchase_intent NUMERIC DEFAULT 0.5,
  preferred_categories TEXT[],
  communication_style TEXT DEFAULT 'friendly',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para intenções detectadas
CREATE TABLE IF NOT EXISTS public.detected_intentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'facebook',
  message TEXT NOT NULL,
  detected_intent TEXT NOT NULL,
  confidence_score NUMERIC DEFAULT 0.5,
  entities JSONB DEFAULT '{}',
  sentiment_score NUMERIC DEFAULT 0.5,
  sentiment_label TEXT DEFAULT 'neutral',
  response_generated TEXT,
  was_successful BOOLEAN DEFAULT null,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para feedback e auto-melhoria
CREATE TABLE IF NOT EXISTS public.ai_response_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'facebook',
  original_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  user_reaction TEXT,
  effectiveness_score NUMERIC DEFAULT 0.5,
  improvement_applied BOOLEAN DEFAULT false,
  learned_pattern TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para notificações de admin
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detected_intentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_response_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins podem gerenciar preferências usuários" ON public.user_preferences FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Sistema pode gerenciar preferências usuários" ON public.user_preferences FOR ALL USING (true);

CREATE POLICY "Admins podem ver intenções detectadas" ON public.detected_intentions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Sistema pode gerenciar intenções" ON public.detected_intentions FOR ALL USING (true);

CREATE POLICY "Admins podem ver feedback IA" ON public.ai_response_feedback FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Sistema pode gerenciar feedback" ON public.ai_response_feedback FOR ALL USING (true);

CREATE POLICY "Admins podem ver notificações" ON public.admin_notifications FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Sistema pode gerenciar notificações admin" ON public.admin_notifications FOR ALL USING (true);

-- Triggers para updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para análise de sentimento básica
CREATE OR REPLACE FUNCTION public.analyze_sentiment(message_text TEXT)
RETURNS JSONB AS $$
DECLARE
  positive_words TEXT[] := ARRAY['bom', 'ótimo', 'excelente', 'gosto', 'adoro', 'perfeito', 'maravilhoso', 'incrível', 'fantástico', 'amor', 'feliz'];
  negative_words TEXT[] := ARRAY['ruim', 'péssimo', 'odeio', 'terrível', 'horrível', 'problema', 'erro', 'triste', 'raiva', 'frustrado'];
  word_count INTEGER := 0;
  positive_count INTEGER := 0;
  negative_count INTEGER := 0;
  word TEXT;
  sentiment_score NUMERIC;
  sentiment_label TEXT;
BEGIN
  -- Contar palavras positivas e negativas
  FOR word IN SELECT unnest(string_to_array(lower(message_text), ' '))
  LOOP
    word_count := word_count + 1;
    IF word = ANY(positive_words) THEN
      positive_count := positive_count + 1;
    ELSIF word = ANY(negative_words) THEN
      negative_count := negative_count + 1;
    END IF;
  END LOOP;
  
  -- Calcular score
  IF word_count = 0 THEN
    sentiment_score := 0.5;
  ELSE
    sentiment_score := (positive_count - negative_count + word_count) / (2.0 * word_count);
  END IF;
  
  -- Determinar label
  IF sentiment_score > 0.6 THEN
    sentiment_label := 'positive';
  ELSIF sentiment_score < 0.4 THEN
    sentiment_label := 'negative';
  ELSE
    sentiment_label := 'neutral';
  END IF;
  
  RETURN jsonb_build_object(
    'score', sentiment_score,
    'label', sentiment_label,
    'positive_words', positive_count,
    'negative_words', negative_count
  );
END;
$$ LANGUAGE plpgsql;