-- Atualizar o ID do admin principal para o ID correto do Facebook
UPDATE ai_settings 
SET value = '24320548907583618' 
WHERE key = 'admin_facebook_id';