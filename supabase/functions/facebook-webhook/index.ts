import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // LOGS DETALHADOS PARA DEBUG FACEBOOK
  console.log('🚀 === WEBHOOK CHAMADO ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Método:', req.method);
  console.log('URL completa:', req.url);
  
  // CAPTURAR TODOS OS HEADERS (especialmente do Facebook)
  console.log('📋 === TODOS OS HEADERS ===');
  const headers = Object.fromEntries(req.headers.entries());
  console.log('Headers completos:', JSON.stringify(headers, null, 2));
  
  // HEADERS ESPECÍFICOS DO FACEBOOK
  console.log('🔍 === HEADERS FACEBOOK ESPECÍFICOS ===');
  console.log('X-Hub-Signature-256:', req.headers.get('X-Hub-Signature-256'));
  console.log('X-Hub-Signature:', req.headers.get('X-Hub-Signature'));
  console.log('X-Forwarded-For:', req.headers.get('X-Forwarded-For'));
  console.log('User-Agent:', req.headers.get('User-Agent'));
  console.log('Content-Type:', req.headers.get('Content-Type'));
  console.log('Content-Length:', req.headers.get('Content-Length'));
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('⚡ Processando request OPTIONS (CORS preflight)');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle Facebook webhook verification (GET request)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      
      // Se não tem parâmetros de verificação, retorna status OK
      if (!mode && !token && !challenge) {
        console.log('📡 Webhook acessado diretamente - Status OK');
        return new Response('Webhook Facebook está online e funcionando!', { 
          status: 200,
          headers: {
            'Content-Type': 'text/plain',
            ...corsHeaders
          }
        });
      }
      
      console.log('=== WEBHOOK VERIFICATION ===');
      console.log('Mode:', mode);
      console.log('Token recebido:', token);
      console.log('Challenge:', challenge);
      
      // Token de verificação fixo
      const VERIFY_TOKEN = 'minha_superloja_webhook_token_2024';
      console.log('Token esperado:', VERIFY_TOKEN);
      
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Verificacao aprovada - Retornando challenge');
        return new Response(challenge, { 
          status: 200,
          headers: {
            'Content-Type': 'text/plain',
            ...corsHeaders
          }
        });
      } else {
        console.log('Verificacao rejeitada');
        console.log('Mode válido?', mode === 'subscribe');
        console.log('Token válido?', token === VERIFY_TOKEN);
        return new Response('Forbidden', { 
          status: 403,
          headers: corsHeaders
        });
      }
    }

    // Handle incoming messages (POST request)
    if (req.method === 'POST') {
      console.log('📨 === PROCESSANDO POST REQUEST ===');
      
      // CAPTURAR CORPO DA REQUISIÇÃO
      const body = await req.text();
      console.log('📦 Body tamanho:', body.length, 'bytes');
      console.log('📦 Body conteúdo RAW:', body);
      
      // VERIFICAR SE É JSON VÁLIDO
      let data;
      try {
        data = JSON.parse(body);
        console.log('JSON válido');
        console.log('📊 Dados parseados (estrutura completa):');
        console.log(JSON.stringify(data, null, 2));
        
        // ANÁLISE DETALHADA DA ESTRUTURA
        console.log('🔍 === ANÁLISE DA ESTRUTURA ===');
        console.log('Tipo do objeto:', typeof data);
        console.log('Propriedades do objeto:', Object.keys(data));
        
        if (data.object) {
          console.log('Object type:', data.object);
        }
        
        if (data.entry) {
          console.log('Entry array length:', data.entry.length);
          data.entry.forEach((entry, index) => {
            console.log(`Entry ${index}:`, Object.keys(entry));
            if (entry.messaging) {
              console.log(`Entry ${index} messaging length:`, entry.messaging.length);
              entry.messaging.forEach((msg, msgIndex) => {
                console.log(`Messaging ${msgIndex}:`, Object.keys(msg));
                if (msg.message) {
                  console.log(`Message fields:`, Object.keys(msg.message));
                }
                if (msg.postback) {
                  console.log(`Postback fields:`, Object.keys(msg.postback));
                }
              });
            }
          });
        }
        
      } catch (parseError) {
        console.error('Erro JSON PARSE:', parseError);
        console.log('Tentando processar como text/plain...');
        
        // Se não é JSON, pode ser outro formato
        return new Response('OK', { 
          status: 200,
          headers: corsHeaders
        });
      }
      
      // PROCESSAR MENSAGENS
      console.log('🚀 === INICIANDO PROCESSAMENTO ===');
      
      if (data.entry && data.entry.length > 0) {
        for (const entry of data.entry) {
          console.log('📋 Processando entry:', entry.id);
          
          if (entry.messaging && entry.messaging.length > 0) {
            for (const messaging of entry.messaging) {
              console.log('💬 Processando messaging:', Object.keys(messaging));
              
              // PRIMEIRO: Verificar se é comando administrativo
              if (messaging.message && messaging.message.text) {
                const isAdminCommand = await processAdminCommands(messaging, supabase);
                if (isAdminCommand) {
                  console.log('🔧 Comando administrativo processado');
                  continue; // Pular processamento normal
                }
              }

              // MENSAGEM DE TEXTO
              if (messaging.message && messaging.message.text) {
                console.log('📝 Mensagem de texto encontrada');
                await handleMessage(messaging, supabase);
              }
              
              // POSTBACK (botões)
              else if (messaging.postback) {
                console.log('🔘 Postback encontrado:', messaging.postback);
                // Tratar postback como mensagem de texto
                const textMessage = {
                  ...messaging,
                  message: {
                    text: messaging.postback.payload
                  }
                };
                await handleMessage(textMessage, supabase);
              }
              
              // OUTROS TIPOS
              else {
                console.log('Tipo de messaging não reconhecido:', messaging);
              }
            }
          } else {
            console.log('Entry sem messaging ou messaging vazio');
          }
        }
      } else {
        console.log('Dados sem entry ou entry vazio');
      }
      
      console.log('PROCESSAMENTO COMPLETO');
      return new Response('OK', { 
        status: 200,
        headers: corsHeaders
      });
    }
    
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('Erro geral no webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// FUNÇÕES AUXILIARES FORA DO SERVE

async function handleMessage(messaging: any, supabase: any) {
  const senderId = messaging.sender.id;
  const messageText = messaging.message.text;
  
  console.log(`📨 Nova mensagem de ${senderId}: ${messageText}`);
  
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
    
    console.log('💾 Mensagem salva no banco');
    
    // NOVA LÓGICA: 100% IA - Sem verificações automáticas
    const aiResponse = await processWithPureAI(messageText, senderId, supabase);
    console.log(`🤖 Resposta IA: ${aiResponse}`);
    
    // Verificar se a IA solicitou envio de imagem EXPLICITAMENTE
    const imageResponse = await checkAndSendProductImage(messageText, aiResponse, senderId, supabase);
    
    // Verificar se precisa finalizar compra
    const needsOrderProcessing = await checkForOrderCompletion(aiResponse, senderId, supabase);
    if (needsOrderProcessing) {
      console.log('🛒 Detectado pedido finalizado - notificando administrador');
      await notifyAdminOfNewOrder(needsOrderProcessing.orderData, supabase);
    }
    
    // IMPORTANTE: Só enviar resposta texto se NÃO enviou imagem
    if (!imageResponse.imageSent) {
      await sendFacebookMessage(senderId, aiResponse, supabase);
    }
    
    // Salvar resposta enviada
    await supabase.from('ai_conversations').insert({
      platform: 'facebook',
      user_id: senderId,
      message: aiResponse,
      type: 'sent',
      timestamp: new Date().toISOString()
    });
    
    console.log('Processamento completo');
    
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    await sendFacebookMessage(senderId, 'Desculpe, tive um problema técnico. Tente novamente!', supabase);
  }
}

// NOVA FUNÇÃO: 100% IA - Sem automações com aprendizado
async function processWithPureAI(userMessage: string, senderId: string, supabase: any): Promise<string> {
  console.log('🤖 === PROCESSAMENTO 100% IA COM APRENDIZADO ===');
  console.log('👤 Usuário:', senderId);
  console.log('💬 Mensagem:', userMessage);
  
  try {
    // 1. Verificar se é feedback negativo ou correção do usuário
    const feedbackDetected = await detectUserFeedback(userMessage, senderId, supabase);
    if (feedbackDetected) {
      return await handleUserFeedback(userMessage, senderId, supabase);
    }

    // 2. Buscar contexto do usuário 
    let userContext = await getOrCreateUserContext(senderId, supabase);
    console.log('📋 Contexto:', { messageCount: userContext.message_count });

    // 3. Verificar se há aprendizado aplicável
    const learnedResponse = await improveProductSearch(userMessage, supabase);
    if (learnedResponse) {
      return learnedResponse;
    }

    // 4. Buscar TODOS os produtos disponíveis (com stock) com categorização melhorada
    const availableProducts = await getAllAvailableProductsImproved(supabase);
    
    // 3. Buscar na base de conhecimento
    const knowledgeResponse = await searchKnowledgeBase(userMessage, supabase);

    // 4. Buscar configurações de IA
    const { data: aiSettings } = await supabase
      .from('ai_settings')
      .select('key, value')
      .in('key', ['openai_api_key', 'preferred_model']);

    const settingsMap = aiSettings?.reduce((acc: any, setting: any) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {}) || {};

    const openaiApiKey = settingsMap.openai_api_key || Deno.env.get('OPENAI_API_KEY');
    const model = settingsMap.preferred_model || 'gpt-4o-mini';

    if (!openaiApiKey) {
      console.error('OpenAI API key não configurada');
      return getFallbackResponse(userMessage, senderId, supabase);
    }

    // 5. Construir prompt 100% IA com todos os produtos
    const systemPrompt = buildAdvancedAIPrompt(userContext, knowledgeResponse, availableProducts);
    const conversationHistory = await getRecentConversationHistory(senderId, supabase);

    console.log('🧠 Chamando OpenAI (100% IA)...');
    console.log('📊 Histórico:', conversationHistory.length, 'mensagens');
    console.log('🗃️ Produtos disponíveis:', availableProducts.length);

    // 6. Chamar OpenAI - IA decide tudo
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 600,
        presence_penalty: 0.3,
        frequency_penalty: 0.2
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro OpenAI:', response.status, response.statusText);
      throw new Error(`Erro OpenAI ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    let aiResponse = data.choices[0]?.message?.content?.trim();

    if (!aiResponse) {
      throw new Error('Resposta vazia da IA');
    }

    console.log('Resposta IA 100% gerada:', aiResponse.substring(0, 100) + '...');

    // 7. Atualizar contexto
    await updateUserContext(senderId, userMessage, aiResponse, supabase);

    return aiResponse;

  } catch (error) {
    console.error('Erro no processamento 100% IA:', error);
    return getFallbackResponse(userMessage, senderId, supabase);
  }
}

// Funções auxiliares simplificadas
async function getAllAvailableProductsImproved(supabase: any) {
  try {
    const { data: products } = await supabase
      .from('products')
      .select(`
        id, name, slug, price, original_price, description, 
        image_url, in_stock, stock_quantity, featured,
        category_id, categories(name), variants, colors, sizes
      `)
      .eq('active', true)
      .order('name', { ascending: true });

    if (!products) return [];

    const categorizedProducts = products.map(product => {
      const name = product.name.toLowerCase();
      let aiCategory = 'outros';
      let specificType = '';
      
      if (name.includes('fone') || name.includes('auricular') || name.includes('headphone') || 
          name.includes('earphone') || name.includes('auscultador')) {
        aiCategory = 'fones_audio';
        specificType = 'dispositivo_audio';
      } 
      else if ((name.includes('cabo') || name.includes('cable')) && 
               !name.includes('fone') && !name.includes('auricular')) {
        aiCategory = 'cabos_conexao';
        specificType = 'cabo_conectividade';
      } 
      else if (name.includes('carregador') || name.includes('fonte') || name.includes('charger')) {
        aiCategory = 'carregadores';
        specificType = 'dispositivo_alimentacao';
      } 
      else if (name.includes('adaptador') || name.includes('conversor') || name.includes('adapter')) {
        aiCategory = 'adaptadores';
        specificType = 'conversor_sinais';
      }
      
      return { 
        ...product, 
        ai_category: aiCategory,
        ai_specific_type: specificType,
        ai_search_keywords: name.split(' ').filter(word => word.length > 2)
      };
    });

    console.log('📦 Produtos categorizados:', categorizedProducts.length);
    
    return categorizedProducts;
  } catch (error) {
    console.error('Erro ao buscar produtos melhorados:', error);
    return [];
  }
}

async function buildAdvancedAIPrompt(userContext: any, knowledgeResponse: any, products: any[]) {
  let prompt = `Você é um vendedor especialista da SUPERLOJA, a melhor loja de tecnologia em Angola.

CONTEXTO DA EMPRESA:
📍 LOCALIZAÇÃO: Angola, Luanda
💰 MOEDA: Kz (Kwanza Angolano)
🚚 ENTREGA: GRÁTIS em Luanda | PAGA fora de Luanda (calcular frete)
📞 CONTATO: WhatsApp/Telegram: +244 930 000 000
🌐 SITE: https://superloja.vip`;

  const inStockProducts = products.filter(p => p.in_stock);
  
  if (inStockProducts.length > 0) {
    prompt += '\n\nPRODUTOS DISPONÍVEIS (EM STOCK):\n';
    inStockProducts.forEach((product, index) => {
      const price = parseFloat(product.price).toLocaleString('pt-AO');
      prompt += `${index + 1}. ${product.name} - ${price} Kz - https://superloja.vip/produto/${product.slug}\n`;
    });
  }

  prompt += `

INSTRUÇÕES DE COMPORTAMENTO:
- Seja natural, amigável e profissional
- Responda em português de Angola
- Só mencione produtos que estão EM STOCK
- Use preços exatos da lista
- Para produtos específicos use link específico
- Para perguntas gerais use https://superloja.vip
- Ajude com pedidos coletando: nome, telefone, endereço

SEJA PRECISO, HONESTO E NATURAL!`;

  return prompt;
}

async function detectUserFeedback(userMessage: string, senderId: string, supabase: any): Promise<boolean> {
  return false; // Simplificado
}

async function handleUserFeedback(userMessage: string, senderId: string, supabase: any): Promise<string> {
  return "Obrigado pelo feedback!"; // Simplificado
}

async function improveProductSearch(userMessage: string, supabase: any): Promise<string | null> {
  return null; // Simplificado
}

async function searchKnowledgeBase(userMessage: string, supabase: any): Promise<any> {
  try {
    const { data: knowledge } = await supabase
      .from('knowledge_base')
      .select('*')
      .limit(10);
    
    return knowledge || [];
  } catch (error) {
    console.error('Erro ao buscar knowledge base:', error);
    return [];
  }
}

async function getOrCreateUserContext(senderId: string, supabase: any): Promise<any> {
  try {
    let { data: context } = await supabase
      .from('ai_conversation_context')
      .select('*')
      .eq('user_id', senderId)
      .eq('platform', 'facebook')
      .maybeSingle();

    if (!context) {
      const { data: newContext } = await supabase
        .from('ai_conversation_context')
        .insert({
          user_id: senderId,
          platform: 'facebook',
          message_count: 0,
          conversation_summary: 'Novo usuário',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      context = newContext;
    }

    return context || { message_count: 0 };
  } catch (error) {
    console.log('Erro ao buscar/criar contexto:', error);
    return { message_count: 0 };
  }
}

async function getRecentConversationHistory(senderId: string, supabase: any): Promise<any[]> {
  const { data: conversations } = await supabase
    .from('ai_conversations')
    .select('message, type, timestamp')
    .eq('user_id', senderId)
    .eq('platform', 'facebook')
    .order('timestamp', { ascending: false })
    .limit(6);

  if (!conversations) return [];

  return conversations
    .reverse()
    .map((conv: any) => ({
      role: conv.type === 'received' ? 'user' : 'assistant',
      content: conv.message
    }));
}

async function updateUserContext(userId: string, userMessage: string, aiResponse: string, supabase: any): Promise<void> {
  try {
    const { data: existingContext } = await supabase
      .from('ai_conversation_context')
      .select('message_count')
      .eq('user_id', userId)
      .eq('platform', 'facebook')
      .maybeSingle();

    const newMessageCount = (existingContext?.message_count || 0) + 1;

    await supabase
      .from('ai_conversation_context')
      .upsert({
        user_id: userId,
        platform: 'facebook',
        message_count: newMessageCount,
        last_interaction: new Date().toISOString(),
        conversation_summary: `Última pergunta: ${userMessage.substring(0, 100)}...`,
        updated_at: new Date().toISOString()
      });
  } catch (error) {
    console.log('Erro ao atualizar contexto:', error);
  }
}

async function getFallbackResponse(userMessage: string, senderId: string, supabase: any): Promise<string> {
  console.log('🔄 Usando resposta fallback');
  
  const fallbacks = [
    'Olá! Como posso te ajudar hoje?',
    'Oi! Estou aqui para te auxiliar. O que precisa?',
    'Seja bem-vindo(a)! Em que posso ser útil?',
    'Olá! Conte-me como posso te ajudar!',
  ];
  
  if (userMessage.length < 10) {
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  } else {
    return fallbacks[0];
  }
}

async function sendFacebookMessage(recipientId: string, message: string, supabase: any) {
  let PAGE_ACCESS_TOKEN = null;
  let tokenSource = 'none';
  
  try {
    const { data: aiSettings } = await supabase
      .from('ai_settings')
      .select('value')
      .eq('key', 'facebook_page_token')
      .maybeSingle();
    
    if (aiSettings?.value) {
      PAGE_ACCESS_TOKEN = aiSettings.value;
      tokenSource = 'ai_settings';
      console.log('Usando token das configurações AI (admin)');
    }
  } catch (error) {
    console.log('Erro ao buscar token AI settings, tentando Meta settings');
  }

  if (!PAGE_ACCESS_TOKEN) {
    try {
      const { data: metaSettings } = await supabase
        .from('meta_settings')
        .select('access_token')
        .limit(1)
        .maybeSingle();
      
      if (metaSettings?.access_token) {
        PAGE_ACCESS_TOKEN = metaSettings.access_token;
        tokenSource = 'meta_settings';
        console.log('Usando token das configurações Meta');
      }
    } catch (error) {
      console.log('Erro ao buscar token Meta, tentando secrets');
    }
  }
  
  if (!PAGE_ACCESS_TOKEN) {
    PAGE_ACCESS_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    tokenSource = 'secrets';
    console.log('Usando token das secrets como fallback');
  }
  
  if (!PAGE_ACCESS_TOKEN) {
    console.error('Nenhum token Facebook encontrado');
    return;
  }
  
  console.log(`📤 Enviando mensagem para ${recipientId}`);
  console.log(`🔑 Token source: ${tokenSource}`);
  console.log(`📝 Mensagem: ${message.substring(0, 50)}...`);
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message }
        }),
      }
    );
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Mensagem enviada com sucesso!');
      console.log('📨 Message ID:', result.message_id);
      console.log('📱 Recipient ID:', result.recipient_id);
    } else {
      console.error('Erro Facebook API (detalhado):');
      console.error('📊 Status:', response.status);
      console.error('💥 Error details:', result);
      
      if (result.error?.code === 190) {
        console.error('🔑 ERRO DE TOKEN: Token inválido ou expirado');
      } else if (result.error?.code === 200) {
        console.error('🚫 ERRO DE PERMISSÃO: Sem permissão para enviar mensagens');
      } else if (result.error?.code === 100) {
        console.error('📝 ERRO DE PARÂMETRO: Parâmetros inválidos na requisição');
      }
    }
    
  } catch (error) {
    console.error('Erro de rede/conexão ao enviar mensagem:');
    console.error('🌐 Network error:', error.message);
  }
}

async function checkAndSendProductImage(userMessage: string, aiResponse: string, recipientId: string, supabase: any): Promise<{imageSent: boolean, productFound?: any}> {
  console.log('📸 === VERIFICANDO SOLICITAÇÃO DE IMAGEM ===');
  
  const explicitImageKeywords = [
    'foto', 'imagem', 'ver foto', 'mostrar foto', 'mostrar imagem', 'picture', 'pic', 
    'como é', 'aspecto', 'ver como é', 'quero ver', 'me mostra', 'photo',
    'aparência', 'visual do produto'
  ];
  
  const userWantsImage = explicitImageKeywords.some(keyword => 
    userMessage.toLowerCase().includes(keyword)
  );

  if (!userWantsImage) {
    console.log('📸 Usuário NÃO solicitou imagem explicitamente');
    return { imageSent: false };
  }

  console.log('📸 Usuário solicitou imagem EXPLICITAMENTE - buscando produto...');
  return { imageSent: false }; // Simplificado por agora
}

async function checkForOrderCompletion(aiResponse: string, recipientId: string, supabase: any): Promise<{orderData?: any} | null> {
  console.log('🛒 === VERIFICANDO FINALIZAÇÃO DE PEDIDO ===');
  return null; // Simplificado por agora
}

async function notifyAdminOfNewOrder(orderData: any, supabase: any): Promise<void> {
  console.log('📢 === NOTIFICANDO ADMINISTRADOR ===');
  // Simplificado por agora
}

async function processAdminCommands(messaging: any, supabase: any): Promise<boolean> {
  const senderId = messaging.sender.id;
  const messageText = messaging.message.text;
  
  console.log('🔧 === VERIFICANDO COMANDOS ADMINISTRATIVOS ===');
  console.log('👤 Sender ID:', senderId);
  console.log('💬 Mensagem:', messageText);
  
  try {
    // Buscar ID do administrador no Facebook das configurações
    const { data: adminIdSetting } = await supabase
      .from('ai_settings')
      .select('value')
      .eq('key', 'admin_facebook_id')
      .limit(1)
      .maybeSingle();
    
    const adminFacebookId = adminIdSetting?.value;
    
    if (!adminFacebookId) {
      console.log('⚠️ Admin Facebook ID não configurado');
      return false;
    }
    
    if (senderId !== adminFacebookId) {
      console.log('🚫 Usuário não é administrador');
      return false;
    }
    
    console.log('Admin verificado - processando comando');
    
    // Comando simples de teste
    if (messageText.toLowerCase().includes('status')) {
      await sendFacebookMessage(
        senderId,
        'Status do bot: Online e funcionando!',
        supabase
      );
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error('Erro ao processar comando administrativo:', error);
    return false;
  }
}