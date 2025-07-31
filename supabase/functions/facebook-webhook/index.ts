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

    // Buscar produtos disponíveis
    const { data: products } = await supabase
      .from('products')
      .select('id, name, slug, price, description, image_url')
      .eq('active', true)
      .eq('in_stock', true)
      .limit(25);

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

COMPORTAMENTO HUMANO:
- Quando cliente mostra interesse em comprar, seja mais detalhado e ajude com o processo
- Pergunte se precisam de mais informações sobre entrega, garantia, etc.
- Se o cliente quer finalizar compra, guie-o passo a passo de forma amigável
- Use emojis moderadamente para expressar emoções
- Varie suas respostas, não seja repetitivo

${conversationHistory}

CONTEXTO ANALISADO:
${context.summary}

PRODUTO DE INTERESSE: ${context.selectedProduct || 'Nenhum produto específico identificado'}
FASE DA CONVERSA: ${context.conversationStage}
PRECISA LEMBRAR: ${context.importantInfo || 'Nada específico'}

${productsInfo}

DETECÇÃO DE FOTOS:
Usuário pediu fotos: ${wantsPhotos}

INSTRUÇÕES CRÍTICAS PARA FONES:
- Quando perguntarem sobre fones, bluetooth ou auriculares, você DEVE mostrar TODOS os produtos relacionados
- OBRIGATÓRIO: mostrar todos os 9 fones - NUNCA menos de 9 fones
- Cada produto deve ter seu próprio número sequencial (1, 2, 3, 4, 5, 6, 7, 8, 9)
- NUNCA corte a lista no meio ou limite a 5 produtos
- NUNCA use frases como "entre outros" ou "e mais"
- Se não mostrar todos os 9 fones, a resposta está INCORRETA

PROCESSO DE VENDA HUMANIZADO:
- Se cliente quer comprar algo, explique: "Óptimo! Para confirmar a sua compra, preciso só de alguns dados..."
- Peça: Nome completo, contacto (telefone), produto escolhido
- Seja empático: "Entendo que quer garantir que seja o produto certo"
- Ofereça ajuda: "Quer saber mais sobre garantia? Entrega é grátis!"

REGRAS PARA IMAGENS:
${wantsPhotos ? 
  '- DEVE INCLUIR imagens para TODOS os produtos usando: 📸 ![Imagem](ImageURL)' :
  '- NÃO inclua imagens a menos que o cliente peça especificamente'
}
- Use EXATAMENTE a ImageURL fornecida nos dados do produto acima

FORMATO OBRIGATÓRIO PARA CADA PRODUTO:
X. *[NOME COMPLETO DO PRODUTO]* - [PREÇO EXATO] Kz
   🔗 [Ver produto](https://superloja.vip/produto/[SLUG])
${wantsPhotos ? '   📸 ![Imagem]([URL_DA_IMAGEM])' : ''}

REGRAS ABSOLUTAS:
- Use * para texto em negrito (*produto*)
- Use [Ver produto](URL) para links  
- Numere TODOS os produtos (1., 2., 3., etc.)
- Use preços EXATOS da lista acima
- Mostre a lista COMPLETA de fones - todos os produtos
${wantsPhotos ? '- INCLUA 📸 ![Imagem](URL) para cada produto' : '- NÃO inclua ![Imagem](URL) a menos que cliente peça fotos'}

IMPORTANTE: 
- SEMPRE lembre do contexto da conversa anterior
- Se o cliente já escolheu um produto, mantenha o foco nesse produto
- Se está na fase de finalização, continue o processo onde parou
- Temos ${products?.filter((p: any) => p.name.toLowerCase().includes('fone')).length || 9} fones. Mostre TODOS eles quando perguntarem sobre fones!`;

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

  // Detectar fase da conversa
  const purchaseIndicators = ['quero comprar', 'interesse', 'finalizar', 'nome:', 'contacto:', 'confirmar'];
  const hasPurchaseIntent = purchaseIndicators.some(indicator => 
    allMessages.includes(indicator) || currentLower.includes(indicator)
  );

  if (hasPurchaseIntent) {
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
  if (context.conversationStage === 'purchase_intent') {
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
  
  // Palavras que indicam interesse forte em comprar
  const strongBuyKeywords = [
    'quero comprar', 'vou comprar', 'compro', 'interesse', 'preço final',
    'como faço para comprar', 'forma de pagamento', 'entrega', 'garantia',
    'posso pagar', 'aceita cartão', 'disponível', 'stock', 'quanto tempo demora'
  ];
  
  // Palavras que indicam dados pessoais/finalização
  const finalizationKeywords = [
    'nome:', 'contacto:', 'telefone:', 'endereço:', 'confirmar compra',
    'finalizar', 'morada', 'dados pessoais', 'meu nome é', 'meu contacto'
  ];
  
  // Detectar interesse forte
  const hasStrongBuyIntent = strongBuyKeywords.some(keyword => 
    lowerMessage.includes(keyword) || lowerResponse.includes(keyword)
  );
  
  // Detectar tentativa de finalização
  const hasFinalizationAttempt = finalizationKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  );
  
  if (hasFinalizationAttempt) {
    return 'finalization'; // Cliente tentando finalizar compra
  } else if (hasStrongBuyIntent) {
    return 'strong_interest'; // Cliente mostra interesse forte
  }
  
  return null; // Nenhuma intenção de compra detectada
}

async function notifyAdmin(customerId: string, customerMessage: string, supabase: any, intentType: string) {
  try {
    console.log(`🔔 Notificando admin sobre ${intentType}...`);
    
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
    
    if (intentType === 'finalization') {
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

    // Tentar enviar para carlosfox2 (admin padrão)
    const adminId = 'carlosfox2';
    const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${pageAccessToken}`;
    
    const payload = {
      recipient: { id: adminId },
      message: { text: notificationMessage },
      messaging_type: 'MESSAGE_TAG',
      tag: 'BUSINESS_PRODUCTIVITY'
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
      console.log('✅ Admin carlosfox2 notificado com sucesso!');
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