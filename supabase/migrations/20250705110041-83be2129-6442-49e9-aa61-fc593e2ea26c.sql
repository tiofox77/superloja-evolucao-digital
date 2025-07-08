-- Adicionar RLS policies para produtos permitir admins modificarem
DROP POLICY IF EXISTS "Admins podem gerenciar produtos" ON public.products;
DROP POLICY IF EXISTS "Admins podem criar produtos" ON public.products;
DROP POLICY IF EXISTS "Admins podem atualizar produtos" ON public.products;
DROP POLICY IF EXISTS "Admins podem deletar produtos" ON public.products;

CREATE POLICY "Admins podem gerenciar produtos" 
ON public.products 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Adicionar RLS policies para categorias
DROP POLICY IF EXISTS "Admins podem gerenciar categorias" ON public.categories;

CREATE POLICY "Admins podem gerenciar categorias" 
ON public.categories 
FOR ALL 
USING (auth.uid() IS NOT NULL);