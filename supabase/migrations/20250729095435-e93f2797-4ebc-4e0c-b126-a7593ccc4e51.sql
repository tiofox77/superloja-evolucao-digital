-- Adicionar campo subcategory_id à tabela products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory_id UUID;

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.products.subcategory_id IS 'ID da subcategoria (opcional, referencia categories.id)';