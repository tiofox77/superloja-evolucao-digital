-- Obter o ID do plano criado e gerar posts automáticos para os próximos dias
WITH plano AS (
  SELECT id FROM weekly_posting_plans 
  WHERE name = 'Plano Automático Superloja' 
  LIMIT 1
),
produtos AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY RANDOM()) as rn
  FROM products 
  WHERE active = true 
  LIMIT 10
)
INSERT INTO public.weekly_plan_posts (
  plan_id,
  product_id,
  platform,
  post_type,
  scheduled_for,
  status
)
SELECT 
  p.id as plan_id,
  pr.id as product_id,
  CASE 
    WHEN (ROW_NUMBER() OVER ()) % 2 = 0 THEN 'facebook'
    ELSE 'both'
  END as platform,
  CASE 
    WHEN (ROW_NUMBER() OVER ()) % 3 = 0 THEN 'promotional'
    WHEN (ROW_NUMBER() OVER ()) % 3 = 1 THEN 'product'
    ELSE 'engagement'
  END as post_type,
  -- Gerar horários: 9h e 18h para os próximos 5 dias
  CASE 
    WHEN (ROW_NUMBER() OVER ()) % 2 = 0 THEN 
      (CURRENT_DATE + ((ROW_NUMBER() OVER () - 1) / 2)::int)::timestamp + '09:00:00'::time
    ELSE 
      (CURRENT_DATE + ((ROW_NUMBER() OVER () - 1) / 2)::int)::timestamp + '18:00:00'::time
  END as scheduled_for,
  'pending' as status
FROM plano p
CROSS JOIN produtos pr
LIMIT 10;