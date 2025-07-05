# Checklist de Deploy cPanel - SuperLoja

## ✅ Pré-Deploy (Local)

### Build e Preparação
- [ ] Executar `npm run build` 
- [ ] Verificar se pasta `dist/` foi criada
- [ ] Confirmar que `dist/index.html` existe
- [ ] Verificar se `.htaccess` está em `public/`
- [ ] Testar build localmente com `npm run preview`

### Configurações Supabase
- [ ] URLs da Supabase estão corretas no código
- [ ] Configurações de logo e loja estão salvas
- [ ] Testes de funcionalidade admin concluídos
- [ ] Sistema de backup configurado

## 📁 Upload para cPanel

### Estrutura de Arquivos
- [ ] Fazer backup do `public_html/` atual (se existir)
- [ ] Upload de `dist/index.html` → `public_html/index.html`
- [ ] Upload de `dist/assets/` → `public_html/assets/`
- [ ] Upload de `dist/.htaccess` → `public_html/.htaccess`
- [ ] Upload de `dist/robots.txt` → `public_html/robots.txt` (se existir)

### Permissões (se necessário)
- [ ] `index.html` - 644
- [ ] `.htaccess` - 644
- [ ] Pasta `assets/` - 755
- [ ] Arquivos em `assets/` - 644

## 🔧 Configuração cPanel

### Domínio e SSL
- [ ] Domínio principal configurado
- [ ] SSL/TLS ativo (Let's Encrypt recomendado)
- [ ] Redirecionamento HTTPS ativo
- [ ] Teste de acesso: `https://seudominio.com`

### Configurações Avançadas
- [ ] Compressão GZIP ativa
- [ ] Cache do navegador configurado
- [ ] Headers de segurança aplicados

## 🧪 Testes Pós-Deploy

### Funcionalidades Básicas
- [ ] Homepage carrega corretamente
- [ ] Logo da loja aparece (se configurado)
- [ ] Menu de navegação funciona
- [ ] Busca de produtos funciona

### Rotas e Páginas
- [ ] `/catalogo` - Lista de produtos
- [ ] `/categorias` - Categorias de produtos  
- [ ] `/sobre` - Página sobre
- [ ] `/contato` - Página de contato
- [ ] `/auth` - Login/Registro
- [ ] `/cliente` - Área do cliente
- [ ] `/admin` - Área administrativa

### Funcionalidades Avançadas
- [ ] Carrinho de compras funciona
- [ ] Processo de checkout funciona
- [ ] Login/Logout funciona
- [ ] Área administrativa acessível
- [ ] Upload de imagens funciona
- [ ] Sistema POS funciona
- [ ] Geração de PDF funciona

### Responsive e Performance
- [ ] Design responsivo em mobile
- [ ] Design responsivo em tablet
- [ ] Carregamento rápido (<3s)
- [ ] Imagens otimizadas carregam

## 🐛 Troubleshooting

### Problemas Comuns e Soluções

**Página em branco**
- [ ] Verificar se `index.html` está na raiz
- [ ] Verificar erros no console do navegador
- [ ] Verificar logs de erro no cPanel

**Rotas retornam 404**
- [ ] Verificar se `.htaccess` está presente
- [ ] Verificar configuração do RewriteEngine
- [ ] Testar acesso direto às rotas

**Assets não carregam (CSS/JS)**
- [ ] Verificar caminhos dos assets
- [ ] Verificar permissões dos arquivos
- [ ] Verificar se MIME types estão corretos

**Funcionalidades não funcionam**
- [ ] Verificar console do navegador por erros
- [ ] Verificar se Supabase está acessível
- [ ] Verificar logs de rede (Network tab)

### Logs para Verificar
- [ ] Error Logs no cPanel
- [ ] Console do navegador (F12)
- [ ] Network tab para falhas de requisição
- [ ] Supabase dashboard para erros de API

## 📊 Monitoramento

### Métricas Importantes
- [ ] Tempo de carregamento
- [ ] Taxa de erro 404
- [ ] Uso de largura de banda
- [ ] Visitors únicos

### Ferramentas Recomendadas
- [ ] Google Analytics configurado
- [ ] Google Search Console
- [ ] Monitoramento de uptime
- [ ] Backup automático ativo

## 🔄 Manutenção

### Backups
- [ ] Backup inicial pós-deploy
- [ ] Configurar backups automáticos
- [ ] Testar restauração de backup

### Atualizações
- [ ] Sistema de atualizações GitHub configurado
- [ ] Processo de rollback testado
- [ ] Documentação de mudanças atualizada

---

## 📞 Suporte

### Em caso de problemas:
1. Consultar logs de erro
2. Verificar configurações Supabase
3. Testar funcionalidades uma por uma
4. Contactar suporte da hospedagem
5. Revisar documentação do projeto

### URLs Importantes
- **Site**: https://seudominio.com
- **Admin**: https://seudominio.com/admin
- **Supabase**: https://supabase.com/dashboard

---

**Data do Deploy**: ___________
**Versão**: v1.2.0
**Responsável**: ___________