# Guia de Deploy no cPanel - SuperLoja

## Pré-requisitos
- Conta de hospedagem com suporte a Node.js (versão 18+)
- Acesso ao cPanel
- Projeto construído (build files)

## Estrutura de Arquivos para cPanel

```
public_html/
├── index.html
├── assets/
│   ├── css/
│   ├── js/
│   └── images/
├── .htaccess
└── robots.txt
```

## Passos para Deploy

### 1. Build do Projeto
Execute localmente:
```bash
npm run build
```

### 2. Upload dos Arquivos
- Faça upload de todos os arquivos da pasta `dist/` para `public_html/`
- Certifique-se que o arquivo `.htaccess` está presente

### 3. Configuração do .htaccess
O arquivo `.htaccess` já está configurado para:
- Redirecionamento do React Router
- Compressão GZIP
- Cache do navegador
- Headers de segurança

### 4. Configuração de Base de Dados (Supabase)
- O projeto usa Supabase como backend
- Não requer configuração de base de dados no cPanel
- Todas as chamadas de API são feitas diretamente para Supabase

### 5. Configuração SSL (Recomendado)
- Ative SSL no cPanel
- Descomente as linhas de redirecionamento HTTPS no .htaccess:
```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

## Verificações Pós-Deploy

### ✅ Checklist
- [ ] Site carrega corretamente na homepage
- [ ] Rotas funcionam (teste /catalogo, /sobre, etc.)
- [ ] Imagens carregam corretamente
- [ ] CSS e JS aplicados
- [ ] Formulários funcionam
- [ ] Carrinho de compras funciona
- [ ] Área administrativa acessível

### 🔧 Troubleshooting Comum

**Problema**: Página em branco
**Solução**: Verifique se o arquivo `index.html` está na raiz do `public_html/`

**Problema**: Rotas retornam 404
**Solução**: Verifique se o `.htaccess` está presente e configurado corretamente

**Problema**: Recursos não carregam
**Solução**: Verifique os caminhos dos assets e permissões de arquivos

**Problema**: Funcionalidades não funcionam
**Solução**: Verifique se as URLs da Supabase estão corretas

## Configurações Específicas do cPanel

### Node.js (se disponível)
- Versão recomendada: 18 ou superior
- Startup file: não necessário (projeto estático)

### SSL/TLS
- Ative "Force HTTPS Redirect"
- Use certificado Let's Encrypt (gratuito)

### Subdomínios
Para configurar subdomínios:
1. Crie o subdomínio no cPanel
2. Faça upload dos arquivos para a pasta do subdomínio
3. Configure o `.htaccess` adequadamente

## Monitoramento

### Logs de Erro
- Acesse "Error Logs" no cPanel
- Monitore erros 404 e 500

### Estatísticas
- Use "AWStats" ou "Webalizer" para monitorar tráfego
- Configure Google Analytics para métricas detalhadas

## Backup e Manutenção

### Backup Regular
- Use a funcionalidade de backup do cPanel
- Configure backups automáticos se disponível
- Mantenha cópias locais dos arquivos

### Atualizações
- Mantenha o sistema de atualizações via GitHub configurado
- Teste sempre em ambiente de desenvolvimento primeiro
- Use a funcionalidade de rollback se necessário

## Suporte Técnico

Em caso de problemas:
1. Verifique os logs de erro no cPanel
2. Teste as funcionalidades uma por uma
3. Verifique se todas as dependências estão corretas
4. Contate o suporte da hospedagem se necessário

## URLs Importantes

- **Admin**: `/admin`
- **API Supabase**: Configurada automaticamente
- **Área do Cliente**: `/cliente`
- **Checkout**: `/checkout`

---

**Nota**: Este projeto é uma SPA (Single Page Application) React, totalmente compatível com hospedagem cPanel tradicional.