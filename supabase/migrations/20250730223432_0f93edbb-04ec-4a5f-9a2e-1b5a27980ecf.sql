-- Corrigir ID do Facebook para carlosfox2
UPDATE public.ai_settings 
SET value = 'carlosfox2' 
WHERE key = 'admin_facebook_id';

-- Verificar se existe, se não criar
INSERT INTO public.ai_settings (key, value, description) 
VALUES ('admin_facebook_id', 'carlosfox2', 'ID real do Facebook para receber notificações de admin')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;