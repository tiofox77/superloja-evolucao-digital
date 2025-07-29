# 🚨 URGENTE - Configure Secrets AGORA!

## ✅ **Confirmado: Functions estão ONLINE!**
- ✅ Website Chat AI: FUNCIONANDO
- ✅ Facebook Webhook: ONLINE (precisa só das secrets)

---

## 🔐 **PASSO 1: Configure Secrets (OBRIGATÓRIO)**

### **Acesse:**
https://supabase.com/dashboard/project/fijbvihinhuedkvkxwir

### **Caminho:**
Settings → Edge Functions → Environment Variables

### **Adicione 3 secrets:**

#### **Secret 1:**
```
Name: OPENAI_API_KEY
Value: [SUA CHAVE OPENAI - sk-xxxxxxx]
```

#### **Secret 2:**
```
Name: FACEBOOK_PAGE_ACCESS_TOKEN
Value: [SEU TOKEN FACEBOOK - EAAxxxxxxx]
```

#### **Secret 3:**
```
Name: FACEBOOK_VERIFY_TOKEN
Value: superloja_webhook_2024
```

---

## 📘 **PASSO 2: Configure Facebook Webhook**

### **URL do Webhook:**
```
https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/facebook-webhook
```

### **Verify Token:**
```
superloja_webhook_2024
```

### **No Facebook Developers:**
1. Vá para: https://developers.facebook.com/apps
2. Messenger → Settings → Webhooks
3. Cole a URL e verify token acima
4. Subscribe: messages, messaging_postbacks

---

## 🧪 **PASSO 3: Teste**

Após configurar as secrets:
1. **Aguarde 1-2 minutos** (propagação)
2. **Envie mensagem** para sua página Facebook
3. **Bot deve responder** automaticamente!

---

## ❌ **Se não funcionar:**

### **Verifique:**
1. ✅ Secrets salvos corretamente no Supabase?
2. ✅ OpenAI API key começa com "sk-"?
3. ✅ Facebook token começa com "EAA"?
4. ✅ Aguardou 1-2 minutos após salvar?

### **Debug:**
- Vá para Supabase → Edge Functions → Logs
- Procure por erros nas functions
- Verifique se secrets estão aparecendo

---

## 🎉 **Quando Funcionar:**

✅ Bot responde no Facebook automaticamente  
✅ Chat do website funcionando  
✅ IA integrada com OpenAI  
✅ Sistema completo operacional!

**Configure as secrets AGORA e teste! 🚀**
