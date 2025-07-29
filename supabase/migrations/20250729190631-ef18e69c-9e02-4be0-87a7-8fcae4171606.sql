-- Criar função para buscar conversas recentes
CREATE OR REPLACE FUNCTION get_recent_conversations()
RETURNS TABLE (
  id uuid,
  platform character varying,
  user_id character varying,
  message text,
  type character varying,
  timestamp timestamp with time zone,
  metadata jsonb
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;