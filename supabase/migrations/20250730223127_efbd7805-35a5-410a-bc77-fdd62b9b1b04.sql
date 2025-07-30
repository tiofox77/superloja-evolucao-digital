-- Adicionar configuração para ID real do Facebook do admin
INSERT INTO public.ai_settings (key, value, description) 
VALUES ('admin_facebook_id', 'carlosfox2', 'ID real do Facebook para receber notificações de admin')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;