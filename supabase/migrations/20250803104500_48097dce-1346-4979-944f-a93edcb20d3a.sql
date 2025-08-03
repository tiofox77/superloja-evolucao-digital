-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar cron job para processar planos semanais a cada 15 minutos
SELECT cron.schedule(
  'process-weekly-plans',
  '*/15 * * * *', -- A cada 15 minutos
  $$
  SELECT
    net.http_post(
        url:='https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/process-weekly-plans',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpamJ2aWhpbmh1ZWRrdmt4d2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MDY0NzksImV4cCI6MjA2NzI4MjQ3OX0.gmxFrRj6UqY_VIvdZmsst1DdPBpWnWRCBqBKR-PemvE"}'::jsonb,
        body:='{"trigger": "cron", "timestamp": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);

-- Verificar se o cron job foi criado
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'process-weekly-plans';