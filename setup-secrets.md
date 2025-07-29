# 🔐 Configuração de Secrets - Edge Functions

## **Edge Functions Deployadas ✅**
- **facebook-webhook**: `0d001456-4ffb-44ef-b407-279261c2f915`
- **website-chat-ai**: `42ff824e-17b6-4d00-9461-688c1ceea7b3`

## **URLs das Functions:**
- **Facebook Webhook**: `https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/facebook-webhook`
- **Website Chat**: `https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/website-chat-ai`

## **Secrets Necessários:**

### 1. **OPENAI_API_KEY**
- Obtida em: https://platform.openai.com/api-keys
- Formato: `sk-xxxxxxxxxxxxxxxxxxxxxx`

### 2. **FACEBOOK_PAGE_ACCESS_TOKEN** 
- Token da sua página do Facebook
- Obtido no Facebook Developers

### 3. **FACEBOOK_VERIFY_TOKEN**
- Token de verificação do webhook
- Recomendado: `superloja_webhook_2024`

## **Como Configurar:**

### **Opção 1: Via Painel Supabase (Recomendado)**
1. Acesse: https://supabase.com/dashboard/project/fijbvihinhuedkvkxwir
2. Vá para **Settings → Edge Functions**
3. Adicione os secrets:
   ```
   OPENAI_API_KEY = sua_chave_openai_aqui
   FACEBOOK_PAGE_ACCESS_TOKEN = seu_token_facebook_aqui  
   FACEBOOK_VERIFY_TOKEN = superloja_webhook_2024
   ```

### **Opção 2: Via CLI (se disponível)**
```bash
supabase secrets set OPENAI_API_KEY=sua_chave_openai_aqui
supabase secrets set FACEBOOK_PAGE_ACCESS_TOKEN=seu_token_facebook_aqui
supabase secrets set FACEBOOK_VERIFY_TOKEN=superloja_webhook_2024
```

## **Próximos Passos:**

### **1. Configure o Webhook do Facebook**
- URL: `https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/facebook-webhook`
- Verify Token: `superloja_webhook_2024`
- Subscribe to: `messages`, `messaging_postbacks`

### **2. Teste o Chat do Website**
- O widget já está no site
- URL da function: `https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/website-chat-ai`

### **3. Verificar se as Tabelas AI Existem**
- Execute a migração se ainda não fez
- Use o botão "🔍 Testar" no admin

---
**⚠️ IMPORTANTE:** Configure os secrets ANTES de testar o bot!
