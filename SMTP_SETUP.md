# Configuração SMTP para Envio de Emails

## Situação Atual
O sistema detecta automaticamente que está em `localhost` e **simula** o envio de emails por padrão. Para enviar emails reais, você precisa configurar um servidor SMTP.

## Opções de Configuração

### 1. **Gmail** (Recomendado para testes)
```json
{
    "smtp_host": "smtp.gmail.com",
    "smtp_port": "587",
    "smtp_user": "seu-email@gmail.com",
    "smtp_password": "sua-senha-de-app",
    "smtp_from_email": "seu-email@gmail.com",
    "smtp_from_name": "SuperLoja",
    "smtp_use_tls": true
}
```

**Configuração Gmail:**
1. Ative a autenticação de 2 fatores
2. Gere uma "senha de app" em: https://myaccount.google.com/apppasswords
3. Use a senha de app (não sua senha normal)

### 2. **Outlook/Hotmail**
```json
{
    "smtp_host": "smtp-mail.outlook.com",
    "smtp_port": "587",
    "smtp_user": "seu-email@outlook.com",
    "smtp_password": "sua-senha",
    "smtp_from_email": "seu-email@outlook.com",
    "smtp_from_name": "SuperLoja",
    "smtp_use_tls": true
}
```

### 3. **Yahoo**
```json
{
    "smtp_host": "smtp.mail.yahoo.com",
    "smtp_port": "587",
    "smtp_user": "seu-email@yahoo.com",
    "smtp_password": "sua-senha-de-app",
    "smtp_from_email": "seu-email@yahoo.com",
    "smtp_from_name": "SuperLoja",
    "smtp_use_tls": true
}
```

### 4. **SMTP Personalizado**
```json
{
    "smtp_host": "seu-servidor-smtp.com",
    "smtp_port": "587",
    "smtp_user": "seu-usuario",
    "smtp_password": "sua-senha",
    "smtp_from_email": "noreply@seudominio.com",
    "smtp_from_name": "SuperLoja",
    "smtp_use_tls": true
}
```

## Como Configurar

### 1. **Editar arquivo de configuração**
Edite: `public/api/config/smtp.json`

### 2. **Testar no Admin**
1. Acesse `/admin/configuracoes`
2. Va para a aba "Avançado"
3. Na seção "Testes de Email", insira seu email
4. Clique em "Enviar Email Teste"

### 3. **Forçar Envio Real**
O sistema agora suporta o parâmetro `force_real: true` para forçar o envio mesmo em localhost.

## Verificação de Funcionamento

### Logs
- Verifique logs em: `public/api/logs/email_YYYY-MM-DD.log`
- Em caso de erro, detalhes aparecem nos logs

### Portas Comuns
- **587**: STARTTLS (recomendado)
- **465**: SSL/TLS
- **25**: Não criptografado (não recomendado)

### Solução de Problemas

1. **Erro de autenticação**: Verifique usuário/senha
2. **Conexão rejeitada**: Firewall ou antivírus pode bloquear
3. **Gmail não funciona**: Use senha de app, não senha normal
4. **Porta bloqueada**: Alguns ISPs bloqueiam porta 25

## Exemplo de Teste
O botão "Enviar Email Teste" no admin enviará um email de boas-vindas para o endereço que você especificar.

## Configuração Atual
Sua configuração atual está em:
- Arquivo: `public/api/config/smtp.json`
- Host: `mail.superloja.vip`
- Porta: `465`
- Usuário: `superloja@superloja.vip`

Para usar essa configuração, certifique-se de que:
1. O servidor SMTP está acessível
2. As credenciais estão corretas
3. O Laragon permite conexões SMTP externas
