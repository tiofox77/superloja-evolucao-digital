-- Inserir configurações padrão para Instagram bot
INSERT INTO public.ai_settings (key, value, description) VALUES
('instagram_bot_enabled', 'false', 'Habilitar ou desabilitar bot automático do Instagram'),
('instagram_page_token', '', 'Token de acesso da página do Instagram para API'),
('instagram_verify_token', 'minha_superloja_instagram_webhook_token_2024', 'Token de verificação do webhook do Instagram')
ON CONFLICT (key) DO NOTHING;

-- Adicionar novos tipos de insights para Instagram
INSERT INTO public.ai_learning_insights (insight_type, content, confidence_score, effectiveness_score, metadata) VALUES
('instagram_engagement', 'Usuários do Instagram preferem respostas visuais e diretas', 0.8, 0.9, '{"platform": "instagram", "recommendation": "Use mais emojis e menos texto"}'),
('instagram_behavior', 'Conversas no Instagram são mais rápidas e orientadas a ação', 0.7, 0.8, '{"platform": "instagram", "tip": "Seja mais direto e ofereça links rapidamente"}')
ON CONFLICT (id) DO NOTHING;