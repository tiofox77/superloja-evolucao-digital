-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar cron job para processar posts agendados a cada 5 minutos
SELECT cron.schedule(
  'process-scheduled-posts',
  '*/5 * * * *', -- A cada 5 minutos
  $$
  SELECT
    net.http_post(
        url:='https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/process-scheduled-posts',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpamJ2aWhpbmh1ZWRrdmt4d2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MDY0NzksImV4cCI6MjA2NzI4MjQ3OX0.gmxFrRj6UqY_VIvdZmsst1DdPBpWnWRCBqBKR-PemvE"}'::jsonb,
        body:='{"trigger": "cron", "timestamp": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);