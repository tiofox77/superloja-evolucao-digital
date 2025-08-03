-- Criar tabela para planos semanais de postagem
CREATE TABLE public.weekly_posting_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  target_posts_per_day INTEGER DEFAULT 2,
  preferred_times TIME[] DEFAULT ARRAY['09:00:00', '18:00:00']::time[],
  platforms TEXT[] DEFAULT ARRAY['both']::text[],
  post_types TEXT[] DEFAULT ARRAY['product', 'promotional', 'engagement']::text[],
  product_categories TEXT[],
  auto_generate BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para posts do plano semanal
CREATE TABLE public.weekly_plan_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.weekly_posting_plans(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  platform TEXT NOT NULL,
  post_type TEXT NOT NULL,
  content TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'posted', 'failed')),
  generated_content TEXT,
  banner_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices
CREATE INDEX idx_weekly_plans_status ON public.weekly_posting_plans(status);
CREATE INDEX idx_weekly_plans_dates ON public.weekly_posting_plans(start_date, end_date);
CREATE INDEX idx_weekly_plan_posts_plan_id ON public.weekly_plan_posts(plan_id);
CREATE INDEX idx_weekly_plan_posts_scheduled ON public.weekly_plan_posts(scheduled_for);
CREATE INDEX idx_weekly_plan_posts_status ON public.weekly_plan_posts(status);

-- Habilitar RLS
ALTER TABLE public.weekly_posting_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_plan_posts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (admin only)
CREATE POLICY "Admin can manage weekly posting plans" 
ON public.weekly_posting_plans 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admin can manage weekly plan posts" 
ON public.weekly_plan_posts 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_weekly_posting_plans_updated_at
BEFORE UPDATE ON public.weekly_posting_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_weekly_plan_posts_updated_at
BEFORE UPDATE ON public.weekly_plan_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Comentários
COMMENT ON TABLE public.weekly_posting_plans IS 'Planos semanais automáticos de postagem nas redes sociais';
COMMENT ON TABLE public.weekly_plan_posts IS 'Posts individuais gerados pelos planos semanais';