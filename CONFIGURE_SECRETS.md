# 🔐 Configuração de Secrets - URGENTE!

## 🚨 **Status Atual**
✅ **Edge Functions deployadas com sucesso**  
❌ **Secrets (variáveis de ambiente) NÃO configuradas**

**Por isso o bot não responde no Facebook!**

---

## 📋 **Secrets Necessários**

### 1. **OPENAI_API_KEY** ⚡
```
OPENAI_API_KEY = sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
- **Onde obter**: https://platform.openai.com/api-keys
- **Formato**: Começa com `sk-`
- **Status**: ❌ **NÃO CONFIGURADO**

### 2. **FACEBOOK_PAGE_ACCESS_TOKEN** 📘
```
FACEBOOK_PAGE_ACCESS_TOKEN = EAAX22PMnYEABPGZCLIpwZChzWATWqYnnb4nqZCpEkugLwPAKn...
```
- **Onde obter**: Facebook Developers → Sua App → Messenger → Settings
- **Formato**: Token longo começando com `EAA`
- **Status**: ❌ **NÃO CONFIGURADO**

### 3. **FACEBOOK_VERIFY_TOKEN** 🔑
```
FACEBOOK_VERIFY_TOKEN = superloja_webhook_2024
```
- **Valor fixo**: `superloja_webhook_2024`
- **Usado para**: Verificar webhook do Facebook
- **Status**: ❌ **NÃO CONFIGURADO**

---

## 🎯 **Como Configurar (MÉTODO FÁCIL)**

### **Passo 1: Acesse Supabase**
1. Vá para: https://supabase.com/dashboard/project/fijbvihinhuedkvkxwir
2. Faça login com sua conta

### **Passo 2: Configure Secrets**
1. Clique em **"Settings"** (no menu lateral)
2. Clique em **"Edge Functions"**
3. Na seção **"Environment Variables"**, adicione:

```bash
Nome: OPENAI_API_KEY
Valor: sk-sua_chave_openai_aqui

Nome: FACEBOOK_PAGE_ACCESS_TOKEN  
Valor: seu_token_facebook_aqui

Nome: FACEBOOK_VERIFY_TOKEN
Valor: superloja_webhook_2024
```

### **Passo 3: Salvar e Aguardar**
- Clique **"Save"** para cada secret
- Aguarde 30-60 segundos para propagar

---

## 🔧 **Depois de Configurar**

### **1. Teste as Functions**
- Abra: http://localhost/superlojareact/test-edge-functions.html
- Clique **"🚀 Testar Website Chat"**
- Deve funcionar agora!

### **2. Configure Facebook Webhook**
- Vá para: https://developers.facebook.com/apps
- **Webhook URL**: `https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/facebook-webhook`
- **Verify Token**: `superloja_webhook_2024`

### **3. Teste no Facebook**
- Envie mensagem para sua página
- O bot deve responder automaticamente

---

## 🚨 **IMPORTANTE**

### **Sem essas configurações:**
- ❌ Bot não responde no Facebook
- ❌ Chat do website não funciona  
- ❌ Edge Functions retornam erro

### **Com as configurações:**
- ✅ Bot responde automaticamente
- ✅ IA integrada com OpenAI
- ✅ Multicanal (Website + Facebook)

---

## 📞 **Precisa de Ajuda?**

Se tiver dificuldades:
1. **Screenshot** da tela de configuração de secrets
2. **Copie os erros** que aparecem no teste
3. **Verifique** se as chaves estão corretas

**As secrets são OBRIGATÓRIAS para o bot funcionar!**
