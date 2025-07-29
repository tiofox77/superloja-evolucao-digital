-- Habilitar RLS e criar políticas para tabelas do sistema IA
-- Tabela ai_conversations
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Políticas para ai_conversations
CREATE POLICY "Admins podem ver todas as conversas IA" 
ON ai_conversations FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Sistema pode inserir conversas" 
ON ai_conversations FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins podem atualizar conversas" 
ON ai_conversations FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Tabela ai_knowledge_base  
ALTER TABLE ai_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Políticas para ai_knowledge_base
CREATE POLICY "Admins podem gerenciar base de conhecimento" 
ON ai_knowledge_base FOR ALL 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Sistema pode consultar base de conhecimento" 
ON ai_knowledge_base FOR SELECT 
USING (active = true);

-- Tabela ai_settings
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para ai_settings
CREATE POLICY "Admins podem gerenciar configurações IA" 
ON ai_settings FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Tabela ai_metrics
ALTER TABLE ai_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas para ai_metrics
CREATE POLICY "Admins podem ver métricas IA" 
ON ai_metrics FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Sistema pode inserir métricas" 
ON ai_metrics FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar métricas" 
ON ai_metrics FOR UPDATE 
USING (true);