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
    
    // Verificar se usuário está pedindo fotos/imagens explicitamente
    const isRequestingImages = checkIfRequestingImages(messageText);
    
    // Processar com IA normal SEMPRE
    const aiResponse = await processWithAI(messageText, senderId, supabase);
    console.log(`🤖 Resposta IA: ${aiResponse}`);
    
    // Enviar resposta da IA primeiro
    await sendFacebookMessage(senderId, aiResponse, supabase);
    
    // CORRIGIDO: Só enviar produtos se explicitamente solicitado
    if (isRequestingImages && await shouldSendProducts(senderId, messageText, supabase)) {
      console.log('📸 Usuário solicitou produtos - enviando imagens');
      
      // Pequeno delay para não sobrepor mensagens
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Enviar imagens apenas quando solicitado
      await handleImageRequest(senderId, messageText, supabase);
    } else {
      console.log('ℹ️ Resposta apenas de texto - produtos não solicitados ou já enviados recentemente');
    }
    
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

// Função para verificar se usuário está pedindo imagens
function checkIfRequestingImages(message: string): boolean {
  const messageLower = message.toLowerCase();
  const imageKeywords = [
    'foto', 'fotos', 'imagem', 'imagens', 'mostrar', 'mostra', 'ver', 'veja',
    'picture', 'photo', 'image', 'show', 'see', 'visualizar'
  ];
  
  return imageKeywords.some(keyword => messageLower.includes(keyword));
}

// Função para lidar com pedidos de imagens
async function handleImageRequest(senderId: string, messageText: string, supabase: any) {
  try {
    // Buscar produtos relevantes com imagens
    const products = await getRelevantProducts(messageText, supabase);
    const productsWithImages = products.filter(p => p.image_url);
    
    if (productsWithImages.length === 0) {
      await sendFacebookMessage(senderId, 'Desculpe, não encontrei produtos com imagens para mostrar. 😔', supabase);
      return;
    }
    
    // Enviar imagens dos produtos encontrados
    for (const product of productsWithImages.slice(0, 3)) { // Máximo 3 produtos
      const price = parseFloat(product.price).toLocaleString('pt-AO');
      const stock = product.in_stock ? 'Em estoque' : 'Indisponível';
      const productLink = `https://superloja.vip/produto/${product.slug || product.id}`;
      
      const caption = `🛍️ ${product.name}\n💰 ${price} Kz\n📦 ${stock}\n\n${product.description || ''}\n\n🔗 Ver detalhes: ${productLink}`;
      
      // Enviar imagem com legenda
      await sendFacebookImage(senderId, product.image_url, caption, supabase);
      
      // Delay pequeno entre envios
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Salvar resposta enviada no histórico
    await supabase.from('ai_conversations').insert({
      platform: 'facebook',
      user_id: senderId,
      message: `📸 Enviou ${productsWithImages.length} imagem(ns) de produtos`,
      type: 'sent',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao enviar imagens:', error);
    await sendFacebookMessage(senderId, 'Desculpe, tive um problema ao buscar as imagens. 😔', supabase);
  }
}

async function processWithAI(userMessage: string, senderId: string, supabase: any): Promise<string> {
  console.log('🤖 === PROCESSAMENTO IA AVANÇADO ===');
  console.log('👤 Usuário:', senderId);
  console.log('💬 Mensagem:', userMessage);
  
  try {
    // 1. BUSCAR OU CRIAR CONTEXTO DO USUÁRIO
    let userContext = await getOrCreateUserContext(senderId, supabase);
    console.log('📋 Contexto do usuário:', { 
      messageCount: userContext.message_count,
      hasPreferences: !!userContext.user_preferences 
    });

    // 2. VERIFICAR PADRÕES DE CONVERSAS PREDEFINIDOS
    const patternResponse = await checkConversationPatterns(userMessage, userContext, supabase);
    if (patternResponse) {
      console.log('🎯 Resposta por padrão encontrada');
      await updateUserContext(senderId, userMessage, patternResponse, supabase);
      return patternResponse;
    }

    // 3. BUSCAR NA BASE DE CONHECIMENTO
    const knowledgeResponse = await searchKnowledgeBase(userMessage, supabase);
    
    // 4. BUSCAR PRODUTOS RELEVANTES
    const relevantProducts = await getRelevantProducts(userMessage, supabase);

    // 5. BUSCAR CONFIGURAÇÕES DE IA
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

    // 6. CONSTRUIR PROMPT INTELIGENTE E CONTEXTUAL
    const systemPrompt = buildIntelligentSystemPrompt(userContext, knowledgeResponse, relevantProducts);
    const conversationHistory = await getRecentConversationHistory(senderId, supabase);

    console.log('🧠 Chamando OpenAI com contexto avançado...');
    console.log('📊 Histórico:', conversationHistory.length, 'mensagens');
    console.log('🔍 Produtos relevantes:', relevantProducts.length);
    console.log('📚 Base conhecimento:', knowledgeResponse ? 'encontrada' : 'não encontrada');

    // 7. CHAMAR OPENAI COM CONTEXTO COMPLETO
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
      console.error('❌ Erro OpenAI:', response.status, response.statusText);
      console.error('❌ Erro OpenAI detalhado:', errorText);
      console.error('🔑 Chave OpenAI usada (primeiros 10 chars):', openaiApiKey.substring(0, 10) + '...');
      throw new Error(`Erro OpenAI ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    let aiResponse = data.choices[0]?.message?.content?.trim();

    if (!aiResponse) {
      throw new Error('Resposta vazia da IA');
    }

    console.log('✅ Resposta IA gerada:', aiResponse.substring(0, 100) + '...');

    // 8. ATUALIZAR CONTEXTO E APRENDER
    await updateUserContext(senderId, userMessage, aiResponse, supabase);
    await learnFromInteraction(userMessage, aiResponse, userContext, supabase);

    return aiResponse;

  } catch (error) {
    console.error('❌ Erro no processamento IA:', error);
    
    // FALLBACK INTELIGENTE
    const fallbackResponse = await getFallbackResponse(userMessage, senderId, supabase);
    return fallbackResponse;
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

// Função para verificar padrões de conversas
async function checkConversationPatterns(message: string, userContext: any, supabase: any): Promise<string | null> {
  const { data: patterns } = await supabase
    .from('ai_conversation_patterns')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (!patterns) return null;

  const messageLower = message.toLowerCase();
  
  for (const pattern of patterns) {
    const hasMatchingKeyword = pattern.trigger_keywords.some((keyword: string) => 
      messageLower.includes(keyword.toLowerCase())
    );

    if (hasMatchingKeyword) {
      // Atualizar estatísticas do padrão
      await supabase
        .from('ai_conversation_patterns')
        .update({ 
          usage_count: pattern.usage_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', pattern.id);

      return personalizeResponse(pattern.response_template, userContext);
    }
  }

  return null;
}

// Função para personalizar resposta baseada no contexto
function personalizeResponse(template: string, userContext: any): string {
  let response = template;
  
  // Personalização baseada no histórico
  if (userContext.message_count > 5) {
    response = response.replace('😊', '😊✨');
  }
  
  if (userContext.message_count === 0) {
    response = `Seja bem-vindo(a)! ${response}`;
  }

  return response;
}

// Função para buscar na base de conhecimento
async function searchKnowledgeBase(message: string, supabase: any): Promise<any> {
  const { data: knowledge } = await supabase
    .from('ai_knowledge_base')
    .select('*')
    .eq('active', true)
    .order('priority', { ascending: false });

  if (!knowledge) return null;

  const messageLower = message.toLowerCase();
  
  for (const item of knowledge) {
    const hasMatchingKeyword = item.keywords.some((keyword: string) => 
      messageLower.includes(keyword.toLowerCase())
    );

    if (hasMatchingKeyword || messageLower.includes(item.question.toLowerCase())) {
      return item;
    }
  }

  return null;
}

// Função para buscar produtos relevantes com detalhes completos
async function getRelevantProducts(message: string, supabase: any): Promise<any[]> {
  console.log('🔍 Buscando produtos para:', message);
  
  // Palavras-chave para busca mais inteligente
  const keywords = extractProductKeywords(message);
  console.log('🏷️ Palavras-chave extraídas:', keywords);
  
  let products = [];
  
  // Busca por palavras-chave específicas primeiro
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
  
  // Se não encontrou nada com keywords, busca geral
  if (products.length === 0) {
    const { data: generalProducts } = await supabase
      .from('products')
      .select('id, name, slug, price, original_price, description, image_url, images, in_stock, stock_quantity')
      .eq('active', true)
      .or(`name.ilike.%${message}%,description.ilike.%${message}%`)
      .limit(3);
    
    products = generalProducts || [];
  }
  
  // Remover duplicados e limitar a 3
  const uniqueProducts = products
    .filter((product, index, self) => 
      self.findIndex(p => p.id === product.id) === index
    )
    .slice(0, 3);
  
  console.log('📦 Produtos encontrados:', uniqueProducts.length);
  
  return uniqueProducts;
}

// Função para extrair palavras-chave de produtos
function extractProductKeywords(message: string): string[] {
  const messageLower = message.toLowerCase();
  const keywords: string[] = [];
  
  // Categorias de produtos (MELHORADAS para Angola)
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
  
  // Verificar cada categoria
  for (const [category, terms] of Object.entries(productCategories)) {
    if (terms.some(term => messageLower.includes(term))) {
      keywords.push(category);
      // Adicionar também os termos específicos
      terms.forEach(term => {
        if (messageLower.includes(term)) {
          keywords.push(term);
        }
      });
    }
  }
  
  // Extrair palavras individuais relevantes
  const words = messageLower.split(' ').filter(word => word.length > 3);
  keywords.push(...words);
  
  return [...new Set(keywords)]; // Remove duplicatas
}

// Função para construir prompt inteligente
function buildIntelligentSystemPrompt(userContext: any, knowledgeResponse: any, products: any[]): string {
  const basePrompt = `Você é Alex, o assistente virtual da SuperLoja, uma loja de tecnologia moderna. 

PERSONALIDADE:
- Seja natural, amigável e empático
- Use emojis moderadamente (1-2 por resposta)
- Responda de forma conversacional, não robótica
- Seja proativo em oferecer ajuda
- Lembre-se do contexto da conversa

CONTEXTO DO USUÁRIO:
- Mensagens anteriores: ${userContext.message_count}
- É cliente ${userContext.message_count > 3 ? 'frequente' : 'novo'}`;

  let contextualInfo = '';

  if (knowledgeResponse) {
    contextualInfo += `\n\nINFORMAÇÃO RELEVANTE:
- Pergunta: ${knowledgeResponse.question}
- Resposta: ${knowledgeResponse.answer}`;
  }

  if (products.length > 0) {
    contextualInfo += `\n\n📦 PRODUTOS ENCONTRADOS:
${products.map(p => {
  // Correção: Não dividir por 100, mostrar valor direto em Kz
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
}

IMPORTANTE: 
- Sempre mencione o preço e disponibilidade
- Se tiver imagem, mencione que pode mostrar
- Seja específico sobre cada produto
- Inclua sempre o link direto para facilitar a compra
- Para produto único: link direto do produto
- Para múltiplos produtos: link do catálogo`;
  }

  return basePrompt + contextualInfo + `

INSTRUÇÕES PARA APRESENTAR PRODUTOS:
1. Quando encontrar produtos relevantes, SEMPRE apresente de forma detalhada
2. Mencione NOME, PREÇO (em Kz), DISPONIBILIDADE e DESCRIÇÃO
3. Use emojis para destacar informações importantes
4. Se houver imagem, mencione que pode mostrar/enviar
5. Compare preços se houver preço original
6. Informe sobre estoque disponível
7. Seja empolgante mas honesto sobre os produtos
8. **SEMPRE FAÇA PERGUNTAS** para especificar melhor a necessidade

TERMOS ANGOLANOS EQUIVALENTES:
- Auricular = Fone = Escutador = Auscultador = Headphone
- Mouse = Rato (dispositivo)
- Carregador = Cabo de carregamento = Adaptador

ESTRATÉGIA INTERATIVA:
- Se usuário pergunta "auricular", pergunte: Bluetooth ou com fio? Para que tipo de uso?
- Se usuário pergunta "mouse", pergunte: Para que uso? Gaming, trabalho ou uso geral?
- Se usuário pergunta preço, mostre opções e pergunte qual prefere
- SEMPRE ofereça alternativas e especificações

EXEMPLO DE RESPOSTA PARA AURICULARES:
"Encontrei várias opções de auriculares! 🎧

🎵 **Auricular Bluetooth XYZ** - 750,00 Kz
✅ Sem fio, cancelamento de ruído
📦 Em estoque (3 unidades)

🎶 **Auricular com Fio ABC** - 450,00 Kz  
🔌 Ótima qualidade de som
📦 Em estoque (8 unidades)

Que tipo prefere? Bluetooth para exercícios ou com fio para usar no computador? 
📸 Posso mostrar as imagens de qualquer um!"

INSTRUÇÕES GERAIS:
1. Responda de forma natural e conversacional
2. Use as informações de produtos quando disponível  
3. Seja específico e útil
4. Mantenha respostas entre 2-4 frases para produtos
5. Encoraje mais perguntas e seja interativo
6. NUNCA repita sempre a mesma resposta genérica
7. Seja único e entusiasmado em cada resposta
8. Use preços em Kz (Kwanza) sempre
9. Reconheça termos angolanos: auricular, escutador, auscultador`;
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

// Função para atualizar contexto do usuário
async function updateUserContext(userId: string, userMessage: string, aiResponse: string, supabase: any): Promise<void> {
  try {
    await supabase
      .from('ai_conversation_context')
      .upsert({
        user_id: userId,
        platform: 'facebook',
        message_count: supabase.raw('COALESCE(message_count, 0) + 1'),
        last_interaction: new Date().toISOString(),
        conversation_summary: `Última pergunta: ${userMessage.substring(0, 100)}...`,
        updated_at: new Date().toISOString()
      });
  } catch (error) {
    console.log('⚠️ Erro ao atualizar contexto:', error);
  }
}

// Função para aprendizado automático
async function learnFromInteraction(userMessage: string, aiResponse: string, userContext: any, supabase: any): Promise<void> {
  try {
    // Detectar padrões frequentes
    const messageLower = userMessage.toLowerCase();
    
    // Aprender palavras-chave frequentes
    if (messageLower.includes('preço') || messageLower.includes('valor') || messageLower.includes('custa')) {
      await recordLearningInsight(
        'frequent_question',
        'Usuário pergunta sobre preços frequentemente',
        { keyword: 'preço', context: userMessage.substring(0, 50) },
        supabase
      );
    }

    // Detectar satisfação através de palavras positivas
    if (messageLower.includes('obrigado') || messageLower.includes('valeu') || messageLower.includes('perfeito')) {
      await recordLearningInsight(
        'positive_feedback',
        'Resposta bem recebida pelo usuário',
        { response: aiResponse.substring(0, 100), userReaction: userMessage },
        supabase
      );
    }
  } catch (error) {
    console.log('⚠️ Erro no aprendizado:', error);
  }
}

// Função para registrar insights de aprendizado
async function recordLearningInsight(type: string, content: string, metadata: any, supabase: any): Promise<void> {
  try {
    await supabase
      .from('ai_learning_insights')
      .insert({
        insight_type: type,
        content: content,
        metadata: metadata,
        usage_count: 1
      });
  } catch (error) {
    console.log('⚠️ Erro ao salvar insight:', error);
  }
}

// Função para resposta de fallback inteligente
async function getFallbackResponse(userMessage: string, userId: string, supabase: any): Promise<string> {
  const fallbacks = [
    'Desculpe, não entendi completamente. Pode reformular sua pergunta? 🤔',
    'Hmm, deixe-me pensar... Pode me dar mais detalhes? 💭',
    'Não tenho certeza sobre isso, mas posso te ajudar de outra forma! 😊',
    'Ops! Parece que preciso de mais informações. Me conta melhor! 🙂',
    'Que interessante! Me explica um pouco mais sobre isso? 🤗',
    'Não captei direito, mas estou aqui para ajudar! Reformula pra mim? 😄'
  ];

  try {
    const userContext = await getOrCreateUserContext(userId, supabase);
    const randomIndex = userContext.message_count % fallbacks.length;
    return fallbacks[randomIndex];
  } catch {
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

// NOVA FUNÇÃO: Verificar se deve enviar produtos (evitar spam)
async function shouldSendProducts(senderId: string, messageText: string, supabase: any): Promise<boolean> {
  try {
    // Verificar se já enviou produtos recentemente (últimos 5 minutos)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: recentProductSends } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', senderId)
      .eq('platform', 'facebook')
      .eq('type', 'sent')
      .gte('timestamp', fiveMinutesAgo)
      .like('message', '%📸 Enviou%imagem%');
    
    if (recentProductSends && recentProductSends.length > 0) {
      console.log('⛔ Produtos já enviados recentemente - evitando spam');
      return false;
    }
    
    // Verificar se a mensagem realmente solicita produtos
    const messageLower = messageText.toLowerCase();
    const productRequestKeywords = [
      'mostra', 'ver produtos', 'produtos', 'imagens', 'fotos',
      'que vocês têm', 'disponível', 'catálogo', 'quero ver',
      'mostrar', 'opções', 'escolher', 'modelos', 'escutadores'
    ];
    
    const hasProductRequest = productRequestKeywords.some(keyword => 
      messageLower.includes(keyword)
    );
    
    console.log('🔍 Análise de solicitação de produtos:', {
      hasProductRequest,
      messageText: messageLower,
      recentSends: recentProductSends?.length || 0
    });
    
    return hasProductRequest;
    
  } catch (error) {
    console.error('❌ Erro ao verificar envio de produtos:', error);
    return false; // Em caso de erro, não envia para evitar spam
  }
}