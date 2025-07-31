-- Ativar realtime para ai_conversations
ALTER TABLE public.ai_conversations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_conversations;