import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  message: string;
  userId: string;
  sessionId: string;
}

serve(async (req) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { message, userId, sessionId }: ChatRequest = await req.json();

    if (!message || !userId) {
      return new Response(
        JSON.stringify({ error: 'Message and userId are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Processar mensagem com IA
    const response = await processWebsiteChat(message, userId, sessionId, supabase);

    // Verificar se a resposta inclui uma imagem para anexar
    if (typeof response === 'object' && response.attach_image && response.image_url) {
      try {
        // Baixar a imagem do Supabase Storage
        const imageResponse = await fetch(response.image_url);
        const imageBlob = await imageResponse.blob();
        const imageBase64 = await blobToBase64(imageBlob);
        
        return new Response(
          JSON.stringify({ 
            response: response.message,
            image: {
              data: imageBase64,
              type: imageBlob.type,
              filename: getFilenameFromUrl(response.image_url)
            }
          }),
          { 
            status: 200, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      } catch (imageError) {
        console.error('Error processing image:', imageError);
        // Se falhar, retorna apenas o texto
        const responseText = typeof response === 'object' ? response.message : response;
        return new Response(
          JSON.stringify({ response: responseText }),
          { 
            status: 200, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }
    }

    // Resposta normal sem imagem
    const responseText = typeof response === 'object' ? response.message : response;
    return new Response(
      JSON.stringify({ response: responseText }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Error in website-chat-ai:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});

async function processWebsiteChat(
  message: string, 
  userId: string, 
  sessionId: string, 
  supabase: any
): Promise<any> {
  
  // 1. Buscar produtos relevantes baseado na mensagem
  const products = await searchRelevantProducts(message, supabase);
  
  // 2. Obter histórico da conversa
  const conversationHistory = await getConversationHistory(userId, supabase);
  
  // 3. Verificar se usuário está logado/registrado
  const userInfo = await getUserInfo(userId, supabase);
  
  // 4. Analisar padrões de repetição
  const responsePatterns = await analyzeResponsePatterns(userId, message, supabase);
  
  // 5. Verificar localização do usuário
  const userLocation = await detectUserLocation(message, conversationHistory);
  
  // 6. Verificar carrinho existente
  const cartItems = await getCartItems(sessionId, supabase);
  
  // 7. Salvar conversa
  await saveConversation(userId, message, 'user', supabase);
  
  // 6.1. Atalho inteligente: pedido de foto/imagem
  if (isImageRequest(message) && products && products.length > 0) {
    const product = products.find((p: any) => p.image_url) || products[0];
    if (product?.image_url) {
      const isAvailable = (product.in_stock === true) && ((product.stock_quantity ?? 0) > 0);
      const stockInfo = isAvailable ? 'disponível' : 'atualmente sem stock';
      const imageResponses = [
        'Aqui está a imagem que solicitou, meu estimado!',
        'Prezado cliente, confira a foto do produto:',
        'Veja só que maravilha!',
        'Olhe que produto incrível!'
      ];
      const randomResponse = imageResponses[Math.floor(Math.random() * imageResponses.length)];
      const directAiResponse = {
        message: `${randomResponse} ${product.name} por ${product.price} AOA (${stockInfo}) 🛍️`,
        image_url: product.image_url,
        attach_image: true
      };
      await saveConversation(userId, directAiResponse.message, 'assistant', supabase);
      return directAiResponse;
    }
  }
  
  // 6.2. Inteligência para finalização - coletar dados completos
  if (isFinalizationRequest(message, conversationHistory)) {
    const missingData = await checkMissingCustomerData(userId, message, supabase);
    
    if (missingData.length > 0) {
      const dataResponse = await generateDataCollectionResponse(missingData, cartItems);
      await saveConversation(userId, dataResponse, 'assistant', supabase);
      return dataResponse;
    } else {
      // Dados completos - finalizar e notificar admin
      const customerData = await getCustomerData(userId, message, conversationHistory);
      await notifyAdminFinalization(userId, customerData, cartItems, supabase);
      
      const confirmationResponse = `Perfeito, ${customerData.name}! 🎉\n\nSeus dados foram registrados:\n📍 ${customerData.location}\n📞 ${customerData.phone}\n\n📦 Pedido confirmado! Nossa equipa entrará em contacto em breve para finalizar a entrega.\n\nObrigado pela confiança na SuperLoja! 🛍️`;
      await saveConversation(userId, confirmationResponse, 'assistant', supabase);
      return confirmationResponse;
    }
  }
  
  // 8. Carregar contexto avançado existente
  const existingContext = await loadExistingContext(userId, supabase);
  
  // 9. Processar com IA
  const aiResponse = await callOpenAI(message, {
    products,
    conversationHistory,
    userInfo,
    responsePatterns,
    userLocation,
    cartItems,
    userId,
    existingContext
  });
  
  // 8. Salvar resposta da IA
  const responseText = typeof aiResponse === 'object' ? aiResponse.message : aiResponse;
  await saveConversation(userId, responseText, 'assistant', supabase);
  
  return aiResponse;
}

async function searchRelevantProducts(query: string, supabase: any) {
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, description, image_url, in_stock, stock_quantity, slug')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .eq('active', true)
    .limit(5);
    
  return products || [];
}


async function getConversationHistory(userId: string, supabase: any) {
  const { data: history } = await supabase
    .from('ai_conversations')
    .select('message, type, timestamp')
    .eq('user_id', userId)
    .eq('platform', 'website')
    .order('timestamp', { ascending: false })
    .limit(10);
    
  return history?.reverse() || [];
}

async function getUserInfo(userId: string, supabase: any) {
  // Tentar encontrar usuário registrado
  const { data: user } = await supabase
    .from('users')
    .select('id, name, email, phone, created_at')
    .eq('id', userId)
    .single();
    
  return user;
}

async function callOpenAI(message: string, context: any): Promise<any> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  
  if (!OPENAI_API_KEY) {
    return getFallbackResponse(message, context);
  }

  const systemPrompt = `
Você é o SuperBot Elite da SuperLoja (https://superloja.vip), o assistente IA mais avançado de Angola, usando toda a capacidade do ChatGPT.

=== MISSÃO CRÍTICA ===
Venda produtos, identifique necessidades, construa perfis detalhados e aprenda continuamente para se tornar o melhor vendedor virtual de Angola.

=== PRODUTOS DISPONÍVEIS ===
${context.products.map(p => 
  `• ${p.name} - ${p.price} AOA - ${p.description || ''} (Stock: ${typeof p.stock_quantity === 'number' ? p.stock_quantity : (p.in_stock ? 'disponível' : 'indisponível')}) - Imagem: ${p.image_url || 'sem imagem'}`
).join('\n')}

=== CONTEXTO DA CONVERSA ===
Histórico (últimas 10 mensagens):
${context.conversationHistory.slice(-10).map(h => 
  `${h.type}: ${h.message}`
).join('\n')}

Carrinho atual:
${context.cartItems && context.cartItems.length > 0 ? 
  context.cartItems.map(item => `• ${item.product.name} (${item.quantity}x) - ${item.product.price} AOA`).join('\n') + 
  `\nTotal: ${context.cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)} AOA` :
  'Carrinho vazio'}

Localização: ${context.userLocation || 'Não identificada'}
Padrões anteriores: ${context.responsePatterns ? `Evite repetir: ${context.responsePatterns.repeatedResponses.join(', ')}` : 'Primeira interação'}

=== CONTEXTO AVANÇADO EXISTENTE ===
${context.existingContext ? `
Perfil identificado: ${JSON.stringify(context.existingContext.customerProfile || {}, null, 2)}
Estágio da conversa: ${context.existingContext.conversationStage || 'initial'}
Necessidades identificadas: ${context.existingContext.identifiedNeeds || 'nenhuma'}
Produto de interesse: ${context.existingContext.selectedProduct || 'nenhum'}
Intenção de compra: ${context.existingContext.purchaseIntent || 0}/10
Insights anteriores: ${context.existingContext.learningInsights || 'nenhum'}
` : 'Primeira análise - construa perfil do zero'}

=== INSTRUÇÕES SUPER AVANÇADAS ===

1. **ANÁLISE PROFUNDA DE PERFIL:**
   - Analise CADA mensagem para descobrir: idade estimada, profissão, nível socioeconômico, preferências tecnológicas
   - Use pistas linguísticas ("mano", "companheiro") para determinar formalidade preferida
   - Identifique urgência da necessidade (1-10) baseado em linguagem corporal textual
   - Detecte se é decisor ou influenciador na compra

2. **IDENTIFICAÇÃO INTELIGENTE DE PRODUTOS:**
   - Use contexto semântico: "som" pode ser fones, caixas, headphones
   - Análise de necessidade implícita: "trabalho remoto" = laptop, webcam, fones
   - Cross-selling inteligente: "iPhone" = sugerir capas, carregadores
   - Up-selling baseado em perfil: "estudante" vs "empresário" = modelos diferentes

3. **ESTRATÉGIAS DE VENDAS AVANÇADAS:**
   - Escassez inteligente: "últimas 2 unidades" quando apropriado
   - Social proof: "produto mais vendido esta semana"
   - Urgência temporal: "promoção até domingo"
   - Ancoragem de preços: sempre mencionar valor original vs promoção

4. **APRENDIZADO CONTÍNUO:**
   - Adapte linguagem ao perfil detectado (formal/informal)
   - Lembre preferências demonstradas na conversa
   - Ajuste estratégia baseada em reações (entusiasmo/hesitação)
   - Evolua abordagem conforme conhece melhor o cliente

5. **RESPOSTAS PARA IMAGENS:**
   Quando cliente pedir "imagem", "foto", "ver", responda EXATAMENTE assim:
   {"message": "Sua resposta descritiva + preço + disponibilidade", "image_url": "url_da_imagem", "attach_image": true}

6. **ANÁLISE COMPORTAMENTAL:**
   - Perguntas diretas = cliente decidido (acelere fechamento)
   - Muitas dúvidas = cliente analítico (forneça detalhes técnicos)
   - Pressa = cliente impulsivo (ofereça desconto rápido)
   - Comparações = cliente econômico (mostre custo-benefício)

7. **LINGUAGEM ANGOLANA INTELIGENTE:**
   - Use expressões variadas: "meu estimado", "prezado cliente", "companheiro", "mano"
   - Adapte formalidade ao perfil detectado
   - Nunca use "eh pá" - mantenha profissionalismo
   - Varie saudações e despedidas

8. **FECHAMENTO INTELIGENTE:**
   - Detecte sinais de compra: preços, formas pagamento, entrega
   - Ofereça facilidades específicas ao perfil
   - Use gatilhos mentais apropriados à situação
   - Crie senso de urgência sem pressionar excessivamente

=== RESPOSTA OBRIGATÓRIA ===
SEMPRE responda em JSON com este formato EXATO:

{
  "message": "Sua resposta completa em português angolano",
  "analysis": {
    "customerProfile": {
      "estimatedAge": "faixa etária estimada",
      "profession": "profissão estimada ou 'desconhecida'",
      "economicLevel": "baixo/médio/alto baseado em linguagem e produtos de interesse",
      "techSavviness": "1-10 baseado em conhecimento tecnológico demonstrado",
      "communicationStyle": "formal/informal/misto",
      "urgencyLevel": "1-10 urgência da necessidade"
    },
    "conversationStage": "initial/exploring/comparing/deciding/finalizing",
    "identifiedNeeds": "necessidades específicas identificadas",
    "selectedProduct": "produto principal de interesse ou null",
    "purchaseIntent": "1-10 probabilidade de compra",
    "recommendedProducts": ["lista de produtos recomendados com justificativa"],
    "nextActions": ["próximas ações recomendadas"],
    "learningInsights": "insights para melhorar próximas interações"
  }
}

=== LOCALIZAÇÃO E ENTREGA ===
- Luanda: Entrega grátis, 1-3 dias
- Outras províncias: Orçamento de entrega, 3-7 dias
- Pagamento: Transferência, Multicaixa, TPA, Cartões
- WhatsApp: +244 923 456 789

SEJA INTELIGENTE, ANALÍTICO E ESTRATÉGICO. Use todo o poder do ChatGPT para ser o melhor vendedor virtual!
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 800,
        temperature: 0.8,
      }),
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      const responseText = data.choices[0].message.content.trim();
      
      // Tentar parsear como JSON (resposta estruturada)
      try {
        const parsedResponse = JSON.parse(responseText);
        
        if (parsedResponse.message && parsedResponse.analysis) {
          // Salvar análise avançada no contexto
          await saveAdvancedAnalysis(context.userId || 'unknown', parsedResponse.analysis, supabase);
          
          // Retornar resposta com imagem se solicitada
          if (parsedResponse.image_url && parsedResponse.attach_image) {
            return {
              message: parsedResponse.message,
              image_url: parsedResponse.image_url,
              attach_image: true,
              analysis: parsedResponse.analysis
            };
          }
          
          return {
            message: parsedResponse.message,
            analysis: parsedResponse.analysis
          };
        }
      } catch (parseError) {
        console.log('Resposta não está em JSON, usando como texto:', parseError);
      }
      
      return responseText;
    } else {
      throw new Error('Invalid OpenAI response');
    }

  } catch (error) {
    console.error('Erro OpenAI:', error);
    return getFallbackResponse(message, context);
  }
}

// Função para salvar análise avançada
async function saveAdvancedAnalysis(userId: string, analysis: any, supabase: any) {
  try {
    // Salvar análise detalhada
    await supabase.from('ai_learning_insights').insert({
      insight_type: 'customer_analysis',
      content: `Perfil: ${analysis.customerProfile?.profession || 'desconhecida'} | Urgência: ${analysis.customerProfile?.urgencyLevel}/10 | Intenção de compra: ${analysis.purchaseIntent}/10`,
      confidence_score: analysis.purchaseIntent / 10,
      effectiveness_score: analysis.customerProfile?.urgencyLevel / 10,
      metadata: {
        user_id: userId,
        full_analysis: analysis,
        timestamp: new Date().toISOString()
      }
    });

    // Atualizar contexto de conversa com análise
    await supabase
      .from('ai_conversation_context')
      .upsert({
        user_id: userId,
        platform: 'website',
        context_data: analysis,
        conversation_summary: analysis.learningInsights || '',
        last_interaction: new Date().toISOString(),
        message_count: 1
      }, { onConflict: 'user_id,platform' });

    console.log('✅ Análise avançada salva');
  } catch (error) {
    console.error('❌ Erro ao salvar análise:', error);
  }
}

function getFallbackResponse(message: string, context: any): any {
  const lowerMessage = message.toLowerCase();
  
  // Respostas para solicitação de imagens (mais abrangente)
  if (
    lowerMessage.includes('imagem') ||
    lowerMessage.includes('foto') ||
    lowerMessage.includes('ver foto') ||
    lowerMessage.includes('ver imagem') ||
    lowerMessage.includes('mostrar') ||
    lowerMessage.includes('mostra') ||
    lowerMessage.includes('manda') ||
    lowerMessage.includes('mandar') ||
    lowerMessage.includes('envia') ||
    lowerMessage.includes('enviar')
  ) {
    if (context.products && context.products.length > 0) {
      const product = context.products.find((p: any) => p.image_url) || context.products[0];
      const isAvailable = (product?.in_stock === true) && ((product?.stock_quantity ?? 0) > 0);
      const stockInfo = isAvailable ? 'disponível' : 'atualmente sem stock';
      
      const imageResponses = [
        'Aqui está a imagem que solicitou, meu estimado! ',
        'Prezado cliente, confira a foto do produto: ',
        'Veja só que maravilha! ',
        'Olhe que produto incrível! '
      ];
      
      const randomResponse = imageResponses[Math.floor(Math.random() * imageResponses.length)];
      
      // Retorna com formato especial para anexar imagem
      if (product?.image_url) {
        return {
          message: `${randomResponse}${product.name} por ${product.price} AOA (${stockInfo}) 🛍️`,
          image_url: product.image_url,
          attach_image: true
        };
      }
    }
  }

  // Respostas variadas para produtos
  if (lowerMessage.includes('produto') || lowerMessage.includes('comprar')) {
    const productResponses = [
      'Meu estimado, temos produtos incríveis! ',
      'Prezado cliente, recomendo vivamente nossos ',
      'Companheiro, vai adorar nossos ',
      'Excelente escolha! Temos '
    ];
    
    if (context.products && context.products.length > 0) {
      const product = context.products[0];
      const isAvailable = (product?.in_stock === true) && ((product?.stock_quantity ?? 0) > 0);
      const stockInfo = isAvailable ? 'disponível' : 'atualmente sem stock';
      const randomResponse = productResponses[Math.floor(Math.random() * productResponses.length)];
      return `${randomResponse}${product.name} por ${product.price} AOA (${stockInfo}) 🛍️`;
    }
    
    const catalogResponses = [
      'Meu estimado, veja nosso catálogo em https://superloja.vip! Eletrônicos de qualidade com entrega rápida 📱',
      'Prezado cliente, recomendo visitar https://superloja.vip! Produtos tecnológicos à sua disposição 🔥',
      'Companheiro, não vai se arrepender! Catálogo completo em https://superloja.vip 📲'
    ];
    return catalogResponses[Math.floor(Math.random() * catalogResponses.length)];
  }
  
  // Respostas variadas para conta
  if (lowerMessage.includes('conta') || lowerMessage.includes('registro')) {
    const accountResponses = [
      'Meu estimado, crie conta grátis e ganhe 10% desconto! Sempre às ordens → https://superloja.vip/register 👤',
      'Prezado cliente, recomendo vivamente criar conta! Ofertas exclusivas esperando → https://superloja.vip/register ✨',
      'Excelente ideia! Conta grátis + descontos especiais → https://superloja.vip/register 🎯'
    ];
    return accountResponses[Math.floor(Math.random() * accountResponses.length)];
  }
  
  // Respostas variadas para entrega
  if (lowerMessage.includes('entrega') || lowerMessage.includes('envio')) {
    const deliveryResponses = [
      'Com todo o prazer! Entregamos em todo Angola: 1-3 dias Luanda, 3-7 dias províncias 🚚',
      'À sua disposição! Entrega rápida em Angola toda. Frete grátis acima de 15.000 AOA 📦',
      'Sempre às ordens! Cobrimos Angola inteiro com entrega express 🚛'
    ];
    return deliveryResponses[Math.floor(Math.random() * deliveryResponses.length)];
  }
  
  // Respostas variadas para pagamento
  if (lowerMessage.includes('pagamento')) {
    const paymentResponses = [
      'Meu estimado, aceitamos: Transferência, Multicaixa, TPA, Visa/Mastercard. Pagamento 100% seguro 💳',
      'Prezado cliente, várias opções: Banco, Multicaixa Express, cartões. Tudo protegido 🔒',
      'Fixe mesmo! Multicaixa, transferência, TPA na entrega, cartões internacionais 💰'
    ];
    return paymentResponses[Math.floor(Math.random() * paymentResponses.length)];
  }
  
  // Respostas variadas para ajuda
  if (lowerMessage.includes('ajuda') || lowerMessage.includes('problema')) {
    const helpResponses = [
      'Com todo o prazer! Nossa equipe está à disposição: WhatsApp +244 923 456 789 📞',
      'Sempre às ordens! Suporte direto: https://superloja.vip/suporte ou WhatsApp +244 923 456 789 🆘',
      'Meu estimado, estamos aqui para ajudar! Contacte-nos já 💬'
    ];
    return helpResponses[Math.floor(Math.random() * helpResponses.length)];
  }
  
  // Respostas para publicidade
  if (lowerMessage.includes('publicidade') || lowerMessage.includes('produtos') || lowerMessage.includes('ver mais')) {
    if (context.products && context.products.length > 0) {
      const resumo = context.products.slice(0, 3).map((p: any) => `• ${p.name} - ${p.price} AOA`).join('\n');
      return `Meu estimado, aqui estão algumas opções:\n${resumo}\n\nQuer ver lista completa? À sua disposição! 🛍️`;
    }
  }
  
  // Fallback de esclarecimento: fazer pergunta e dar exemplos
  const clarify = [
    'Para eu te ajudar certinho: quer ver fotos, remover algo do carrinho, comparar opções ou finalizar?',
    'Preferes que eu mostre a lista, retire algum item, explique diferenças ou finalize a compra?'
  ];
  const examples = 'Exemplos: "ver fones", "tirar 2", "comparar x83 e pro6", "finalizar".';
  return `${clarify[Math.floor(Math.random()*clarify.length)]}\n${examples}`;
}

// Detector simples de intenção de imagem
function isImageRequest(text: string): boolean {
  const t = text.toLowerCase();
  const keywords = [
    'imagem', 'foto', 'ver foto', 'ver imagem', 'mostrar', 'mostra',
    'manda', 'mandar', 'envia', 'enviar', 'foto do', 'foto da', 'quero ver'
  ];
  return keywords.some(k => t.includes(k));
}

// Função para analisar padrões de resposta
async function analyzeResponsePatterns(userId: string, message: string, supabase: any) {
  const { data: recentResponses } = await supabase
    .from('ai_conversations')
    .select('message')
    .eq('user_id', userId)
    .eq('type', 'assistant')
    .order('timestamp', { ascending: false })
    .limit(5);

  const repeatedResponses = recentResponses?.map(r => r.message.substring(0, 30)) || [];
  
  return {
    repeatedResponses,
    messageCount: recentResponses?.length || 0
  };
}

// Função para detectar localização do usuário
async function detectUserLocation(message: string, history: any[]) {
  const locationKeywords = {
    'luanda': ['luanda', 'luanda norte', 'luanda sul', 'maianga', 'ingombota'],
    'benguela': ['benguela', 'lobito'],
    'huambo': ['huambo'],
    'lubango': ['lubango', 'huíla'],
    'malanje': ['malanje'],
    'namibe': ['namibe', 'moçâmedes']
  };

  const lowerMessage = message.toLowerCase();
  const fullText = [message, ...history.map(h => h.message)].join(' ').toLowerCase();

  for (const [province, keywords] of Object.entries(locationKeywords)) {
    if (keywords.some(keyword => fullText.includes(keyword))) {
      return province;
    }
  }

  return null;
}

// Função para obter itens do carrinho
async function getCartItems(sessionId: string, supabase: any) {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        product_id,
        quantity,
        products:product_id (
          name,
          price,
          image_url,
          slug
        )
      `)
      .eq('session_id', sessionId);

    if (error) throw error;

    const formattedItems = data?.map(item => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      product: {
        name: item.products.name,
        price: item.products.price,
        image_url: item.products.image_url,
        slug: item.products.slug,
      }
    })) || [];

    return formattedItems;
  } catch (error) {
    console.error('Erro ao carregar carrinho:', error);
    return [];
  }
}

// Função para detectar solicitação de entrega
function isDeliveryRequest(text: string): boolean {
  const lowerText = text.toLowerCase();
  const deliveryKeywords = [
    'entrega', 'entregar', 'entrego', 'entreguem',
    'envio', 'enviar', 'enviem', 'mandar', 'mandem',
    'levar', 'levem', 'buscar', 'ir buscar',
    'finalizar', 'finalizo', 'fechar', 'comprar',
    'quero comprar', 'vou comprar', 'quero levar',
    'pode entregar', 'podem entregar', 'como faço',
    'como é que', 'como é a entrega'
  ];
  
  return deliveryKeywords.some(keyword => lowerText.includes(keyword));
}

// Função para salvar conversas
async function saveConversation(userId: string, message: string, type: string, supabase: any) {
  try {
    await supabase
      .from('ai_conversations')
      .insert({
        user_id: userId,
        message,
        type,
        platform: 'website',
        timestamp: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
}

// Função auxiliar para converter blob para base64
async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

// Função auxiliar para extrair nome do arquivo da URL
function getFilenameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    return pathname.split('/').pop() || 'image.jpg';
  } catch {
    return 'image.jpg';
  }
}

// Função para detectar solicitação de finalização
function isFinalizationRequest(message: string, history: any[]): boolean {
  const lowerText = message.toLowerCase();
  const finalizationKeywords = [
    'finalizar', 'finalizo', 'fechar', 'comprar agora',
    'quero comprar', 'vou comprar', 'confirmar pedido',
    'meu nome é', 'meu contacto', 'nome:', 'contacto:',
    'telefone:', 'endereço:', 'morada:', 'dados pessoais'
  ];
  
  // Verificar contexto recente sobre entrega/compra
  const recentContext = history.slice(-3).map(h => h.message).join(' ').toLowerCase();
  const hasRecentDeliveryContext = recentContext.includes('entrega') || 
                                   recentContext.includes('finalizar') ||
                                   recentContext.includes('dados');
  
  return finalizationKeywords.some(keyword => lowerText.includes(keyword)) || 
         (hasRecentDeliveryContext && (lowerText.length > 10)); // Resposta substancial após contexto de entrega
}

// Função para verificar dados em falta do cliente
async function checkMissingCustomerData(userId: string, message: string, supabase: any): Promise<string[]> {
  const missingData = [];
  
  // Extrair informações da mensagem atual
  const hasName = /nome.*:.*\w+|meu nome é.*\w+|chamo-me.*\w+/i.test(message);
  const hasPhone = /telefone.*:.*\d+|contacto.*:.*\d+|\d{9,}/i.test(message);
  const hasLocation = /endereço.*:.*\w+|morada.*:.*\w+|vivo em.*\w+|fico em.*\w+/i.test(message) ||
                     /(luanda|benguela|huambo|lubango|malanje|namibe|cabinda|cuando|cunene|huíla|lunda|moxico|uíge|zaire)/i.test(message);
  
  if (!hasName) missingData.push('nome');
  if (!hasPhone) missingData.push('telefone');
  if (!hasLocation) missingData.push('localização');
  
  return missingData;
}

// Função para gerar resposta de coleta de dados
async function generateDataCollectionResponse(missingData: string[], cartItems: any[]): Promise<string> {
  const cartSummary = cartItems && cartItems.length > 0 ? 
    `\n\n📦 Resumo do seu pedido:\n${cartItems.map(item => 
      `• ${item.product.name} (${item.quantity}x) - ${item.product.price} AOA`
    ).join('\n')}\n\nTotal: ${cartItems.reduce((sum, item) => 
      sum + (item.product.price * item.quantity), 0)} AOA` : '';

  let response = `Perfeito! Para finalizar seu pedido, preciso apenas de alguns dados:${cartSummary}\n\n`;
  
  if (missingData.includes('nome')) {
    response += '👤 **Seu nome completo**\n';
  }
  if (missingData.includes('telefone')) {
    response += '📞 **Número de telefone/WhatsApp**\n';
  }
  if (missingData.includes('localização')) {
    response += '📍 **Localização para entrega** (província e endereço)\n';
  }
  
  response += '\nPode fornecer esses dados? Exemplo:\n';
  response += '"Meu nome é João Silva, telefone 923456789, vivo em Luanda, Talatona"';
  
  return response;
}

// Função para extrair dados do cliente
async function getCustomerData(userId: string, message: string, history: any[]): Promise<any> {
  const allText = [message, ...history.slice(-5).map(h => h.message)].join(' ');
  
  // Extrair nome
  const nameMatch = allText.match(/(?:nome.*?:.*?|meu nome é|chamo-me)\s*([A-Za-zÀ-ÿ\s]+)/i);
  const name = nameMatch ? nameMatch[1].trim() : 'Cliente';
  
  // Extrair telefone
  const phoneMatch = allText.match(/(?:telefone.*?:.*?|contacto.*?:.*?|)\s*(\d{9,})/i);
  const phone = phoneMatch ? phoneMatch[1] : '';
  
  // Extrair localização
  const locationMatch = allText.match(/(?:endereço.*?:.*?|morada.*?:.*?|vivo em|fico em)\s*([A-Za-zÀ-ÿ\s,]+)/i) ||
                       allText.match(/(luanda|benguela|huambo|lubango|malanje|namibe|cabinda|cuando|cunene|huíla|lunda|moxico|uíge|zaire)[^.]*?([A-Za-zÀ-ÿ\s,]*)/i);
  const location = locationMatch ? locationMatch[0].trim() : 'Não especificada';
  
  return { name, phone, location };
}

// Função para notificar admin sobre finalização
async function notifyAdminFinalization(userId: string, customerData: any, cartItems: any[], supabase: any) {
  try {
    const cartSummary = cartItems.map(item => 
      `• ${item.product.name} (${item.quantity}x) - ${item.product.price} AOA`
    ).join('\n');
    
    const totalValue = cartItems.reduce((sum, item) => 
      sum + (item.product.price * item.quantity), 0
    );

    const message = `🎉 PEDIDO FINALIZADO! 🎉

👤 Cliente: ${customerData.name}
📞 Telefone: ${customerData.phone}
📍 Localização: ${customerData.location}
🆔 ID Sessão: ${userId}

📦 Produtos:
${cartSummary}

💰 Total: ${totalValue} AOA

⏰ ${new Date().toLocaleString('pt-AO')}

🚚 AÇÃO NECESSÁRIA: Contactar cliente para confirmar entrega!`;

    // Salvar notificação
    await supabase.from('admin_notifications').insert({
      admin_user_id: '24320548907583618',
      notification_type: 'pedido_finalizado',
      message: message,
      metadata: {
        customer_id: userId,
        customer_name: customerData.name,
        customer_phone: customerData.phone,
        customer_location: customerData.location,
        cart_items: cartItems,
        total_value: totalValue,
        platform: 'website',
        requires_contact: true,
        timestamp: new Date().toISOString()
      }
    });

    console.log('✅ Admin notificado sobre finalização');
  } catch (error) {
    console.error('❌ Erro ao notificar admin:', error);
  }
}

// Função para carregar contexto existente
async function loadExistingContext(userId: string, supabase: any) {
  try {
    const { data } = await supabase
      .from('ai_conversation_context')
      .select('context_data, conversation_summary')
      .eq('user_id', userId)
      .eq('platform', 'website')
      .single();

    if (data && data.context_data) {
      console.log('📊 Contexto anterior carregado para:', userId);
      return data.context_data;
    }
    
    return null;
  } catch (error) {
    console.log('ℹ️ Nenhum contexto anterior encontrado para:', userId);
    return null;
  }
}
