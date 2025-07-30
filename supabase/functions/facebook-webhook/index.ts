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
    
    console.log('✅ Processamento completo');
    
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
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
    
    // 3. Buscar na base de conhecimento PRIMEIRO - PRIORIDADE ABSOLUTA
    console.log('🔍 === BUSCANDO BASE DE CONHECIMENTO (PRIORIDADE MÁXIMA) ===');
    const knowledgeResponse = await searchKnowledgeBase(userMessage, supabase);
    console.log('📚 Resultado da busca:', knowledgeResponse ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
    if (knowledgeResponse) {
      console.log('📖 Conhecimento encontrado:', knowledgeResponse.question, '→', knowledgeResponse.answer.substring(0, 50) + '...');
      console.log('🎯 BASE DE CONHECIMENTO TEM PRIORIDADE - IA deve usar exatamente esta resposta');
    }

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

// NOVA FUNÇÃO: Buscar TODOS os produtos disponíveis
async function getAllAvailableProducts(supabase: any) {
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
    
    console.log('📦 Total de produtos carregados:', products?.length || 0);
    console.log('📦 Produtos em stock:', products?.filter(p => p.in_stock).length || 0);
    console.log('📦 Produtos sem stock:', products?.filter(p => !p.in_stock).length || 0);
    
    return products || [];
  } catch (error) {
    console.error('❌ Erro ao buscar produtos:', error);
    return [];
  }
}

// FUNÇÃO MELHORADA: Buscar produtos com categorização aprimorada
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

    // Categorizar produtos por tipo para evitar confusão entre fones e cabos
    const categorizedProducts = products.map(product => {
      const name = product.name.toLowerCase();
      let aiCategory = 'outros';
      let specificType = '';
      
      // Categorização específica para fones de ouvido
      if (name.includes('fone') || name.includes('auricular') || name.includes('headphone') || 
          name.includes('earphone') || name.includes('auscultador')) {
        aiCategory = 'fones_audio';
        specificType = 'dispositivo_audio';
      } 
      // Categorização específica para cabos (excluindo fones)
      else if ((name.includes('cabo') || name.includes('cable')) && 
               !name.includes('fone') && !name.includes('auricular')) {
        aiCategory = 'cabos_conexao';
        specificType = 'cabo_conectividade';
      } 
      // Carregadores
      else if (name.includes('carregador') || name.includes('fonte') || name.includes('charger')) {
        aiCategory = 'carregadores';
        specificType = 'dispositivo_alimentacao';
      } 
      // Adaptadores
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
    console.log('📦 Fones de áudio:', categorizedProducts.filter(p => p.ai_category === 'fones_audio').length);
    console.log('📦 Cabos:', categorizedProducts.filter(p => p.ai_category === 'cabos_conexao').length);
    console.log('📦 Carregadores:', categorizedProducts.filter(p => p.ai_category === 'carregadores').length);
    
    return categorizedProducts;
  } catch (error) {
    console.error('❌ Erro ao buscar produtos melhorados:', error);
    return [];
  }
}

// Função simples para buscar produtos (manter para compatibilidade)
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

// NOVA FUNÇÃO: Prompt avançado com todos os produtos
function buildAdvancedAIPrompt(userContext: any, knowledgeResponse: any, products: any[]): string {
  
  // INFORMAÇÕES DA EMPRESA
  const companyInfo = `
📍 LOCALIZAÇÃO: Angola, Luanda
💰 MOEDA: Kz (Kwanza Angolano)
🚚 ENTREGA: ✅ GRÁTIS em Luanda | 💰 PAGA fora de Luanda (calcular frete)
📞 CONTATO: WhatsApp/Telegram: +244 930 000 000
🌐 SITE: https://superloja.vip
⏰ HORÁRIO: Segunda a Sexta: 8h-18h | Sábado: 8h-14h
⚠️ IMPORTANTE: Entregas fora de Luanda têm custo adicional - solicitar contato para calcular frete`;

  // CATÁLOGO COMPLETO DE PRODUTOS - CRÍTICO PARA PRECISÃO
  let productsInfo = '';
  if (products.length > 0) {
    productsInfo = '\n\n📦 ===== CATÁLOGO COMPLETO SUPERLOJA =====\n';
    
    // Produtos em stock
    const inStockProducts = products.filter(p => p.in_stock);
    const outOfStockProducts = products.filter(p => !p.in_stock);
    
    if (inStockProducts.length > 0) {
      productsInfo += '\n✅ PRODUTOS DISPONÍVEIS (EM STOCK):\n';
      inStockProducts.forEach((product, index) => {
        const price = parseFloat(product.price).toLocaleString('pt-AO');
        const originalPrice = product.original_price ? 
          ` (antes: ${parseFloat(product.original_price).toLocaleString('pt-AO')} Kz)` : '';
        const category = product.categories?.name ? ` | ${product.categories.name}` : '';
        
        productsInfo += `${index + 1}. ${product.name} - ${price} Kz${originalPrice}${category}\n`;
        productsInfo += `   🔗 LINK: https://superloja.vip/produto/${product.slug}\n`;
        if (product.description) {
          productsInfo += `   📝 ${product.description.substring(0, 80)}...\n`;
        }
        if (product.image_url) {
          productsInfo += `   📸 IMAGEM: ${product.image_url}\n`;
        }
      });
    }
    
    if (outOfStockProducts.length > 0) {
      productsInfo += '\n❌ PRODUTOS SEM STOCK (NÃO MENCIONAR):\n';
      outOfStockProducts.forEach((product, index) => {
        productsInfo += `${index + 1}. ${product.name} - INDISPONÍVEL\n`;
      });
    }
    
    productsInfo += '\n🎯 REGRAS CRÍTICAS SOBRE PRODUTOS:';
    productsInfo += '\n• SÓ mencione produtos que estão EM STOCK (✅)';
    productsInfo += '\n• NUNCA mencione produtos sem stock (❌)';
    productsInfo += '\n• Use os preços EXATOS da lista acima';
    productsInfo += '\n• Quando cliente escolher um produto ESPECÍFICO, use o LINK DIRETO do produto';
    productsInfo += '\n• Se cliente pedir imagem/foto, use a URL da imagem do produto';
    productsInfo += '\n• Se cliente mencionar número da lista (ex: "produto 5"), identifique qual produto é';
    productsInfo += '\n• ⚠️ ATENÇÃO CATEGORIA: FONES ≠ CABOS (são produtos diferentes!)';
    productsInfo += '\n• Se cliente pedir FONES/AURICULARES: mostre apenas produtos de ÁUDIO';
    productsInfo += '\n• Se cliente pedir CABOS: mostre apenas produtos de CONEXÃO/CARREGAMENTO';
    productsInfo += '\n• Se não tiver certeza do que cliente quer, PERGUNTE especificamente';
  }

  // CONTEXTO DA CONVERSA
  let conversationContext = '';
  if (userContext.message_count > 0) {
    conversationContext = `\n\n📋 CONTEXTO: Esta conversa tem ${userContext.message_count} mensagens.`;
  }

  // BASE DE CONHECIMENTO
  let knowledgeInfo = '';
  if (knowledgeResponse) {
    console.log('📚 Incluindo conhecimento no prompt:', knowledgeResponse.question);
    knowledgeInfo = `\n\n💡 INFORMAÇÃO RELEVANTE DA BASE DE CONHECIMENTO: 
📝 Pergunta: ${knowledgeResponse.question}
📋 Resposta: ${knowledgeResponse.answer}
🏷️ Categoria: ${knowledgeResponse.category}`;
  } else {
    console.log('⚠️ Nenhum conhecimento relevante para incluir no prompt');
  }

  return `Você é o assistente virtual oficial da SUPERLOJA, uma loja de tecnologia em Angola.
MISSÃO: Atender clientes com informações PRECISAS e ATUALIZADAS sobre nossos produtos.

INFORMAÇÕES DA EMPRESA:${companyInfo}${productsInfo}${conversationContext}${knowledgeInfo}

🎯 REGRA ABSOLUTA - BASE DE CONHECIMENTO:
${knowledgeResponse ? `
🚨 ATENÇÃO: FOI ENCONTRADA INFORMAÇÃO ESPECÍFICA NA BASE DE CONHECIMENTO!
📝 PERGUNTA: ${knowledgeResponse.question}
📋 RESPOSTA OBRIGATÓRIA: ${knowledgeResponse.answer}

⚠️ VOCÊ DEVE USAR EXATAMENTE ESTA RESPOSTA ACIMA - NÃO INVENTE NADA DIFERENTE!
⚠️ NÃO ADICIONE INFORMAÇÕES QUE NÃO ESTÃO NA BASE DE CONHECIMENTO!
⚠️ USE APENAS O CONTEÚDO DA BASE DE CONHECIMENTO PARA ESTA PERGUNTA!
` : ''}

🎯 INSTRUÇÕES CRÍTICAS DE VENDAS:
- **PRIORIDADE MÁXIMA: SEMPRE usar informações da base de conhecimento quando disponíveis**
- Se há informação na base de conhecimento acima, USE-A EXATAMENTE - não invente nada
- NÃO adicione informações extras quando há conhecimento específico disponível
- A base de conhecimento tem prioridade sobre qualquer outra informação
- Sempre confirme se um produto ESTÁ EM STOCK antes de mencionar
- Use os preços EXATOS da lista acima - não invente preços
- Se perguntarem sobre um produto inexistente, responda: "Não temos esse produto no momento"
- Para auriculares/fones, mostre apenas os que estão EM STOCK
- Sugira produtos similares se o desejado estiver indisponível

🔗 LINKS E IMAGENS:
- Quando cliente escolher produto ESPECÍFICO, use LINK DIRETO: https://superloja.vip/produto/[slug]
- Se cliente pedir foto/imagem, envie URL da imagem do produto
- Para lista geral, pode usar https://superloja.vip

🛒 PROCESSO DE COMPRA:
- Se cliente quiser comprar, pergunte: nome, telefone, endereço
- Confirme produto, preço e dados antes de finalizar
- Informe sobre entrega grátis em Angola
- Diga: "Vou processar seu pedido e entrar em contato!"

💬 COMUNICAÇÃO NATURAL:
- Se perguntarem "como está", responda: "Estou bem, obrigado! E você?"
- Quando mencionarem número da lista (ex: "produto 29"), identifique corretamente
- Seja simpático: "Olá! Tudo bem?" ou "Bom dia!"
- Máximo 3 frases por resposta
- Use 1-2 emojis
- Português de Angola

🚫 NUNCA FAÇA:
- Mencionar produtos sem stock
- Inventar preços ou produtos
- Enviar link geral quando cliente escolheu produto específico
- Ignorar quando cliente menciona número da lista

✅ SEMPRE FAÇA:
- Verificar stock antes de recomendar
- Dar preços corretos da lista
- Usar link específico do produto quando cliente escolher
- Responder de forma humana e natural
- Identificar números de produtos mencionados

SEJA PRECISO, HONESTO E NATURAL!`;
}

// Função para construir prompt 100% IA (manter para compatibilidade)
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
    console.log('📚 Incluindo conhecimento no prompt (modo compatibilidade):', knowledgeResponse.question);
    knowledgeInfo = `\n\n💡 INFORMAÇÃO RELEVANTE DA BASE DE CONHECIMENTO: 
📝 Pergunta: ${knowledgeResponse.question}
📋 Resposta: ${knowledgeResponse.answer}
🏷️ Categoria: ${knowledgeResponse.category}`;
  } else {
    console.log('⚠️ Nenhum conhecimento relevante para incluir no prompt (modo compatibilidade)');
  }

  return `Você é o assistente virtual oficial da empresa Superloja. 
Seu objetivo é responder às mensagens recebidas de forma amigável, profissional e natural, como se fosse um atendente humano real. 

INFORMAÇÕES DA EMPRESA:${companyInfo}${productsInfo}${conversationContext}${knowledgeInfo}

INSTRUÇÕES CRÍTICAS:
- **SEMPRE usar informações da base de conhecimento quando disponíveis**
- Se há informação relevante na base de conhecimento, USE-A EXATAMENTE como está
- NÃO invente respostas quando há conhecimento específico disponível
- Responda de forma natural e humana mas baseado no conhecimento fornecido
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
    console.log('🔍 Buscando na base de conhecimento para:', query);
    
    // Normalizar e extrair palavras-chave com variações
    const normalizeText = (text: string) => {
      return text.toLowerCase()
        .replace(/[áàâã]/g, 'a')
        .replace(/[éèê]/g, 'e')
        .replace(/[íì]/g, 'i')
        .replace(/[óòôõ]/g, 'o')
        .replace(/[úù]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[^a-z0-9\s]/g, '');
    };
    
    const normalizedQuery = normalizeText(query);
    const keywords = normalizedQuery.split(' ').filter(word => word.length > 2);
    console.log('🔑 Palavras-chave normalizadas:', keywords);
    
    // Buscar todos os conhecimentos ativos
    const { data: knowledge } = await supabase
      .from('ai_knowledge_base')
      .select('question, answer, category, keywords')
      .eq('active', true);
    
    if (!knowledge || knowledge.length === 0) {
      console.log('❌ Nenhum conhecimento encontrado na base');
      return null;
    }
    
    console.log('📚 Total de conhecimentos ativos:', knowledge.length);
    
    // Filtrar por relevância usando busca flexível
    const relevantKnowledge = knowledge.filter(item => {
      const itemText = normalizeText(`${item.question} ${item.answer} ${item.keywords.join(' ')}`);
      
      // Verificar se alguma palavra-chave da query aparece no texto do item
      const hasMatch = keywords.some(keyword => {
        return itemText.includes(keyword) || 
               keyword.includes('devoluc') && itemText.includes('devoluc') ||
               keyword.includes('troca') && itemText.includes('troca') ||
               keyword.includes('trocar') && itemText.includes('troca') ||
               keyword.includes('devolver') && itemText.includes('devoluc');
      });
      
      if (hasMatch) {
        console.log(`✅ Match encontrado em: ${item.question}`);
      }
      
      return hasMatch;
    });
    
    console.log('🎯 Conhecimentos relevantes encontrados:', relevantKnowledge.length);
    
    if (relevantKnowledge.length > 0) {
      // Ordenar por prioridade e retornar o primeiro
      const bestMatch = relevantKnowledge.sort((a, b) => b.priority - a.priority)[0];
      console.log('✅ Melhor conhecimento encontrado:', bestMatch.question);
      return bestMatch;
    }
    
    console.log('⚠️ Nenhum conhecimento relevante encontrado');
    return null;
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
    console.error('🔗 URL tentativa:', `https://graph.facebook.com/v21.0/me/messages`);
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
      `https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
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
}

// FUNÇÃO: Detectar e enviar imagens APENAS quando solicitado explicitamente
async function checkAndSendProductImage(userMessage: string, aiResponse: string, recipientId: string, supabase: any): Promise<{imageSent: boolean, productFound?: any}> {
  console.log('📸 === VERIFICANDO SOLICITAÇÃO DE IMAGEM ===');
  
  // APENAS detectar se o usuário pediu EXPLICITAMENTE uma imagem
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

  try {
    let selectedProduct = null;
    
    // 1. Detectar número da lista primeiro (ex: "produto 29", "número 5", "foto do produto 1", etc)
    const numberMatch = userMessage.match(/(?:produto|número|item|n[ºo°]?\.?)\s*(\d+)/i);
    if (numberMatch) {
      const productNumber = parseInt(numberMatch[1]);
      console.log(`📸 Detectado número do produto: ${productNumber}`);
      
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .eq('in_stock', true)
        .order('name', { ascending: true })
        .limit(50);
      
      if (products && products.length >= productNumber && productNumber > 0) {
        selectedProduct = products[productNumber - 1];
        console.log(`📸 Produto encontrado pelo número: ${selectedProduct.name}`);
      }
    }

    // 2. Se não achou por número, buscar em TODOS os produtos disponíveis
    if (!selectedProduct) {
      console.log('📸 Buscando em TODOS os produtos disponíveis...');
      
      // Buscar por QUALQUER palavra mencionada pelo usuário
      const userWords = userMessage.toLowerCase().split(' ').filter(word => word.length > 2);
      console.log(`📸 Palavras extraídas do usuário: ${userWords.join(', ')}`);
      
      const { data: allProducts } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .eq('in_stock', true);
      
      if (allProducts) {
        console.log(`📸 Verificando ${allProducts.length} produtos disponíveis...`);
        
        // Buscar produto que contenha qualquer palavra mencionada
        for (const word of userWords) {
          if (word.length > 2) { // Ignorar palavras muito pequenas
            const foundProduct = allProducts.find(product => 
              product.name.toLowerCase().includes(word) ||
              (product.description && product.description.toLowerCase().includes(word))
            );
            
            if (foundProduct) {
              selectedProduct = foundProduct;
              console.log(`📸 Produto encontrado por palavra "${word}": ${selectedProduct.name}`);
              break;
            }
          }
        }
        
        // Se ainda não achou, pegar o primeiro produto com imagem disponível
        if (!selectedProduct) {
          const productWithImage = allProducts.find(p => p.image_url);
          if (productWithImage) {
            selectedProduct = productWithImage;
            console.log(`📸 Usando primeiro produto com imagem: ${selectedProduct.name}`);
          }
        }
      }
    }

    // 3. Se encontrou produto, verificar se imagem está acessível e enviar
    if (selectedProduct && selectedProduct.image_url) {
      console.log(`📸 Enviando imagem do produto: ${selectedProduct.name}`);
      
      // Garantir URL completa para Supabase Storage
      let imageUrl = selectedProduct.image_url;
      if (!imageUrl.startsWith('http')) {
        if (imageUrl.startsWith('product-images/')) {
          imageUrl = `https://fijbvihinhuedkvkxwir.supabase.co/storage/v1/object/public/${imageUrl}`;
        } else {
          imageUrl = `https://fijbvihinhuedkvkxwir.supabase.co/storage/v1/object/public/product-images/${imageUrl}`;
        }
      }
      
      console.log(`📸 URL da imagem: ${imageUrl}`);
      
      // Verificar se imagem está acessível antes de enviar
      try {
        const imageCheck = await fetch(imageUrl, { method: 'HEAD' });
        if (!imageCheck.ok) {
          throw new Error('Imagem não acessível');
        }
        
        // Enviar imagem diretamente com resposta integrada
        await sendFacebookImage(
          recipientId,
          imageUrl,
          `📸 ${selectedProduct.name}
💰 Preço: ${parseFloat(selectedProduct.price).toLocaleString('pt-AO')} Kz
🔗 Ver mais: https://superloja.vip/produto/${selectedProduct.slug}

✨ Interessado? Me diga seu nome, telefone e endereço para processar seu pedido!`,
          supabase
        );
        
        return { imageSent: true, productFound: selectedProduct };
        
      } catch (imageError) {
        console.log('❌ Erro ao acessar imagem, enviando link:', imageError);
        
        // Fallback: enviar texto com link da imagem
        await sendFacebookMessage(
          recipientId,
          `📸 ${selectedProduct.name}
💰 Preço: ${parseFloat(selectedProduct.price).toLocaleString('pt-AO')} Kz
🔗 Ver mais: https://superloja.vip/produto/${selectedProduct.slug}
🖼️ Imagem: ${imageUrl}

✨ Interessado? Me diga seu nome, telefone e endereço para processar seu pedido!`,
          supabase
        );
        
        return { imageSent: true, productFound: selectedProduct };
      }
    } else {
      console.log('📸 Produto não encontrado ou sem imagem disponível');
      // Informar que não encontrou o produto para mostrar foto
      await sendFacebookMessage(
        recipientId,
        `🤔 Desculpe, não consegui identificar qual produto você quer ver a foto. 

📋 Você pode me dizer:
- "foto do produto 1" (usando o número da lista)
- "foto dos fones" (mencionando o tipo)

Ou consulte nossa lista de produtos disponíveis! 😊`,
        supabase
      );
      return { imageSent: true }; // Marcar como enviado para evitar resposta dupla
    }
    
  } catch (error) {
    console.error('❌ Erro ao processar solicitação de imagem:', error);
    return { imageSent: false };
  }
}

// NOVA FUNÇÃO: Verificar se pedido foi finalizado
async function checkForOrderCompletion(aiResponse: string, recipientId: string, supabase: any): Promise<{orderData?: any} | null> {
  console.log('🛒 === VERIFICANDO FINALIZAÇÃO DE PEDIDO ===');
  
  // Detectar se a resposta contém confirmação de pedido
  const orderKeywords = [
    'confirmando os dados para o seu pedido',
    'está tudo correto',
    'vou processar seu pedido',
    'pedido processado',
    'entrar em contato'
  ];
  
  const hasOrderConfirmation = orderKeywords.some(keyword => 
    aiResponse.toLowerCase().includes(keyword)
  );

  if (!hasOrderConfirmation) {
    return null;
  }

  console.log('🛒 Detectado finalização de pedido!');

  // Extrair dados do pedido da resposta da IA
  const productMatch = aiResponse.match(/\*produto\*:\s*([^\n]+)/i);
  const priceMatch = aiResponse.match(/\*preço\*:\s*([^\n]+)/i);
  const nameMatch = aiResponse.match(/\*nome\*:\s*([^\n]+)/i);
  const phoneMatch = aiResponse.match(/\*telefone\*:\s*([^\n]+)/i);
  const addressMatch = aiResponse.match(/\*endereço\*:\s*([^\n]+)/i);

  const orderData = {
    recipientId,
    produto: productMatch ? productMatch[1].trim() : 'Produto não identificado',
    preco: priceMatch ? priceMatch[1].trim() : 'Preço não identificado',
    nome: nameMatch ? nameMatch[1].trim() : 'Nome não informado',
    telefone: phoneMatch ? phoneMatch[1].trim() : 'Telefone não informado',
    endereco: addressMatch ? addressMatch[1].trim() : 'Endereço não informado',
    timestamp: new Date().toLocaleString('pt-AO')
  };

  console.log('🛒 Dados do pedido extraídos:', orderData);
  return { orderData };
}

// NOVA FUNÇÃO: Notificar administrador sobre novo pedido
async function notifyAdminOfNewOrder(orderData: any, supabase: any): Promise<void> {
  console.log('📢 === NOTIFICANDO ADMINISTRADOR ===');
  
  try {
    // Buscar ID do administrador no Facebook das configurações
    let adminFacebookId = "";
    
    try {
      const { data: adminIdSetting } = await supabase
        .from('ai_settings')
        .select('value')
        .eq('key', 'admin_facebook_id')
        .limit(1)
        .maybeSingle();
      
      if (adminIdSetting?.value) {
        adminFacebookId = adminIdSetting.value;
        console.log(`📞 Admin Facebook ID encontrado: ${adminFacebookId}`);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar admin ID:', error);
    }

    // Fallback para ID padrão se não encontrar nas configurações
    if (!adminFacebookId) {
      adminFacebookId = "carlosfox"; // ID padrão
      console.log(`📞 Usando admin ID padrão: ${adminFacebookId}`);
    }
    
    const orderMessage = `🚨 NOVO PEDIDO RECEBIDO! 🚨

📦 Produto: ${orderData.produto}
💰 Preço: ${orderData.preco}
👤 Cliente: ${orderData.nome}
📞 Telefone: ${orderData.telefone}
📍 Endereço: ${orderData.endereco}
⏰ Horário: ${orderData.timestamp}

🔗 ID do cliente no Messenger: ${orderData.recipientId}

🎯 AÇÕES RÁPIDAS:
✅ Responda "CONFIRMAR ${orderData.recipientId}" para confirmar o pedido
❌ Responda "CANCELAR ${orderData.recipientId}" para cancelar
📱 Responda "CONTATO ${orderData.recipientId}" para enviar seus dados de contato

Por favor, entre em contato com o cliente para confirmar a entrega! 📦✨`;

    // Tentar enviar via Facebook Messenger para o admin
    try {
      await sendFacebookMessage(adminFacebookId, orderMessage, supabase);
      console.log('✅ Notificação enviada para admin via Facebook');
    } catch (error) {
      console.error('❌ Erro ao enviar para admin via Facebook:', error);
    }

    // Salvar pedido no banco de dados com informações detalhadas
    const priceClean = orderData.preco.toString().replace(/[^\d,.]/g, '').replace(',', '.');
    const totalAmount = parseFloat(priceClean) || 0;

    const { data: orderInsert, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: orderData.nome,
        customer_phone: orderData.telefone,
        customer_email: '', // Não temos email do Facebook
        total_amount: totalAmount,
        order_status: 'pending',
        order_source: 'facebook_messenger',
        payment_status: 'pending',
        payment_method: 'to_be_defined',
        notes: `Endereço: ${orderData.endereco}\nProduto: ${orderData.produto}\nMessenger ID: ${orderData.recipientId}\nDetalhes: Pedido recebido via Facebook Messenger às ${orderData.timestamp}`
      });

    if (orderError) {
      console.error('❌ Erro ao salvar pedido no banco:', orderError);
    } else {
      console.log('✅ Pedido salvo no banco de dados:', orderInsert);
    }

    // Criar notificação no sistema para admins
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        title: 'Novo Pedido Via Messenger',
        message: `Cliente: ${orderData.nome} | Produto: ${orderData.produto} | Valor: ${orderData.preco}`,
        type: 'order',
        user_id: null // Notificação para todos os admins
      });

    if (notificationError) {
      console.error('❌ Erro ao criar notificação:', notificationError);
    } else {
      console.log('✅ Notificação criada no sistema');
    }

    // Log detalhado para rastreamento
    const { error: logError } = await supabase
      .from('notification_logs')
      .insert({
        notification_type: 'order_facebook',
        recipient: adminFacebookId,
        subject: 'Novo Pedido Facebook',
        message: orderMessage,
        status: 'sent',
        provider: 'facebook_messenger',
        metadata: {
          order_data: orderData,
          timestamp: new Date().toISOString(),
          admin_id: adminFacebookId
        }
      });

    if (logError) {
      console.error('❌ Erro ao criar log de notificação:', logError);
    }

  } catch (error) {
    console.error('❌ Erro geral ao notificar administrador:', error);
  }
}

// NOVA FUNÇÃO: Detectar feedback negativo do usuário
async function detectUserFeedback(userMessage: string, senderId: string, supabase: any): Promise<boolean> {
  console.log('🧠 === DETECTANDO FEEDBACK DO USUÁRIO ===');
  
  const feedbackKeywords = [
    'errado', 'incorreto', 'não é isso', 'não quero', 'não era isso',
    'quero fones', 'eu pedi fones', 'não cabos', 'pedi auriculares',
    'isso está errado', 'você enviou errado', 'não é o que pedi',
    'queria outro produto', 'não quero cabo', 'eu disse fones',
    'por que cabo', 'pedi headphones', 'quero earphones',
    'não mandou certo', 'enviou produto errado'
  ];
  
  const userMsgLower = userMessage.toLowerCase();
  const hasFeedback = feedbackKeywords.some(keyword => userMsgLower.includes(keyword));
  
  if (hasFeedback) {
    console.log('🧠 Feedback negativo detectado!');
    
    // Buscar últimas conversas para contexto
    const { data: recentConversations } = await supabase
      .from('ai_conversations')
      .select('message, type')
      .eq('user_id', senderId)
      .eq('platform', 'facebook')
      .order('timestamp', { ascending: false })
      .limit(4);
    
    if (recentConversations && recentConversations.length >= 2) {
      const lastAiResponse = recentConversations.find(c => c.type === 'sent')?.message || '';
      const userPreviousMessage = recentConversations.find(c => c.type === 'received')?.message || '';
      
      // Salvar feedback para aprendizado
      await supabase.from('ai_feedback').insert({
        user_id: senderId,
        user_message: userPreviousMessage,
        ai_response: lastAiResponse,
        user_feedback: userMessage,
        is_correct: false,
        learning_applied: false
      });
      
      console.log('💾 Feedback negativo salvo para aprendizado');
    }
  }
  
  return hasFeedback;
}

// NOVA FUNÇÃO: Tratar feedback do usuário e aprender
async function handleUserFeedback(userMessage: string, senderId: string, supabase: any): Promise<string> {
  console.log('🎓 === TRATANDO FEEDBACK E APRENDENDO ===');
  
  // Detectar produto correto que o usuário quer
  const productKeywords = {
    'fones': ['fones', 'auriculares', 'headphones', 'earphones', 'auscultadores'],
    'cabos': ['cabo', 'cabos', 'carregador', 'adaptador'],
    'carregadores': ['carregador', 'fonte', 'alimentação'],
    'adaptadores': ['adaptador', 'conversor', 'hub']
  };
  
  let desiredCategory = '';
  const userMsgLower = userMessage.toLowerCase();
  
  for (const [category, keywords] of Object.entries(productKeywords)) {
    if (keywords.some(keyword => userMsgLower.includes(keyword))) {
      desiredCategory = category;
      break;
    }
  }
  
  if (desiredCategory) {
    console.log(`🎓 Usuário quer categoria: ${desiredCategory}`);
    
    // Buscar produtos da categoria correta
    const { data: correctProducts } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .eq('in_stock', true)
      .ilike('name', `%${desiredCategory}%`)
      .limit(5);
    
    if (correctProducts && correctProducts.length > 0) {
      let response = `🎯 Peço desculpas pelo erro! Você quer ${desiredCategory}. Aqui estão os disponíveis:\n\n`;
      
      correctProducts.forEach((product, index) => {
        const price = parseFloat(product.price).toLocaleString('pt-AO');
        response += `${index + 1}. ${product.name} - ${price} Kz\n`;
        response += `   🔗 https://superloja.vip/produto/${product.slug}\n\n`;
      });
      
      response += '✨ Qual destes produtos lhe interessa? Posso mostrar mais detalhes!';
      
      // Marcar feedback como aprendido
      await supabase
        .from('ai_feedback')
        .update({ learning_applied: true, correction_provided: response })
        .eq('user_id', senderId)
        .eq('learning_applied', false)
        .order('created_at', { ascending: false })
        .limit(1);
      
      return response;
    }
  }
  
  // Se não conseguiu identificar produto específico, pedir clarificação
  return `🤔 Peço desculpas pelo erro! Para te ajudar melhor, pode me dizer exatamente qual produto você procura?

📋 Temos essas categorias:
• Fones de ouvido e auriculares
• Cabos e adaptadores  
• Carregadores
• Acessórios para smartphone

O que você gostaria de ver? 😊`;
}

// NOVA FUNÇÃO: Melhorar busca de produtos com base no aprendizado
async function improveProductSearch(userMessage: string, supabase: any) {
  console.log('🎓 === MELHORANDO BUSCA COM APRENDIZADO ===');
  
  // Buscar feedbacks anteriores para melhorar precisão
  const { data: learningData } = await supabase
    .from('ai_feedback')
    .select('user_message, correction_provided, user_feedback')
    .eq('is_correct', false)
    .eq('learning_applied', true)
    .limit(10);
  
  if (learningData && learningData.length > 0) {
    console.log(`🎓 Aplicando ${learningData.length} insights de aprendizado`);
    
    // Verificar se mensagem atual é similar a erros passados
    const userMsgLower = userMessage.toLowerCase();
    
    for (const feedback of learningData) {
      const similarityKeywords = feedback.user_message.toLowerCase().split(' ').filter(w => w.length > 2);
      const hasSimilarity = similarityKeywords.some(keyword => userMsgLower.includes(keyword));
      
      if (hasSimilarity && feedback.correction_provided) {
        console.log('🎓 Aplicando correção aprendida anteriormente');
        return feedback.correction_provided;
      }
    }
  }
  
  return null; // Continuar com busca normal
}

// NOVA FUNÇÃO: Processar comandos administrativos
async function processAdminCommands(messaging: any, supabase: any): Promise<boolean> {
  const senderId = messaging.sender.id;
  const userMessage = messaging.message?.text?.trim() || '';
  
  // Verificar se é comando administrativo
  const commandPatterns = [
    /^CONFIRMAR\s+(.+)$/i,
    /^CANCELAR\s+(.+)$/i,
    /^CONTATO\s+(.+)$/i
  ];

  let isAdminCommand = false;
  let customerId = '';
  let command = '';

  for (const pattern of commandPatterns) {
    const match = userMessage.match(pattern);
    if (match) {
      isAdminCommand = true;
      customerId = match[1].trim();
      command = userMessage.split(' ')[0].toUpperCase();
      break;
    }
  }

  if (!isAdminCommand) {
    return false;
  }

  console.log(`🔧 Comando administrativo detectado: ${command} para ${customerId}`);

  try {
    switch (command) {
      case 'CONFIRMAR':
        await sendFacebookMessage(
          customerId,
          `✅ Ótima notícia! Seu pedido foi CONFIRMADO! 🎉

🚚 Nossa equipe entrará em contato em breve para coordenar a entrega.
📞 Mantenha seu telefone disponível para confirmarmos os detalhes.

Obrigado por escolher a SuperLoja! 💙`,
          supabase
        );
        
        await sendFacebookMessage(
          senderId,
          `✅ Confirmação enviada para o cliente ${customerId}`,
          supabase
        );
        break;

      case 'CANCELAR':
        await sendFacebookMessage(
          customerId,
          `❌ Infelizmente não conseguimos processar seu pedido no momento.

🔄 Por favor, entre em contato novamente ou visite nosso site: https://superloja.vip

Pedimos desculpas pelo inconveniente. 🙏`,
          supabase
        );
        
        await sendFacebookMessage(
          senderId,
          `❌ Cancelamento enviado para o cliente ${customerId}`,
          supabase
        );
        break;

      case 'CONTATO':
        await sendFacebookMessage(
          customerId,
          `📞 Dados para contato direto:

👤 Atendimento: Carlos
📱 WhatsApp: +244 939 729 902
📧 Email: carlos@superloja.vip
🌐 Site: https://superloja.vip

🕒 Horário de atendimento:
Segunda a Sexta: 8h às 18h
Sábado: 8h às 14h

Entre em contato quando for melhor para você! 😊`,
          supabase
        );
        
        await sendFacebookMessage(
          senderId,
          `📞 Dados de contato enviados para ${customerId}`,
          supabase
        );
        break;
    }

    return true;
  } catch (error) {
    console.error('❌ Erro ao processar comando administrativo:', error);
    await sendFacebookMessage(
      senderId,
      `❌ Erro ao executar comando. Tente novamente.`,
      supabase
    );
    return true;
  }
}

