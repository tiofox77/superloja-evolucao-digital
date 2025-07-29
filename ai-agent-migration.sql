-- Migração completa do Agente IA SuperLoja
-- Execute este script no Supabase SQL Editor

-- 1. Tabela de conversas do agente IA
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform VARCHAR(50) NOT NULL, -- 'website', 'facebook', 'instagram'
    user_id VARCHAR(255),
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'received', 'sent'
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- 2. Tabela de base de conhecimento
CREATE TABLE IF NOT EXISTS ai_knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    priority INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de métricas do agente
CREATE TABLE IF NOT EXISTS ai_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    total_messages INTEGER DEFAULT 0,
    successful_responses INTEGER DEFAULT 0,
    failed_responses INTEGER DEFAULT 0,
    average_response_time DECIMAL(10,2) DEFAULT 0,
    user_satisfaction_score DECIMAL(3,2) DEFAULT 0,
    platform_breakdown JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date)
);

-- 4. Tabela de configurações do agente
CREATE TABLE IF NOT EXISTS ai_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Inserir configurações padrão
INSERT INTO ai_settings (key, value, description) VALUES
('openai_api_key', '', 'Chave da API OpenAI para GPT-3.5-turbo')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_settings (key, value, description) VALUES
('facebook_page_token', '', 'Token da página Facebook para Messenger')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_settings (key, value, description) VALUES
('bot_enabled', 'true', 'Bot habilitado/desabilitado')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_settings (key, value, description) VALUES
('response_tone', 'amigavel', 'Tom das respostas: profissional, amigavel, casual')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_settings (key, value, description) VALUES
('auto_response_enabled', 'true', 'Respostas automáticas ativadas')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_settings (key, value, description) VALUES
('max_response_length', '200', 'Tamanho máximo das respostas')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_settings (key, value, description) VALUES
('fallback_to_human', 'true', 'Transferir para humano quando não entender')
ON CONFLICT (key) DO NOTHING;

-- 6. Popular base de conhecimento inicial
INSERT INTO ai_knowledge_base (category, question, answer, keywords, priority, active) VALUES
('produtos', 'Que produtos vocês vendem?', 'Vendemos uma ampla variedade de produtos eletrônicos: smartphones, computadores, laptops, tablets, acessórios para celular (capas, carregadores, fones), equipamentos de áudio, produtos para casa inteligente e muito mais. Confira nosso catálogo completo no site superloja.vip.', ARRAY['produtos', 'eletrônicos', 'smartphones', 'computadores', 'catálogo'], 5, true),

('compras', 'Como posso fazer uma compra?', 'Você pode comprar de 3 formas: 1) Diretamente no nosso site superloja.vip, 2) Através do Facebook Messenger, ou 3) Via Instagram Direct. Basta escolher o produto, adicionar ao carrinho e seguir o processo de checkout. Aceitamos múltiplas formas de pagamento.', ARRAY['comprar', 'checkout', 'pedido', 'facebook', 'instagram'], 5, true),

('conta', 'Por que devo criar uma conta?', 'Criar uma conta na SuperLoja oferece várias vantagens: ofertas exclusivas, histórico completo de pedidos, lista de favoritos, processo de compra mais rápido, cupons de desconto personalizados, e notificações sobre novos produtos do seu interesse.', ARRAY['conta', 'cadastro', 'benefícios', 'ofertas', 'desconto'], 4, true),

('entrega', 'Como funciona a entrega?', 'Fazemos entregas em toda Angola. Para Luanda, entregamos em 24-48h. Para outras províncias, o prazo é de 3-7 dias úteis. Oferecemos entrega grátis para compras acima de 15.000 Kz. Você recebe código de rastreamento por SMS.', ARRAY['entrega', 'prazo', 'angola', 'luanda', 'grátis', 'rastreamento'], 5, true),

('pagamento', 'Quais formas de pagamento vocês aceitam?', 'Aceitamos: Multicaixa, TPA (cartão), transferência bancária, pagamento na entrega e Unitel Money. Para pagamentos online, processamos de forma segura. Para pagamento na entrega, aceitamos dinheiro.', ARRAY['pagamento', 'multicaixa', 'tpa', 'cartão', 'entrega', 'unitel'], 5, true),

('garantia', 'Os produtos têm garantia?', 'Sim! Todos os produtos têm garantia. Produtos eletrônicos têm 12 meses de garantia, acessórios têm 6 meses. Garantia cobre defeitos de fabricação. Para problemas, entre em contato conosco com número do pedido.', ARRAY['garantia', 'defeito', 'conserto', 'problema'], 4, true),

('promocoes', 'Vocês fazem promoções?', 'Sempre! Temos promoções semanais, ofertas relâmpago, descontos para novos clientes e promoções especiais em datas comemorativas. Siga-nos no Facebook e Instagram para não perder nenhuma oferta!', ARRAY['promoção', 'desconto', 'oferta', 'relâmpago', 'facebook', 'instagram'], 4, true),

('suporte', 'Como posso entrar em contato?', 'Pode nos contactar: 1) Chat do site (24h), 2) Facebook Messenger, 3) Instagram Direct, 4) Email: info@superloja.vip, 5) Telefone/WhatsApp: +244 999 000 000. Nosso suporte está sempre disponível para ajudar!', ARRAY['contato', 'suporte', 'chat', 'email', 'telefone', 'whatsapp'], 5, true),

('devolucao', 'Posso trocar ou devolver um produto?', 'Sim, você tem 7 dias para trocar ou devolver produtos desde que estejam na embalagem original e sem uso. Para eletrônicos, fazemos teste antes da troca. Entre em contato conosco para iniciar o processo.', ARRAY['troca', 'devolução', 'prazo', 'embalagem'], 4, true),

('precos', 'Os preços são competitivos?', 'Sim! Temos os melhores preços de Angola. Fazemos price match - se encontrar o mesmo produto mais barato em outro lugar, igualamos o preço. Além disso, oferecemos descontos progressivos para compras maiores.', ARRAY['preço', 'competitivo', 'barato', 'desconto', 'price match'], 4, true),

('facebook', 'Como comprar pelo Facebook?', 'Pelo Facebook: 1) Comente "QUERO" no post do produto 2) Te chamaremos no DM 3) Confirmamos detalhes 4) Fazemos pedido personalizado para você.', ARRAY['facebook', 'comprar', 'dm', 'quero'], 4, true)

ON CONFLICT DO NOTHING;

-- 7. Inserir métricas iniciais para hoje
INSERT INTO ai_metrics (date, total_messages, successful_responses, failed_responses, average_response_time, user_satisfaction_score, platform_breakdown) VALUES
(CURRENT_DATE, 0, 0, 0, 0.0, 0.0, '{"website": 0, "facebook": 0, "instagram": 0}')
ON CONFLICT (date) DO NOTHING;

-- 8. Habilitar RLS (Row Level Security) - Opcional
-- ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ai_knowledge_base ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ai_metrics ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

-- 9. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_platform ON ai_conversations(platform);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_timestamp ON ai_conversations(timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_category ON ai_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_keywords ON ai_knowledge_base USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_active ON ai_knowledge_base(active);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_date ON ai_metrics(date);

COMMENT ON TABLE ai_conversations IS 'Histórico de conversas do agente IA em todas as plataformas';
COMMENT ON TABLE ai_knowledge_base IS 'Base de conhecimento para respostas do agente IA';
COMMENT ON TABLE ai_metrics IS 'Métricas diárias de performance do agente IA';
COMMENT ON TABLE ai_settings IS 'Configurações do agente IA (APIs, comportamento, etc)';
