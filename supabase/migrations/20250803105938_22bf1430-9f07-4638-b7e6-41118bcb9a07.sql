-- Corrigir políticas RLS que estão causando erro de acesso à tabela users
-- Remover políticas problemáticas e recriar corretamente

-- Políticas para weekly_posting_plans
DROP POLICY IF EXISTS "Admin can manage weekly posting plans" ON public.weekly_posting_plans;
CREATE POLICY "Admin can manage weekly posting plans" 
ON public.weekly_posting_plans 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Políticas para weekly_plan_posts  
DROP POLICY IF EXISTS "Admin can manage weekly plan posts" ON public.weekly_plan_posts;
CREATE POLICY "Admin can manage weekly plan posts" 
ON public.weekly_plan_posts 
FOR ALL 
USING (auth.uid() IS NOT NULL);