-- Corrigir problemas de segurança

-- Habilitar RLS nas tabelas que faltaram
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Corrigir função com search_path seguro
CREATE OR REPLACE FUNCTION public.analyze_sentiment(message_text TEXT)
RETURNS JSONB 
SECURITY DEFINER
SET search_path = public
AS $$
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