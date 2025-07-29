@echo off
echo Fazendo deploy das Edge Functions do Agente IA...
echo.

cd /d "c:\laragon\www\superlojareact"

echo Fazendo login no Supabase...
supabase login

echo.
echo Linkando projeto...
supabase link --project-ref cqhqvgfvfpawvnpgvjhj

echo.
echo Fazendo deploy da function facebook-webhook...
supabase functions deploy facebook-webhook

echo.
echo Fazendo deploy da function website-chat-ai...
supabase functions deploy website-chat-ai

echo.
echo Configurando variáveis de ambiente...
echo Execute os comandos abaixo manualmente no CLI do Supabase:
echo.
echo supabase secrets set OPENAI_API_KEY=sua_chave_openai_aqui
echo supabase secrets set FACEBOOK_PAGE_ACCESS_TOKEN=seu_token_facebook_aqui
echo supabase secrets set FACEBOOK_VERIFY_TOKEN=superloja_webhook_2024
echo.
echo Deploy completo!
pause
