-- Habilitar RLS na tabela profiles que tem políticas mas não tem RLS habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Corrigir funções para ter search_path seguro
CREATE OR REPLACE FUNCTION public.update_winning_bid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Resetar todos os lances como não vencedores para este produto
  UPDATE public.auction_bids 
  SET is_winning = false 
  WHERE product_id = NEW.product_id;
  
  -- Marcar o lance atual como vencedor
  UPDATE public.auction_bids 
  SET is_winning = true 
  WHERE id = NEW.id;
  
  -- Atualizar o lance atual no produto
  UPDATE public.products 
  SET current_bid = NEW.bid_amount 
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_recent_conversations()
RETURNS TABLE(id uuid, platform character varying, user_id character varying, message text, type character varying, msg_timestamp timestamp with time zone, metadata jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.platform,
    c.user_id,
    c.message,
    c.type,
    c.timestamp,
    c.metadata
  FROM ai_conversations c
  ORDER BY c.timestamp DESC
  LIMIT 50;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );
  RETURN new;
END;
$function$;