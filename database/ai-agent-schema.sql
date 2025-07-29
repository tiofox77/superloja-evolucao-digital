-- Tabela para conversas do agente IA
CREATE TABLE ai_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('facebook', 'instagram', 'website')),
    user_id VARCHAR(255) NOT NULL, -- Facebook ID ou user_id interno
    message TEXT NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('sent', 'received')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadados adicionais
    metadata JSONB DEFAULT '{}',
    processed BOOLEAN DEFAULT false,
    ai_confidence DECIMAL(3,2), -- 0.00 a 1.00
    
    -- Índices
    INDEX idx_ai_conversations_platform (platform),
    INDEX idx_ai_conversations_user_id (user_id),
    INDEX idx_ai_conversations_timestamp (timestamp)
);

-- Tabela para base de conhecimento do agente
CREATE TABLE ai_knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(50) NOT NULL, -- 'products', 'policies', 'faq', 'company'
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    keywords TEXT[], -- Array de palavras-chave para matching
    priority INTEGER DEFAULT 1, -- 1=baixa, 5=alta
    active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices
    INDEX idx_ai_knowledge_category (category),
    INDEX idx_ai_knowledge_keywords (keywords),
    INDEX idx_ai_knowledge_active (active)
);

-- Tabela para métricas do agente IA
CREATE TABLE ai_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    platform VARCHAR(20) NOT NULL,
    
    -- Métricas de volume
    total_messages INTEGER DEFAULT 0,
    user_messages INTEGER DEFAULT 0,
    bot_messages INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    
    -- Métricas de qualidade
    avg_confidence DECIMAL(3,2),
    successful_interactions INTEGER DEFAULT 0,
    escalated_to_human INTEGER DEFAULT 0,
    
    -- Métricas de negócio
    leads_generated INTEGER DEFAULT 0,
    products_recommended INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    
    -- Constraint para evitar duplicatas
    UNIQUE(date, platform)
);

-- Tabela para configurações do agente IA
CREATE TABLE ai_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configurações padrão
INSERT INTO ai_settings (key, value, description, category) VALUES
('openai_api_key', '""', 'Chave da API OpenAI', 'api'),
('facebook_page_token', '""', 'Token da página Facebook', 'facebook'),
('facebook_verify_token', '""', 'Token de verificação webhook', 'facebook'),
('bot_personality', '{
    "name": "SuperBot",
    "tone": "friendly",
    "language": "pt-AO",
    "max_response_length": 160,
    "fallback_to_human": true
}', 'Personalidade do bot', 'behavior'),
('business_hours', '{
    "enabled": true,
    "timezone": "Africa/Luanda",
    "weekdays": {
        "start": "08:00",
        "end": "18:00"
    },
    "weekends": {
        "start": "09:00",
        "end": "15:00"
    }
}', 'Horário de funcionamento', 'behavior'),
('auto_responses', '{
    "greeting": "Olá! Sou o assistente da SuperLoja. Como posso ajudá-lo?",
    "out_of_hours": "Obrigado pela mensagem! Nossa equipe responderá em breve no horário comercial.",
    "fallback": "Desculpe, não entendi. Pode reformular a pergunta?",
    "product_not_found": "Não encontrei esse produto. Veja nosso catálogo em https://superloja.vip"
}', 'Respostas automáticas', 'messages');

-- Inserir dados iniciais na base de conhecimento
INSERT INTO ai_knowledge_base (category, question, answer, keywords, priority) VALUES
('company', 'O que é a SuperLoja?', 'A SuperLoja é uma loja online em Angola especializada em eletrônicos, gadgets e acessórios. Vendemos produtos de qualidade com entrega em todo o país.', ARRAY['superloja', 'empresa', 'loja', 'angola'], 5),

('policies', 'Como funciona a entrega?', 'Fazemos entregas em todo Angola. O prazo varia de 1-3 dias em Luanda e 3-7 dias nas outras províncias. Frete grátis acima de 15.000 AOA.', ARRAY['entrega', 'envio', 'frete', 'prazo'], 4),

('policies', 'Formas de pagamento?', 'Aceitamos transferência bancária, Multicaixa Express, TPA na entrega e cartões Visa/Mastercard. Pagamento seguro garantido.', ARRAY['pagamento', 'multicaixa', 'transferência', 'cartão'], 4),

('account', 'Vantagens de ter conta?', 'Com conta no site você tem: histórico de pedidos, lista de favoritos, descontos exclusivos, checkout rápido, ofertas personalizadas e suporte prioritário.', ARRAY['conta', 'registro', 'vantagens', 'benefícios'], 5),

('purchase', 'Como comprar no site?', 'É simples: 1) Navegue pelos produtos 2) Adicione ao carrinho 3) Faça checkout 4) Escolha forma de pagamento 5) Confirme pedido. Pronto!', ARRAY['comprar', 'como', 'pedido', 'checkout'], 5),

('purchase', 'Como comprar pelo Facebook?', 'Pelo Facebook: 1) Comente "QUERO" no post do produto 2) Te chamaremos no DM 3) Confirmamos detalhes 4) Fazemos pedido personalizado para você.', ARRAY['facebook', 'comprar', 'dm', 'quero'], 4),

('support', 'Preciso de ajuda técnica', 'Nossa equipe técnica está disponível no horário comercial. Para suporte imediato, acesse https://superloja.vip/suporte ou ligue 923-456-789.', ARRAY['suporte', 'ajuda', 'técnico', 'problema'], 3),

('faq', 'Produtos têm garantia?', 'Sim! Todos os produtos têm garantia de 6 meses a 2 anos dependendo do fabricante. Trocas e devoluções até 7 dias após recebimento.', ARRAY['garantia', 'troca', 'devolução', 'defeito'], 4);

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para ai_settings
CREATE TRIGGER update_ai_settings_updated_at BEFORE UPDATE ON ai_settings 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para ai_knowledge_base
CREATE TRIGGER update_ai_knowledge_base_updated_at BEFORE UPDATE ON ai_knowledge_base 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Permitir leitura pública para knowledge base
ALTER TABLE ai_knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON ai_knowledge_base FOR SELECT USING (active = true);

-- Permitir acesso total para usuários autenticados
CREATE POLICY "Allow authenticated full access" ON ai_conversations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access" ON ai_metrics FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access" ON ai_settings FOR ALL USING (auth.role() = 'authenticated');
