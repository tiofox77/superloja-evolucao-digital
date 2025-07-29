# Setup Facebook Bot para SuperLoja

## 1. Criar App Facebook Developers

### Passo 1: Facebook Developers Console
1. Acesse [developers.facebook.com](https://developers.facebook.com)
2. Crie novo App → Tipo: "Business"
3. Nome: "SuperLoja AI Assistant"

### Passo 2: Adicionar Produtos
- **Messenger**: Para chat direto
- **Instagram Basic Display**: Para posts/stories
- **Webhooks**: Para receber mensagens

### Passo 3: Configurar Messenger
```bash
# Webhook URL (nossa Edge Function)
https://[SEU_PROJETO].supabase.co/functions/v1/facebook-webhook

# Verificar Token (criar um aleatório)
FACEBOOK_VERIFY_TOKEN=superloja_webhook_2024
```

### Passo 4: Permissões Necessárias
- `pages_messaging` - Enviar/receber mensagens
- `pages_read_engagement` - Ler interações
- `instagram_basic` - Acesso básico Instagram
- `pages_show_list` - Listar páginas

### Passo 5: Tokens
- **Page Access Token**: Para enviar mensagens
- **App Secret**: Para verificar autenticidade
- **Verify Token**: Para validar webhook

## 2. Configurar Webhook

### URL Webhook
```
https://cqhqvgfvfpawvnpgvjhj.supabase.co/functions/v1/facebook-webhook
```

### Eventos para Subscrever
- `messages` - Mensagens recebidas
- `messaging_postbacks` - Botões clicados
- `message_deliveries` - Status entrega
- `messaging_optins` - Usuário aceita receber mensagens

## 3. Testes
- Use Facebook Messenger para testar
- Instagram Direct Messages
- Simulador no Facebook Developers
