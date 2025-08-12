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
  
  // 6. Salvar conversa
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
  
  // 7. Processar com IA
  const aiResponse = await callOpenAI(message, {
    products,
    conversationHistory,
    userInfo,
    responsePatterns,
    userLocation
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
Você é o SuperBot, assistente IA oficial da SuperLoja (https://superloja.vip) usando ChatGPT para responder inteligentemente.

INFORMAÇÕES DA EMPRESA:
- SuperLoja: Loja online líder em Angola
- Especialidade: Eletrônicos, gadgets, smartphones, acessórios
- Entrega: Todo Angola (1-3 dias Luanda, 3-7 dias províncias)
- Pagamento: Transferência, Multicaixa, TPA, Cartões
- WhatsApp: +244 923 456 789

PRODUTOS DISPONÍVEIS:
${context.products.map(p => 
  `• ${p.name} - ${p.price} AOA - ${p.description || ''} (Stock: ${typeof p.stock_quantity === 'number' ? p.stock_quantity : (p.in_stock ? 'disponível' : 'indisponível')}) - Imagem: ${p.image_url || 'sem imagem'}`
).join('\n')}

HISTÓRICO DA CONVERSA:
${context.conversationHistory.slice(-5).map(h => 
  `${h.type}: ${h.message}`
).join('\n')}

PADRÕES DE RESPOSTA ANTERIORES: 
${context.responsePatterns ? `Evite repetir: ${context.responsePatterns.repeatedResponses.join(', ')}` : ''}

LOCALIZAÇÃO DO USUÁRIO:
${context.userLocation || 'Não identificada'}

INSTRUÇÕES CRÍTICAS PARA IMAGENS:
- Quando o cliente pedir "imagem", "foto", "mostrar", "ver foto", "quero ver", "manda", "mandar", "envia", "enviar"
- RESPONDA EXATAMENTE neste formato JSON:
{"message": "Sua resposta em português angolano", "image_url": "url_da_imagem_do_produto", "attach_image": true}
- Use APENAS produtos da lista acima que tenham image_url
- Sempre explique o produto na mensagem

EXPRESSÕES ANGOLANAS PROFISSIONAIS (USE VARIADAS):
- Saudações: "Meu estimado", "Prezado cliente", "Mano querido", "Companheiro"
- Afirmações: "Fixe mesmo!", "Está bom assim", "Excelente escolha", "Boa ideia"
- Persuasão: "Recomendo vivamente", "É uma oportunidade única", "Não vai se arrepender"
- Cordialidade: "Com todo o prazer", "À sua disposição", "Sempre às ordens"

INSTRUÇÕES ESPECIAIS:
1. NUNCA use "eh pá" - use alternativas profissionais
2. VARIE as expressões em cada resposta para evitar repetição
3. Para produtos fora de stock: elogie mas informe "atualmente sem stock"
4. Para publicidade: liste produtos resumidamente primeiro
5. Para usuários fora de Luanda: explique processo de encomenda passo-a-passo
6. Use linguagem comercial angolana respeitosa
7. Analise o contexto completo da mensagem, não apenas palavras-chave

LOCALIZAÇÃO E ENTREGA:
- Luanda: Entrega grátis, 1-3 dias
- Outras províncias: Orçamento de entrega, 3-7 dias

PADRÃO ANTI-REPETIÇÃO:
- Analise mensagens anteriores para evitar respostas idênticas
- Use sinônimos e variações de expressão
- Adapte tom baseado no histórico do usuário
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
        max_tokens: 300,
        temperature: 0.8,
      }),
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      const response = data.choices[0].message.content.trim();
      
      // Tentar parsear como JSON (para respostas com imagem)
      try {
        const parsedResponse = JSON.parse(response);
        if (parsedResponse.message && parsedResponse.attach_image) {
          return parsedResponse;
        }
      } catch {
        // Se não for JSON válido, retorna como texto normal
      }
      
      return response;
    } else {
      throw new Error('Invalid OpenAI response');
    }

  } catch (error) {
    console.error('OpenAI API Error:', error);
    return getFallbackResponse(message, context);
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
