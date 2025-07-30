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
  
  // Base de conhecimento desabilitada - usando apenas ChatGPT para respostas mais humanas
  const knowledgeBase = null;
  
  // 3. Obter histórico da conversa
  const conversationHistory = await getConversationHistory(userId, supabase);
  
  // 4. Verificar se usuário está logado/registrado
  const userInfo = await getUserInfo(userId, supabase);
  
  // 5. Processar com IA
  const aiResponse = await callOpenAI(message, {
    products,
    knowledgeBase,
    conversationHistory,
    userInfo
  });
  
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

async function searchKnowledgeBase(query: string, supabase: any) {
  // Buscar por palavras-chave na base de conhecimento
  const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
  
  const { data: knowledge } = await supabase
    .from('ai_knowledge_base')
    .select('question, answer, category, priority')
    .eq('active', true)
    .or(keywords.map(keyword => `keywords.cs.{${keyword}}`).join(','))
    .order('priority', { ascending: false })
    .limit(3);
    
  return knowledge || [];
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
Você é o SuperBot, assistente virtual humano da SuperLoja (https://superloja.vip).
Seja MUITO HUMANO e natural - como um vendedor real conversando com o cliente.

🗣️ TOM DE CONVERSA:
- Seja caloroso e amigável como um angolano
- Use "Olá! Como está?" ou "Oi! Tudo bem?"
- Responda de forma conversacional e natural
- Use emojis com moderação (1-2 por mensagem)
- Máximo 2-3 frases por resposta (seja direto)

INFORMAÇÕES DA EMPRESA:
📍 LOCALIZAÇÃO: Angola, Luanda
💰 MOEDA: Kz (Kwanza Angolano)
🚚 ENTREGA: Grátis em toda Angola
📞 CONTATO: WhatsApp/Telegram: +244 930 000 000
🌐 SITE: https://superloja.vip
⏰ HORÁRIO: Segunda a Sexta: 8h-18h | Sábado: 8h-14h

PRODUTOS DISPONÍVEIS:
${context.products.map(p => 
  `• ${p.name} - ${p.price} Kz - Stock: ${p.stock}`
).join('\n')}

HISTÓRICO DA CONVERSA:
${context.conversationHistory.slice(-5).map(h => 
  `${h.type}: ${h.message}`
).join('\n')}

USUÁRIO: ${context.userInfo ? 
  `Cliente: ${context.userInfo.name}` : 
  'Visitante'
}

🛒 VENDAS:
- Ajude com informações sobre produtos
- Para compra: pedir nome, telefone, endereço
- "Vou processar e te contacto!"

💬 EXEMPLOS DE RESPOSTAS HUMANAS:
❌ Robótico: "Temos os seguintes produtos disponíveis..."
✅ Humano: "Olá! Temos alguns produtos bacanas. O que procura?"

❌ Robótico: "Para finalizar o pedido, preciso dos seus dados..."
✅ Humano: "Perfeito! Me passa teu nome e telefone que processo o pedido 😊"

SEJA HUMANO, DIRETO E SIMPÁTICO!
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 200,
        temperature: 0.7,
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

function getFallbackResponse(message: string, context: any): string {
  const lowerMessage = message.toLowerCase();
  
  // Respostas baseadas em palavras-chave
  if (lowerMessage.includes('produto') || lowerMessage.includes('comprar')) {
    if (context.products.length > 0) {
      const product = context.products[0];
      return `Temos ${product.name} por ${product.price} AOA! Ver mais produtos em https://superloja.vip 🛍️`;
    }
    return `Veja nosso catálogo completo em https://superloja.vip! Temos eletrônicos incríveis com entrega rápida 📱`;
  }
  
  if (lowerMessage.includes('conta') || lowerMessage.includes('registro')) {
    return `Crie sua conta grátis e ganhe 10% desconto na primeira compra! Checkout rápido + ofertas exclusivas → https://superloja.vip/register 👤`;
  }
  
  if (lowerMessage.includes('entrega') || lowerMessage.includes('envio')) {
    return `Entregamos em todo Angola! 1-3 dias em Luanda, 3-7 dias nas províncias. Frete grátis acima de 15.000 AOA 🚚`;
  }
  
  if (lowerMessage.includes('pagamento')) {
    return `Aceito: Transferência bancária, Multicaixa Express, TPA na entrega e cartões Visa/Mastercard. Pagamento 100% seguro 💳`;
  }
  
  if (lowerMessage.includes('ajuda') || lowerMessage.includes('problema')) {
    return `Nossa equipe está pronta para ajudar! WhatsApp: +244 923 456 789 ou suporte em https://superloja.vip/suporte 📞`;
  }
  
  // Resposta padrão
  return `Olá! Sou o SuperBot da SuperLoja 🤖 Como posso ajudá-lo? Temos produtos incríveis com entrega rápida em Angola! https://superloja.vip`;
}
