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
        return new Response('Webhook Facebook está online e funcionando! ✅', { 
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
        console.log('✅ VERIFICAÇÃO APROVADA - Retornando challenge');
        return new Response(challenge, { 
          status: 200,
          headers: {
            'Content-Type': 'text/plain',
            ...corsHeaders
          }
        });
      } else {
        console.log('❌ VERIFICAÇÃO REJEITADA');
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
        console.log('✅ JSON válido');
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
        console.error('❌ ERRO JSON PARSE:', parseError);
        console.log('💡 Tentando processar como text/plain...');
        
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
              
              // MENSAGEM DE TEXTO
              if (messaging.message && messaging.message.text) {
                console.log('📝 Mensagem de texto encontrada');
                await handleMessage(messaging, supabase);
              }
              
              // POSTBACK (botões)
              else if (messaging.postback) {
                console.log('🔘 Postback encontrado:', messaging.postback);
              }
              
              // OUTROS TIPOS
              else {
                console.log('❓ Tipo de messaging não reconhecido:', messaging);
              }
            }
          } else {
            console.log('⚠️ Entry sem messaging ou messaging vazio');
          }
        }
      } else {
        console.log('⚠️ Dados sem entry ou entry vazio');
      }
      
      console.log('✅ === PROCESSAMENTO COMPLETO ===');
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
    console.error('❌ Erro geral no webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

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
    
    // Enviar apenas a resposta da IA
    await sendFacebookMessage(senderId, aiResponse, supabase);
    
    // Salvar resposta enviada
    await supabase.from('ai_conversations').insert({
      platform: 'facebook',
      user_id: senderId,
      message: aiResponse,
      type: 'sent',
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Processamento completo');
    
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    await sendFacebookMessage(senderId, 'Desculpe, tive um problema técnico. Tente novamente!', supabase);
  }
}

// NOVA FUNÇÃO: 100% IA - Sem automações
async function processWithPureAI(userMessage: string, senderId: string, supabase: any): Promise<string> {
  console.log('🤖 === PROCESSAMENTO 100% IA ===');
  console.log('👤 Usuário:', senderId);
  console.log('💬 Mensagem:', userMessage);
  
  try {
    // 1. Buscar contexto do usuário 
    let userContext = await getOrCreateUserContext(senderId, supabase);
    console.log('📋 Contexto:', { messageCount: userContext.message_count });

    // 2. Buscar produtos (para IA ter conhecimento disponível)
    const availableProducts = await getProductsForAI(supabase);
    
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
      console.error('❌ OpenAI API key não configurada');
      return getFallbackResponse(userMessage, senderId, supabase);
    }

    // 5. Construir prompt 100% IA
    const systemPrompt = buildPureAIPrompt(userContext, knowledgeResponse, availableProducts);
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
        temperature: 0.8,
        max_tokens: 500,
        presence_penalty: 0.3,
        frequency_penalty: 0.2
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro OpenAI:', response.status, response.statusText);
      throw new Error(`Erro OpenAI ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    let aiResponse = data.choices[0]?.message?.content?.trim();

    if (!aiResponse) {
      throw new Error('Resposta vazia da IA');
    }

    console.log('✅ Resposta IA 100% gerada:', aiResponse.substring(0, 100) + '...');

    // 7. Atualizar contexto
    await updateUserContext(senderId, userMessage, aiResponse, supabase);

    return aiResponse;

  } catch (error) {
    console.error('❌ Erro no processamento 100% IA:', error);
    return getFallbackResponse(userMessage, senderId, supabase);
  }
}

// Função simples para buscar produtos (sem filtros automáticos)
async function getProductsForAI(supabase: any) {
  try {
    const { data: products } = await supabase
      .from('products')
      .select('id, name, slug, price, description, image_url, in_stock')
      .eq('active', true)
      .limit(10); // Apenas 10 produtos para IA ter conhecimento
    
    return products || [];
  } catch (error) {
    console.error('❌ Erro ao buscar produtos para IA:', error);
    return [];
  }
}

// Função para construir prompt 100% IA
function buildPureAIPrompt(userContext: any, knowledgeResponse: any, products: any[]): string {
  
  // INFORMAÇÕES DA EMPRESA
  const companyInfo = `
📍 LOCALIZAÇÃO: Angola, Luanda
💰 MOEDA: Kz (Kwanza Angolano)
🚚 ENTREGA: Grátis em toda Angola
📞 CONTATO: WhatsApp/Telegram: +244 930 000 000
🌐 SITE: https://superloja.vip
⏰ HORÁRIO: Segunda a Sexta: 8h-18h | Sábado: 8h-14h`;

  // PRODUTOS DISPONÍVEIS (apenas informação, não envio automático)
  let productsInfo = '';
  if (products.length > 0) {
    productsInfo = '\n\n📦 PRODUTOS DISPONÍVEIS PARA CONSULTA:\n';
    products.forEach((product, index) => {
      const price = parseFloat(product.price).toLocaleString('pt-AO');
      const stock = product.in_stock ? '✅ Disponível' : '❌ Indisponível';
      productsInfo += `${index + 1}. ${product.name} - ${price} Kz - ${stock}\n`;
    });
    productsInfo += '\n⚠️ IMPORTANTE: Só mencione produtos se o cliente perguntar diretamente sobre eles!';
  }

  // CONTEXTO DA CONVERSA
  let conversationContext = '';
  if (userContext.message_count > 0) {
    conversationContext = `\n\n📋 CONTEXTO: Esta conversa tem ${userContext.message_count} mensagens.`;
  }

  // BASE DE CONHECIMENTO
  let knowledgeInfo = '';
  if (knowledgeResponse) {
    knowledgeInfo = `\n\n💡 INFORMAÇÃO RELEVANTE: ${knowledgeResponse.answer}`;
  }

  return `Você é o assistente virtual oficial da empresa Superloja. 
Seu objetivo é responder às mensagens recebidas de forma amigável, profissional e natural, como se fosse um atendente humano real. 

INFORMAÇÕES DA EMPRESA:${companyInfo}${productsInfo}${conversationContext}${knowledgeInfo}

INSTRUÇÕES CRÍTICAS:
- Cumprimente de forma personalizada ("Olá, tudo bem?" ou "Bom dia! Como posso ajudar?").
- Responda de forma clara e objetiva às perguntas sobre serviços, preços, horários, localização.
- Colete dados do cliente quando necessário (nome, email, telefone), mas sempre de forma gradual e educada.
- Encerre a conversa com simpatia quando o usuário disser que não precisa mais de ajuda.
- NUNCA mencione produtos sem o usuário perguntar especificamente sobre eles.
- Se perguntarem sobre produtos, use apenas as informações da lista acima.
- NÃO envie imagens automaticamente - apenas texto.

REGRAS IMPORTANTES:
- Não envie respostas longas. Use no máximo 2 ou 3 frases.
- Se a mensagem for saudação (ex.: "Oi", "Bom dia"), responda com saudação amigável e "Como posso te ajudar hoje?".
- Se não entender, peça para explicar melhor: "Desculpe, poderia me dar mais detalhes?".
- Evite respostas robóticas. Seja variado, criativo e humano.
- Use emojis moderadamente (1-2 por resposta).
- Sempre responda em português de Angola.

SEJA NATURAL E HUMANO EM TODAS AS INTERAÇÕES!`;
}

// Função para buscar na base de conhecimento
async function searchKnowledgeBase(query: string, supabase: any): Promise<any> {
  try {
    const { data: knowledge } = await supabase
      .from('ai_knowledge_base')
      .select('question, answer')
      .eq('active', true)
      .or(`question.ilike.%${query}%,keywords.cs.{${query}}`)
      .limit(1)
      .maybeSingle();

    return knowledge;
  } catch (error) {
    console.error('❌ Erro ao buscar base conhecimento:', error);
    return null;
  }
}

// Função para buscar ou criar contexto do usuário
async function getOrCreateUserContext(userId: string, supabase: any): Promise<any> {
  const { data: existingContext } = await supabase
    .from('ai_conversation_context')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', 'facebook')
    .maybeSingle();

  if (existingContext) {
    return existingContext;
  }

  // Criar novo contexto
  const { data: newContext } = await supabase
    .from('ai_conversation_context')
    .insert({
      user_id: userId,
      platform: 'facebook',
      context_data: {},
      message_count: 0,
      user_preferences: {}
    })
    .select()
    .maybeSingle();

  return newContext || { user_id: userId, message_count: 0, context_data: {}, user_preferences: {} };
}

// Função para obter histórico recente
async function getRecentConversationHistory(userId: string, supabase: any): Promise<any[]> {
  const { data: conversations } = await supabase
    .from('ai_conversations')
    .select('message, type')
    .eq('user_id', userId)
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

// Função para atualizar contexto do usuário - CORRIGIDA
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
    console.log('⚠️ Erro ao atualizar contexto:', error);
  }
}

// Função para fallback quando IA falha
async function getFallbackResponse(userMessage: string, senderId: string, supabase: any): Promise<string> {
  console.log('🔄 Usando resposta fallback');
  
  const fallbacks = [
    'Olá! Como posso te ajudar hoje? 😊',
    'Oi! Estou aqui para te auxiliar. O que precisa?',
    'Seja bem-vindo(a)! Em que posso ser útil?',
    'Olá! Conte-me como posso te ajudar! 😊',
  ];
  
  // Escolher fallback baseado no comprimento da mensagem do usuário
  if (userMessage.length < 10) {
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  } else {
    return fallbacks[0];
  }
}

async function sendFacebookMessage(recipientId: string, message: string, supabase: any) {
  // Primeiro tenta buscar token das configurações AI (onde o admin salva)
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
      console.log('✅ Usando token das configurações AI (admin)');
    }
  } catch (error) {
    console.log('⚠️ Erro ao buscar token AI settings, tentando Meta settings');
  }

  // Fallback 1: Configurações Meta
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
        console.log('✅ Usando token das configurações Meta');
      }
    } catch (error) {
      console.log('⚠️ Erro ao buscar token Meta, tentando secrets');
    }
  }
  
  // Fallback 2: Secrets do Supabase
  if (!PAGE_ACCESS_TOKEN) {
    PAGE_ACCESS_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    tokenSource = 'secrets';
    console.log('⚠️ Usando token das secrets como fallback');
  }
  
  if (!PAGE_ACCESS_TOKEN) {
    console.error('❌ Nenhum token Facebook encontrado');
    return;
  }
  
  console.log(`📤 Enviando mensagem para ${recipientId}`);
  console.log(`🔑 Token source: ${tokenSource}`);
  console.log(`📝 Mensagem: ${message.substring(0, 50)}...`);
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
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
      console.log('✅ Mensagem enviada com sucesso!');
      console.log('📨 Message ID:', result.message_id);
      console.log('📱 Recipient ID:', result.recipient_id);
    } else {
      console.error('❌ Erro Facebook API (detalhado):');
      console.error('📊 Status:', response.status);
      console.error('📋 Response headers:', Object.fromEntries(response.headers.entries()));
      console.error('💥 Error details:', result);
      
      // Log específico para diferentes tipos de erro
      if (result.error?.code === 190) {
        console.error('🔑 ERRO DE TOKEN: Token inválido ou expirado');
      } else if (result.error?.code === 200) {
        console.error('🚫 ERRO DE PERMISSÃO: Sem permissão para enviar mensagens');
      } else if (result.error?.code === 100) {
        console.error('📝 ERRO DE PARÂMETRO: Parâmetros inválidos na requisição');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro de rede/conexão ao enviar mensagem:');
    console.error('🌐 Network error:', error.message);
    console.error('🔗 URL tentativa:', `https://graph.facebook.com/v18.0/me/messages`);
    console.error('🔑 Token usado (primeiros 20 chars):', PAGE_ACCESS_TOKEN.substring(0, 20) + '...');
  }
}

// Função para enviar imagens do Facebook
async function sendFacebookImage(recipientId: string, imageUrl: string, caption: string, supabase: any) {
  // Buscar token da mesma forma que sendFacebookMessage
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
    }
  } catch (error) {
    console.log('⚠️ Erro ao buscar token AI settings para imagem');
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
      }
    } catch (error) {
      console.log('⚠️ Erro ao buscar token Meta para imagem');
    }
  }
  
  if (!PAGE_ACCESS_TOKEN) {
    PAGE_ACCESS_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    tokenSource = 'secrets';
  }
  
  if (!PAGE_ACCESS_TOKEN) {
    console.error('❌ Nenhum token Facebook encontrado para enviar imagem');
    return;
  }
  
  console.log(`📸 Enviando imagem para ${recipientId}`);
  console.log(`🖼️ URL da imagem: ${imageUrl}`);
  console.log(`📝 Legenda: ${caption.substring(0, 50)}...`);
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: {
            attachment: {
              type: 'image',
              payload: {
                url: imageUrl,
                is_reusable: true
              }
            }
          }
        }),
      }
    );
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Imagem enviada com sucesso!');
      console.log('📨 Message ID:', result.message_id);
      
      // Enviar legenda separadamente
      if (caption && caption.trim()) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay de 0.5s
        await sendFacebookMessage(recipientId, caption, supabase);
      }
    } else {
      console.error('❌ Erro ao enviar imagem Facebook:', result);
      // Fallback: enviar apenas a mensagem de texto
      await sendFacebookMessage(recipientId, `${caption}\n\n🖼️ Imagem: ${imageUrl}`, supabase);
    }
    
  } catch (error) {
    console.error('❌ Erro de rede ao enviar imagem:', error);
    // Fallback: enviar apenas a mensagem de texto
    await sendFacebookMessage(recipientId, `${caption}\n\n🖼️ Link da imagem: ${imageUrl}`, supabase);
  }