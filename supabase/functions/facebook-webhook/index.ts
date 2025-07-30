import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

// Declarar EdgeRuntime para background tasks
declare const EdgeRuntime: {
  waitUntil(promise: Promise<any>): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
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
        return new Response('Webhook Facebook está online! ✅', { 
          status: 200,
          headers: { 'Content-Type': 'text/plain', ...corsHeaders }
        });
      }
      
      const VERIFY_TOKEN = 'minha_superloja_webhook_token_2024';
      
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        return new Response(challenge, { 
          status: 200,
          headers: { 'Content-Type': 'text/plain', ...corsHeaders }
        });
      } else {
        return new Response('Forbidden', { 
          status: 403,
          headers: corsHeaders
        });
      }
    }

    // Handle incoming messages (POST request)
    if (req.method === 'POST') {
      const body = await req.text();
      let data;
      
      try {
        data = JSON.parse(body);
      } catch (parseError) {
        return new Response('OK', { 
          status: 200,
          headers: corsHeaders
        });
      }
      
      if (data.entry && data.entry.length > 0) {
        for (const entry of data.entry) {
          if (entry.messaging && entry.messaging.length > 0) {
            for (const messaging of entry.messaging) {
              if (messaging.message && messaging.message.text) {
                await handleMessage(messaging, supabase);
              }
            }
          }
        }
      }
      
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
    const aiResponse = await callOpenAIDirectly(messageText, senderId, supabase);
    
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

async function callOpenAIDirectly(message: string, senderId: string, supabase: any): Promise<string> {
  try {
    // Analisar sentimento da mensagem
    const sentimentResult = await supabase.rpc('analyze_sentiment', { message_text: message });
    const sentiment = sentimentResult.data || { score: 0.5, label: 'neutral' };
    
    // Detectar intenção do usuário
    const detectedIntent = await detectUserIntent(message, sentiment);
    
    // Buscar ou criar preferências do usuário
    const userPrefs = await getUserPreferences(senderId, supabase);
    
    // Buscar produtos em stock com personalização
    const { data: products } = await supabase
      .from('products')
      .select('id, name, slug, price, description, image_url')
      .eq('active', true)
      .eq('in_stock', true)
      .limit(20);
    
    // Filtrar produtos baseado nas preferências do usuário
    const personalizedProducts = personalizeProductSelection(products || [], userPrefs, detectedIntent);
    
    // Buscar histórico da conversa
    const { data: history } = await supabase
      .from('ai_conversations')
      .select('message, type')
      .eq('user_id', senderId)
      .eq('platform', 'facebook')
      .order('timestamp', { ascending: false })
      .limit(6);
    
    // Salvar intenção detectada
    await supabase.from('detected_intentions').insert({
      user_id: senderId,
      platform: 'facebook',
      message: message,
      detected_intent: detectedIntent.intent,
      confidence_score: detectedIntent.confidence,
      entities: detectedIntent.entities,
      sentiment_score: sentiment.score,
      sentiment_label: sentiment.label
    });
    
    // Verificar se é uma mensagem de compra/confirmação
    const lowerMessage = message.toLowerCase();
    if (detectedIntent.intent === 'purchase_confirmation' || 
        lowerMessage.includes('nome:') || 
        lowerMessage.includes('contacto:') || 
        lowerMessage.includes('endereço:') || 
        lowerMessage.includes('kilamba') ||
        lowerMessage.includes('confirmar') ||
        lowerMessage.includes('dados:')) {
      // Usar background task para não bloquear resposta
      EdgeRuntime.waitUntil(notifyAdmin(senderId, message, personalizedProducts, supabase));
    }
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      return getFallbackResponse(message, personalizedProducts || [], userPrefs, sentiment);
    }

    // Construir lista de produtos personalizada
    let productsInfo = '';
    if (personalizedProducts && personalizedProducts.length > 0) {
      productsInfo = '\n\nPRODUTOS RECOMENDADOS PARA VOCÊ:\n';
      personalizedProducts.forEach((product, index) => {
        const price = parseFloat(product.price).toLocaleString('pt-AO');
        productsInfo += `${index + 1}. ${product.name} - ${price} Kz\n`;
        productsInfo += `   Link: https://superloja.vip/produto/${product.slug}\n`;
        if (product.image_url) {
          productsInfo += `   Imagem: ${product.image_url}\n`;
        }
        if (product.description) {
          productsInfo += `   Descrição: ${product.description.substring(0, 100)}...\n`;
        }
      });
    }

    const systemPrompt = `Você é um vendedor angolano inteligente da SuperLoja (https://superloja.vip).

PERSONALIDADE: ${userPrefs.communication_style || 'amigável'}, direto, conhece bem os produtos, fala como um angolano real.

ANÁLISE DO CLIENTE:
- Sentimento atual: ${sentiment.label} (${(sentiment.score * 100).toFixed(1)}%)
- Intenção detectada: ${detectedIntent.intent}
- Estilo preferido: ${userPrefs.communication_style || 'amigável'}
- Categorias de interesse: ${userPrefs.preferred_categories?.join(', ') || 'geral'}

${productsInfo}

CONVERSA ANTERIOR:
${(history || []).reverse().map(h => `${h.type === 'received' ? 'Cliente' : 'Você'}: ${h.message}`).join('\n')}

INSTRUÇÕES INTELIGENTES:
- Adapte sua resposta ao sentimento do cliente (${sentiment.label})
- Se detectou intenção de compra, seja mais persuasivo e forneça detalhes
- Se detectou dúvida, seja mais explicativo
- Use SEMPRE este formato para produtos:

FORMATO OBRIGATÓRIO PARA PRODUTOS:
Olá! Com base no seu interesse, temos estas opções perfeitas:

1. *[NOME DO PRODUTO]* - [PREÇO] Kz
   🔗 [Ver produto](https://superloja.vip/produto/[SLUG])
   📸 ![Imagem]([URL_DA_IMAGEM])

REGRAS CRÍTICAS:
- Use * para texto em negrito (*produto*)
- Use exatamente ![Imagem](URL) para imagens
- Use [Ver produto](URL) para links
- Numere sempre os produtos (1., 2., 3...)
- Use preços EXATOS da lista acima
- SÓ mencione produtos da lista disponível
- Máximo 5 produtos por resposta
- Personalize baseado no perfil do cliente`;

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
        max_tokens: 1000,
        temperature: 0.6,
      }),
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      const aiResponse = data.choices[0].message.content.trim();
      
      // Atualizar preferências do usuário baseado na interação
      await updateUserPreferences(senderId, message, detectedIntent, sentiment, supabase);
      
      // Salvar feedback para auto-melhoria
      await supabase.from('ai_response_feedback').insert({
        user_id: senderId,
        platform: 'facebook',
        original_message: message,
        ai_response: aiResponse,
        effectiveness_score: calculateEffectivenessScore(detectedIntent, sentiment)
      });
      
      return aiResponse;
    } else {
      throw new Error('Resposta inválida da OpenAI');
    }

  } catch (error) {
    console.error('Erro OpenAI:', error);
    return getFallbackResponse(message, personalizedProducts || [], userPrefs, sentiment);
  }
}

// Função para detectar intenção do usuário
function detectUserIntent(message: string, sentiment: any): any {
  const lowerMessage = message.toLowerCase();
  
  // Detectar confirmação de compra baseado em padrões mais específicos
  if (lowerMessage.includes('comprei') || lowerMessage.includes('comprado') || lowerMessage.includes('pagou') || 
      lowerMessage.includes('paguei') || lowerMessage.includes('finalizei') || lowerMessage.includes('pedido feito') ||
      lowerMessage.includes('nome:') || lowerMessage.includes('contacto:') || lowerMessage.includes('endereço:') ||
      lowerMessage.includes('kilamba') || lowerMessage.includes('dados:') || lowerMessage.includes('confirmar')) {
    return {
      intent: 'purchase_confirmation',
      confidence: 0.9,
      entities: { 
        action: 'purchase_made',
        has_contact_info: lowerMessage.includes('contacto:') || lowerMessage.includes('939729902'),
        has_address: lowerMessage.includes('endereço:') || lowerMessage.includes('kilamba'),
        has_name: lowerMessage.includes('nome:') || lowerMessage.includes('carlos')
      }
    };
  }
  
  // Intenções de produto
  if (lowerMessage.includes('quero') || lowerMessage.includes('preciso') || lowerMessage.includes('gostaria')) {
    return {
      intent: 'product_interest',
      confidence: 0.8,
      entities: { action: 'seeking_product' }
    };
  }
  
  // Intenções de dúvida
  if (lowerMessage.includes('como') || lowerMessage.includes('onde') || lowerMessage.includes('quando') || 
      lowerMessage.includes('?')) {
    return {
      intent: 'question',
      confidence: 0.7,
      entities: { action: 'seeking_information' }
    };
  }
  
  return {
    intent: 'general_conversation',
    confidence: 0.5,
    entities: {}
  };
}

// Função para buscar preferências do usuário
async function getUserPreferences(userId: string, supabase: any): Promise<any> {
  const { data } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', 'facebook')
    .single();
    
  return data || {
    communication_style: 'friendly',
    preferred_categories: [],
    purchase_intent: 0.5
  };
}

// Função para personalizar seleção de produtos
function personalizeProductSelection(products: any[], userPrefs: any, intent: any): any[] {
  if (!products.length) return products;
  
  // Se o usuário tem categorias preferidas, priorizar esses produtos
  if (userPrefs.preferred_categories && userPrefs.preferred_categories.length > 0) {
    const preferred = products.filter(p => 
      userPrefs.preferred_categories.some((cat: string) => 
        p.name.toLowerCase().includes(cat.toLowerCase())
      )
    );
    const others = products.filter(p => 
      !userPrefs.preferred_categories.some((cat: string) => 
        p.name.toLowerCase().includes(cat.toLowerCase())
      )
    );
    return [...preferred, ...others].slice(0, 8);
  }
  
  return products.slice(0, 8);
}

// Função para atualizar preferências do usuário
async function updateUserPreferences(userId: string, message: string, intent: any, sentiment: any, supabase: any) {
  const { data: existing } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', 'facebook')
    .single();
    
  const preferences = existing || {};
  
  // Atualizar histórico de interação
  if (!preferences.interaction_history) preferences.interaction_history = {};
  preferences.interaction_history[new Date().toISOString()] = {
    message_length: message.length,
    intent: intent.intent,
    sentiment: sentiment.label
  };
  
  // Atualizar perfil de sentimento
  if (!preferences.sentiment_profile) preferences.sentiment_profile = {};
  preferences.sentiment_profile.last_sentiment = sentiment.label;
  preferences.sentiment_profile.average_score = sentiment.score;
  
  if (existing) {
    await supabase
      .from('user_preferences')
      .update({
        preferences,
        interaction_history: preferences.interaction_history,
        sentiment_profile: preferences.sentiment_profile,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('platform', 'facebook');
  } else {
    await supabase
      .from('user_preferences')
      .insert({
        user_id: userId,
        platform: 'facebook',
        preferences,
        interaction_history: preferences.interaction_history,
        sentiment_profile: preferences.sentiment_profile
      });
  }
}

// Função para calcular score de efetividade
function calculateEffectivenessScore(intent: any, sentiment: any): number {
  let baseScore = 0.5;
  
  if (sentiment.label === 'positive') baseScore += 0.3;
  if (sentiment.label === 'negative') baseScore -= 0.2;
  
  if (intent.confidence > 0.8) baseScore += 0.2;
  
  return Math.max(0, Math.min(1, baseScore));
}

// Função para notificar admin sobre compras
async function notifyAdmin(userId: string, message: string, products: any[], supabase: any) {
  console.log(`🔔 INICIANDO NOTIFICAÇÃO ADMIN - Usuario: ${userId}, Mensagem: "${message}"`);
  
  try {
    // Extrair dados do cliente da mensagem
    const customerData = extractCustomerData(message);
    
    // Salvar notificação no banco
    const { data: notificationData, error: notificationError } = await supabase.from('admin_notifications').insert({
      admin_user_id: 'carlosfox2',
      notification_type: 'purchase_confirmation',
      message: `🛒 COMPRA CONFIRMADA!\n\nUsuário Facebook: ${userId}\nMensagem: "${message}"\n\nDados do Cliente:\n${customerData.summary}\n\nProdutos visualizados:\n${products.slice(0, 3).map(p => `- ${p.name} (${p.price} Kz)`).join('\n')}`,
      metadata: {
        user_id: userId,
        original_message: message,
        customer_data: customerData,
        products_count: products.length,
        timestamp: new Date().toISOString()
      }
    });
    
    if (notificationError) {
      console.error('❌ Erro ao salvar notificação no banco:', notificationError);
    } else {
      console.log('✅ Notificação salva no banco:', notificationData);
    }
    
    // Buscar configurações de admin
    const { data: adminSettings, error: adminError } = await supabase
      .from('ai_settings')
      .select('key, value')
      .in('key', ['admin_facebook_id', 'facebook_page_token']);
      
    console.log('📋 Configurações admin encontradas:', adminSettings);
    
    if (adminError) {
      console.error('❌ Erro ao buscar configurações:', adminError);
      return;
    }
    
    const adminId = adminSettings?.find(s => s.key === 'admin_facebook_id')?.value || 'carlosfox2';
    const pageToken = adminSettings?.find(s => s.key === 'facebook_page_token')?.value;
    
    console.log(`📱 Tentando enviar para admin ID: ${adminId}`);
    console.log(`🔑 Token disponível: ${pageToken ? 'SIM' : 'NÃO'}`);
    
    // Tentar enviar notificação diretamente para carlosfox2
    await sendAdminFacebookNotification(adminId, userId, message, products, customerData, supabase);
    
  } catch (error) {
    console.error('❌ Erro geral na notificação admin:', error);
  }
}

// Função para extrair dados do cliente da mensagem
function extractCustomerData(message: string): any {
  const data = {
    name: '',
    phone: '',
    address: '',
    summary: ''
  };
  
  // Extrair nome
  const nameMatch = message.match(/nome[:\s]+([^\n\r,]+)/i);
  if (nameMatch) data.name = nameMatch[1].trim();
  
  // Extrair telefone/contacto
  const phoneMatch = message.match(/contacto[:\s]+([0-9\s\+\-\(\)]+)/i) || message.match(/([0-9]{9,})/);
  if (phoneMatch) data.phone = phoneMatch[1].trim();
  
  // Extrair endereço
  const addressMatch = message.match(/endereço[:\s]+([^\n\r,]+)/i) || message.match(/(kilamba[^,\n\r]*)/i);
  if (addressMatch) data.address = addressMatch[1].trim();
  
  // Criar resumo
  const parts = [];
  if (data.name) parts.push(`👤 Nome: ${data.name}`);
  if (data.phone) parts.push(`📞 Contacto: ${data.phone}`);
  if (data.address) parts.push(`📍 Endereço: ${data.address}`);
  
  data.summary = parts.length > 0 ? parts.join('\n') : '❗ Dados do cliente não identificados na mensagem';
  
  return data;
}

// Função específica para enviar notificação ao admin
async function sendAdminFacebookNotification(adminId: string, customerId: string, customerMessage: string, products: any[], customerData: any, supabase: any) {
  console.log(`📤 ENVIANDO NOTIFICAÇÃO ADMIN - Admin: ${adminId}, Cliente: ${customerId}`);
  
  try {
    const { data: pageTokenData } = await supabase
      .from('ai_settings')
      .select('value')
      .eq('key', 'facebook_page_token')
      .single();

    const pageAccessToken = pageTokenData?.value || Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    
    if (!pageAccessToken) {
      console.error('❌ Facebook Page Access Token não encontrado');
      console.log('🔍 Tokens disponíveis:', {
        db_token: pageTokenData?.value ? 'SIM' : 'NÃO',
        env_token: Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN') ? 'SIM' : 'NÃO'
      });
      return;
    }

    console.log('✅ Token encontrado, preparando mensagem...');

    const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${pageAccessToken}`;
    
    // Mensagem detalhada para admin
    const notificationMessage = `🚨 NOVA COMPRA CONFIRMADA! 🚨

👤 Cliente Facebook: ${customerId}
💬 Mensagem completa: "${customerMessage}"

📋 DADOS EXTRAÍDOS:
${customerData.summary}

📦 PRODUTOS DE INTERESSE:
${products.slice(0, 5).map((p: any) => `• ${p.name} - ${p.price} Kz\n  🔗 https://superloja.vip/produto/${p.slug}`).join('\n\n')}

🕐 Recebido em: ${new Date().toLocaleString('pt-AO')}

⚡ AÇÃO NECESSÁRIA: Entre em contacto com o cliente para finalizar a venda!`;
    
    console.log('📝 Mensagem preparada para admin');
    console.log('🎯 Enviando para ID:', adminId);
    console.log('🌐 URL da API:', url.substring(0, 50) + '...');
    
    const payload = {
      recipient: { id: adminId },
      message: { text: notificationMessage },
      messaging_type: 'MESSAGE_TAG',
      tag: 'BUSINESS_PRODUCTIVITY'
    };

    console.log('📦 Payload preparado:', JSON.stringify(payload, null, 2).substring(0, 200) + '...');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('📡 Resposta da API Facebook:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro detalhado da API Facebook:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        adminId: adminId,
        url: url.substring(0, 50) + '...'
      });
      
      // Tentar com messaging_type diferente
      console.log('🔄 Tentando com messaging_type RESPONSE...');
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
      
      console.log('📡 Resposta fallback:', fallbackResponse.status, fallbackResponse.statusText);
      
      if (!fallbackResponse.ok) {
        const fallbackError = await fallbackResponse.text();
        console.error('❌ Erro fallback também falhou:', fallbackError);
      } else {
        console.log('✅ Mensagem enviada via fallback!');
      }
    } else {
      const responseData = await response.json();
      console.log('✅ Notificação enviada com sucesso para admin!', responseData);
    }

  } catch (error) {
    console.error('❌ Erro ao enviar notificação para admin:', error);
    console.log('🔍 Detalhes do erro:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 300)
    });
  }
}

function getFallbackResponse(message: string, products: any[], userPrefs: any = {}, sentiment: any = {}): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('fone') || lowerMessage.includes('auricular')) {
    // Buscar fones na lista de produtos
    const headphones = products.filter(p => 
      p.name.toLowerCase().includes('fone') || 
      p.name.toLowerCase().includes('auricular')
    );
    
    if (headphones.length > 0) {
      let response = "Olá! Tudo bem? 😊 Temos os seguintes fones de ouvido em stock:\n\n";
      headphones.forEach((product, index) => {
        const price = parseFloat(product.price).toLocaleString('pt-AO');
        response += `${index + 1}. *${product.name}* - ${price} Kz\n`;
        response += `   🔗 [Ver produto](https://superloja.vip/produto/${product.slug})\n`;
        if (product.image_url) {
          response += `   📸 ![Imagem](${product.image_url})\n`;
        }
        response += "\n";
      });
      response += "Se algum deles te interessar, avise-me! 😊";
      return response;
    }
    return `Meu irmão, ainda não temos fones bluetooth completos em stock na SuperLoja neste momento. Sei que bluetooth é mesmo prático para quem não quer ficar agarrado a fios, mas infelizmente só estamos com acessórios para fones agora.

Mas olha, se já tens fones ou pretendes conectar fones em vários aparelhos (telemóvel, computador, rádio do carro), temos adaptadores que podem facilitar tua vida enquanto aguardas os novos fones chegarem. Dá só uma olhada nestas opções:

1. *Adaptor de Áudio para Fones de Ouvido* - 5 500 Kz  
   🔗 [Ver produto](https://superloja.vip/produto/adaptor-de-udio-para-fones-de-ouvido)  
   

2. *2 em 1 Cabo Adaptador* - 5 500 Kz  
   🔗 [Ver produto](https://superloja.vip/produto/2-em-1-cabo-adaptador)  
   

3. *Adaptador de cabo (carregador)* - 5 500 Kz  
   🔗 [Ver produto](https://superloja.vip/produto/adaptador-de-cabo-carregador)  
   

Se quiseres, posso guardar teu contacto para te avisar assim que chegarem fones bluetooth novos. Que tal, irmão? Posso te ajudar com algum destes acessórios enquanto isso?`;
  }
  
  if (lowerMessage.includes('smartphone') || lowerMessage.includes('telefone')) {
    return `Smartphones com ótimos preços! Confira: https://superloja.vip 📱`;
  }
  
  if (lowerMessage.includes('preço') || lowerMessage.includes('custo')) {
    return `Nossos preços são os melhores de Angola! Ver catálogo: https://superloja.vip 💰`;
  }
  
  return `Olá! Bem-vindo à SuperLoja! 😊 Temos produtos incríveis com entrega grátis. O que procura? https://superloja.vip`;
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

    // Usar API v21 do Facebook
    const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${pageAccessToken}`;
    
    // Verificar se a mensagem contém imagens para enviar como attachments
    const imageRegex = /📸 !\[Imagem\]\(([^)]+)\)/g;
    const images = [];
    let match;
    
    while ((match = imageRegex.exec(messageText)) !== null) {
      images.push(match[1]);
    }
    
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
    for (const imageUrl of images) {
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
        console.error('❌ Erro ao enviar imagem Facebook:', imageResponse.status, errorText);
      } else {
        console.log('✅ Imagem enviada para Facebook');
      }
      
      // Pequena pausa entre envios para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

  } catch (error) {
    console.error('❌ Erro geral ao enviar mensagem:', error);
  }
}