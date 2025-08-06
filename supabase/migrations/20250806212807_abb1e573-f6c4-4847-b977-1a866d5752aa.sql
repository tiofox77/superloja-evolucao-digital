-- Criar um plano semanal automático de exemplo
INSERT INTO public.weekly_posting_plans (
  name,
  description,
  start_date,
  end_date,
  target_posts_per_day,
  preferred_times,
  platforms,
  post_types,
  auto_generate,
  status
) VALUES (
  'Plano Automático SuperLoja',
  'Postagens automáticas diárias para produtos da SuperLoja',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  2,
  ARRAY['09:00:00', '18:00:00'],
  ARRAY['both'],
  ARRAY['product', 'promotional', 'engagement'],
  true,
  'active'
);