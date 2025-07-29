# 🚀 Como Executar a Migração do Agente IA

## Método 1: SQL Editor do Supabase (Recomendado)

### Passo 1: Acesse o Dashboard
1. Vá para [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione seu projeto SuperLoja

### Passo 2: Execute o SQL
1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New Query"**
3. Copie todo o conteúdo do arquivo `ai-agent-migration.sql`
4. Cole no editor SQL
5. Clique em **"Run"** (ou Ctrl+Enter)

### Passo 3: Confirme a Criação
Você deve ver as mensagens de sucesso:
- ✅ `CREATE TABLE` para 4 tabelas
- ✅ `INSERT` para configurações e conhecimento
- ✅ `CREATE INDEX` para índices

---

## Método 2: Via Arquivo HTML (Alternativo)

1. Abra o arquivo `migrate-ai-tables.html` no navegador
2. Configure sua URL e chave anon do Supabase
3. Clique em "Executar Migração"
4. Aguarde as mensagens de sucesso

---

## ✅ Como Verificar se Funcionou

### 1. Verificar Tabelas Criadas
No SQL Editor do Supabase, execute:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'ai_%';
```

Deve retornar:
- `ai_conversations`
- `ai_knowledge_base` 
- `ai_metrics`
- `ai_settings`

### 2. Verificar Dados Inseridos
```sql
-- Ver configurações
SELECT * FROM ai_settings;

-- Ver base de conhecimento  
SELECT category, question FROM ai_knowledge_base;

-- Ver métricas
SELECT * FROM ai_metrics;
```

### 3. Testar na Interface
1. Volte para **Admin → Agente IA → Configurações**
2. O aviso amarelo deve sumir
3. Os campos devem carregar valores padrão
4. O botão "Salvar" deve funcionar normalmente

---

## 🔧 Resolução de Problemas

### Erro: "relation already exists"
- **Normal!** Significa que as tabelas já existem
- Continue o processo normalmente

### Erro: "permission denied" 
- Verifique se tem permissões de admin no projeto Supabase
- Use a chave de **service_role** se necessário

### Erro: "syntax error"
- Copie o SQL novamente, pode ter caracteres perdidos
- Execute seção por seção se necessário

### Campos não aparecem ainda
1. Recarregue a página do admin
2. Limpe cache do navegador (Ctrl+F5)
3. Verifique console do navegador para erros

---

## 📊 O que foi Criado

### Tabelas:
- **ai_conversations**: Histórico de mensagens
- **ai_knowledge_base**: Perguntas e respostas (11 tópicos)
- **ai_metrics**: Estatísticas de uso
- **ai_settings**: Configurações (APIs, comportamento)

### Configurações Padrão:
- ✅ Tom amigável 
- ✅ Respostas automáticas ativadas
- ✅ Fallback para humano ativado
- ✅ Limite de 200 caracteres por resposta

### Base de Conhecimento:
- ✅ 11 tópicos sobre a SuperLoja
- ✅ Produtos, compras, pagamento, entrega
- ✅ Garantia, promoções, suporte, devolução

---

## 🎯 Próximos Passos

1. ✅ **Execute a migração** (este passo)
2. 🔑 **Configure APIs**: OpenAI + Facebook tokens
3. 🚀 **Deploy functions**: Execute `deploy-functions.bat`
4. ✨ **Teste o agente**: Use chat do site ou Facebook
5. 📊 **Monitore**: Veja métricas e conversas no admin

---

**Precisa de ajuda?** 
- Verifique o console do navegador para erros
- Consulte `GUIA_CONFIGURACAO_APIS.md` para setup completo
- Logs detalhados em: Supabase Dashboard → Logs
