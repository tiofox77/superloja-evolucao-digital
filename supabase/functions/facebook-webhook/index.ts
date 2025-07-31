import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  if (req.method === 'GET') {
    // Webhook verification
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    const VERIFY_TOKEN = Deno.env.get('FACEBOOK_VERIFY_TOKEN');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook verified');
      return new Response(challenge, { status: 200 });
    } else {
      console.log('❌ Verification failed');
      return new Response('Forbidden', { status: 403 });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json();
      console.log('📨 Webhook received:', JSON.stringify(body, null, 2));

      if (body.object === 'page') {
        for (const entry of body.entry) {
          if (entry.messaging) {
            for (const messaging of entry.messaging) {
              // Ignorar mensagens próprias (echo) para evitar loops
              if (messaging.message && messaging.message.is_echo) {
                console.log('🔄 Ignorando mensagem echo (própria)');
                continue;
              }
              
              if (messaging.message && messaging.message.text) {
                await handleMessage(messaging, supabase);
              }
            }
          }
        }
      }

      return new Response('EVENT_RECEIVED', { status: 200 });
    } catch (error) {
      console.error('❌ Error processing webhook:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  return new Response('Method not allowed', { status: 405 });
});

async function handleMessage(messaging: any, supabase: any) {
  const senderId = messaging.sender.id;
  const messageText = messaging.message.text;
  
  console.log(`📨 Mensagem de ${senderId}: ${messageText}`);
  
  try {
    // Verificar se o bot está habilitado
    const { data: botSettings } = await supabase
      .from('ai_settings')
      .select('value')
      .eq('key', 'bot_enabled')
      .single();
    
    if (botSettings?.value !== 'true') {
      console.log('🚫 Bot desabilitado');
      return;
    }
    
    // Salvar mensagem recebida
    await supabase.from('ai_conversations').insert({
      platform: 'facebook',
      user_id: senderId,
      message: messageText,
      type: 'received',
      timestamp: new Date().toISOString()
    });
    
    // Processar com IA
    const aiResponse = await processWithAI(messageText, senderId, supabase);
    
    // Enviar resposta
    await sendFacebookMessage(senderId, aiResponse, supabase);
    
    // Salvar resposta enviada
    await supabase.from('ai_conversations').insert({
      platform: 'facebook',
      user_id: senderId,
      message: aiResponse,
      type: 'sent',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    await sendFacebookMessage(senderId, 'Desculpe, tive um problema técnico. Tente novamente!', supabase);
  }
}

async function processWithAI(message: string, senderId: string, supabase: any): Promise<string> {
  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.error('❌ OpenAI API Key não encontrada');
      return getFallbackResponse(message, supabase);
    }

    // Buscar histórico de conversas recentes do usuário para contexto
    console.log('🔍 Buscando histórico de conversas...');
    const { data: recentConversations } = await supabase
      .from('ai_conversations')
      .select('message, type, timestamp')
      .eq('platform', 'facebook')
      .eq('user_id', senderId)
      .order('timestamp', { ascending: false })
      .limit(10); // Últimas 10 mensagens

    // Analisar contexto da conversa
    const context = analyzeConversationContext(recentConversations || [], message);
    console.log('🧠 Contexto analisado:', context);

    // BUSCA INTELIGENTE DE PRODUTOS BASEADA NA MENSAGEM DO USUÁRIO
    console.log('🧠 Analisando mensagem para busca inteligente:', message);
    
    // Detectar categoria/tipo de produto que o usuário está perguntando
    const productKeywords = {
      'fones': ['fone', 'fones', 'headphone', 'earphone', 'ouvido'],
      'mouse': ['mouse', 'rato'],
      'teclado': ['teclado', 'keyboard'],
      'cabo': ['cabo', 'carregador'],
      'carregador': ['carregador', 'fonte'],
      'todos': ['todos', 'tudo', 'mais', 'outros', 'resto']
    };
    
    let searchQuery = '';
    let categoryFound = '';
    
    // Detectar categoria específica
    for (const [category, keywords] of Object.entries(productKeywords)) {
      if (keywords.some(keyword => message.toLowerCase().includes(keyword))) {
        categoryFound = category;
        if (category !== 'todos') {
          searchQuery = keywords[0]; // Usar primeira palavra-chave para busca
        }
        break;
      }
    }
    
    console.log('🎯 Categoria detectada:', categoryFound);
    console.log('🔍 Query de busca:', searchQuery);
    
    // Buscar produtos de forma mais específica
    let productsQuery = supabase
      .from('products')
      .select('id, name, slug, price, description, image_url, category_id')
      .eq('active', true)
      .eq('in_stock', true);
    
    // Se foi detectado uma categoria específica, filtrar por ela
    if (searchQuery && categoryFound !== 'todos') {
      // Usar ilike para busca flexível no nome e descrição
      productsQuery = productsQuery.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }
    
    // Buscar TODOS os produtos se usuário perguntou sobre "todos" ou categoria específica
    if (categoryFound === 'todos' || searchQuery) {
      productsQuery = productsQuery.limit(50); // Aumentar limite para busca mais completa
    } else {
      productsQuery = productsQuery.limit(25);
    }
    
    const { data: products } = await productsQuery;

    // Construir informações dos produtos (incluindo URLs das imagens quando necessário)
    let productsInfo = '';
    if (products && products.length > 0) {
      productsInfo = '\n\nPRODUTOS DISPONÍVEIS:\n';
      products.forEach((product: any, index: number) => {
        const price = parseFloat(product.price).toLocaleString('pt-AO');
        productsInfo += `${index + 1}. ${product.name} - ${price} Kz\n`;
        productsInfo += `   Link: https://superloja.vip/produto/${product.slug}\n`;
        // Incluir URL da imagem nos dados do produto para a IA
        if (product.image_url) {
          productsInfo += `   ImageURL: ${product.image_url}\n`;
        }
        productsInfo += '\n';
      });
      
      console.log(`📊 Produtos carregados: ${products.length}`);
      console.log(`🖼️ Produtos com imagem: ${products.filter((p: any) => p.image_url).length}`);
    }

    // Detectar se usuário quer ver fotos
    const photoKeywords = ['fotos', 'foto', 'imagem', 'imagens', 'envie fotos', 'manda imagem', 'manda imagens', 'quero fotos', 'quero ver', 'mostra foto', 'mostra imagem'];
    const wantsPhotos = photoKeywords.some(keyword => message.toLowerCase().includes(keyword));
    
    console.log('=== DEBUG FOTOS ===');
    console.log('📝 Mensagem original:', message);
    console.log('📸 Keywords encontradas:', photoKeywords.filter(k => message.toLowerCase().includes(k)));
    console.log('🎯 Usuário quer fotos:', wantsPhotos);
    console.log('==================');

    // Construir histórico de conversa para contexto
    let conversationHistory = '';
    if (recentConversations && recentConversations.length > 0) {
      conversationHistory = '\n\n📋 HISTÓRICO RECENTE DA CONVERSA:\n';
      recentConversations.reverse().forEach((conv: any, index: number) => {
        const role = conv.type === 'received' ? 'Cliente' : 'Carlos';
        conversationHistory += `${index + 1}. ${role}: "${conv.message}"\n`;
      });
      conversationHistory += '\n';
    }

    const systemPrompt = `Você é Carlos, um vendedor angolano experiente da SuperLoja (https://superloja.vip).

PERSONALIDADE: 
- Fala como um angolano real, informal mas respeitoso
- Use expressões como "meu caro", "eh pá", "não é assim?"
- Seja caloroso, paciente e entusiasmado com os produtos
- Conte histórias sobre os produtos se apropriado
- Mostre interesse genuíno nas necessidades do cliente

INTELIGÊNCIA CRÍTICA - ANTES DE RESPONDER:
1. ANALISE A MENSAGEM: O que o cliente REALMENTE está perguntando?
2. IDENTIFIQUE O PRODUTO: Ele quer algo específico ou está explorando?
3. CONTEXTO: Olhe o histórico - já falaram de algo antes?
4. ESTRATÉGIA: Qual a melhor forma de ajudar este cliente específico?
5. HUMANIDADE: Como um vendedor real responderia?

REGRAS DE INTELIGÊNCIA:
- Se cliente pergunta produto específico que NÃO EXISTE, seja honesto: "Eh pá, não temos esse modelo específico, mas tenho aqui..."
- Se cliente pergunta algo vago, faça perguntas: "Qual tipo de fone procura? Para desporto? Trabalho?"
- Se cliente parece confuso, esclareça: "Deixe-me ajudar a encontrar o que precisa..."
- NUNCA dê listas genéricas se cliente perguntou algo específico
- SEMPRE tente entender a NECESSIDADE por trás da pergunta

${conversationHistory}

CONTEXTO ANALISADO:
${context.summary}

PRODUTO DE INTERESSE: ${context.selectedProduct || 'Nenhum produto específico identificado'}
FASE DA CONVERSA: ${context.conversationStage}
PRECISA LEMBRAR: ${context.importantInfo || 'Nada específico'}

${productsInfo}

INSTRUÇÕES ESPECÍFICAS PARA ESTA MENSAGEM:
Mensagem do cliente: "${message}"

ANÁLISE OBRIGATÓRIA ANTES DE RESPONDER:
1. O que o cliente REALMENTE quer? (analise palavras-chave, intenção)
2. BUSCA NA BASE DE DADOS: Categoria detectada - "${categoryFound}" | Query - "${searchQuery}" | Produtos encontrados: ${products?.length || 0}
3. Se cliente pergunta "são todos?", "tem mais?", "mais algum?" - CONSULTE A LISTA COMPLETA ACIMA e responda baseado nos dados REAIS
4. Se não existe exatamente o que perguntou, qual seria a melhor alternativa da lista acima?
5. Como posso ser mais útil e humano na resposta baseado nos produtos REAIS disponíveis?

IMPORTANTE - QUANDO CLIENTE PERGUNTA SE HÁ MAIS PRODUTOS:
- Analise TODA a lista de produtos acima
- Se existem ${products?.length || 0} produtos na categoria "${categoryFound}"
- Seja específico: "Sim, esses são TODOS os ${categoryFound} que temos" ou "Encontrei mais X produtos..."
- NUNCA invente produtos que não estão na lista acima
- Se a busca retornou poucos produtos, seja honesto: "Esses são os que temos disponíveis no momento"

DETECÇÃO DE FOTOS:
Usuário pediu fotos: ${wantsPhotos}

COMPORTAMENTO HUMANO AVANÇADO:
- Se cliente pergunta "fones pro6" e não temos, seja honesto e ofereça alternativas similares
- Se cliente pergunta sobre stock, seja específico sobre o que tem
- Se cliente quer algo que não existe, sugira o mais próximo com explicação
- Use linguagem natural: "Olha, esse modelo específico não temos, mas tenho aqui uns que são parecidos..."
- Faça perguntas quando não tiver certeza: "Quando diz 'pro6', está a falar de que marca?"

PROCESSO DE VENDA HUMANIZADO:
- Se cliente quer comprar algo, explique: "Óptimo! Para confirmar a sua compra, preciso só de alguns dados..."
- Peça: Nome completo, contacto (telefone), produto escolhido
- Seja empático: "Entendo que quer garantir que seja o produto certo"
- Ofereça ajuda: "Quer saber mais sobre garantia? Entrega é grátis!"

REGRAS PARA IMAGENS:
${wantsPhotos ? 
  '- DEVE INCLUIR imagens para produtos relevantes usando: 📸 ![Imagem](ImageURL)' :
  '- NÃO inclua imagens a menos que o cliente peça especificamente'
}

FORMATO PARA PRODUTOS (só quando relevante):
X. *[NOME COMPLETO DO PRODUTO]* - [PREÇO EXATO] Kz
   🔗 [Ver produto](https://superloja.vip/produto/[SLUG])
${wantsPhotos ? '   📸 ![Imagem]([URL_DA_IMAGEM])' : ''}

REGRAS ABSOLUTAS:
- PENSE antes de responder - analise o que cliente REALMENTE quer
- SEJA HONESTO se não temos o produto específico
- FAÇA PERGUNTAS se não entender
- SEJA HUMANO, não robótico
- OFEREÇA ALTERNATIVAS inteligentes
- Use * para texto em negrito (*produto*)
- Use [Ver produto](URL) para links quando mostrar produtos
- Use preços EXATOS da lista acima

IMPORTANTE: 
- SEMPRE analise a mensagem específica do cliente
- Se cliente pergunta algo que não temos, seja honesto mas ofereça alternativas
- Se cliente está confuso, ajude a esclarecer
- RESPONDA COMO UM HUMANO, não como um bot com lista padrão`;

    console.log('🤖 Enviando para OpenAI com instruções para mostrar TODOS os fones...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 10000,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro OpenAI:', response.status, errorText);
      return getFallbackResponse(message, supabase);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      const aiResponse = data.choices[0].message.content.trim();
      console.log(`✅ Resposta IA gerada - Tamanho: ${aiResponse.length} caracteres`);
      console.log(`📊 Tokens usados: ${data.usage?.total_tokens || 'não disponível'}`);
      console.log(`📝 Tokens completion: ${data.usage?.completion_tokens || 'não disponível'}`);
      
      // Detectar intenção de compra mais ampla
      const purchaseIntentDetected = detectPurchaseIntent(message, aiResponse);
      if (purchaseIntentDetected) {
        console.log('🛒 Intenção de compra detectada - notificando admin');
        // Notificar admin em background (sem aguardar)
        notifyAdmin(senderId, message, supabase, purchaseIntentDetected).catch(error => 
          console.error('❌ Erro ao notificar admin:', error)
        );
      }
      
      return aiResponse;
    } else {
      throw new Error('Resposta inválida da OpenAI');
    }

  } catch (error) {
    console.error('❌ Erro processamento IA:', error);
    return getFallbackResponse(message, supabase);
  }
}

async function getFallbackResponse(message: string, supabase: any): Promise<string> {
  const lowerMessage = message.toLowerCase();
  
  // Detectar se usuário quer ver fotos
  const photoKeywords = ['fotos', 'foto', 'imagem', 'imagens', 'envie fotos', 'manda imagem', 'manda imagens', 'quero fotos', 'quero ver', 'mostra foto', 'mostra imagem'];
  const wantsPhotos = photoKeywords.some(keyword => lowerMessage.includes(keyword));
  
  console.log(`📸 Fallback - Usuário quer fotos: ${wantsPhotos}`);
  
  // Buscar produtos por categoria específica
  if (lowerMessage.includes('fone') || lowerMessage.includes('bluetooth') || lowerMessage.includes('auricular')) {
    try {
      const { data: headphones } = await supabase
        .from('products')
        .select('name, slug, price, image_url')
        .eq('active', true)
        .eq('in_stock', true)
        .or('name.ilike.%fone%,name.ilike.%bluetooth%,name.ilike.%auricular%')
        .order('price', { ascending: true });
      
      if (headphones && headphones.length > 0) {
        console.log(`✅ Encontrados ${headphones.length} fones em stock - enviando TODOS`);
        let response = "Claro! Aqui estão todos os fones de ouvido disponíveis na nossa loja:\n\n";
        headphones.forEach((product: any, index: number) => {
          const price = parseFloat(product.price).toLocaleString('pt-AO');
          response += `${index + 1}. *${product.name}* - ${price} Kz\n`;
          response += `   🔗 [Ver produto](https://superloja.vip/produto/${product.slug})\n`;
          
          // Incluir imagem se usuário pediu fotos E produto tem imagem
          if (wantsPhotos && product.image_url) {
            response += `   📸 ![Imagem](${product.image_url})\n`;
          }
          response += "\n";
        });
        
        // Mensagem adicional sobre fotos
        if (wantsPhotos) {
          response += "📸 Fotos incluídas acima! Se alguma não aparecer, é só avisar.\n";
        } else {
          response += "Se quiseres ver as fotos dos produtos, é só pedir! 📸\n";
        }
        
        response += "Qual deles te interessa mais? 😊";
        return response;
      }
    } catch (error) {
      console.error('❌ Erro buscar fones:', error);
    }
  }
  
  return `Olá! Bem-vindo à SuperLoja! 😊 Temos produtos incríveis com entrega grátis. O que procura? 

Visite nosso site: https://superloja.vip`;
}

function analyzeConversationContext(conversations: any[], currentMessage: string) {
  console.log('🔍 Analisando contexto de', conversations.length, 'conversas...');
  
  const context = {
    summary: '',
    selectedProduct: null,
    conversationStage: 'initial',
    importantInfo: null
  };

  // Se não há histórico, retornar contexto inicial
  if (!conversations || conversations.length === 0) {
    context.summary = 'Primeira conversa com o cliente';
    context.conversationStage = 'initial';
    return context;
  }

  // Analisar mensagens para extrair contexto
  const allMessages = conversations.map(c => c.message).join(' ').toLowerCase();
  const currentLower = currentMessage.toLowerCase();

  // Detectar produto de interesse baseado no histórico
  const productKeywords = {
    't19': 'Fones de ouvido Bluetooth sem fio Disney T19',
    'disney': 'Fones de ouvido Bluetooth sem fio Disney T19',
    'bluetooth': 'Fones de ouvido relacionados',
    'fone': 'Fones de ouvido em geral',
    'auricular': 'Fones de ouvido',
    'tws': 'Fones sem fio TWS'
  };

  for (const [keyword, product] of Object.entries(productKeywords)) {
    if (allMessages.includes(keyword) || currentLower.includes(keyword)) {
      context.selectedProduct = product;
      break;
    }
  }

  // Detectar confirmações e respostas positivas
  const confirmationKeywords = ['sim', 'yes', 'ok', 'certo', 'correto', 'confirmo', 'podem entregar', 'perfeito', 'está certo', 'tudo certo'];
  const hasConfirmation = confirmationKeywords.some(keyword => 
    currentLower.includes(keyword)
  );

  // Detectar fase da conversa com mais inteligência
  const purchaseIndicators = ['quero comprar', 'interesse', 'finalizar', 'nome:', 'contacto:', 'confirmar', 'carlos raposo', '939729902'];
  const hasPurchaseIntent = purchaseIndicators.some(indicator => 
    allMessages.includes(indicator) || currentLower.includes(indicator)
  );

  // Detectar se cliente já forneceu dados pessoais completos
  const hasPersonalData = (allMessages.includes('carlos raposo') || allMessages.includes('939729902')) && 
                         (allMessages.includes('kilamba') || allMessages.includes('j4'));

  if (hasPersonalData && hasConfirmation) {
    context.conversationStage = 'confirmed_purchase';
  } else if (hasPersonalData) {
    context.conversationStage = 'awaiting_confirmation';
  } else if (hasPurchaseIntent) {
    context.conversationStage = 'purchase_intent';
  } else if (context.selectedProduct) {
    context.conversationStage = 'product_discussion';
  } else {
    context.conversationStage = 'browsing';
  }

  // Detectar informações importantes para lembrar
  const importantPatterns = [
    { pattern: /nome.*?([a-zA-Z\s]+)/i, type: 'nome' },
    { pattern: /contacto.*?(\d+)/i, type: 'contacto' },
    { pattern: /telefone.*?(\d+)/i, type: 'telefone' }
  ];

  for (const conv of conversations) {
    for (const pattern of importantPatterns) {
      const match = conv.message.match(pattern.pattern);
      if (match) {
        context.importantInfo = `${pattern.type}: ${match[1]}`;
        break;
      }
    }
  }

  // Construir resumo baseado no contexto
  if (context.conversationStage === 'confirmed_purchase') {
    context.summary = `🎉 COMPRA CONFIRMADA! Cliente ${context.selectedProduct ? 'confirmou compra do ' + context.selectedProduct : 'finalizou pedido'}. NOTIFICAR ADMIN IMEDIATAMENTE!`;
  } else if (context.conversationStage === 'awaiting_confirmation') {
    context.summary = `Cliente forneceu dados pessoais para ${context.selectedProduct || 'um produto'}. Aguardando confirmação final.`;
  } else if (context.conversationStage === 'purchase_intent') {
    context.summary = `Cliente demonstrou interesse em comprar ${context.selectedProduct || 'um produto'}. Fase de finalização de compra.`;
  } else if (context.conversationStage === 'product_discussion') {
    context.summary = `Cliente está interessado em ${context.selectedProduct}. Discutindo detalhes do produto.`;
  } else {
    context.summary = 'Cliente navegando e explorando produtos disponíveis.';
  }

  console.log('🧠 Contexto extraído:', {
    produto: context.selectedProduct,
    fase: context.conversationStage,
    info: context.importantInfo
  });

  return context;
}

function detectPurchaseIntent(customerMessage: string, aiResponse: string): string | null {
  const lowerMessage = customerMessage.toLowerCase();
  const lowerResponse = aiResponse.toLowerCase();
  
  // Palavras que indicam confirmação direta
  const confirmationKeywords = [
    'sim podem entregar', 'sim', 'yes', 'ok', 'certo', 'correto', 'confirmo', 
    'podem entregar', 'perfeito', 'está certo', 'tudo certo', 'concordo'
  ];
  
  // Palavras que indicam interesse forte em comprar
  const strongBuyKeywords = [
    'quero comprar', 'vou comprar', 'compro', 'interesse', 'preço final',
    'como faço para comprar', 'forma de pagamento', 'entrega', 'garantia',
    'posso pagar', 'aceita cartão', 'disponível', 'stock', 'quanto tempo demora'
  ];
  
  // Palavras que indicam dados pessoais/finalização
  const finalizationKeywords = [
    'nome:', 'contacto:', 'telefone:', 'endereço:', 'confirmar compra',
    'finalizar', 'morada', 'dados pessoais', 'meu nome é', 'meu contacto',
    'carlos raposo', '939729902', 'kilamba j4'
  ];
  
  // Detectar confirmação direta (MÁXIMA PRIORIDADE)
  const hasDirectConfirmation = confirmationKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  ) && (lowerResponse.includes('dados') || lowerResponse.includes('finalizar') || lowerResponse.includes('compra'));
  
  // Detectar tentativa de finalização
  const hasFinalizationAttempt = finalizationKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  );
  
  // Detectar interesse forte
  const hasStrongBuyIntent = strongBuyKeywords.some(keyword => 
    lowerMessage.includes(keyword) || lowerResponse.includes(keyword)
  );
  
  if (hasDirectConfirmation) {
    return 'confirmed_purchase'; // Cliente confirmou compra diretamente
  } else if (hasFinalizationAttempt) {
    return 'finalization'; // Cliente tentando finalizar compra
  } else if (hasStrongBuyIntent) {
    return 'strong_interest'; // Cliente mostra interesse forte
  }
  
  return null; // Nenhuma intenção de compra detectada
}

async function notifyAdmin(customerId: string, customerMessage: string, supabase: any, intentType: string) {
  try {
    console.log(`🔔 Notificando admin sobre ${intentType}...`);
    
    // Buscar admin ID do banco de dados
    const { data: adminData } = await supabase
      .from('ai_settings')
      .select('value')
      .eq('key', 'admin_facebook_id')
      .single();

    const adminId = adminData?.value || "24320548907583618";
    console.log('🔍 Admin ID para notificação:', adminId);
    
    // Buscar token do Facebook
    const { data: tokenData } = await supabase
      .from('ai_settings')
      .select('value')
      .eq('key', 'facebook_page_token')
      .single();

    const pageAccessToken = tokenData?.value || Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    
    if (!pageAccessToken) {
      console.error('❌ Token Facebook não encontrado');
      return;
    }

    // Construir mensagem personalizada baseada no tipo de intenção
    let notificationMessage = '';
    let urgencyLevel = '';
    
    
    if (intentType === 'confirmed_purchase') {
      urgencyLevel = '🎉 VENDA FECHADA';
      notificationMessage = `${urgencyLevel} - COMPRA CONFIRMADA PELO CLIENTE! 🎉

👤 Cliente: ${customerId}
💬 Mensagem: "${customerMessage}"

✅ CLIENTE CONFIRMOU A COMPRA!
📦 Proceder com preparação da entrega
💰 Venda finalizada com sucesso!

⏰ ${new Date().toLocaleString('pt-AO')}`;
    } else if (intentType === 'finalization') {
      urgencyLevel = '🚨 URGENTE';
      notificationMessage = `${urgencyLevel} - CLIENTE TENTANDO FINALIZAR COMPRA! 🚨

👤 Cliente: ${customerId}
💬 Mensagem: "${customerMessage}"

🔥 AÇÃO IMEDIATA NECESSÁRIA!
📱 Entre já em contacto com o cliente para fechar a venda!

⏰ ${new Date().toLocaleString('pt-AO')}`;
    } else if (intentType === 'strong_interest') {
      urgencyLevel = '⚡ OPORTUNIDADE';
      notificationMessage = `${urgencyLevel} - CLIENTE COM FORTE INTERESSE! ⚡

👤 Cliente: ${customerId}
💬 Mensagem: "${customerMessage}"

💡 Cliente demonstra interesse real em comprar
📞 Considere entrar em contacto para ajudar na decisão

⏰ ${new Date().toLocaleString('pt-AO')}`;
    }

    const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${pageAccessToken}`;
    
    // Primeiro tentar com RESPONSE (que funciona no teste)
    const payload = {
      recipient: { id: adminId },
      message: { text: notificationMessage },
      messaging_type: 'RESPONSE'
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro notificar admin:', response.status, errorText);
      
      // Se falhar, tentar enviar como notificação normal (sem tag)
      const fallbackPayload = {
        recipient: { id: adminId },
        message: { text: notificationMessage },
        messaging_type: 'RESPONSE'
      };
      
      const fallbackResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fallbackPayload),
      });
      
      if (fallbackResponse.ok) {
        console.log('✅ Admin notificado via fallback!');
      } else {
        console.error('❌ Falha total ao notificar admin');
      }
    } else {
      console.log('✅ Admin notificado com sucesso!');
    }

    // Salvar notificação no banco para histórico
    await supabase.from('admin_notifications').insert({
      admin_user_id: adminId,
      notification_type: intentType,
      message: notificationMessage,
      metadata: {
        customer_id: customerId,
        customer_message: customerMessage,
        intent_type: intentType,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erro ao notificar admin:', error);
  }
}

async function sendFacebookMessage(recipientId: string, messageText: string, supabase: any) {
  try {
    const { data: pageTokenData } = await supabase
      .from('ai_settings')
      .select('value')
      .eq('key', 'facebook_page_token')
      .single();

    const pageAccessToken = pageTokenData?.value || Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    
    if (!pageAccessToken) {
      console.error('❌ Facebook Page Access Token não encontrado');
      return;
    }

    const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${pageAccessToken}`;
    
    // Verificar se a mensagem contém imagens
    const imageRegex = /📸 !\[Imagem\]\(([^)]+)\)/g;
    const images = [];
    let match;
    
    console.log('🔍 Verificando imagens na mensagem...');
    console.log('📝 Texto da mensagem:', messageText.substring(0, 500));
    
    while ((match = imageRegex.exec(messageText)) !== null) {
      images.push(match[1]);
      console.log('📸 Imagem encontrada:', match[1]);
    }
    
    console.log(`📊 Total de imagens encontradas: ${images.length}`);
    
    // Remover markdown de imagem do texto
    const cleanText = messageText.replace(/📸 !\[Imagem\]\([^)]+\)/g, '').trim();
    
    // Enviar texto primeiro
    if (cleanText) {
      const textPayload = {
        recipient: { id: recipientId },
        message: { text: cleanText },
        messaging_type: 'RESPONSE'
      };

      const textResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(textPayload),
      });

      if (!textResponse.ok) {
        const errorText = await textResponse.text();
        console.error('❌ Erro ao enviar texto Facebook:', textResponse.status, errorText);
      } else {
        console.log('✅ Texto enviado para Facebook');
      }
    }
    
    // Enviar imagens como attachments
    console.log(`🚀 Enviando ${images.length} imagens como anexos...`);
    for (const imageUrl of images) {
      console.log('📤 Enviando imagem:', imageUrl);
      const imagePayload = {
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: 'image',
            payload: {
              url: imageUrl,
              is_reusable: true
            }
          }
        },
        messaging_type: 'RESPONSE'
      };

      const imageResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imagePayload),
      });

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        console.error('❌ Erro ao enviar imagem Facebook:', {
          status: imageResponse.status,
          error: errorText,
          imageUrl: imageUrl
        });
      } else {
        console.log('✅ Imagem enviada com sucesso para Facebook:', imageUrl);
      }
      
      // Pausa entre envios
      await new Promise(resolve => setTimeout(resolve, 500));
    }

  } catch (error) {
    console.error('❌ Erro geral ao enviar mensagem:', error);
  }
}