import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  console.log('🚀 === INSTAGRAM WEBHOOK CHAMADO ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Método:', req.method);
  console.log('URL completa:', req.url);
  
  // Capturar headers do Instagram
  console.log('📋 === HEADERS DO INSTAGRAM ===');
  const headers = Object.fromEntries(req.headers.entries());
  console.log('Headers completos:', JSON.stringify(headers, null, 2));
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('⚡ Processando request OPTIONS (CORS preflight)');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle Instagram webhook verification (GET request)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      
      // Se não tem parâmetros de verificação, retorna status OK
      if (!mode && !token && !challenge) {
        console.log('📡 Webhook Instagram acessado diretamente - Status OK');
        return new Response('Webhook Instagram está online e funcionando! ✅', { 
          status: 200,
          headers: {
            'Content-Type': 'text/plain',
            ...corsHeaders
          }
        });
      }
      
      console.log('=== INSTAGRAM WEBHOOK VERIFICATION ===');
      console.log('Mode:', mode);
      console.log('Token recebido:', token);
      console.log('Challenge:', challenge);
      
      // Token de verificação fixo para Instagram
      const VERIFY_TOKEN = 'minha_superloja_instagram_webhook_token_2024';
      console.log('Token esperado:', VERIFY_TOKEN);
      
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ VERIFICAÇÃO INSTAGRAM APROVADA - Retornando challenge');
        return new Response(challenge, { 
          status: 200,
          headers: {
            'Content-Type': 'text/plain',
            ...corsHeaders
          }
        });
      } else {
        console.log('❌ VERIFICAÇÃO INSTAGRAM REJEITADA');
        console.log('Mode válido?', mode === 'subscribe');
        console.log('Token válido?', token === VERIFY_TOKEN);
        return new Response('Forbidden', { 
          status: 403,
          headers: corsHeaders
        });
      }
    }

    // Handle incoming Instagram messages (POST request)
    if (req.method === 'POST') {
      console.log('📨 === PROCESSANDO INSTAGRAM POST REQUEST ===');
      
      // Capturar corpo da requisição
      const body = await req.text();
      console.log('📦 Body tamanho:', body.length, 'bytes');
      console.log('📦 Body conteúdo RAW:', body);
      
      // Verificar se é JSON válido
      let data;
      try {
        data = JSON.parse(body);
        console.log('✅ JSON válido');
        console.log('📊 Dados parseados (estrutura completa):');
        console.log(JSON.stringify(data, null, 2));
        
        // Análise detalhada da estrutura do Instagram
        console.log('🔍 === ANÁLISE DA ESTRUTURA INSTAGRAM ===');
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
              });
            }
          });
        }
        
      } catch (parseError) {
        console.error('❌ ERRO JSON PARSE INSTAGRAM:', parseError);
        console.log('💡 Tentando processar como text/plain...');
        
        return new Response('OK', { 
          status: 200,
          headers: corsHeaders
        });
      }
      
      // Processar mensagens do Instagram
      console.log('🚀 === INICIANDO PROCESSAMENTO INSTAGRAM ===');
      
      if (data.entry && data.entry.length > 0) {
        for (const entry of data.entry) {
          console.log('📋 Processando entry Instagram:', entry.id);
          
          if (entry.messaging && entry.messaging.length > 0) {
            for (const messaging of entry.messaging) {
              console.log('💬 Processando messaging Instagram:', Object.keys(messaging));
              
              // Mensagem de texto do Instagram
              if (messaging.message && messaging.message.text) {
                console.log('📝 Mensagem de texto Instagram encontrada');
                await handleInstagramMessage(messaging, supabase);
              }
              // Outros tipos de messaging podem ser adicionados aqui
              else {
                console.log('❓ Tipo de messaging Instagram não reconhecido:', messaging);
              }
            }
          } else {
            console.log('⚠️ Entry Instagram sem messaging ou messaging vazio');
          }
        }
      } else {
        console.log('⚠️ Dados Instagram sem entry ou entry vazio');
      }
      
      console.log('✅ === PROCESSAMENTO INSTAGRAM COMPLETO ===');
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
    console.error('❌ Erro geral no webhook Instagram:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

async function handleInstagramMessage(messaging: any, supabase: any) {
  const senderId = messaging.sender.id;
  const messageText = messaging.message.text;
  
  console.log(`📨 Nova mensagem Instagram de ${senderId}: ${messageText}`);
  
  try {
    // Verificar se o bot Instagram está habilitado
    const { data: botSettings } = await supabase
      .from('ai_settings')
      .select('value')
      .eq('key', 'instagram_bot_enabled')
      .single();
    
    if (botSettings?.value !== 'true') {
      console.log('🚫 Bot Instagram desabilitado');
      return;
    }
    
    // Salvar mensagem recebida
    await supabase.from('ai_conversations').insert({
      platform: 'instagram',
      user_id: senderId,
      message: messageText,
      type: 'received',
      timestamp: new Date().toISOString()
    });
    
    console.log('💾 Mensagem Instagram salva no banco');
    
    // Processar com IA (reutilizando a lógica do Facebook)
    const aiResponse = await processWithAI(messageText, senderId, supabase);
    console.log(`🤖 Resposta IA para Instagram: ${aiResponse}`);
    
    // Verificar se encontrou produtos
    const products = await getRelevantProducts(messageText, supabase);
    const hasProductsWithImages = products.some(p => p.image_url);
    
    // Enviar resposta da IA primeiro
    await sendInstagramMessage(senderId, aiResponse, supabase);
    
    // Se encontrou produtos com imagens, enviar automaticamente
    if (hasProductsWithImages && products.length > 0) {
      console.log('📸 Enviando imagens automaticamente dos produtos encontrados no Instagram');
      
      // Pequeno delay para não sobrepor mensagens
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Enviar imagens automaticamente no Instagram
      await handleInstagramImageRequest(senderId, messageText, supabase);
    }
    
    // Salvar resposta enviada
    await supabase.from('ai_conversations').insert({
      platform: 'instagram',
      user_id: senderId,
      message: aiResponse,
      type: 'sent',
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Processamento Instagram completo');
    
  } catch (error) {
    console.error('❌ Erro ao processar mensagem Instagram:', error);
    await sendInstagramMessage(senderId, 'Desculpe, tive um problema técnico. Tente novamente!', supabase);
  }
}

// Reutilizando as funções do Facebook com adaptações para Instagram
async function processWithAI(userMessage: string, senderId: string, supabase: any): Promise<string> {
  console.log('🤖 === PROCESSAMENTO IA INSTAGRAM ===');
  console.log('👤 Usuário:', senderId);
  console.log('💬 Mensagem:', userMessage);
  
  try {
    // Buscar ou criar contexto do usuário (Instagram)
    let userContext = await getOrCreateUserContext(senderId, supabase);
    console.log('📋 Contexto do usuário Instagram:', { 
      messageCount: userContext.message_count,
      hasPreferences: !!userContext.user_preferences 
    });

    // Buscar produtos relevantes
    const relevantProducts = await getRelevantProducts(userMessage, supabase);

    // Buscar configurações de IA
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

    // Construir prompt para Instagram
    const systemPrompt = buildInstagramSystemPrompt(userContext, relevantProducts);
    const conversationHistory = await getRecentConversationHistory(senderId, supabase);

    console.log('🧠 Chamando OpenAI para Instagram...');
    console.log('📊 Histórico:', conversationHistory.length, 'mensagens');
    console.log('🔍 Produtos relevantes:', relevantProducts.length);

    // Chamar OpenAI
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
        max_tokens: 300,
        presence_penalty: 0.3,
        frequency_penalty: 0.2
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro OpenAI Instagram:', response.status, response.statusText);
      throw new Error(`Erro OpenAI ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    let aiResponse = data.choices[0]?.message?.content?.trim();

    if (!aiResponse) {
      throw new Error('Resposta vazia da IA');
    }

    console.log('✅ Resposta IA Instagram gerada:', aiResponse.substring(0, 100) + '...');

    // Atualizar contexto
    await updateUserContext(senderId, userMessage, aiResponse, supabase);

    return aiResponse;

  } catch (error) {
    console.error('❌ Erro no processamento IA Instagram:', error);
    return getFallbackResponse(userMessage, senderId, supabase);
  }
}

// Funções auxiliares adaptadas para Instagram
async function getOrCreateUserContext(userId: string, supabase: any): Promise<any> {
  const { data: existingContext } = await supabase
    .from('ai_conversation_context')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', 'instagram')
    .maybeSingle();

  if (existingContext) {
    return existingContext;
  }

  // Criar novo contexto para Instagram
  const { data: newContext } = await supabase
    .from('ai_conversation_context')
    .insert({
      user_id: userId,
      platform: 'instagram',
      context_data: {},
      message_count: 0,
      user_preferences: {}
    })
    .select()
    .maybeSingle();

  return newContext || { user_id: userId, message_count: 0, context_data: {}, user_preferences: {} };
}

async function getRelevantProducts(message: string, supabase: any): Promise<any[]> {
  console.log('🔍 Buscando produtos Instagram para:', message);
  
  const keywords = extractProductKeywords(message);
  console.log('🏷️ Palavras-chave extraídas:', keywords);
  
  let products = [];
  
  if (keywords.length > 0) {
    for (const keyword of keywords) {
      const { data: keywordProducts } = await supabase
        .from('products')
        .select('id, name, slug, price, original_price, description, image_url, images, in_stock, stock_quantity')
        .eq('active', true)
        .or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%`)
        .limit(2);
      
      if (keywordProducts && keywordProducts.length > 0) {
        products.push(...keywordProducts);
      }
    }
  }
  
  if (products.length === 0) {
    const { data: generalProducts } = await supabase
      .from('products')
      .select('id, name, slug, price, original_price, description, image_url, images, in_stock, stock_quantity')
      .eq('active', true)
      .or(`name.ilike.%${message}%,description.ilike.%${message}%`)
      .limit(3);
    
    products = generalProducts || [];
  }
  
  const uniqueProducts = products
    .filter((product, index, self) => 
      self.findIndex(p => p.id === product.id) === index
    )
    .slice(0, 3);
  
  console.log('📦 Produtos encontrados Instagram:', uniqueProducts.length);
  
  return uniqueProducts;
}

function extractProductKeywords(message: string): string[] {
  const messageLower = message.toLowerCase();
  const keywords: string[] = [];
  
  const productCategories = {
    'auricular': ['auricular', 'fone', 'fones', 'escutador', 'auscultador', 'headphone', 'earphone', 'ouvido'],
    'mouse': ['mouse', 'rato'],
    'teclado': ['teclado', 'keyboard'],
    'cabo': ['cabo', 'carregador', 'adaptador', 'fio'],
    'organizador': ['organizador', 'organizar', 'arrumação'],
    'sem fio': ['sem fio', 'wireless', 'bluetooth'],
    'usb': ['usb', 'pendrive', 'pen drive'],
    'carregador': ['carregador', 'charger', 'fonte'],
    'bluetooth': ['bluetooth', 'sem fio', 'wireless'],
    'esportivo': ['esportivo', 'sport', 'exercício', 'corrida'],
    'gaming': ['gaming', 'gamer', 'jogos', 'jogo']
  };
  
  for (const [category, terms] of Object.entries(productCategories)) {
    if (terms.some(term => messageLower.includes(term))) {
      keywords.push(category);
      terms.forEach(term => {
        if (messageLower.includes(term)) {
          keywords.push(term);
        }
      });
    }
  }
  
  const words = messageLower.split(' ').filter(word => word.length > 3);
  keywords.push(...words);
  
  return [...new Set(keywords)];
}

function buildInstagramSystemPrompt(userContext: any, products: any[]): string {
  const basePrompt = `Você é Alex, o assistente virtual da SuperLoja no Instagram! 📱
  
PERSONALIDADE PARA INSTAGRAM:
- Seja natural, amigável e use um tom moderno
- Use emojis de forma estratégica (2-3 por resposta)
- Responda de forma direta e visual
- Seja entusiasmado sobre produtos
- Adapte-se ao estilo visual do Instagram

CONTEXTO DO USUÁRIO:
- Mensagens anteriores: ${userContext.message_count}
- É cliente ${userContext.message_count > 3 ? 'frequente' : 'novo'}
- Plataforma: Instagram (respostas mais visuais)`;

  let contextualInfo = '';

  if (products.length > 0) {
    contextualInfo += `\n\n📦 PRODUTOS ENCONTRADOS:
${products.map(p => {
  const price = parseFloat(p.price).toLocaleString('pt-AO');
  const originalPrice = p.original_price ? ` (era ${parseFloat(p.original_price).toLocaleString('pt-AO')} Kz)` : '';
  const stock = p.in_stock ? `✅ Em estoque` : `❌ Indisponível`;
  const stockQty = p.stock_quantity > 0 ? ` (${p.stock_quantity} unidades)` : '';
  const hasImage = p.image_url ? '📸 Imagem disponível' : '';
  
  return `
🛍️ **${p.name}**
💰 Preço: ${price} Kz${originalPrice}
📋 ${p.description || 'Descrição não disponível'}
📦 Status: ${stock}${stockQty}
${hasImage}`;
}).join('\n')}

🌐 LINKS DIRETOS:
${products.length === 1 
  ? `🔗 Ver produto: https://superloja.vip/produto/${products[0].slug || products[0].id}`
  : `🛒 Ver catálogo completo: https://superloja.vip/produtos`
}`;
  }

  return basePrompt + contextualInfo + `

INSTRUÇÕES ESPECÍFICAS PARA INSTAGRAM:
1. Respostas mais concisas e visuais
2. Use emojis para destacar informações
3. Sempre mencione preços em Kz (Kwanza)
4. Seja direto e eficiente
5. Convide para ver mais no site
6. Mantenha o tom entusiasmado mas profissional
7. Faça perguntas para engajar
8. Lembre-se: no Instagram as pessoas gostam de visual

EXEMPLO DE RESPOSTA INSTAGRAM:
"✨ Encontrei auriculares incríveis para você! 

🎧 **Auricular Bluetooth Pro** 
💰 750,00 Kz 
📦 Em estoque ✅

Perfeito para exercícios! 💪
Quer ver a foto? 📸

🔗 Todos os detalhes: superloja.vip"`;
}

async function getRecentConversationHistory(userId: string, supabase: any): Promise<any[]> {
  const { data: conversations } = await supabase
    .from('ai_conversations')
    .select('message, type')
    .eq('user_id', userId)
    .eq('platform', 'instagram')
    .order('timestamp', { ascending: false })
    .limit(4); // Menos histórico para Instagram (respostas mais rápidas)

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
    await supabase
      .from('ai_conversation_context')
      .upsert({
        user_id: userId,
        platform: 'instagram',
        message_count: supabase.raw('COALESCE(message_count, 0) + 1'),
        last_interaction: new Date().toISOString(),
        conversation_summary: `Última pergunta: ${userMessage.substring(0, 100)}...`,
        updated_at: new Date().toISOString()
      });
  } catch (error) {
    console.log('⚠️ Erro ao atualizar contexto Instagram:', error);
  }
}

async function getFallbackResponse(userMessage: string, userId: string, supabase: any): Promise<string> {
  const fallbacks = [
    'Opa! Não entendi direito 🤔 Me explica melhor?',
    'Hmm... Pode reformular? 💭',
    'Desculpa, não captei! Me dá mais detalhes? 😊',
    'Não entendi bem, mas posso ajudar! Me conta melhor! 🙂',
    'Interessante! Me explica mais sobre isso? 🤗'
  ];

  try {
    const userContext = await getOrCreateUserContext(userId, supabase);
    const randomIndex = userContext.message_count % fallbacks.length;
    return fallbacks[randomIndex];
  } catch {
    return fallbacks[0];
  }
}

async function sendInstagramMessage(recipientId: string, message: string, supabase: any) {
  // Buscar token do Instagram das configurações
  let PAGE_ACCESS_TOKEN = null;
  let tokenSource = 'none';
  
  try {
    const { data: aiSettings } = await supabase
      .from('ai_settings')
      .select('value')
      .eq('key', 'instagram_page_token')
      .maybeSingle();
    
    if (aiSettings?.value) {
      PAGE_ACCESS_TOKEN = aiSettings.value;
      tokenSource = 'ai_settings';
      console.log('✅ Usando token Instagram das configurações AI');
    }
  } catch (error) {
    console.log('⚠️ Erro ao buscar token Instagram AI settings');
  }

  // Fallback: Meta settings
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
        console.log('✅ Usando token Instagram das configurações Meta');
      }
    } catch (error) {
      console.log('⚠️ Erro ao buscar token Instagram Meta');
    }
  }
  
  // Fallback: Secrets
  if (!PAGE_ACCESS_TOKEN) {
    PAGE_ACCESS_TOKEN = Deno.env.get('INSTAGRAM_PAGE_ACCESS_TOKEN');
    tokenSource = 'secrets';
    console.log('⚠️ Usando token Instagram das secrets');
  }
  
  if (!PAGE_ACCESS_TOKEN) {
    console.error('❌ Nenhum token Instagram encontrado');
    return;
  }
  
  console.log(`📤 Enviando mensagem Instagram para ${recipientId}`);
  console.log(`🔑 Token source: ${tokenSource}`);
  console.log(`📝 Mensagem: ${message.substring(0, 50)}...`);
  
  try {
    // Instagram usa a mesma API do Facebook para mensagens
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
      console.log('✅ Mensagem Instagram enviada com sucesso!');
      console.log('📨 Message ID:', result.message_id);
    } else {
      console.error('❌ Erro Instagram API:', result);
    }
    
  } catch (error) {
    console.error('❌ Erro de rede ao enviar mensagem Instagram:', error);
  }
}

async function handleInstagramImageRequest(senderId: string, messageText: string, supabase: any) {
  try {
    const products = await getRelevantProducts(messageText, supabase);
    const productsWithImages = products.filter(p => p.image_url);
    
    if (productsWithImages.length === 0) {
      await sendInstagramMessage(senderId, 'Desculpe, não encontrei produtos com imagens para mostrar. 😔', supabase);
      return;
    }
    
    // Enviar imagens dos produtos encontrados
    for (const product of productsWithImages.slice(0, 2)) { // Máximo 2 para Instagram
      const price = parseFloat(product.price).toLocaleString('pt-AO');
      const stock = product.in_stock ? 'Em estoque' : 'Indisponível';
      const productLink = `https://superloja.vip/produto/${product.slug || product.id}`;
      
      const caption = `📱 ${product.name}\n💰 ${price} Kz\n📦 ${stock}\n\n${product.description || ''}\n\n🔗 Ver detalhes: ${productLink}`;
      
      // Enviar imagem com legenda
      await sendInstagramImage(senderId, product.image_url, caption, supabase);
      
      // Delay entre envios
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Salvar resposta enviada no histórico
    await supabase.from('ai_conversations').insert({
      platform: 'instagram',
      user_id: senderId,
      message: `📸 Enviou ${productsWithImages.length} imagem(ns) de produtos`,
      type: 'sent',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao enviar imagens Instagram:', error);
    await sendInstagramMessage(senderId, 'Desculpe, tive um problema ao buscar as imagens. 😔', supabase);
  }
}

async function sendInstagramImage(recipientId: string, imageUrl: string, caption: string, supabase: any) {
  // Buscar token da mesma forma que sendInstagramMessage
  let PAGE_ACCESS_TOKEN = null;
  
  try {
    const { data: aiSettings } = await supabase
      .from('ai_settings')
      .select('value')
      .eq('key', 'instagram_page_token')
      .maybeSingle();
    
    if (aiSettings?.value) {
      PAGE_ACCESS_TOKEN = aiSettings.value;
    }
  } catch (error) {
    console.log('⚠️ Erro ao buscar token Instagram para imagem');
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
      }
    } catch (error) {
      console.log('⚠️ Erro ao buscar token Meta para imagem Instagram');
    }
  }
  
  if (!PAGE_ACCESS_TOKEN) {
    PAGE_ACCESS_TOKEN = Deno.env.get('INSTAGRAM_PAGE_ACCESS_TOKEN');
  }
  
  if (!PAGE_ACCESS_TOKEN) {
    console.error('❌ Nenhum token Instagram encontrado para enviar imagem');
    return;
  }
  
  console.log(`📸 Enviando imagem Instagram para ${recipientId}`);
  console.log(`🖼️ URL da imagem: ${imageUrl}`);
  
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
      console.log('✅ Imagem Instagram enviada com sucesso!');
      
      // Enviar legenda separadamente
      if (caption && caption.trim()) {
        await new Promise(resolve => setTimeout(resolve, 500));
        await sendInstagramMessage(recipientId, caption, supabase);
      }
    } else {
      console.error('❌ Erro ao enviar imagem Instagram:', result);
      await sendInstagramMessage(recipientId, `${caption}\n\n🖼️ Imagem: ${imageUrl}`, supabase);
    }
    
  } catch (error) {
    console.error('❌ Erro de rede ao enviar imagem Instagram:', error);
    await sendInstagramMessage(recipientId, `${caption}\n\n🖼️ Link da imagem: ${imageUrl}`, supabase);
  }
}