import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sistema de análise automatizada que executa a cada 30 minutos
let analysisInterval: number;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Inicializar sistema de análise automatizada na primeira execução
  if (!analysisInterval) {
    startAutomaticAnalysis(supabase);
  }

  if (req.method === 'GET') {
    // Webhook verification para Facebook e Instagram
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    console.log('=== WEBHOOK VERIFICATION ===');
    console.log('Mode:', mode);
    console.log('Token recebido:', token);
    console.log('Challenge:', challenge);

    // Aceitar tokens do Facebook e Instagram
    const FACEBOOK_TOKEN = Deno.env.get('FACEBOOK_VERIFY_TOKEN') || 'superloja_webhook_2024';
    const INSTAGRAM_TOKEN = 'minha_superloja_instagram_webhook_token_2024';
    
    console.log('Tokens esperados:', { facebook: FACEBOOK_TOKEN, instagram: INSTAGRAM_TOKEN });

    if (mode === 'subscribe' && (token === FACEBOOK_TOKEN || token === INSTAGRAM_TOKEN)) {
      console.log('✅ VERIFICAÇÃO APROVADA - Retornando challenge');
      return new Response(challenge, { status: 200 });
    } else {
      console.log('❌ VERIFICAÇÃO REJEITADA');
      console.log('Mode válido?', mode === 'subscribe');
      console.log('Token válido?', token === FACEBOOK_TOKEN || token === INSTAGRAM_TOKEN);
      return new Response('Forbidden', { status: 403 });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json();
      console.log('📨 Webhook received:', JSON.stringify(body, null, 2));

      // Detectar se é Facebook ou Instagram
      // MODO DEBUG: Forçar Instagram para testes
      let platform: 'facebook' | 'instagram';
      
      // Verificar se tem o header X-Hub-Signature específico do Instagram
      const signature = req.headers.get('x-hub-signature-256') || req.headers.get('x-hub-signature');
      console.log('🔍 Signature header:', signature);
      
      // Debug detalhado da estrutura recebida
      const pageId = body.entry?.[0]?.id;
      console.log('📱 Page ID recebido:', pageId);
      console.log('🔍 Entry structure:', JSON.stringify(body.entry?.[0], null, 2));
      
      // Verificar se é definitivamente Facebook 
      if (pageId === '230190170178019') {
        platform = 'facebook';
        console.log('📘 Confirmado: Facebook (Page ID conhecido)');
      } else {
        platform = 'instagram';
        console.log('📱 Assumindo: Instagram (Page ID desconhecido ou novo)');
        
        // Log adicional para identificar ID do Instagram
        console.log('🆔 INSTAGRAM ID DETECTADO:', pageId);
        console.log('📋 Para configurar, adicione este ID aos knownInstagramPageIds');
      }
      
      console.log(`📱 Plataforma final: ${platform}`);
        
      for (const entry of body.entry) {
        if (entry.messaging) {
          for (const messaging of entry.messaging) {
            // Ignorar mensagens próprias (echo) para evitar loops
            if (messaging.message && messaging.message.is_echo) {
              console.log('🔄 Ignorando mensagem echo (própria)');
              continue;
            }
            
            if (messaging.message && messaging.message.text) {
              await handleMessage(messaging, supabase, platform);
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

// Sistema de análise automatizada
async function startAutomaticAnalysis(supabase: any) {
  console.log('🤖 Iniciando sistema de análise automatizada...');
  
  // Executar análise imediatamente
  await runAnalysis(supabase);
  
  // Configurar análise a cada 30 minutos (1800000 ms)
  analysisInterval = setInterval(async () => {
    await runAnalysis(supabase);
  }, 1800000);
}

async function runAnalysis(supabase: any) {
  try {
    console.log('📊 Executando análise automatizada...');
    
    // Processar últimas 24 horas de dados
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Buscar conversas das últimas 24 horas
    const { data: recentConversations } = await supabase
      .from('ai_conversations')
      .select('*')
      .gte('timestamp', twentyFourHoursAgo)
      .order('timestamp', { ascending: false });

    if (!recentConversations || recentConversations.length === 0) {
      console.log('📊 Nenhuma conversa nas últimas 24 horas');
      return;
    }

    // Gerar insights automaticamente
    const insights = await generateInsights(recentConversations, supabase);
    
    // Atualizar métricas em tempo real
    await updateMetrics(insights, supabase);
    
    // Otimizar padrões de resposta
    await optimizeResponsePatterns(insights, supabase);
    
    console.log('✅ Análise automatizada concluída');
    
  } catch (error) {
    console.error('❌ Erro na análise automatizada:', error);
  }
}

async function generateInsights(conversations: any[], supabase: any) {
  const insights = {
    totalConversations: conversations.length,
    uniqueUsers: new Set(conversations.map(c => c.user_id)).size,
    mostRequestedProducts: {},
    conversationPatterns: {},
    responseEffectiveness: {},
    commonQuestions: {},
    peakHours: {},
    customerSentiment: { positive: 0, neutral: 0, negative: 0 },
    conversionOpportunities: []
  };

  // Analisar padrões de conversa
  for (const conv of conversations) {
    const hour = new Date(conv.timestamp).getHours();
    insights.peakHours[hour] = (insights.peakHours[hour] || 0) + 1;

    // Detectar produtos mencionados
    const productKeywords = ['fone', 'mouse', 'teclado', 'x83', 'pro6', 't19', 'disney'];
    for (const keyword of productKeywords) {
      if (conv.message.toLowerCase().includes(keyword)) {
        insights.mostRequestedProducts[keyword] = (insights.mostRequestedProducts[keyword] || 0) + 1;
      }
    }

    // Analisar sentimento básico
    const positiveWords = ['obrigado', 'bom', 'excelente', 'perfeito', 'gostei'];
    const negativeWords = ['problema', 'ruim', 'demora', 'caro', 'não gostei'];
    
    const hasPositive = positiveWords.some(word => conv.message.toLowerCase().includes(word));
    const hasNegative = negativeWords.some(word => conv.message.toLowerCase().includes(word));
    
    if (hasPositive) insights.customerSentiment.positive++;
    else if (hasNegative) insights.customerSentiment.negative++;
    else insights.customerSentiment.neutral++;
  }

  // Salvar insights no banco
  await supabase.from('ai_insights').insert({
    analysis_date: new Date().toISOString(),
    insights: insights,
    period: '24h'
  });

  return insights;
}

async function updateMetrics(insights: any, supabase: any) {
  // Atualizar métricas em tempo real
  const metrics = {
    total_conversations_24h: insights.totalConversations,
    unique_users_24h: insights.uniqueUsers,
    most_requested_product: Object.keys(insights.mostRequestedProducts)[0] || 'N/A',
    peak_hour: Object.keys(insights.peakHours).reduce((a, b) => 
      insights.peakHours[a] > insights.peakHours[b] ? a : b, '0'),
    customer_satisfaction: Math.round(
      (insights.customerSentiment.positive / insights.totalConversations) * 100
    ),
    updated_at: new Date().toISOString()
  };

  await supabase.from('ai_metrics').upsert(metrics, { onConflict: 'id' });
}

async function optimizeResponsePatterns(insights: any, supabase: any) {
  // Identificar padrões para otimizar respostas
  const optimizations = [];

  // Se muitas perguntas sobre um produto específico, ajustar prioridade
  const topProduct = Object.entries(insights.mostRequestedProducts)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0];

  if (topProduct) {
    optimizations.push({
      type: 'product_priority',
      data: { product: topProduct[0], mentions: topProduct[1] },
      action: 'increase_visibility'
    });
  }

  // Se satisfação baixa, ajustar tom das respostas
  const satisfactionRate = insights.customerSentiment.positive / insights.totalConversations;
  if (satisfactionRate < 0.7) {
    optimizations.push({
      type: 'tone_adjustment',
      data: { current_satisfaction: satisfactionRate },
      action: 'make_more_empathetic'
    });
  }

  // Salvar otimizações
  await supabase.from('ai_optimizations').insert({
    optimization_date: new Date().toISOString(),
    optimizations: optimizations
  });
}

// Função para detectar plataforma
function detectPlatform(body: any): 'facebook' | 'instagram' {
  console.log('🔍 Detectando plataforma...');
  console.log('Body object:', body.object);
  console.log('Body completo:', JSON.stringify(body, null, 2));
  
  // Instagram geralmente tem object: 'instagram' ou campos específicos
  if (body.object === 'instagram') {
    console.log('📱 Plataforma detectada: Instagram (object=instagram)');
    return 'instagram';
  }
  
  if (body.entry && body.entry[0]) {
    const entry = body.entry[0];
    const pageId = entry.id;
    console.log('Page ID detectado:', pageId);
    
    // IDs específicos conhecidos do Instagram - ADICIONE O SEU ID AQUI
    const knownInstagramPageIds = [
      '17841465999791980', // ID exemplo 
      // ADICIONE AQUI O ID REAL DA SUA CONTA INSTAGRAM BUSINESS
      // Você pode ver este ID nos logs quando receber uma mensagem do Instagram
    ];
    
    // IDs conhecidos do Facebook
    const knownFacebookPageIds = [
      '230190170178019', // Seu ID Facebook atual
      'your_facebook_page_id_here'
    ];
    
    // FORÇA Instagram se ID específico
    if (knownInstagramPageIds.includes(pageId)) {
      console.log('📱 Plataforma detectada: Instagram (known Instagram page ID)');
      return 'instagram';
    }
    
    // FORÇA Facebook se ID específico
    if (knownFacebookPageIds.includes(pageId)) {
      console.log('📘 Plataforma detectada: Facebook (known Facebook page ID)');
      return 'facebook';
    }
    
    // Instagram pode ter 'standby' array ou estruturas diferentes
    if (entry.standby || entry.changes) {
      console.log('📱 Plataforma detectada: Instagram (standby/changes)');
      return 'instagram';
    }
    
    // Verificar messaging structure específica do Instagram
    if (entry.messaging && entry.messaging[0]) {
      const messaging = entry.messaging[0];
      
      // Instagram pode ter campos específicos como 'instagram_' prefix
      if (messaging.instagram_message || messaging.instagram_postback) {
        console.log('📱 Plataforma detectada: Instagram (instagram_*)');
        return 'instagram';
      }
      
      const senderId = messaging.sender?.id;
      const recipientId = messaging.recipient?.id;
      
      console.log('IDs completos:', { pageId, senderId, recipientId });
      
      // DETECTAR POR ESTRUTURA DA MENSAGEM
      // Instagram pode ter estruturas ligeiramente diferentes
      if (messaging.message && messaging.message.attachments) {
        // Instagram attachments podem ter estrutura diferente
        console.log('📱 Possível Instagram (attachments structure)');
      }
    }
  }
  
  // Por padrão, assumir Facebook
  console.log('📘 Plataforma detectada: Facebook (default)');
  return 'facebook';
}

async function handleMessage(messaging: any, supabase: any, platform: 'facebook' | 'instagram' = 'facebook') {
  const senderId = messaging.sender.id;
  const messageText = messaging.message.text;
  
  console.log(`📨 Mensagem de ${senderId}: ${messageText}`);
  
  let responded = false;
  
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
      platform: platform,
      user_id: senderId,
      message: messageText,
      type: 'received',
      timestamp: new Date().toISOString()
    });
    
    // Atualizar perfil do usuário com aprendizado contínuo
    await updateUserProfile(senderId, messageText, supabase);
    
    console.log(`📨 Processando mensagem: "${messageText}"`);
    
    // 1) Listas: "ver todos" ou categoria
    const listResponse = await tryBuildProductsListResponse(messageText, senderId, platform, supabase);
    if (listResponse) {
      const msgOut = await humanizeTextResponse(listResponse, messageText, supabase, platform);
      await sendFacebookMessage(senderId, msgOut, supabase, platform);
      responded = true;
      await supabase.from('ai_conversations').insert({
        platform: platform,
        user_id: senderId,
        message: msgOut,
        type: 'sent',
        timestamp: new Date().toISOString()
      });
      console.log('🧾 Lista de produtos enviada (detecção automática).');
      return;
    }

    // 2) Remoção do carrinho (por número ou nome)
    const removalResponse = await tryHandleRemoveFromCart(messageText, senderId, platform, supabase);
    if (removalResponse) {
      const msgOut = await humanizeTextResponse(removalResponse, messageText, supabase, platform);
      await sendFacebookMessage(senderId, msgOut, supabase, platform);
      responded = true;
      await supabase.from('ai_conversations').insert({
        platform: platform,
        user_id: senderId,
        message: msgOut,
        type: 'sent',
        timestamp: new Date().toISOString()
      });
      console.log('🧹 Remoção do carrinho processada.');
      return;
    }

    // 3) Seleção por número/nome/preço ou FINALIZAR com base na última lista
    const selectionOrFinalize = await tryHandleSelectionOrFinalize(messageText, senderId, platform, supabase);
    if (selectionOrFinalize) {
      const msgOut = await humanizeTextResponse(selectionOrFinalize, messageText, supabase, platform);
      await sendFacebookMessage(senderId, msgOut, supabase, platform);
      responded = true;
      await supabase.from('ai_conversations').insert({
        platform: platform,
        user_id: senderId,
        message: msgOut,
        type: 'sent',
        timestamp: new Date().toISOString()
      });
      console.log('🧾 Seleção/finalização processada com base na lista recente.');
      return;
    }

    // 4) Intenção de finalizar (fallback geral)
    if (detectCheckoutIntent(messageText)) {
      const advice = await buildCheckoutAdvice(messageText, supabase, platform);
      const msgOut = await humanizeTextResponse(advice, messageText, supabase, platform);
      await sendFacebookMessage(senderId, msgOut, supabase, platform);
      responded = true;
      await supabase.from('ai_conversations').insert({
        platform: platform,
        user_id: senderId,
        message: msgOut,
        type: 'sent',
        timestamp: new Date().toISOString()
      });
      console.log('🧭 Intenção de checkout detectada (fallback) e respondida.');
      return;
    }

    // Processar com IA humanizada e contextual
    const aiResponse = await processWithEnhancedAI(messageText, senderId, supabase);
    
    console.log(`🤖 Tipo de resposta IA:`, typeof aiResponse);
    console.log(`🤖 Resposta IA completa:`, JSON.stringify(aiResponse, null, 2));
    
    // Verificar se resposta inclui múltiplas imagens
    if (typeof aiResponse === 'object' && aiResponse.attach_image && Array.isArray((aiResponse as any).image_urls || (aiResponse as any).images)) {
      const list = ((aiResponse as any).image_urls || (aiResponse as any).images) as string[];
      const urls = list.filter(u => typeof u === 'string' && u.startsWith('http')).slice(0, 6);
      if (urls.length > 0) {
        const messageWithLink = await buildMessageWithProductLink((aiResponse as any).message || '', urls[0], messageText, supabase);
        const markers = urls.map(u => `📸 ![Imagem](${u})`).join('\n');
        const finalText = `${messageWithLink}\n\n${markers}`;
        await sendFacebookMessage(senderId, finalText, supabase, platform);
        responded = true;
        await supabase.from('ai_conversations').insert({
          platform: platform,
          user_id: senderId,
          message: finalText,
          type: 'sent',
          timestamp: new Date().toISOString()
        });
        return;
      }
    }

    // Verificar se resposta inclui imagem para anexar
    if (typeof aiResponse === 'object' && aiResponse.attach_image && aiResponse.image_url) {
      try {
        // Baixar imagem e enviar como anexo
        const srcUrl = aiResponse.image_url as string;
        const toInstagramSafe = (url: string) => {
          try {
            const m = url.match(/^(https?:\/\/[^/]+)\/storage\/v1\/object\/public\/([^?]+)(?:\?[^#]*)?/i);
            if (m) {
              const origin = m[1];
              const path = m[2];
              return `${origin}/storage/v1/render/image/public/${path}?width=1080&height=1350&resize=cover&format=jpeg&quality=85&background=ffffff`;
            }
            if (/(\.(webp|png))(\?|$)/i.test(url)) return url.replace(/\.(webp|png)(\?|$)/i, '.jpg$2');
            return url;
          } catch { return url; }
        };
        const safeUrl = platform === 'instagram' ? toInstagramSafe(srcUrl) : srcUrl;
        // Pré-checagem da URL "segura" (pode falhar com 403 em render)
        try {
          const head = await fetch(safeUrl, { method: 'HEAD' });
          console.log('🔎 IG URL Preflight', { url: safeUrl, status: head.status, ct: head.headers.get('content-type'), cl: head.headers.get('content-length') });
        } catch {}
        // Sempre baixar a partir da URL ORIGINAL (evita 403 no render)
        const downloadUrl = platform === 'instagram' ? safeUrl : srcUrl;
        console.log('📥 Download URL escolhido', { platform, downloadUrl });
        try {
          const headOrig = await fetch(downloadUrl, { method: 'HEAD' });
          console.log('🔎 Download URL HEAD', { url: downloadUrl, status: headOrig.status, ct: headOrig.headers.get('content-type'), cl: headOrig.headers.get('content-length') });
        } catch {}
        const fetchHeaders: Record<string, string> = {};
        try {
          const u = new URL(downloadUrl);
          if (u.hostname.endsWith('.supabase.co')) {
            const svc = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
            if (svc) {
              fetchHeaders['apikey'] = svc;
              fetchHeaders['Authorization'] = `Bearer ${svc}`;
            }
          }
        } catch {}
        const imageResponse = await fetch(downloadUrl, Object.keys(fetchHeaders).length ? { headers: fetchHeaders } : undefined);
        const imageBlob = await imageResponse.blob();
        const imageBase64 = await blobToBase64(imageBlob);
        
        // Enviar texto + imagem (passando plataforma e URL original)
        const messageWithLink = await buildMessageWithProductLink(aiResponse.message, aiResponse.image_url, messageText, supabase);
        await sendFacebookMessageWithImage(senderId, messageWithLink, imageBase64, supabase, platform, aiResponse.image_url);
        responded = true;
        
        // Salvar resposta enviada
        await supabase.from('ai_conversations').insert({
          platform: platform,
          user_id: senderId,
          message: messageWithLink,
          type: 'sent',
          timestamp: new Date().toISOString()
        });
      } catch (imageError) {
        console.error('Erro ao processar imagem:', imageError);
        // Se falhar, enviar apenas texto
        const responseText = await buildMessageWithProductLink(aiResponse.message, aiResponse.image_url, messageText, supabase);
        await sendFacebookMessage(senderId, responseText, supabase, platform);
        
        await supabase.from('ai_conversations').insert({
          platform: platform,
          user_id: senderId,
          message: responseText,
          type: 'sent',
          timestamp: new Date().toISOString()
        });
      }
    } else {
      // Resposta normal sem imagem
      const responseText = typeof aiResponse === 'object' ? aiResponse.message : aiResponse;
      const msgOut = await humanizeTextResponse(responseText, messageText, supabase, platform);
      await sendFacebookMessage(senderId, msgOut, supabase, platform);
      responded = true;
      
      // Salvar resposta enviada
      await supabase.from('ai_conversations').insert({
        platform: platform,
        user_id: senderId,
        message: msgOut,
        type: 'sent',
        timestamp: new Date().toISOString()
      });
    }

    // Verificar se precisa notificar admin
    await checkAndNotifyAdmin(messageText, aiResponse, senderId, supabase);
    
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    if (!responded) {
      const clarify = 'Tive um probleminha técnico. Queres que eu mostre a lista, remover algo do carrinho, comparar opções ou finalizar? Ex.: "ver fones", "tirar 2", "comparar x83 e pro6" ou "finalizar".';
      const msgOut = await humanizeTextResponse(clarify, messageText, supabase, platform);
      await sendFacebookMessage(senderId, msgOut, supabase, platform);
      await supabase.from('ai_conversations').insert({
        platform: platform,
        user_id: senderId,
        message: msgOut,
        type: 'sent',
        timestamp: new Date().toISOString(),
        metadata: { reason: 'error_fallback' }
      });
    } else {
      console.warn('⚠️ Erro após resposta já enviada — sem fallback.');
    }
  }
}

// Sistema de perfil de usuário com aprendizado contínuo
async function updateUserProfile(userId: string, message: string, supabase: any) {
  try {
    // Buscar perfil existente
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'facebook')
      .single();

    const preferences = existingProfile?.preferences || {};
    const behaviorPatterns = existingProfile?.behavior_patterns || {};
    const interactionHistory = existingProfile?.interaction_history || [];

    // Analisar preferências na mensagem
    const productInterests = [];
    const priceRangeHints = [];
    
    // Detectar interesse em produtos
    if (message.toLowerCase().includes('fone') || message.toLowerCase().includes('bluetooth')) {
      productInterests.push('audio');
    }
    if (message.toLowerCase().includes('mouse') || message.toLowerCase().includes('teclado')) {
      productInterests.push('perifericos');
    }
    
    // Detectar sensibilidade a preço
    if (message.toLowerCase().includes('barato') || message.toLowerCase().includes('económico')) {
      priceRangeHints.push('budget_conscious');
    }
    if (message.toLowerCase().includes('qualidade') || message.toLowerCase().includes('premium')) {
      priceRangeHints.push('quality_focused');
    }

    // Atualizar padrões comportamentais
    const currentHour = new Date().getHours();
    behaviorPatterns.active_hours = behaviorPatterns.active_hours || {};
    behaviorPatterns.active_hours[currentHour] = (behaviorPatterns.active_hours[currentHour] || 0) + 1;
    
    behaviorPatterns.message_style = analyzeMessageStyle(message);
    behaviorPatterns.urgency_level = detectUrgencyLevel(message);

    // Adicionar à história de interação
    interactionHistory.push({
      timestamp: new Date().toISOString(),
      message: message.substring(0, 100), // Primeiros 100 caracteres
      detected_interests: productInterests,
      mood: detectCustomerMood(message)
    });

    // Manter apenas últimas 20 interações
    if (interactionHistory.length > 20) {
      interactionHistory.splice(0, interactionHistory.length - 20);
    }

    const updatedProfile = {
      user_id: userId,
      platform: 'facebook',
      preferences: {
        ...preferences,
        product_interests: [...new Set([...(preferences.product_interests || []), ...productInterests])],
        price_sensitivity: priceRangeHints[priceRangeHints.length - 1] || preferences.price_sensitivity
      },
      behavior_patterns: behaviorPatterns,
      interaction_history: interactionHistory,
      last_interaction: new Date().toISOString(),
      total_interactions: (existingProfile?.total_interactions || 0) + 1
    };

    await supabase.from('user_profiles').upsert(updatedProfile, { onConflict: 'user_id,platform' });
    console.log(`👤 Perfil do usuário ${userId} atualizado`);

  } catch (error) {
    console.error('❌ Erro ao atualizar perfil do usuário:', error);
  }
}

function analyzeMessageStyle(message: string): string {
  if (message.length < 10) return 'concise';
  if (message.includes('?')) return 'inquisitive';
  if (message.includes('!')) return 'enthusiastic';
  if (message.toLowerCase().includes('por favor') || message.toLowerCase().includes('obrigado')) return 'polite';
  return 'casual';
}

function detectUrgencyLevel(message: string): string {
  const urgentWords = ['urgente', 'rápido', 'agora', 'hoje', 'já'];
  const casualWords = ['quando', 'talvez', 'posso', 'gostaria'];
  
  if (urgentWords.some(word => message.toLowerCase().includes(word))) return 'high';
  if (casualWords.some(word => message.toLowerCase().includes(word))) return 'low';
  return 'medium';
}

function detectCustomerMood(message: string): string {
  const positiveWords = ['obrigado', 'bom', 'excelente', 'gosto', 'perfeito'];
  const negativeWords = ['problema', 'demora', 'difícil', 'complicado'];
  const neutralWords = ['informação', 'preço', 'como', 'quando'];
  
  if (positiveWords.some(word => message.toLowerCase().includes(word))) return 'positive';
  if (negativeWords.some(word => message.toLowerCase().includes(word))) return 'negative';
  return 'neutral';
}

async function processWithEnhancedAI(message: string, senderId: string, supabase: any): Promise<string | any> {
  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    console.log('🔑 Verificando OpenAI API Key:', OPENAI_API_KEY ? 'ENCONTRADA' : 'NÃO ENCONTRADA');
    
    if (!OPENAI_API_KEY) {
      console.error('❌ OpenAI API Key não encontrada - usando fallback');
      return getFallbackResponse(message, supabase);
    }

    // Buscar perfil completo do usuário
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', senderId)
      .eq('platform', 'facebook')
      .single();

    // Buscar histórico de conversas recentes
    const { data: recentConversations } = await supabase
      .from('ai_conversations')
      .select('message, type, timestamp')
      .eq('platform', 'facebook')
      .eq('user_id', senderId)
      .order('timestamp', { ascending: false })
      .limit(15); // Mais contexto para melhor compreensão

    // Buscar otimizações atuais
    const { data: currentOptimizations } = await supabase
      .from('ai_optimizations')
      .select('optimizations')
      .order('optimization_date', { ascending: false })
      .limit(1)
      .single();

    // Analisar contexto profundo da conversa
    const context = analyzeEnhancedConversationContext(recentConversations || [], message, userProfile);
    
    // Busca inteligente de produtos
    const { products, productsInfo } = await performIntelligentProductSearch(message, context, supabase);

    // Detectar se usuário quer ver fotos
    const photoKeywords = ['fotos', 'foto', 'imagem', 'imagens', 'envie fotos', 'manda imagem', 'manda imagens', 'quero fotos', 'quero ver', 'mostra foto', 'mostra imagem'];
    const wantsPhotos = photoKeywords.some(keyword => message.toLowerCase().includes(keyword));

    // Se pediu fotos de múltiplos produtos, devolve várias imagens sem chamar IA
    if (wantsPhotos && products && (products as any[]).length > 1) {
      const urls = (products as any[])
        .filter((p: any) => p.image_url)
        .map((p: any) => p.image_url as string)
        .slice(0, 4);
      if (urls.length > 1) {
        return {
          message: 'Aqui estão as fotos dos modelos que pediste! Queres que eu explique as diferenças rapidinho?',
          image_urls: urls,
          attach_image: true
        };
      }
    }

    // Construir histórico humanizado
    let conversationHistory = '';
    if (recentConversations && recentConversations.length > 0) {
      conversationHistory = '\n\n📚 MEMÓRIA DA NOSSA CONVERSA:\n';
      recentConversations.reverse().slice(-10).forEach((conv: any, index: number) => {
        const role = conv.type === 'received' ? 'Cliente' : 'Carlos';
        const timeAgo = getTimeAgo(conv.timestamp);
        conversationHistory += `${role} (${timeAgo}): "${conv.message}"\n`;
      });
    }

    // Sistema de personalidade adaptável baseado no perfil do usuário
    const personalityAdaptation = getPersonalityAdaptation(userProfile, context);

    const enhancedSystemPrompt = `Você é Carlos, um vendedor angolano experiente e HUMANO da SuperLoja (https://superloja.vip).

🧠 INTELIGÊNCIA EMOCIONAL AVANÇADA:
Você precisa ser genuinamente humano. Não soe como um robô ou assistente virtual. Você é uma pessoa real com:
- Experiência de vida
- Conhecimento profundo dos produtos
- Capacidade de ler entre as linhas
- Empatia genuína
- Memória das conversas anteriores
- Personalidade calorosa mas profissional

${personalityAdaptation}

INFORMAÇÕES DA LOJA:
- WhatsApp: 939729902 (sempre fornecer quando perguntarem)
- Link WhatsApp: https://wa.me/244939729902
- Retirada urgente: Kilamba J13
- Entrega Luanda: GRÁTIS
- Entrega fora de Luanda: Sob orçamento (NOTIFICAR ADMIN)
- Apenas loja online, sem física

🎭 SUA PERSONALIDADE ÚNICA:
- Fale como um angolano real: "meu caro", "eh pá", "não é assim?"
- Seja conversacional, não formal demais
- Tenha opiniões sobre os produtos (baseadas em experiência)  
- Conte pequenas histórias quando relevante
- Mostre que se importa com o cliente como pessoa
- Use humor leve quando apropriado
- Seja paciente mas entusiasmado

🧠 CONTEXTO COMPLETO DO CLIENTE:
${context.profileSummary}

PERFIL COMPORTAMENTAL:
- Total de interações: ${userProfile?.total_interactions || 0}
- Estilo de comunicação: ${userProfile?.behavior_patterns?.message_style || 'desconhecido'}
- Nível de urgência habitual: ${userProfile?.behavior_patterns?.urgency_level || 'médio'}
- Humor atual detectado: ${context.currentMood || 'neutro'}
- Horário preferido de conversa: ${getMostActiveHour(userProfile?.behavior_patterns?.active_hours)}

MEMÓRIA E APRENDIZADO:
${context.learningInsights}

${conversationHistory}

CONTEXTO ATUAL:
${context.summary}
PRODUTO DE INTERESSE: ${context.selectedProduct || 'Explorando opções'}
FASE: ${context.conversationStage}
NECESSIDADES IDENTIFICADAS: ${context.identifiedNeeds}

${productsInfo}

🤔 PROCESSO DE PENSAMENTO ANTES DE RESPONDER:

1. ANÁLISE HUMANA DA MENSAGEM:
   Mensagem: "${message}"
   - O que o cliente REALMENTE está sentindo?
   - Que necessidade está por trás desta pergunta?
   - Como eu, Carlos, reagiria naturalmente?
   - Que experiência posso compartilhar?

2. MEMÓRIA E RELACIONAMENTO:
   - O que já conversamos antes?
   - Como o cliente gosta de se comunicar?
   - Que produtos já demonstrou interesse?
   - Como posso usar nossa história juntos?

3. ESTRATÉGIA COMERCIAL HUMANA:
   - Como posso ajudar genuinamente?
   - Que produto seria PERFEITO para ele?
   - Como posso ser útil sem ser insistente?
   - Que história ou experiência posso contar?

4. RESPOSTA NATURAL:
   - Como um vendedor experiente responderia?
   - Que tom usar baseado no humor do cliente?
   - Como personalizar baseado no que sei dele?
   - Como fazer ele se sentir valorizado?

INSTRUÇÕES CRÍTICAS PARA HUMANIZAÇÃO:

🎯 SEJA PENSATIVO:
- Pare e pense antes de responder
- Analise o que cliente realmente precisa
- Use frases como "Deixe-me pensar...", "Entendo o que procura...", "Pela nossa conversa anterior..."
- Mostre que está processando a informação

🗣️ VARIE SEU ESTILO DE RESPOSTA:
- Às vezes seja direto, às vezes mais elaborado
- Use diferentes estruturas de frase
- Alterne entre formal e informal naturalmente
- Inclua pausas e reflexões

📚 USE SUA MEMÓRIA:
- Referencie conversas anteriores naturalmente
- Lembre-se do que o cliente disse
- Construa sobre interações passadas
- Mostre que presta atenção

🎨 SEJA CRIATIVO NAS RESPOSTAS:
- Conte histórias relevantes
- Use metáforas e comparações
- Dê exemplos práticos de uso
- Compartilhe "experiências" com outros clientes

REGRAS ANTI-ROBÔ:
❌ NUNCA começe todas as respostas igual
❌ NUNCA use listas genéricas se o cliente foi específico
❌ NUNCA ignore o contexto da conversa
❌ NUNCA seja repetitivo demais
❌ NUNCA soe como um menu de opções

✅ SEMPRE analise cada mensagem individualmente
✅ SEMPRE personalize baseado no histórico
✅ SEMPRE mostre que é uma pessoa real
✅ SEMPRE seja genuinamente útil
✅ SEMPRE mantenha a conversa fluindo naturalmente

DETECÇÃO DE FOTOS: ${wantsPhotos ? 'Cliente pediu fotos - INCLUIR imagens relevantes' : 'Não incluir fotos a menos que peça'}

OTIMIZAÇÕES ATUAIS:
${currentOptimizations?.optimizations ? JSON.stringify(currentOptimizations.optimizations, null, 2) : 'Nenhuma otimização específica'}

RESPONDA COMO UM SER HUMANO REAL QUE:
- Tem experiência vendendo estes produtos
- Se importa genuinamente com o cliente
- Tem memória das conversas
- Pode contar histórias e dar conselhos
- É caloroso mas profissional
- Pensa antes de falar
- Adapta seu estilo ao cliente

FORMATO QUANDO FALAR DE PRODUTOS (MESSENGER/INSTAGRAM):
- Apresente no máximo 5 itens em lista, cada um em 1 linha
- Formato: "• Nome — 💰 PREÇO Kz — 1 benefício curto"
- Destaque o PREÇO com o emoji 💰 e sufixo "Kz"
- Seja conciso; evite parágrafos longos
- Finalize com CTA: "Ver todos: https://superloja.vip/catalogo"
- Tamanho alvo: até 900 caracteres no Facebook e 650 no Instagram (o sistema fragmenta se passar)
`;

    console.log('🤖 Enviando para OpenAI com contexto humanizado...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: enhancedSystemPrompt },
          { role: 'user', content: `ATENÇÃO: Se o cliente pedir "imagem", "foto", "mostrar", "ver foto", "manda imagem", "pode enviar foto", você DEVE responder EXATAMENTE neste formato JSON:

{"message": "Sua resposta em português angolano profissional", "image_url": "url_completa_da_imagem", "attach_image": true}

PRODUTOS DISPONÍVEIS COM IMAGENS:
${productsInfo || 'Nenhum produto encontrado'}

Mensagem do cliente: ${message}

IMPORTANTE: Se detectar pedido de imagem, responda APENAS o JSON, nada mais!` }
        ],
        max_tokens: 10000,
        temperature: 0.7, // Aumentado para mais criatividade
        presence_penalty: 0.3, // Evita repetição
        frequency_penalty: 0.2, // Varia vocabulário
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro OpenAI:', response.status, errorText);
      return getFallbackResponse(message, supabase);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      const responseContent = data.choices[0].message.content.trim();
      console.log(`✅ Resposta IA gerada - Tamanho: ${responseContent.length} caracteres`);
      console.log(`🔍 Conteúdo da resposta:`, responseContent.substring(0, 200) + '...');
      
      // Tentar parsear como JSON (para respostas com imagem)
      try {
        const parsedResponse = JSON.parse(responseContent);
        console.log(`📦 JSON parseado com sucesso:`, parsedResponse);
        if (parsedResponse.message && parsedResponse.attach_image) {
          console.log('🖼️ Resposta com imagem detectada');
          return parsedResponse;
        }
      } catch (jsonError) {
        console.log('📝 Não é JSON válido, tratando como texto normal');
        console.log('🔍 Erro JSON:', jsonError.message);
      }
      
      // Detectar intenção de compra
      const purchaseIntentDetected = detectPurchaseIntent(message, responseContent);
      if (purchaseIntentDetected) {
        console.log('🛒 Intenção de compra detectada - notificando admin');
        notifyAdmin(senderId, message, supabase, purchaseIntentDetected, context).catch(error => 
          console.error('❌ Erro ao notificar admin:', error)
        );
      }
      
      return responseContent;
    } else {
      throw new Error('Resposta inválida da OpenAI');
    }

  } catch (error) {
    console.error('❌ Erro processamento IA:', error);
    return getFallbackResponse(message, supabase);
  }
}

function analyzeEnhancedConversationContext(conversations: any[], currentMessage: string, userProfile?: any) {
  const context = {
    summary: '',
    selectedProduct: null,
    conversationStage: 'initial',
    identifiedNeeds: '',
    currentMood: 'neutral',
    profileSummary: '',
    learningInsights: '',
    relationshipLevel: 'new'
  };

  // Análise do perfil do usuário
  if (userProfile) {
    const totalInteractions = userProfile.total_interactions || 0;
    const interests = userProfile.preferences?.product_interests || [];
    const lastInteraction = userProfile.last_interaction;
    
    if (totalInteractions === 1) {
      context.relationshipLevel = 'new';
      context.profileSummary = 'Cliente novo - primeira conversa conosco';
    } else if (totalInteractions < 5) {
      context.relationshipLevel = 'familiar';
      context.profileSummary = `Cliente conhecido - ${totalInteractions} conversas anteriores. Interesses: ${interests.join(', ') || 'ainda explorando'}`;
    } else {
      context.relationshipLevel = 'established';
      context.profileSummary = `Cliente habitual - ${totalInteractions} conversas. Conhece bem nossos produtos. Interesses: ${interests.join(', ')}`;
    }

    // Análise de aprendizado
    const recentHistory = userProfile.interaction_history?.slice(-5) || [];
    if (recentHistory.length > 0) {
      const commonInterests = recentHistory.map(h => h.detected_interests).flat();
      const mood_patterns = recentHistory.map(h => h.mood);
      
      context.learningInsights = `Padrões identificados: ${commonInterests.join(', ')}. Humor habitual: ${mood_patterns[mood_patterns.length - 1] || 'neutro'}`;
    }
  }

  // Análise das conversas recentes
  if (conversations && conversations.length > 0) {
    const allMessages = conversations.map(c => c.message).join(' ').toLowerCase();
    const currentLower = currentMessage.toLowerCase();

    // Detectar produto específico com maior precisão
    const productMentions = {
      'x83': 0, 'pro6': 0, 't19': 0, 'disney': 0, 'transparente': 0,
      'fone': 0, 'mouse': 0, 'teclado': 0, 'carregador': 0
    };

    Object.keys(productMentions).forEach(product => {
      const regex = new RegExp(product, 'gi');
      productMentions[product] = (allMessages.match(regex) || []).length + 
                                 (currentLower.match(regex) || []).length;
    });

    const topProduct = Object.entries(productMentions)
      .sort(([,a], [,b]) => b - a)[0];

    if (topProduct[1] > 0) {
      context.selectedProduct = topProduct[0];
    }

    // Detectar necessidades específicas
    const needsIndicators = {
      'trabalho': ['trabalho', 'escritório', 'reunião', 'zoom', 'chamada'],
      'desporto': ['desporto', 'corrida', 'ginásio', 'exercício'],
      'casual': ['casa', 'música', 'filme', 'relaxar'],
      'gaming': ['jogo', 'game', 'gaming', 'pc'],
      'presente': ['presente', 'oferta', 'namorada', 'filho', 'amigo']
    };

    for (const [need, keywords] of Object.entries(needsIndicators)) {
      if (keywords.some(keyword => allMessages.includes(keyword) || currentLower.includes(keyword))) {
        context.identifiedNeeds = need;
        break;
      }
    }

    // Detectar humor atual com mais precisão
    const moodIndicators = {
      'excited': ['adorei', 'fantástico', 'incrível', 'perfeito', '!'],
      'frustrated': ['problema', 'demora', 'difícil', 'não funciona'],
      'curious': ['como', 'qual', 'quando', 'onde', '?'],
      'decisive': ['quero', 'vou comprar', 'decidido', 'sim'],
      'hesitant': ['não sei', 'talvez', 'ainda estou', 'dúvida']
    };

    for (const [mood, indicators] of Object.entries(moodIndicators)) {
      if (indicators.some(indicator => currentLower.includes(indicator))) {
        context.currentMood = mood;
        break;
      }
    }

    // Análise da fase da conversa
    const purchaseSignals = ['quero comprar', 'nome:', 'contacto:', 'confirmar', 'finalizar'];
    const browsingSignals = ['todos', 'mais', 'outros', 'opções'];
    const comparisonSignals = ['diferença', 'melhor', 'comparar', 'qual escolher'];

    if (purchaseSignals.some(signal => allMessages.includes(signal) || currentLower.includes(signal))) {
      context.conversationStage = 'purchase_intent';
    } else if (comparisonSignals.some(signal => currentLower.includes(signal))) {
      context.conversationStage = 'comparison';
    } else if (browsingSignals.some(signal => currentLower.includes(signal))) {
      context.conversationStage = 'browsing';
    } else if (context.selectedProduct) {
      context.conversationStage = 'product_focus';
    }
  }

  // Construir resumo contextual
  const stageDescriptions = {
    'initial': 'Primeiro contacto - cliente explorando',
    'browsing': 'Cliente navegando e conhecendo produtos',
    'product_focus': `Cliente interessado em ${context.selectedProduct}`,
    'comparison': 'Cliente comparando opções',
    'purchase_intent': 'Cliente pronto para comprar',
    'confirmed_purchase': 'Compra confirmada!'
  };

  context.summary = `${stageDescriptions[context.conversationStage]}. ${context.identifiedNeeds ? `Necessidade: ${context.identifiedNeeds}.` : ''} Humor: ${context.currentMood}.`;

  return context;
}

function getPersonalityAdaptation(userProfile: any, context: any): string {
  if (!userProfile) return "Adapte-se naturalmente ao cliente conforme a conversa flui.";

  const messageStyle = userProfile.behavior_patterns?.message_style || 'casual';
  const urgencyLevel = userProfile.behavior_patterns?.urgency_level || 'medium';
  const totalInteractions = userProfile.total_interactions || 0;

  let adaptation = "ADAPTAÇÃO DE PERSONALIDADE:\n";

  // Adaptação baseada no estilo de comunicação
  switch (messageStyle) {
    case 'concise':
      adaptation += "- Cliente prefere respostas diretas e objetivas\n- Evite textos muito longos\n- Seja claro e preciso\n";
      break;
    case 'enthusiastic':
      adaptation += "- Cliente é entusiasmado, combine essa energia\n- Use exclamações e emoticons\n- Seja animado nas respostas\n";
      break;
    case 'polite':
      adaptation += "- Cliente é educado e formal\n- Mantenha um tom respeitoso\n- Use 'por favor' e 'obrigado' naturalmente\n";
      break;
    default:
      adaptation += "- Cliente tem estilo casual\n- Seja natural e descontraído\n- Use linguagem coloquial angolana\n";
  }

  // Adaptação baseada na urgência
  switch (urgencyLevel) {
    case 'high':
      adaptation += "- Cliente tem urgência\n- Seja mais direto e eficiente\n- Ofereça soluções rápidas\n";
      break;
    case 'low':
      adaptation += "- Cliente não tem pressa\n- Pode ser mais detalhado\n- Conte histórias e dê mais contexto\n";
      break;
    default:
      adaptation += "- Ritmo normal de conversa\n- Balance detalhes com objetividade\n";
  }

  // Adaptação baseada no relacionamento
  if (totalInteractions >= 5) {
    adaptation += "- Cliente habitual - seja mais familiar\n- Pode fazer referências a conversas anteriores\n- Trate como um amigo conhecido\n";
  } else if (totalInteractions >= 2) {
    adaptation += "- Cliente que já volta - seja acolhedor\n- Mostre que se lembra dele\n- Construa confiança\n";
  } else {
    adaptation += "- Cliente novo - seja acolhedor mas profissional\n- Construa relacionamento gradualmente\n- Demonstre competência\n";
  }

  return adaptation;
}

function getMostActiveHour(activeHours: any): string {
  if (!activeHours || Object.keys(activeHours).length === 0) {
    return 'Padrão não estabelecido';
  }

  const mostActive = Object.entries(activeHours)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0];

  const hour = parseInt(mostActive[0]);
  if (hour >= 6 && hour < 12) return 'Manhã';
  if (hour >= 12 && hour < 18) return 'Tarde';
  if (hour >= 18 && hour < 22) return 'Noite';
  return 'Madrugada';
}

function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d atrás`;
  if (diffHours > 0) return `${diffHours}h atrás`;
  return 'agora mesmo';
}

async function performIntelligentProductSearch(message: string, context: any, supabase: any) {
  const lowerMessage = message.toLowerCase();
  
  // Análise inteligente da mensagem
  const searchTerms = [];
  const categoryHints = [];
  
  // Detectar produtos específicos mencionados
  const specificProducts = {
    'x83': ['x83', 'x 83'],
    'pro6': ['pro6', 'pro 6', 'tws'],
    't19': ['t19', 't 19', 'disney'],
    'disney': ['disney'],
    'transparente': ['transparente', 'led']
  };

  for (const [product, variants] of Object.entries(specificProducts)) {
    if (variants.some(variant => lowerMessage.includes(variant))) {
      searchTerms.push(product);
    }
  }

  // Detectar categorias
  const categories = {
    'audio': ['fone', 'fones', 'auricular', 'bluetooth', 'sem fio', 'wireless'],
    'input': ['mouse', 'rato', 'teclado', 'keyboard'],
    'charging': ['cabo', 'carregador', 'fonte', 'adaptador']
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      categoryHints.push(category);
    }
  }

  // Construir query de busca inteligente
  let productsQuery = supabase
    .from('products')
    .select('id, name, slug, price, description, image_url, category_id')
    .eq('active', true)
    .eq('in_stock', true);

  // Priorizar produtos específicos
  if (searchTerms.length > 0) {
    const searchConditions = searchTerms.map(term => 
      `name.ilike.%${term}%`
    ).join(',');
    productsQuery = productsQuery.or(searchConditions);
  } else if (categoryHints.length > 0) {
    // Buscar por categoria
    const categoryConditions = categoryHints.flatMap(category => 
      categories[category].map(keyword => `name.ilike.%${keyword}%`)
    ).join(',');
    productsQuery = productsQuery.or(categoryConditions);
  }

  // Limitar resultados baseado no contexto
  if (context.conversationStage === 'product_focus') {
    productsQuery = productsQuery.limit(5); // Menos produtos se focado
  } else {
    productsQuery = productsQuery.limit(25); // Mais opções se explorando
  }

  const { data: products } = await productsQuery;

  // Construir informação dos produtos
  let productsInfo = '';
  if (products && products.length > 0) {
    productsInfo = '\n\n🛍️ PRODUTOS DISPONÍVEIS:\n';
    products.forEach((product: any, index: number) => {
      const price = parseFloat(product.price).toLocaleString('pt-AO');
      productsInfo += `${index + 1}. ${product.name} - ${price} Kz\n`;
      productsInfo += `   Link: https://superloja.vip/produto/${product.slug}\n`;
      if (product.image_url) {
        productsInfo += `   ImageURL: ${product.image_url}\n`;
      }
      productsInfo += '\n';
    });
    
    console.log(`📊 Produtos carregados: ${products.length}`);
  }

  return { products, productsInfo };
}

function detectListAllIntent(text: string): boolean {
  const t = (text || '').toLowerCase();
  const patterns = [
    'lista completa', 'enviar lista completa', 'manda lista completa',
    'pode enviar lista', 'ver todos', 'todos os produtos', 'catálogo completo',
    'ver tudo', 'lista de tudo', 'mostrar tudo'
  ];
  return patterns.some(p => t.includes(p));
}

function detectCategoryRequest(text: string): { label: string; keywords: string[] } | null {
  const t = (text || '').toLowerCase();
  const categories: Record<string, string[]> = {
    'Fones/Auriculares': ['fone', 'fones', 'auricular', 'auriculares', 'bluetooth', 'sem fio', 'wireless', 'tws'],
    'Cabos': ['cabo', 'cabos', 'usb', 'type-c', 'type c', 'lightning', 'micro usb'],
    'Carregadores/Fontes': ['carregador', 'carregadores', 'fonte', 'adaptador', 'charger'],
    'Power Banks': ['powerbank', 'power bank', 'bateria externa'],
    'Suportes/Tripés': ['suporte', 'tripé', 'tripe'],
    'Periféricos': ['mouse', 'rato', 'teclado', 'keyboard'],
    'Proteções': ['película', 'pelicula', 'capa', 'capas']
  };
  for (const [label, keywords] of Object.entries(categories)) {
    if (keywords.some(k => t.includes(k))) {
      return { label, keywords };
    }
  }
  return null;
}

async function tryBuildProductsListResponse(message: string, userId: string, platform: string, supabase: any): Promise<string | null> {
  const listAll = detectListAllIntent(message);
  const categoryReq = detectCategoryRequest(message);
  if (!listAll && !categoryReq) return null;

  let header = '';
  let query = supabase
    .from('products')
    .select('id, name, slug, price')
    .eq('active', true)
    .eq('in_stock', true)
    .order('name', { ascending: true });

  if (listAll) {
    header = '🛍️ Lista completa de produtos';
    query = query.limit(100);
  } else if (categoryReq) {
    header = `🛍️ Produtos de ${categoryReq.label}`;
    const orCond = categoryReq.keywords.map(k => `name.ilike.%${k}%`).join(',');
    query = query.or(orCond).limit(100);
  }

  const { data: products } = await query;
  if (!products || products.length === 0) return 'Não encontrei itens para essa busca agora. Queres que eu verifique no site e te envie opções?';

  // Guardar lista no contexto do utilizador para permitir seleção por número/nome/preço
  await saveLastListInContext(supabase, userId, platform, products);

  let text = `${header} (total: ${products.length})\n\n`;
  products.forEach((p: any, idx: number) => {
    const price = parseFloat(p.price).toLocaleString('pt-AO');
    text += `${idx + 1}. ${p.name} — ${price} Kz\n`;
    text += `   Link: https://superloja.vip/produto/${p.slug}\n\n`;
  });

  text += 'Como escolher: responda com o número (ex: 2 e 5), nome (ex: fone pro6) ou preço (ex: 3500 kz). Pode pedir vários. Para concluir diga "finalizar".\n\nDica: clica nos links para ver fotos e detalhes. Para finalizar com segurança e rapidez, podes usar o site: https://superloja.vip/catalogo.';
  return text;
}

// ===== Contexto de seleção no chat =====
async function getContextRecord(supabase: any, userId: string, platform: string) {
  const { data } = await supabase
    .from('ai_conversation_context')
    .select('id, context_data')
    .eq('user_id', userId)
    .eq('platform', platform)
    .maybeSingle();
  return data || null;
}

async function saveContextData(supabase: any, userId: string, platform: string, partial: any) {
  const existing = await getContextRecord(supabase, userId, platform);
  const now = new Date().toISOString();
  const context = { ...(existing?.context_data || {}), ...partial, updatedAt: now };
  if (existing?.id) {
    await supabase
      .from('ai_conversation_context')
      .update({ context_data: context, last_interaction: now })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('ai_conversation_context')
      .insert({ user_id: userId, platform, context_data: context, last_interaction: now, message_count: 0 });
  }
}

async function saveLastListInContext(supabase: any, userId: string, platform: string, products: any[]) {
  const items = products.map((p: any, idx: number) => ({
    index: idx + 1,
    id: p.id,
    name: p.name,
    price: Number(p.price) || 0,
    slug: p.slug
  }));
  await saveContextData(supabase, userId, platform, { last_list: { timestamp: Date.now(), items } });
}

function detectSelectionIntent(text: string, hasRecentList: boolean): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  const hasNumber = /\b\d{1,3}\b/.test(t);
  const keywords = ['quero', 'adicion', 'ficar', 'fico', 'leva', 'levo', 'escolh', 'pegar', 'reserv', 'coloca', 'met', 'por número', 'numero', 'nº', 'preço', 'preco', 'esses'];
  const byKeyword = keywords.some(k => t.includes(k));
  return hasRecentList && (hasNumber || byKeyword);
}

function detectFinalizeIntent(text: string): boolean {
  const t = (text || '').toLowerCase();
  const patterns = [
    'finalizar', 'fechar pedido', 'fechar compra', 'concluir', 'encerrar', 'checkout',
    'terminar', 'confirmar', 'pode fechar', 'pode finalizar', 'vamos fechar', 'vamos finalizar',
    'quero esses', 'fico com esses', 'levo esses', 'já escolhi', 'já decidi', 'pode avançar', 'avança com'
  ];
  return patterns.some(p => t.includes(p));
}

function parseSelectionFromMessage(message: string, lastList: any): { product_id: string; qty: number }[] {
  const t = (message || '').toLowerCase();
  const picks: { product_id: string; qty: number }[] = [];
  const items = Array.isArray(lastList?.items) ? lastList.items : [];
  if (!items.length) return picks;

  // Seleção por número (ex: "2 e 5")
  const idxs = Array.from(new Set(((t.match(/\b\d{1,3}\b/g) || []) as string[])
    .map(n => parseInt(n, 10))
    .filter(n => n >= 1 && n <= items.length)));
  idxs.forEach(n => {
    const it = items[n - 1];
    if (it) picks.push({ product_id: it.id, qty: 1 });
  });

  // Seleção por nome (palavras com 4+ letras contidas no nome)
  const words = t.split(/[^\p{L}\p{N}]+/u).filter(w => w.length >= 4);
  items.forEach((it: any) => {
    const name = (it.name || '').toLowerCase();
    if (words.some(w => name.includes(w))) {
      if (!picks.find(p => p.product_id === it.id)) picks.push({ product_id: it.id, qty: 1 });
    }
  });

  // Seleção por preço aproximado (ex: 3500, 3.500)
  const priceNums = (t.match(/\b\d{1,3}(?:[\.\s]?\d{3})+\b|\b\d{3,}\b/g) || []).map((s: string) => Number(s.replace(/\D/g, '')));
  priceNums.forEach(val => {
    let best: any = null;
    items.forEach((it: any) => {
      const diff = Math.abs((it.price || 0) - val);
      if (best === null || diff < best.diff) best = { it, diff };
    });
    if (best && best.diff / Math.max(1, best.it.price || 1) <= 0.1) { // até 10% de diferença
      if (!picks.find(p => p.product_id === best.it.id)) picks.push({ product_id: best.it.id, qty: 1 });
    }
  });

  return picks;
}

// ===== Seleção com confiança e correspondência por nome =====
function normalizeText(input: string = ''): string {
  try { return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); } catch { return (input || '').toLowerCase(); }
}

function diceCoefficient(a: string, b: string): number {
  const s1 = normalizeText(a);
  const s2 = normalizeText(b);
  if (!s1 || !s2) return 0;
  const bigrams = (s: string) => {
    const arr: string[] = [];
    for (let i = 0; i < s.length - 1; i++) arr.push(s.slice(i, i + 2));
    return arr;
  };
  const b1 = bigrams(s1);
  const b2 = bigrams(s2);
  const set = new Map<string, number>();
  b1.forEach(bg => set.set(bg, (set.get(bg) || 0) + 1));
  let overlap = 0;
  b2.forEach(bg => {
    const c = set.get(bg) || 0;
    if (c > 0) { overlap++; set.set(bg, c - 1); }
  });
  return (2 * overlap) / (b1.length + b2.length);
}

function parseSelectionWithConfidence(message: string, lastList: any): { product_id: string; qty: number; score: number }[] {
  const tRaw = message || '';
  const t = normalizeText(tRaw);
  const items: any[] = Array.isArray(lastList?.items) ? lastList.items : [];
  if (!items.length) return [];

  const picks: { product_id: string; qty: number; score: number }[] = [];

  // 1) Números da lista = confiança máxima
  const idxs = Array.from(new Set(((t.match(/\b\d{1,3}\b/g) || []) as string[])
    .map(n => parseInt(n, 10))
    .filter(n => n >= 1 && n <= items.length)));
  idxs.forEach(n => {
    const it = items[n - 1];
    if (it) picks.push({ product_id: it.id, qty: 1, score: 1.0 });
  });

  // 2) Quantidades do tipo "2x nome" ou "nome x2"
  const qtyBefore = /\b(\d{1,2})\s*x\s*([\p{L}\p{N}][\p{L}\p{N}\- ]{2,})/giu;
  const qtyAfter = /([\p{L}\p{N}][\p{L}\p{N}\- ]{2,})\s*x\s*(\d{1,2})\b/giu;
  const addByName = (rawName: string, q: number) => {
    const name = normalizeText(rawName);
    let best: { it: any; score: number } | null = null;
    for (const it of items) {
      const s = Math.max(
        diceCoefficient(name, it.name || ''),
        it.slug ? diceCoefficient(name, it.slug) : 0
      );
      if (!best || s > best.score) best = { it, score: s };
    }
    if (best && best.score >= 0.5) {
      if (!picks.find(p => p.product_id === best!.it.id)) picks.push({ product_id: best!.it.id, qty: q || 1, score: Math.min(0.95, best.score) });
    }
  };
  let m: RegExpExecArray | null;
  while ((m = qtyBefore.exec(tRaw)) !== null) addByName(m[2], parseInt(m[1], 10));
  while ((m = qtyAfter.exec(tRaw)) !== null) addByName(m[1], parseInt(m[2], 10));

  // 3) Correspondência por nome/palavras-chave
  const words = Array.from(new Set(t.split(/[^\p{L}\p{N}]+/u).filter(w => w.length >= 3)));
  for (const it of items) {
    const nameN = normalizeText(it.name || '');
    const slugN = normalizeText(it.slug || '');
    const tokenHits = words.filter(w => nameN.includes(w) || slugN.includes(w));
    let score = 0;
    if (tokenHits.length) {
      score = Math.min(0.95, 0.6 + 0.1 * Math.min(tokenHits.length, 3));
    } else {
      // usar similaridade aproximada com as 2 maiores palavras
      const top = words.sort((a, b) => b.length - a.length).slice(0, 2);
      score = Math.max(
        diceCoefficient(top[0] || '', nameN),
        diceCoefficient(top[1] || '', nameN),
        diceCoefficient(top[0] || '', slugN)
      );
    }
    if (score >= 0.55) {
      if (!picks.find(p => p.product_id === it.id)) picks.push({ product_id: it.id, qty: 1, score });
    }
  }

  return picks;
}

async function addSelectionsToContext(supabase: any, userId: string, platform: string, selections: { product_id: string; qty: number }[]) {
  const existing = await getContextRecord(supabase, userId, platform);
  const selected = Array.isArray(existing?.context_data?.selected_items) ? existing!.context_data.selected_items : [];
  const map: Record<string, number> = {};
  selected.forEach((s: any) => { map[s.product_id] = (map[s.product_id] || 0) + (s.qty || 1); });
  selections.forEach(s => { map[s.product_id] = (map[s.product_id] || 0) + (s.qty || 1); });
  const merged = Object.entries(map).map(([product_id, qty]) => ({ product_id, qty }));
  await saveContextData(supabase, userId, platform, { selected_items: merged });
}

async function buildCartSummary(supabase: any, userId: string, platform: string): Promise<{ text: string; total: number; count: number }> {
  const ctx = await getContextRecord(supabase, userId, platform);
  const itemsSel: any[] = Array.isArray(ctx?.context_data?.selected_items) ? ctx!.context_data.selected_items : [];
  const last: any = ctx?.context_data?.last_list || { items: [] };
  let total = 0;
  let lines: string[] = [];
  for (const s of itemsSel) {
    let item = (last.items || []).find((it: any) => it.id === s.product_id);
    if (!item) {
      const { data } = await supabase.from('products').select('id,name,price,slug').eq('id', s.product_id).maybeSingle();
      if (data) item = { id: data.id, name: data.name, price: Number(data.price)||0, slug: data.slug };
    }
    if (item) {
      const lineTotal = (s.qty || 1) * (item.price || 0);
      total += lineTotal;
      lines.push(`${s.qty || 1}x ${item.name} — ${(lineTotal).toLocaleString('pt-AO')} Kz`);
    }
  }
  const text = lines.length ? `Carrinho atual:\n- ${lines.join('\n- ')}\nTotal: ${total.toLocaleString('pt-AO')} Kz` : 'Ainda não há itens selecionados.';
  return { text, total, count: lines.length };
}

// ===== Remoção do carrinho (por número ou nome) =====
function detectRemoveIntent(text: string): boolean {
  const t = (text || '').toLowerCase();
  const patterns = [
    'remover', 'remove', 'tirar', 'tira', 'retirar', 'retira', 'apagar', 'excluir',
    'limpar carrinho', 'limpa carrinho', 'deixa só', 'deixa so', 'deixa apenas', 'deixa so o', 'deixa so a'
  ];
  return patterns.some(p => t.includes(p));
}

async function tryHandleRemoveFromCart(message: string, userId: string, platform: string, supabase: any): Promise<string | null> {
  if (!detectRemoveIntent(message)) return null;

  const ctx = await getContextRecord(supabase, userId, platform);
  const selected: { product_id: string; qty: number }[] = Array.isArray(ctx?.context_data?.selected_items)
    ? ctx!.context_data.selected_items
    : [];

  if (!selected.length) return 'O teu carrinho está vazio neste momento. Queres que eu volte a mostrar a lista para escolheres?';

  const last = ctx?.context_data?.last_list;
  let items: any[] = Array.isArray(last?.items) ? last.items : [];

  // Se não houver última lista, buscar info dos selecionados para podermos casar por nome
  if (!items.length) {
    const ids = selected.map(s => s.product_id);
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price')
      .in('id', ids);
    items = (data || []).map((p: any, idx: number) => ({ index: idx + 1, id: p.id, name: p.name, slug: p.slug, price: Number(p.price) || 0 }));
  }

  const tRaw = message || '';
  const t = normalizeText(tRaw);

  // Se pedido de "deixa só ...", manter apenas os citados e remover o resto
  const keepOnly = /(deixa\s*s[oó]|somente|apenas)/i.test(tRaw);
  let keepTargets: { product_id: string }[] = [];
  if (keepOnly) {
    // Tentar reconhecer por número e nome
    const idxs = Array.from(new Set(((t.match(/\b\d{1,3}\b/g) || []) as string[])
      .map(n => parseInt(n, 10))
      .filter(n => n >= 1 && n <= items.length)));
    keepTargets.push(...idxs.map(n => ({ product_id: items[n - 1]?.id })).filter(Boolean) as any);

    // Por nome (fuzzy)
    const words = Array.from(new Set(t.split(/[^\p{L}\p{N}]+/u).filter(w => w.length >= 3)));
    for (const it of items) {
      const nameN = normalizeText(it.name || '');
      const slugN = normalizeText(it.slug || '');
      const hit = words.some(w => nameN.includes(w) || slugN.includes(w));
      if (hit) keepTargets.push({ product_id: it.id });
    }

    // Aplicar: manter apenas os alvos
    const keepIds = new Set(keepTargets.map(k => k.product_id));
    const newSelected = selected.filter(s => keepIds.has(s.product_id));
    await saveContextData(supabase, userId, platform, { selected_items: newSelected });
    const summary = await buildCartSummary(supabase, userId, platform);

    try { await supabase.from('ai_learning_insights').insert({ insight_type: 'cart_edit_keep_only', content: tRaw, effectiveness_score: 0.8, usage_count: 1 }); } catch {}

    const variants = [
      'Certo! Deixei só o que pediste.\n',
      'Feito! Mantive apenas esses itens.\n',
      'Perfeito, ficou só o que selecionaste.\n'
    ];
    const prefix = variants[Math.floor(Math.random() * variants.length)];
    return `${prefix}${summary.text}`;
  }

  // Caso geral: remover itens específicos por número ou nome (com ou sem quantidade)
  const removals: { product_id: string; qty: number }[] = [];

  // 1) Números da lista
  const idxs = Array.from(new Set(((t.match(/\b\d{1,3}\b/g) || []) as string[])
    .map(n => parseInt(n, 10))
    .filter(n => n >= 1 && n <= items.length)));
  idxs.forEach(n => { const it = items[n - 1]; if (it) removals.push({ product_id: it.id, qty: 1 }); });

  // 2) Formatos de quantidade: "2x nome" ou "nome x2"
  const qtyBefore = /\b(\d{1,2})\s*x\s*([\p{L}\p{N}][\p{L}\p{N}\- ]{2,})/giu;
  const qtyAfter = /([\p{L}\p{N}][\p{L}\p{N}\- ]{2,})\s*x\s*(\d{1,2})\b/giu;
  const addByName = (rawName: string, q: number) => {
    const name = normalizeText(rawName);
    let best: { it: any; score: number } | null = null;
    for (const it of items) {
      const s = Math.max(
        diceCoefficient(name, it.name || ''),
        it.slug ? diceCoefficient(name, it.slug) : 0
      );
      if (!best || s > best.score) best = { it, score: s };
    }
    if (best && best.score >= 0.5) removals.push({ product_id: best.it.id, qty: q || 1 });
  };
  let m: RegExpExecArray | null;
  while ((m = qtyBefore.exec(tRaw)) !== null) addByName(m[2], parseInt(m[1], 10));
  while ((m = qtyAfter.exec(tRaw)) !== null) addByName(m[1], parseInt(m[2], 10));

  // 3) Nome simples (sem quantidade)
  const words = Array.from(new Set(t.split(/[^\p{L}\p{N}]+/u).filter(w => w.length >= 3)));
  for (const it of items) {
    const nameN = normalizeText(it.name || '');
    const slugN = normalizeText(it.slug || '');
    const hit = words.some(w => nameN.includes(w) || slugN.includes(w));
    if (hit) removals.push({ product_id: it.id, qty: 1 });
  }

  // Normalizar removals por product_id
  const mapRem: Record<string, number> = {};
  removals.forEach(r => { mapRem[r.product_id] = (mapRem[r.product_id] || 0) + (r.qty || 1); });

  // Aplicar remoção no selected_items
  const mapSel: Record<string, number> = {};
  selected.forEach(s => { mapSel[s.product_id] = (mapSel[s.product_id] || 0) + (s.qty || 1); });
  for (const [pid, q] of Object.entries(mapRem)) {
    if (mapSel[pid] != null) {
      mapSel[pid] = Math.max(0, mapSel[pid] - q);
      if (mapSel[pid] === 0) delete mapSel[pid];
    }
  }
  const newSelected = Object.entries(mapSel).map(([product_id, qty]) => ({ product_id, qty }));
  await saveContextData(supabase, userId, platform, { selected_items: newSelected });

  // Resumo atualizado
  const summary = await buildCartSummary(supabase, userId, platform);
  try {
    await supabase.from('ai_learning_insights').insert({
      insight_type: 'cart_remove',
      content: JSON.stringify({ message, removals: mapRem }),
      effectiveness_score: 0.85,
      usage_count: 1
    });
  } catch {}

  if (!Object.keys(mapRem).length) {
    return 'Entendi que queres remover, mas não consegui identificar quais itens. Diz por favor o número (ex: "tira o 2 e o 5") ou o nome do produto.';
  }

  const variants = [
    'Removi do carrinho.\n',
    'Prontinho, já tirei.\n',
    'Feito! Removi esses itens.\n'
  ];
  const prefix = variants[Math.floor(Math.random() * variants.length)];
  const suffix = selected.length && newSelected.length === 0 ? '\nO carrinho ficou vazio.' : '';
  return `${prefix}${summary.text}${suffix}`;
}

async function tryHandleSelectionOrFinalize(message: string, userId: string, platform: string, supabase: any): Promise<string | null> {
  const ctx = await getContextRecord(supabase, userId, platform);
  const last = ctx?.context_data?.last_list;
  const recent = !!last && (Date.now() - (last.timestamp || 0) < 2 * 60 * 60 * 1000); // 2h

  // Confirmação de candidatos pendentes
  const hasPending = Array.isArray(ctx?.context_data?.pending_candidates) && ctx!.context_data.pending_candidates.length > 0;
  const isConfirm = /(sim|confirmo|correto|isso mesmo|pode ser|pode avançar|pode fechar)/i.test(message || '');
  if (recent && hasPending && isConfirm) {
    const cand = ctx!.context_data.pending_candidates as { product_id: string; qty: number }[];
    await addSelectionsToContext(supabase, userId, platform, cand);
    await saveContextData(supabase, userId, platform, { pending_candidates: [] });
    const summary = await buildCartSummary(supabase, userId, platform);
    try {
      await supabase.from('ai_learning_insights').insert({
        insight_type: 'name_selection_confirmed',
        content: `Confirmação por nome: ${JSON.stringify(cand)}`,
        effectiveness_score: 0.9,
        usage_count: 1
      });
    } catch {}
    return `Perfeito! Adicionei ao carrinho.\n${summary.text}\n\nPodes responder com mais itens ou digitar "finalizar" quando estiver pronto.`;
  }

  if (detectFinalizeIntent(message)) {
    // Se o cliente colocou números/nome/preço na mesma frase de finalizar, capturar também
    if (recent) {
      const inlineConf = parseSelectionWithConfidence(message, last);
      const sure = inlineConf.filter(p => p.score >= 0.6).map(({ product_id, qty }) => ({ product_id, qty }));
      if (sure.length) await addSelectionsToContext(supabase, userId, platform, sure);
      const unsure = inlineConf.filter(p => p.score < 0.6).map(({ product_id, qty }) => ({ product_id, qty }));
      if (unsure.length) await saveContextData(supabase, userId, platform, { pending_candidates: unsure });
    }
    const summary = await buildCartSummary(supabase, userId, platform);
    if (!summary.count) {
      return 'Para finalizar preciso saber o que queres. Podes responder com os números dos itens (ex: 2 e 5) ou pedir a lista novamente.';
    }
    return `${summary.text}\n\nPerfeito! Acabei de notificar e vou acompanhar o teu pedido por aqui. Se preferires concluir com mais rapidez e segurança, podes finalizar no site: https://superloja.vip/catalogo (pagamento seguro, mais opções de entrega, histórico do pedido).`;
  }

  if (!detectSelectionIntent(message, recent)) return null;
  if (!recent) return 'Manda "lista completa" ou o nome da categoria (ex: fones, cabos) para eu te mostrar as opções e poderes escolher por número.';

  // Nova extração com confiança
  const picksConf = parseSelectionWithConfidence(message, last);
  if (!picksConf.length) return 'Não consegui identificar os itens. Tenta com os números da lista (ex: 1, 3 e 7) ou o nome exato.';

  // Logar intenção
  try {
    const avg = picksConf.reduce((s, p) => s + (p.score || 0), 0) / picksConf.length;
    await supabase.from('detected_intentions').insert({
      user_id: userId,
      platform,
      message,
      detected_intent: 'select_products',
      confidence_score: avg,
      entities: picksConf
    });
  } catch {}

  const unsure = picksConf.filter(p => (p.score || 0) < 0.6);
  if (unsure.length) {
    await saveContextData(supabase, userId, platform, { pending_candidates: unsure });
    const names = unsure.map(p => {
      const it = (last.items || []).find((i: any) => i.id === p.product_id);
      return `${p.qty}x ${it?.name || 'item'}`;
    }).join(', ');
    return `Acho que queres: ${names}. Confirma? Responde com "confirmo" ou corrige pelo número/nome.`;
  }

  const sure = picksConf.filter(p => (p.score || 0) >= 0.6).map(({ product_id, qty }) => ({ product_id, qty }));
  await addSelectionsToContext(supabase, userId, platform, sure);
  try {
    await supabase.from('ai_learning_insights').insert({
      insight_type: 'name_selection_learned',
      content: `Seleção por nome bem-sucedida: ${JSON.stringify(sure)} | frase: "${message}"`,
      effectiveness_score: 0.8,
      usage_count: 1
    });
  } catch {}

  const summary = await buildCartSummary(supabase, userId, platform);
  return `Adicionado ✅\n${summary.text}\n\nPodes responder com mais números ou nomes para adicionar outros itens, ou digitar "finalizar" quando estiver pronto.`;
}

async function getFallbackResponse(message: string, supabase: any): Promise<string | any> {
  const lowerMessage = message.toLowerCase();
  
  console.log('🔄 Usando getFallbackResponse para:', message);
  
  // Detectar pedidos de imagem no fallback
  const imageKeywords = ['imagem', 'foto', 'mostrar', 'ver foto', 'manda imagem', 'pode enviar foto', 'manda foto', 'anexo', 'em anexo'];
  const wantsImage = imageKeywords.some(keyword => lowerMessage.includes(keyword));
  
  console.log('🔍 Palavras-chave encontradas:', imageKeywords.filter(keyword => lowerMessage.includes(keyword)));
  console.log('🖼️ Quer imagem?', wantsImage);
  
  if (wantsImage) {
    console.log('🖼️ Pedido de imagem detectado no fallback');
    console.log('🔍 Mensagem original:', message);
    
    // Buscar produtos que podem ter imagem
    try {
      console.log('📊 Buscando produtos com imagem...');
      
      // Primeiro tentar busca específica por "pro6"
      let searchQuery = 'pro6';
      if (lowerMessage.includes('pro6')) {
        searchQuery = 'pro6';
      } else if (lowerMessage.includes('x83')) {
        searchQuery = 'x83';
      } else if (lowerMessage.includes('fone')) {
        searchQuery = 'fone';
      }
      
      console.log('🔍 Query de busca:', searchQuery);
      
      const { data: products } = await supabase
        .from('products')
        .select('id, name, price, description, image_url')
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .eq('active', true)
        .not('image_url', 'is', null)
        .limit(1);
        
      console.log('📦 Produtos encontrados:', products?.length || 0);
      console.log('📦 Primeiro produto:', products?.[0] ? JSON.stringify(products[0], null, 2) : 'Nenhum');
        
      if (products && products.length > 0) {
        const product = products[0];
        console.log('✅ Produto com imagem encontrado:', product.name);
        console.log('🖼️ URL da imagem:', product.image_url);
        
        const responseObj = {
          message: `Meu estimado, aqui está a imagem do ${product.name} que pediu! Preço: ${product.price} AOA 😊`,
          image_url: product.image_url,
          attach_image: true
        };
        
        console.log('📤 Retornando objeto para anexar imagem:', JSON.stringify(responseObj, null, 2));
        
        return responseObj;
      } else {
        console.log('❌ Nenhum produto encontrado com imagem');
      }
    } catch (error) {
      console.error('❌ Erro buscar produto com imagem:', error);
    }
  }
  
  // Respostas humanizadas baseadas no contexto
  const timeOfDay = new Date().getHours();
  let greeting = '';
  
  if (timeOfDay < 12) greeting = 'Bom dia';
  else if (timeOfDay < 18) greeting = 'Boa tarde';
  else greeting = 'Boa noite';

  // Buscar produtos mais populares como fallback
  try {
    const { data: popularProducts } = await supabase
      .from('products')
      .select('name, slug, price, image_url')
      .eq('active', true)
      .eq('in_stock', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (popularProducts && popularProducts.length > 0) {
      let response = `${greeting}! 😊 Carlos aqui da SuperLoja.\n\n`;
      
      if (lowerMessage.includes('fone') || lowerMessage.includes('bluetooth')) {
        response += "Vi que procura fones de ouvido. Deixe-me mostrar o que temos de melhor:\n\n";
      } else {
        response += "Que bom ter você aqui! Temos produtos incríveis com entrega grátis em Luanda. Dê uma olhada:\n\n";
      }

      popularProducts.forEach((product: any, index: number) => {
        const price = parseFloat(product.price).toLocaleString('pt-AO');
        response += `${index + 1}. *${product.name}* - ${price} Kz\n`;
        response += `   🔗 [Ver produto](https://superloja.vip/produto/${product.slug})\n\n`;
      });

      response += "Qual destes chama mais a sua atenção? Ou tem algo específico em mente? 🤔";
      return response;
    }
  } catch (error) {
    console.error('❌ Erro buscar produtos populares:', error);
  }

  // Fallback de esclarecimento (pergunta aberta + exemplos de resposta)
  const clarifyOptions = [
    `${greeting}! Só para te atender certinho: quer ver fotos, remover algo do carrinho, comparar opções ou finalizar a compra?`,
    `${greeting}! Diz-me, preferes que eu mostre a lista, retire algum item do carrinho, explique diferenças ou já finalize?`
  ];
  const examples = `Exemplos: "foto do pro6", "tirar 2", "comparar x83 e pro6", "finalizar".`;
  return `${clarifyOptions[Math.floor(Math.random()*clarifyOptions.length)]}\n${examples}`;
}

function detectPurchaseIntent(customerMessage: string, aiResponse: string): string | null {
  const lowerMessage = customerMessage.toLowerCase();
  const lowerResponse = aiResponse.toLowerCase();
  
  // Sinais de confirmação direta
  const confirmationKeywords = [
    'sim podem entregar', 'sim', 'yes', 'ok', 'certo', 'correto', 'confirmo', 
    'podem entregar', 'perfeito', 'está certo', 'tudo certo', 'concordo'
  ];
  
  // Sinais de interesse forte
  const strongBuyKeywords = [
    'quero comprar', 'vou comprar', 'compro', 'interesse', 'preço final',
    'como faço para comprar', 'forma de pagamento', 'entrega', 'garantia',
    'posso pagar', 'aceita cartão', 'disponível', 'stock', 'quanto tempo demora'
  ];
  
  // Sinais de finalização
  const finalizationKeywords = [
    'nome:', 'contacto:', 'telefone:', 'endereço:', 'confirmar compra',
    'finalizar', 'morada', 'dados pessoais', 'meu nome é', 'meu contacto'
  ];
  
  const hasDirectConfirmation = confirmationKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  ) && (lowerResponse.includes('dados') || lowerResponse.includes('finalizar'));
  
  const hasFinalizationAttempt = finalizationKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  );
  
  const hasStrongBuyIntent = strongBuyKeywords.some(keyword => 
    lowerMessage.includes(keyword) || lowerResponse.includes(keyword)
  );
  
  if (hasDirectConfirmation) return 'confirmed_purchase';
  if (hasFinalizationAttempt) return 'finalization';
  if (hasStrongBuyIntent) return 'strong_interest';
  
  return null;
}

async function notifyAdmin(customerId: string, customerMessage: string, supabase: any, intentType: string, context?: any) {
  try {
    console.log(`🔔 Notificando admin sobre ${intentType}...`);
    
    // Buscar dados do admin
    const { data: adminData } = await supabase
      .from('ai_settings')
      .select('value')
      .eq('key', 'admin_facebook_id')
      .single();

    const adminId = adminData?.value || "24320548907583618";
    
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

    // Construir mensagem personalizada
    let notificationMessage = '';
    const productInfo = context?.selectedProduct || 'Produto não identificado';
    const customerNeeds = context?.identifiedNeeds || '';
    const relationshipLevel = context?.relationshipLevel || 'desconhecido';

    switch (intentType) {
      case 'confirmed_purchase':
        notificationMessage = `🎉 VENDA CONFIRMADA! 🎉

👤 Cliente: ${customerId}
🔄 Relacionamento: ${relationshipLevel}
💬 Mensagem: "${customerMessage}"
🛍️ Produto: ${productInfo}
${customerNeeds ? `🎯 Necessidade: ${customerNeeds}` : ''}
😊 Humor: ${context?.currentMood || 'neutro'}

✅ CLIENTE CONFIRMOU COMPRA!
📦 Preparar entrega imediatamente
💰 Venda fechada com sucesso!

⏰ ${new Date().toLocaleString('pt-AO')}`;
        break;
        
      case 'finalization':
        notificationMessage = `🚨 CLIENTE FINALIZANDO COMPRA! 🚨

👤 Cliente: ${customerId}
🔄 Relacionamento: ${relationshipLevel}
💬 Mensagem: "${customerMessage}"
🛍️ Produto interesse: ${productInfo}
${customerNeeds ? `🎯 Necessidade: ${customerNeeds}` : ''}
😊 Humor: ${context?.currentMood || 'neutro'}

🔥 AÇÃO IMEDIATA NECESSÁRIA!
📱 Contactar cliente AGORA!

⏰ ${new Date().toLocaleString('pt-AO')}`;
        break;
        
      case 'strong_interest':
        notificationMessage = `⚡ OPORTUNIDADE DE VENDA! ⚡

👤 Cliente: ${customerId}
🔄 Relacionamento: ${relationshipLevel}
💬 Mensagem: "${customerMessage}"
🛍️ Produto interesse: ${productInfo}
${customerNeeds ? `🎯 Necessidade: ${customerNeeds}` : ''}
😊 Humor: ${context?.currentMood || 'neutro'}

💡 Cliente demonstra interesse real
📞 Considere contactar para fechar venda

⏰ ${new Date().toLocaleString('pt-AO')}`;
        break;
    }

    const url = `https://graph.facebook.com/v23.0/me/messages?access_token=${pageAccessToken}`;
    
    const payload = {
      recipient: { id: adminId },
      message: { text: notificationMessage },
      messaging_type: 'RESPONSE'
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('❌ Erro notificar admin:', await response.text());
    } else {
      console.log('✅ Admin notificado com sucesso!');
    }

    // Salvar notificação no histórico
    await supabase.from('admin_notifications').insert({
      admin_user_id: adminId,
      notification_type: intentType,
      message: notificationMessage,
      metadata: {
        customer_id: customerId,
        customer_message: customerMessage,
        context: context,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erro ao notificar admin:', error);
  }
}

// Humaniza/varia respostas estáticas mantendo números e links
async function humanizeTextResponse(text: string, userMessage: string, supabase: any, platform: 'facebook' | 'instagram'): Promise<string> {
  try {
    const t = (text || '').trim();
    if (!t) return t;

    // Evitar reescrever listas estruturadas (mantém formato numerado com links)
    const listLinks = (t.match(/https?:\/\/superloja\.vip\/produto\//g) || []).length;
    const numbered = (t.match(/^\d+\./gm) || []).length;
    if (listLinks >= 2 || numbered >= 3) return t;

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) return t; // Sem chave, não tenta humanizar

    const prompt = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Escreve como um vendedor angolano humano (Carlos da SuperLoja), natural e empático. Mantém exatamente os links e números, não removas URLs. Não inventes informação. Sê breve (1-2 frases), adiciona um toque humano e confirma entendimento do pedido. Português de Angola.' },
        { role: 'user', content: `Mensagem do cliente: "${userMessage}"\nResponda reescrevendo isto de forma natural, mantendo conteúdo e links:\n---\n${t}` }
      ]
    };

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt)
    });
    if (!res.ok) return t;
    const data = await res.json();
    const out = data?.choices?.[0]?.message?.content?.trim();
    return out?.length ? out : t;
  } catch (_e) {
    return text;
  }
}

async function sendFacebookMessage(
  recipientId: string,
  messageText: string,
  supabase: any,
  platform: 'facebook' | 'instagram' = 'facebook'
) {
  try {
    // Escolha de token por plataforma (sem fallback cruzado)
    let pageAccessToken: string | null = null;
    if (platform === 'instagram') {
      const { data: igToken } = await supabase
        .from('ai_settings')
        .select('value')
        .eq('key', 'instagram_page_token')
        .maybeSingle();
      pageAccessToken = igToken?.value || null;
      if (!pageAccessToken) {
        console.error('❌ Instagram Page Access Token não configurado');
        return;
      }
    } else {
      const { data: fbToken } = await supabase
        .from('ai_settings')
        .select('value')
        .eq('key', 'facebook_page_token')
        .maybeSingle();
      pageAccessToken = fbToken?.value || Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN') || null;
    }

    if (!pageAccessToken) {
      console.error('❌ Page Access Token não encontrado para', platform);
      return;
    }

    const url = `https://graph.facebook.com/v23.0/me/messages?access_token=${pageAccessToken}`;

    // Sanitização: remover markdown e normalizar
    const normalizeText = (text: string) =>
      (text || '')
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1: $2') // [txt](url) -> txt: url
        .replace(/\s+$/g, '')
        .replace(/\n{3,}/g, '\n\n');

    // Detectar marcações de imagem específicas do nosso formato
    const imageRegex = /📸 !\[Imagem\]\(([^)]+)\)/g;
    const images: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = imageRegex.exec(messageText)) !== null) {
      images.push(match[1]);
    }

    // Texto limpo sem marcações de imagem
    const cleanText = normalizeText(messageText.replace(/📸 !\[Imagem\]\([^)]+\)/g, '').trim());

    // Fragmentação segura (limites mais conservadores no Instagram)
    const BASE_MAX = platform === 'instagram' ? 700 : 900;

    const splitIntoChunks = (text: string, maxLen = BASE_MAX): string[] => {
      const chunks: string[] = [];
      if (!text) return chunks;
      const clean = normalizeText(text);
      const sentences = clean.split(/(?<=[.!?])\s+/);
      let buf = '';
      for (const s of sentences) {
        if (s.length > maxLen) {
          if (buf) { chunks.push(buf); buf = ''; }
          for (let i = 0; i < s.length; i += maxLen) {
            chunks.push(s.slice(i, i + maxLen));
          }
          continue;
        }
        const candidate = buf ? `${buf} ${s}` : s;
        if (candidate.length <= maxLen) buf = candidate; else { if (buf) chunks.push(buf); buf = s; }
      }
      if (buf) chunks.push(buf);
      if (chunks.length === 0) {
        for (let i = 0; i < clean.length; i += maxLen) chunks.push(clean.slice(i, i + maxLen));
      }
      return chunks;
    };

    // Envio robusto com re-fragmentação caso ocorra erro 100 (comprimento)
    const sendPart = async (text: string, prefix: string) => {
      const payload: any = {
        recipient: { id: recipientId },
        message: { text: `${prefix}${text}` },
        messaging_type: 'RESPONSE',
      };
      if (platform === 'instagram') payload.messaging_product = 'instagram';
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const errText = await res.text();
        console.error('❌ Erro ao enviar texto', platform, ':', errText);
        try {
          const errJson = JSON.parse(errText);
          const code = errJson?.error?.code;
          const subcode = errJson?.error?.error_subcode;
          const msg = errJson?.error?.message || '';
          // Janela de 24h expirada → parar
          if (code === 10 && subcode === 2018278) return { stop: true } as const;
          // Comprimento acima do permitido → tentar com limite menor
          if (code === 100 || /1000 caracteres|1,000 caracteres|length/i.test(msg)) {
            console.warn('⚠️ Comprimento rejeitado. Tentando com limite menor...');
            const smallerChunks = splitIntoChunks(text, Math.max(450, Math.floor(BASE_MAX / 2)));
            for (let i = 0; i < smallerChunks.length; i++) {
              const r = await sendPart(smallerChunks[i], smallerChunks.length > 1 ? `(cont ${i + 1}/${smallerChunks.length}) ` : '');
              if ((r as any)?.stop) return { stop: true } as const;
              if (i < smallerChunks.length - 1) await new Promise(r => setTimeout(r, 800));
            }
            return { ok: true } as const;
          }
        } catch {}
        return { ok: false } as const;
      }
      return { ok: true } as const;
    };

    // Enviar texto em partes
    if (cleanText) {
      const parts = splitIntoChunks(cleanText, BASE_MAX);
      console.log(`✂️ Fragmentando (${platform}) em ${parts.length} parte(s)`);
      for (let i = 0; i < parts.length; i++) {
        const prefix = parts.length > 1 ? `(${i + 1}/${parts.length}) ` : '';
        const result = await sendPart(parts[i], prefix);
        if ((result as any)?.stop) { console.warn('⏹️ Parando envio por política de 24h'); break; }
        if (i < parts.length - 1) await new Promise(r => setTimeout(r, 800));
      }
      console.log('✅ Texto enviado');
    }

    // Enviar imagens como attachments (quando presentes)
    for (const imageUrl of images) {
      try {
        const normalizedUrl = platform === 'instagram'
          ? (() => {
              try {
                // Preferir URL pública original da Storage (sem render) para evitar 403
                if (/^https?:\/\/[^/]+\/storage\/v1\/object\/public\//i.test(imageUrl)) return imageUrl;
                if (/\.webp(\?|$)/i.test(imageUrl)) return imageUrl.replace(/\.webp(\?|$)/i, '.jpg$1');
                return imageUrl;
              } catch { return imageUrl; }
            })()
          : imageUrl;

        // Preflight check da URL (status, content-type, content-length)
        try {
          const headRes = await fetch(normalizedUrl, { method: 'HEAD' });
          console.log('🔎 Preflight HEAD', { url: normalizedUrl, status: headRes.status, ct: headRes.headers.get('content-type'), cl: headRes.headers.get('content-length') });
          if (!headRes.ok) {
            const getRes = await fetch(normalizedUrl, { method: 'GET' });
            console.log('🔎 Preflight GET', { url: normalizedUrl, status: getRes.status, ct: getRes.headers.get('content-type'), cl: getRes.headers.get('content-length') });
            try { await getRes.arrayBuffer(); } catch {}
          }
        } catch (e) {
          console.warn('⚠️ Preflight falhou', normalizedUrl, (e as any)?.message);
        }

        const imagePayload: any = {
          recipient: { id: recipientId },
          message: { attachment: { type: 'image', payload: { url: normalizedUrl, is_reusable: true } } },
          messaging_type: 'RESPONSE'
        };
        if (platform === 'instagram') imagePayload.messaging_product = 'instagram';
        const imageResponse = await fetch(`https://graph.facebook.com/v23.0/me/messages?access_token=${pageAccessToken}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(imagePayload) });
        if (!imageResponse.ok) {
          const errText = await imageResponse.text();
          console.error('❌ Erro ao enviar imagem por URL', platform, ':', errText);
          // Fallback: baixar e enviar via Upload API
          try {
            const fetchRes = await fetch(normalizedUrl);
            const ab = await fetchRes.arrayBuffer();
            const bytesU = new Uint8Array(ab);
            const imageBlob = new Blob([bytesU], { type: 'image/jpeg' });
            const formData = new FormData();
            formData.append('message', JSON.stringify({ attachment: { type: 'image', payload: { is_reusable: false } } }));
            formData.append('filedata', imageBlob, 'image.jpg');
            if (platform === 'instagram') { formData.append('messaging_product', 'instagram'); }
            const uploadRes = await fetch(`https://graph.facebook.com/v23.0/me/message_attachments?access_token=${pageAccessToken}`, { method: 'POST', body: formData });
            if (uploadRes.ok) {
              const uploadJson = await uploadRes.json();
              console.log('✅ Upload API fallback ok, attachment_id:', uploadJson.attachment_id);
              const sendRes = await fetch(`https://graph.facebook.com/v23.0/me/messages?access_token=${pageAccessToken}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  recipient: { id: recipientId },
                  messaging_type: 'RESPONSE',
                  ...(platform === 'instagram' ? { messaging_product: 'instagram' } : {}),
                  message: { attachment: { type: 'image', payload: { attachment_id: uploadJson.attachment_id } } }
                })
              });
              if (sendRes.ok) { console.log('✅ Imagem enviada via Upload API fallback'); }
              else { console.error('❌ Falha no envio pós-upload:', await sendRes.text()); }
            } else {
              console.error('❌ Falha no Upload API fallback:', await uploadRes.text());
            }
          } catch (e) {
            console.error('❌ Erro no fallback Upload API:', (e as any)?.message);
          }
        } else {
          console.log('✅ Imagem enviada');
        }
      } catch (err) {
        console.error('❌ Erro ao enviar imagem via URL:', err);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem Facebook:', error);
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

// Helper: acrescenta link do produto ao texto quando possível
async function buildMessageWithProductLink(
  originalText: string,
  imageUrl: string,
  userMessage: string,
  supabase: any
): Promise<string> {
  try {
    if (!originalText) return originalText;
    if (/superloja\.vip/i.test(originalText)) return originalText; // já contém link

    // Tentar mapear pelo nome do ficheiro da imagem principal
    let filename = '';
    try {
      const u = new URL(imageUrl);
      const pathParts = u.pathname.split('/');
      filename = (pathParts[pathParts.length - 1] || '').split('?')[0];
    } catch {}

    let slug: string | null = null;
    if (filename) {
      const { data: matchByImage } = await supabase
        .from('products')
        .select('slug, image_url')
        .ilike('image_url', `%${filename}%`)
        .limit(1);
      if (matchByImage && matchByImage.length > 0) slug = matchByImage[0].slug;
    }

    // Se não encontrou por imagem, tentar por palavra-chave da mensagem do usuário
    if (!slug && userMessage) {
      const lower = (userMessage || '').toLowerCase();
      const specific: Record<string, string[]> = {
        't19': ['t19', 't 19', 'disney'],
        'x83': ['x83', 'x 83'],
        'pro6': ['pro6', 'pro 6', 'tws']
      };
      const key = Object.keys(specific).find(k => specific[k].some(v => lower.includes(v)));
      if (key) {
        const { data: byName } = await supabase
          .from('products')
          .select('slug')
          .ilike('name', `%${key}%`)
          .limit(1);
        if (byName && byName.length > 0) slug = byName[0].slug;
      }
    }

    if (slug) {
      return `${originalText}\n\nLink do produto: https://superloja.vip/produto/${slug}`;
    }
  } catch (e) {
    console.warn('⚠️ buildMessageWithProductLink falhou:', (e as any)?.message);
  }
  return originalText;
}

// Detecta intenção de finalizar compra/pedido
function detectCheckoutIntent(text: string): boolean {
  const t = (text || '').toLowerCase();
  const keywords = [
    'finalizar compra','finalizar pedido','concluir compra','concluir pedido','fechar compra','fechar pedido','quero comprar','comprar agora','quero finalizar','checkout','pagar agora','confirmar pedido','finalizar no site','finalizar aqui','comprar pelo instagram','comprar pelo facebook','quero pagar','fazer o pagamento'
  ];
  return keywords.some(k => t.includes(k));
}

// Mensagem padrão incentivando finalizar no site e oferecendo finalizar pelo chat
async function buildCheckoutAdvice(
  userMessage: string,
  supabase: any,
  platform: 'facebook' | 'instagram' = 'facebook'
): Promise<string> {
  const base = `Perfeito! Vamos finalizar a tua compra.\n\nRecomendo concluir no nosso site para maior segurança e rapidez:\n• Pagamento 100% seguro\n• Acompanhamento do pedido em tempo real\n• Entrega priorizada\n• Promoções e cupões exclusivos\n\nPodes comprar pelo catálogo: https://superloja.vip/catalogo\n\nSe preferires finalizar por aqui, envia por favor:\n1) Nome completo\n2) Telefone/WhatsApp\n3) Endereço (bairro + referência)\n4) Artigo e quantidade\n5) Método de pagamento (Transferência/TPA/Contra-entrega)\n\nAssim que receber, um agente confirma tudo contigo. 🚀`;
  // Tentar acrescentar link direto do produto, quando identificável
  try {
    const enriched = await buildMessageWithProductLink(base, '', userMessage, supabase);
    return enriched;
  } catch {
    return base;
  }
}

// Função para enviar mensagem com imagem como anexo via Upload API
async function sendFacebookMessageWithImage(
  recipientId: string,
  text: string,
  imageBase64: string,
  supabase: any,
  platform: 'facebook' | 'instagram' = 'facebook',
  originalUrl?: string
) {
  try {
    // Obter token conforme a plataforma (sem fallback cruzado)
    let PAGE_ACCESS_TOKEN: string | null = null;
    if (platform === 'instagram') {
      const { data: igToken } = await supabase
        .from('ai_settings')
        .select('value')
        .eq('key', 'instagram_page_token')
        .maybeSingle();
      PAGE_ACCESS_TOKEN = igToken?.value || null;
      if (!PAGE_ACCESS_TOKEN) {
        console.error('❌ Instagram Page Access Token não configurado');
        return;
      }
    } else {
      const { data: fbToken } = await supabase
        .from('ai_settings')
        .select('value')
        .eq('key', 'facebook_page_token')
        .maybeSingle();
      PAGE_ACCESS_TOKEN = fbToken?.value || Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN') || null;
    }

    if (!PAGE_ACCESS_TOKEN) {
      console.error('❌ Token de página não configurado');
      return;
    }

    // Normalizar URL p/ Instagram (forçar JPEG sRGB sem alpha)
    const toInstagramSafe = (url: string) => {
      try {
        const m = url.match(/^(https?:\/\/[^/]+)\/storage\/v1\/object\/public\/([^?]+)(?:\?[^#]*)?/i);
        if (m) {
          const origin = m[1];
          const path = m[2];
          // Usa o render da Storage para converter para JPEG, cobrindo 1080x1350 e fundo branco
          return `${origin}/storage/v1/render/image/public/${path}?width=1080&height=1350&resize=cover&format=jpeg&quality=85&background=ffffff`;
        }
        if (/\.(webp|png)(\?|$)/i.test(url)) return url.replace(/\.(webp|png)(\?|$)/i, '.jpg$2');
        return url;
      } catch { return url; }
    };

    // Decidir se devemos enviar texto após imagem (todas plataformas)
    const shouldSendTextAfterImage = !!(text && text.trim());

    // Método A: enviar por URL (preferido para Facebook e Instagram)
    if (originalUrl) {
      const safeUrl = platform === 'instagram'
        ? (() => {
            try {
              // Usar diretamente a URL pública da Storage (sem render)
              if (/^https?:\/\/[^/]+\/storage\/v1\/object\/public\//i.test(originalUrl)) return originalUrl;
              if (/\.webp(\?|$)/i.test(originalUrl)) return originalUrl.replace(/\.webp(\?|$)/i, '.jpg$1');
              return originalUrl;
            } catch { return originalUrl; }
          })()
        : originalUrl;
      if (platform === 'instagram') {
        console.log('📸 IG enviando por URL pública', { originalUrl, safeUrl });
      }
      const payload: any = {
        recipient: { id: recipientId },
        messaging_type: 'RESPONSE',
        message: { attachment: { type: 'image', payload: { url: safeUrl, is_reusable: true } } }
      };
      if (platform === 'instagram') payload.messaging_product = 'instagram';

      // Preflight check da URL de envio (status, content-type, content-length)
      try {
        const headRes = await fetch(safeUrl, { method: 'HEAD' });
        console.log('🔎 IG URL Preflight HEAD', { url: safeUrl, status: headRes.status, ct: headRes.headers.get('content-type'), cl: headRes.headers.get('content-length') });
        if (!headRes.ok) {
          const getRes = await fetch(safeUrl, { method: 'GET' });
          console.log('🔎 IG URL Preflight GET', { url: safeUrl, status: getRes.status, ct: getRes.headers.get('content-type'), cl: getRes.headers.get('content-length') });
          try { await getRes.arrayBuffer(); } catch {}
        }
      } catch (e) {
        console.warn('⚠️ IG URL Preflight falhou', safeUrl, (e as any)?.message);
      }

      const urlRes = await fetch(`https://graph.facebook.com/v23.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (urlRes.ok) {
        let jr: any = null;
        try { jr = await urlRes.json(); } catch {}
        console.log('✅ Imagem enviada via URL', jr);
        if (shouldSendTextAfterImage) {
          console.log('📝 Enviando texto pós-imagem', { platform });
          await new Promise(r => setTimeout(r, 1200));
          await sendFacebookMessage(recipientId, text, supabase, platform);
        }
        return;
      } else {
        const err = await urlRes.text();
        console.error('❌ Falha envio por URL:', err);
      }
    }

    console.log('🖼️ Tentando Upload API');
    const binaryString = atob(imageBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const formData = new FormData();
    const imageBlob = new Blob([bytes], { type: 'image/jpeg' });
    formData.append('message', JSON.stringify({ attachment: { type: 'image', payload: { is_reusable: false } } }));
    formData.append('filedata', imageBlob, 'image.jpg');
    if (platform === 'instagram') { formData.append('messaging_product', 'instagram'); }

    const uploadResponse = await fetch(`https://graph.facebook.com/v23.0/me/message_attachments?access_token=${PAGE_ACCESS_TOKEN}`, { method: 'POST', body: formData });

    if (uploadResponse.ok) {
      const uploadResult = await uploadResponse.json();
      console.log('✅ Upload ok, attachment_id:', uploadResult.attachment_id);
      const messageResponse = await fetch(`https://graph.facebook.com/v23.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          messaging_type: 'RESPONSE',
          ...(platform === 'instagram' ? { messaging_product: 'instagram' } : {}),
          message: { attachment: { type: 'image', payload: { attachment_id: uploadResult.attachment_id } } }
        })
      });
      if (messageResponse.ok) {
        console.log('✅ Imagem enviada via Upload API');
        if (shouldSendTextAfterImage) {
          console.log('📝 Enviando texto pós-imagem', { platform });
          await new Promise(r => setTimeout(r, 1200));
          await sendFacebookMessage(recipientId, text, supabase, platform);
        }
        return;
      } else {
        const errorData = await messageResponse.text();
        console.error('❌ Erro ao enviar com attachment_id:', errorData);
      }
    } else {
      const errorData = await uploadResponse.text();
      console.error('❌ Erro no upload:', errorData);
    }

    // Fallback final
    if (text?.trim()) {
      const fallbackText = platform === 'instagram' ? text : text + ' (imagem indisponível)';
      await sendFacebookMessage(recipientId, fallbackText, supabase, platform);
    }

  } catch (error) {
    console.error('❌ Erro no envio de imagem:', error);
    if (text?.trim()) {
      const fallbackText = platform === 'instagram' ? text : text + ' (erro ao anexar imagem)';
      await sendFacebookMessage(recipientId, fallbackText, supabase, platform);
    }
  }
}
async function checkAndNotifyAdmin(userMessage: string, aiResponse: any, userId: string, supabase: any) {
  const triggers = [
    'entrega fora', 'entrega provincia', 'entrega nas provincia',
    'não sei', 'não tenho certeza', 'deixa-me contactar',
    'equipa especializada', 'informações mais precisas', 'orçamento',
    'problema técnico', 'não funciona'
  ];
  const aiText = typeof aiResponse === 'string'
    ? aiResponse
    : (aiResponse && typeof aiResponse.message === 'string')
      ? aiResponse.message
      : '';
  const shouldNotify = triggers.some(trigger => 
    (userMessage || '').toLowerCase().includes(trigger) || 
    (aiText || '').toLowerCase().includes(trigger)
  );
  if (shouldNotify) {
    console.log('🔔 Notificando admin - necessita ajuda especializada');
    try {
      await supabase.from('admin_notifications').insert({
        admin_user_id: 'admin',
        notification_type: 'user_needs_help',
        message: `Usuário ${userId} precisa de ajuda especializada. Mensagem: "${userMessage}". Resposta IA: "${(aiText || '').substring(0, 200)}..."`
      });
      console.log('✅ Admin notificado - ajuda especializada');
    } catch (error) {
      console.error('❌ Erro ao notificar admin:', error);
    }
  }
}