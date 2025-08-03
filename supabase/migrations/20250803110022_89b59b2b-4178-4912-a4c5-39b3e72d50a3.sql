-- Habilitar RLS nas tabelas que estão faltando
ALTER TABLE public.weekly_posting_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_plan_posts ENABLE ROW LEVEL SECURITY;