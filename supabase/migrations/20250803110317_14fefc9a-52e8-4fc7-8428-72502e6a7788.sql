-- Habilitar RLS nas tabelas restantes que estão faltando
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

-- Verificar se a tabela products já tem RLS (ela deveria ter)
-- Se não tiver, habilitar também
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'products' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;