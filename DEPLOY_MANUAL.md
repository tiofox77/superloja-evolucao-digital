# 📋 Deploy Manual das Edge Functions

Como o Supabase CLI não está instalado, vamos fazer o deploy manualmente:

## 🌐 **1. Deploy via Interface Web do Supabase**

### **Acesse seu projeto Supabase:**
1. Vá para: https://supabase.com/dashboard/project/cqhqvgfvfpawvnpgvjhj
2. Faça login com sua conta
3. No menu lateral, clique em **"Edge Functions"**

### **Deploy facebook-webhook:**
1. Clique em **"Create a new function"**
2. Nome: `facebook-webhook`
3. Copie e cole o código de: `supabase/functions/facebook-webhook/index.ts`
4. Clique em **"Deploy function"**

### **Deploy website-chat-ai:**
1. Clique em **"Create a new function"** novamente
2. Nome: `website-chat-ai`
3. Copie e cole o código de: `supabase/functions/website-chat-ai/index.ts`
4. Clique em **"Deploy function"**

## 🔐 **2. Configurar Secrets (Variáveis de Ambiente)**

No painel do Supabase:
1. Vá para **"Settings" → "API"**
2. Role até **"Environment Variables"**
3. Adicione estas variáveis:

```
OPENAI_API_KEY = sua_chave_openai_aqui
FACEBOOK_PAGE_ACCESS_TOKEN = seu_token_facebook_aqui
FACEBOOK_VERIFY_TOKEN = superloja_webhook_2024
```

## 📞 **3. URLs das Functions (após deploy):**

- **Facebook Webhook**: https://cqhqvgfvfpawvnpgvjhj.supabase.co/functions/v1/facebook-webhook
- **Website Chat**: https://cqhqvgfvfpawvnpgvjhj.supabase.co/functions/v1/website-chat-ai

## 🎯 **4. Configurar Webhook do Facebook**

No Facebook Developers:
1. Vá para: https://developers.facebook.com/apps
2. Selecione seu app
3. **Messenger → Settings → Webhooks**
4. Cole a URL: `https://cqhqvgfvfpawvnpgvjhj.supabase.co/functions/v1/facebook-webhook`
5. Verify Token: `superloja_webhook_2024`
6. Subscribe to: `messages, messaging_postbacks`

## ✅ **5. Testar**

Após completar todos os passos:
1. Envie mensagem para sua página no Facebook
2. O bot deve responder automaticamente
3. Verifique logs nas Edge Functions do Supabase

---

**⚠️ IMPORTANTE:** Certifique-se de que as tabelas AI foram criadas no banco antes de testar!
