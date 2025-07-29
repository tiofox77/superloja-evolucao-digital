# Guia de Configuração - APIs do Agente IA SuperLoja

## 🔑 APIs Necessárias

Para que o Agente IA funcione completamente, você precisa configurar as seguintes APIs:

### 1. OpenAI API Key
**Para:** Processar mensagens e gerar respostas inteligentes

📍 **Onde obter:**
- Acesse: https://platform.openai.com/api-keys
- Crie uma conta ou faça login
- Clique em "Create new secret key"
- Copie a chave (formato: `sk-...`)

💰 **Custo aproximado:** $0.002 por 1K tokens (muito baixo para uso normal)

📋 **Como configurar:**
1. No admin da SuperLoja, vá para: **Admin → Agente IA → Configurações**
2. Cole a chave no campo "Chave API OpenAI"
3. Clique em "Salvar Configurações"

---

### 2. Facebook Page Access Token
**Para:** Responder mensagens no Messenger e Instagram automaticamente

📍 **Onde obter:**
1. **Facebook Developers Console:** https://developers.facebook.com/
2. **Graph API Explorer:** https://developers.facebook.com/tools/explorer/
3. **Configuração de Webhook:** https://developers.facebook.com/docs/messenger-platform/

📋 **Passos detalhados:**

#### A. Criar App Facebook
1. Acesse https://developers.facebook.com/apps/
2. Clique "Create App" → "Business"
3. Nome: "SuperLoja Bot"
4. Adicione produto: **Messenger**

#### B. Configurar Página
1. No App, vá para **Messenger → Settings**
2. Em "Access Tokens", selecione sua página
3. Clique "Generate Token"
4. Copie o token (formato: `EAA...`)

#### C. Configurar Webhook
1. Em "Webhooks", clique "Setup Webhooks"
2. **Callback URL:** `https://[sua-url-supabase]/functions/v1/facebook-webhook`
3. **Verify Token:** Crie uma senha (ex: `superloja123`)
4. **Subscription Fields:** Marque `messages`, `messaging_postbacks`

#### D. Configurar Instagram (Opcional)
1. No App, adicione produto **Instagram**
2. Conecte sua conta comercial do Instagram
3. Configure permissões para mensagens

---

## 🛠️ Configuração no Supabase

### Configurar Secrets (Variáveis de Ambiente)
Execute no terminal com Supabase CLI:

```bash
# OpenAI
supabase secrets set OPENAI_API_KEY=sk-sua-chave-aqui

# Facebook
supabase secrets set FACEBOOK_PAGE_ACCESS_TOKEN=EAA-seu-token-aqui
supabase secrets set FACEBOOK_VERIFY_TOKEN=superloja123

# Instagram (se usar)
supabase secrets set INSTAGRAM_ACCESS_TOKEN=seu-token-instagram
```

---

## 🚀 Deploy das Edge Functions

Execute o script de deploy:

```bash
cd c:\laragon\www\superlojareact
deploy-functions.bat
```

Ou manualmente:
```bash
supabase functions deploy facebook-webhook
supabase functions deploy website-chat-ai
```

---

## ✅ Como Testar

### 1. Chat do Website
- Abra o site da SuperLoja
- Clique no chat widget (canto inferior direito)
- Digite uma pergunta (ex: "Que produtos vocês vendem?")
- O bot deve responder automaticamente

### 2. Facebook Messenger
- Vá para sua página do Facebook
- Envie mensagem privada para a página
- O bot deve responder automaticamente

### 3. Instagram Direct
- No Instagram, envie mensagem para sua conta comercial
- O bot deve responder automaticamente

---

## 🔧 Solução de Problemas

### Bot não responde no site
- Verifique se `OPENAI_API_KEY` está configurada
- Verifique se as Edge Functions foram deployadas
- Verifique logs no Supabase Dashboard

### Bot não responde no Facebook
- Verifique se `FACEBOOK_PAGE_ACCESS_TOKEN` está configurada
- Verifique se o webhook está configurado corretamente
- Teste webhook em: https://developers.facebook.com/tools/webhook/

### Mensagens de erro comuns
- **"Invalid API Key":** OpenAI API key está incorreta
- **"Webhook verification failed":** Verify token não confere
- **"Permission denied":** Token do Facebook sem permissões suficientes

---

## 📊 Monitoramento

Acesse **Admin → Agente IA** para ver:
- **Métricas:** Volume de mensagens, qualidade das respostas
- **Conversas:** Histórico completo de interações
- **Base de Conhecimento:** Perguntas e respostas do bot
- **Configurações:** Ajustar comportamento e APIs

---

## 💡 Dicas Importantes

1. **Teste localmente primeiro:** Use o chat do website antes de configurar Facebook
2. **Monitore custos:** OpenAI cobra por uso, mas é muito barato
3. **Atualize conhecimento:** Adicione novas perguntas frequentes
4. **Backup configurações:** Salve tokens em local seguro
5. **Permissões Facebook:** App deve estar em modo "Live" para funcionar publicamente

---

## 📞 Suporte

Se precisar de ajuda:
- Verifique `FACEBOOK_AGENT_SETUP.md` para setup detalhado
- Logs de erro em: Supabase Dashboard → Edge Functions
- Admin SuperLoja → Agente IA → Conversas (para debug)

**Documentação oficial:**
- OpenAI: https://platform.openai.com/docs
- Facebook Messenger: https://developers.facebook.com/docs/messenger-platform
- Supabase Functions: https://supabase.com/docs/guides/functions
