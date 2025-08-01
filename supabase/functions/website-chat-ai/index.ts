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

    return new Response(
      JSON.stringify({ response }),
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
): Promise<string> {
  
  // 1. Buscar produtos relevantes baseado na mensagem
  const products = await searchRelevantProducts(message, supabase);
  
  // 2. Obter histórico da conversa para auto-aprendizado
  const conversationHistory = await getConversationHistory(userId, supabase);
  
  // 3. Verificar se usuário está logado/registrado
  const userInfo = await getUserInfo(userId, supabase);
  
  // 4. Detectar localização do usuário para ajudar com entrega
  const userLocation = detectUserLocation(message);
  
  // 5. Verificar padrões repetitivos para variar respostas
  const responsePattern = await analyzeResponsePatterns(userId, message, supabase);
  
  // 6. Salvar interação para aprendizado
  await saveUserInteraction(userId, message, 'user', supabase);
  
  // 7. Processar com IA melhorada
  const aiResponse = await callOpenAI(message, {
    products,
    conversationHistory,
    userInfo,
    userLocation,
    responsePattern
  });
  
  // 8. Salvar resposta da IA
  await saveUserInteraction(userId, aiResponse, 'ai', supabase);
  
  return aiResponse;
}

async function searchRelevantProducts(query: string, supabase: any) {
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, description, category, image_url, stock')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
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

async function callOpenAI(message: string, context: any): Promise<string> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  
  if (!OPENAI_API_KEY) {
    return getFallbackResponse(message, context);
  }

  const systemPrompt = `
Você é o SuperBot da SuperLoja (https://superloja.vip), com personalidade angolana autêntica!

🇦🇴 PERSONALIDADE ANGOLANA:
- Use expressões angolanas: "aca meu!", "bom mano/mana", "fixe!", "porreiro!", "bué de bom!", "aiuê!", "meu caro/minha cara", "olha só!", "sabes que", "acredita que", "deixa-me te contar"
- Cumprimentos variados: "Como vai meu?", "Oi mana!", "Bom dia caro!", "Tudo fixe?", "Como andas?"
- Empolgação: "Bué fixe!", "Porreiro demais!", "Isso sim é top!", "Que coisa boa!", "Aca, que maravilha!"
- Persuasão: "Sabes que...", "Olha só...", "Deixa-me te contar...", "Acredita que...", "Meu caro..."
- Despedidas: "Força aí!", "Fica bem!", "Qualquer coisa apita!", "Até já!", "Vai com Deus!"
- Seja caloroso, persuasivo e próximo do cliente
- Varie sempre as respostas, NUNCA repita exatamente igual
- Adapte a energia conforme o contexto

EMPRESA SuperLoja:
- Loja online #1 em Angola em eletrônicos e gadgets
- Entrega: 1-3 dias Luanda, 3-7 dias outras províncias 
- Pagamento: Transferência, Multicaixa, TPA, Cartões
- WhatsApp: +244 923 456 789

PRODUTOS DISPONÍVEIS:
${context.products.map(p => 
  `• ${p.name} - ${p.price} AOA - ${p.description} (Stock: ${p.stock > 0 ? p.stock : 'Esgotado'})`
).join('\n')}

${context.userLocation ? `LOCALIZAÇÃO USUÁRIO: ${context.userLocation}` : ''}

PADRÃO DE RESPOSTA: ${context.responsePattern?.count || 0} perguntas similares
${context.responsePattern?.count > 2 ? 'VARIE MUITO A RESPOSTA!' : ''}

HISTÓRICO:
${context.conversationHistory.slice(-3).map(h => 
  `${h.type}: ${h.message}`
).join('\n')}

CLIENTE: ${context.userInfo ? 
  `${context.userInfo.name} (registrado)` : 
  'Visitante'
}

🎯 ESTRATÉGIAS PERSUASIVAS ANGOLANAS:
1. **Publicidade resumida**: Primeiro 3 produtos TOP, depois lista completa
2. **Produtos esgotados**: Elogie o produto, informe que está esgotado, sugira similar
3. **Imagens**: SEMPRE ofereça envio por anexo (não só links)
4. **Outras províncias**: Guia passo-a-passo detalhado para encomenda
5. **Auto-aprendizado**: Se pergunta repetida, mude completamente a abordagem

VARIAÇÕES ANGOLANAS para situações comuns:
- Cumprimento: "Aca meu!", "Bom dia caro!", "Oi mana, como vai?", "Bom mano!", "Como andas?", "Tudo fixe?"
- Empolgação: "Bué fixe!", "Porreiro demais!", "Isso sim é top!", "Que coisa boa!", "Aca, que maravilha!", "Aiuê, que bom!"
- Persuasão: "Acredita que...", "Sabes que...", "Olha só...", "Deixa-me te contar...", "Meu caro..."
- Despedida: "Força aí!", "Fica bem!", "Qualquer coisa apita!", "Até já!", "Vai com Deus!"

INSTRUÇÕES CRÍTICAS:
- NUNCA repita respostas idênticas (varie SEMPRE)
- Use gírias angolanas naturalmente
- Seja persuasivo mas respeitoso
- Se usuário fora de Luanda, explique processo detalhado
- Para imagens, ofereça anexo e descrição
- Maximum 250 caracteres por resposta
`;

  try {
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
        max_tokens: 300,
        temperature: 0.9,
      }),
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      return data.choices[0].message.content.trim();
    } else {
      throw new Error('Invalid OpenAI response');
    }

  } catch (error) {
    console.error('OpenAI API Error:', error);
    return getFallbackResponse(message, context);
  }
}

// Novas funções para auto-aprendizado e personalização
function detectUserLocation(message: string): string | null {
  const lowerMessage = message.toLowerCase();
  
  // Províncias de Angola
  const provinces = [
    'luanda', 'benguela', 'huambo', 'lobito', 'namibe', 'lubango', 'malanje', 
    'cabinda', 'uíge', 'soyo', 'kuanza norte', 'kuanza sul', 'lunda norte', 
    'lunda sul', 'moxico', 'cuando cubango', 'cunene', 'huíla', 'bié'
  ];
  
  for (const province of provinces) {
    if (lowerMessage.includes(province)) {
      return province;
    }
  }
  
  // Bairros de Luanda
  const luandaAreas = [
    'kilamba', 'talatona', 'maianga', 'rangel', 'sambizanga', 'ingombota', 
    'cacuaco', 'viana', 'belas', 'luanda sul', 'ilha do cabo', 'samba'
  ];
  
  for (const area of luandaAreas) {
    if (lowerMessage.includes(area)) {
      return `luanda - ${area}`;
    }
  }
  
  return null;
}

async function analyzeResponsePatterns(userId: string, message: string, supabase: any) {
  // Buscar mensagens similares do usuário nos últimos 7 dias
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const { data: similarMessages } = await supabase
    .from('ai_conversations')
    .select('message, response, timestamp')
    .eq('user_id', userId)
    .eq('type', 'user')
    .gte('timestamp', sevenDaysAgo.toISOString())
    .ilike('message', `%${message.substring(0, 10)}%`);
    
  return {
    count: similarMessages?.length || 0,
    lastSimilar: similarMessages?.[0]?.timestamp,
    responses: similarMessages?.map(m => m.response) || []
  };
}

async function saveUserInteraction(userId: string, message: string, type: 'user' | 'ai', supabase: any) {
  await supabase
    .from('ai_conversations')
    .insert({
      user_id: userId,
      message: message,
      type: type,
      platform: 'website',
      timestamp: new Date().toISOString()
    });
}

function getFallbackResponse(message: string, context: any): string {
  const lowerMessage = message.toLowerCase();
  const greetings = ["Aca meu!", "Bom dia caro!", "Oi mana!", "Bom mano!", "Como andas?", "Tudo fixe?"];
  const excitement = ["Bué fixe!", "Porreiro demais!", "Isso sim é top!", "Aca, que maravilha!", "Aiuê, que bom!"];
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
  const randomExcitement = excitement[Math.floor(Math.random() * excitement.length)];
  
  // Respostas variadas baseadas em contexto
  if (lowerMessage.includes('produto') || lowerMessage.includes('comprar')) {
    if (context.products.length > 0) {
      const product = context.products[0];
      if (product.stock > 0) {
        return `${randomGreeting} Temos ${product.name} por ${product.price} AOA! ${randomExcitement} Quer ver mais? 🛍️`;
      } else {
        return `${product.name} está bué bom mesmo! Mas agora tá esgotado, meu caro. Tenho outros fixos para te mostrar! 📱`;
      }
    }
    
    const responses = [
      `${randomGreeting} Temos eletrônicos que vais adorar! Dá uma olhada no nosso catálogo 📱`,
      `Eh pá, bué de produtos fixes! Qual tipo de gadget procuras? 🔥`,
      `Mano, temos smartphones, fones, tudo que precisas! O que te interessa? 💎`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('publicidade') || lowerMessage.includes('produtos')) {
    // Lista resumida primeiro
    const topProducts = context.products.slice(0, 3);
    if (topProducts.length > 0) {
      const summary = `🔥 TOP 3:\n${topProducts.map(p => `• ${p.name} - ${p.price} AOA`).join('\n')}`;
      return `${randomGreeting} Aqui estão os mais procurados:\n\n${summary}\n\nQuer ver a lista completa? 💫`;
    }
  }
  
  if (lowerMessage.includes('imagem')) {
    return `${randomGreeting} Vou te enviar a imagem por anexo agora mesmo! Já vais ver como é fixe 📸✨`;
  }
  
  if (context.userLocation && !lowerMessage.includes('luanda')) {
    const stepByStep = `
📦 ENCOMENDA PARA ${context.userLocation.toUpperCase()}:
1️⃣ Escolhe o produto no site
2️⃣ Adiciona ao carrinho 
3️⃣ Preenche dados (nome, telefone, morada)
4️⃣ Escolhe forma de pagamento
5️⃣ Confirma pedido
6️⃣ Entrega em 3-7 dias úteis

Precisas de ajuda com algum passo? 🚚`;
    return stepByStep;
  }
  
  if (lowerMessage.includes('conta') || lowerMessage.includes('registro')) {
    const responses = [
      `${randomGreeting} Cria conta e ganha 10% desconto! Bué vantajoso 👤✨`,
      `Mana, com conta tens descontos especiais e entrega mais rápida! Vale a pena 🎁`,
      `Eh pá, conta grátis = mais vantagens! Checkout rápido e ofertas exclusivas 🔥`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Respostas padrão variadas
  const defaultResponses = [
    `${randomGreeting} Sou o SuperBot! Como posso ajudar-te hoje? 🤖`,
    `Bom mano! Precisa de algo? Temos produtos fixes aqui! 💎`,
    `Oi mana! Em que posso ser útil? SuperLoja tem tudo! ⚡`
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}
