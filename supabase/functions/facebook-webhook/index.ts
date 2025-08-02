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
      
      // Se chegou aqui e não é Facebook conhecido, pode ser Instagram
      const pageId = body.entry?.[0]?.id;
      console.log('📱 Page ID recebido:', pageId);
      
      if (pageId === '230190170178019') {
        platform = 'facebook';
        console.log('📘 Confirmado: Facebook (Page ID conhecido)');
      } else {
        platform = 'instagram';
        console.log('📱 Assumindo: Instagram (Page ID desconhecido)');
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
    
    // IDs específicos conhecidos do Instagram - SUBSTITUA PELOS SEUS IDs REAIS
    const knownInstagramPageIds = [
      '17841465999791980', // ID exemplo - substitua pelo seu ID Instagram Business Account
      'your_instagram_business_id_here', // Adicione aqui o ID da sua conta Instagram Business
      '6508493169262079', // Outro exemplo
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
    
    // Processar com IA humanizada e contextual
    const aiResponse = await processWithEnhancedAI(messageText, senderId, supabase);
    
    // Verificar se resposta inclui imagem para anexar
    if (typeof aiResponse === 'object' && aiResponse.attach_image && aiResponse.image_url) {
      try {
        // Baixar imagem e enviar como anexo
        const imageResponse = await fetch(aiResponse.image_url);
        const imageBlob = await imageResponse.blob();
        const imageBase64 = await blobToBase64(imageBlob);
        
        // Enviar texto + imagem
        await sendFacebookMessageWithImage(senderId, aiResponse.message, imageBase64, supabase);
        
        // Salvar resposta enviada
        await supabase.from('ai_conversations').insert({
          platform: platform,
          user_id: senderId,
          message: aiResponse.message,
          type: 'sent',
          timestamp: new Date().toISOString()
        });
      } catch (imageError) {
        console.error('Erro ao processar imagem:', imageError);
        // Se falhar, enviar apenas texto
        const responseText = aiResponse.message;
        await sendFacebookMessage(senderId, responseText, supabase);
        
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
      await sendFacebookMessage(senderId, responseText, supabase);
      
      // Salvar resposta enviada
      await supabase.from('ai_conversations').insert({
        platform: platform,
        user_id: senderId,
        message: responseText,
        type: 'sent',
        timestamp: new Date().toISOString()
      });
    }

    // Verificar se precisa notificar admin
    await checkAndNotifyAdmin(messageText, aiResponse, senderId, supabase);
    
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    await sendFacebookMessage(senderId, 'Desculpe, tive um problema técnico. Tente novamente!', supabase);
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
    
    if (!OPENAI_API_KEY) {
      console.error('❌ OpenAI API Key não encontrada');
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
- Adapta seu estilo ao cliente`;

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
          { role: 'user', content: `INSTRUÇÕES PARA IMAGENS: Se o cliente pedir "imagem", "foto", "mostrar", "ver foto", responda exatamente neste formato JSON:
{"message": "Sua resposta em português angolano", "image_url": "url_da_imagem_do_produto", "attach_image": true}

Use APENAS produtos da lista que tenham ImageURL.

Mensagem do cliente: ${message}` }
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
      
      // Tentar parsear como JSON (para respostas com imagem)
      try {
        const parsedResponse = JSON.parse(responseContent);
        if (parsedResponse.message && parsedResponse.attach_image) {
          console.log('🖼️ Resposta com imagem detectada');
          return parsedResponse;
        }
      } catch {
        // Se não for JSON válido, continua como texto normal
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

async function getFallbackResponse(message: string, supabase: any): Promise<string> {
  const lowerMessage = message.toLowerCase();
  
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

  // Fallback padrão humanizado
  const fallbackResponses = [
    `${greeting}! Carlos aqui da SuperLoja! 😊 Como posso ajudar hoje?`,
    `Olá! Bem-vindo à SuperLoja! Sou o Carlos e estou aqui para encontrar o produto perfeito para você.`,
    `${greeting}! É um prazer ter você aqui na SuperLoja! Em que posso ser útil?`
  ];

  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)] + 
         `\n\nVisite nosso site: https://superloja.vip\nWhatsApp: 939729902`;
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

    const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${pageAccessToken}`;
    
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
        console.error('❌ Erro ao enviar texto Facebook:', await textResponse.text());
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
        }
      });

    } catch (error) {
      console.error('❌ Erro ao enviar imagem via URL:', error);
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

// Função para enviar mensagem com imagem como anexo
async function sendFacebookMessageWithImage(recipientId: string, text: string, imageBase64: string, supabase: any) {
  try {
    const PAGE_ACCESS_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    
    if (!PAGE_ACCESS_TOKEN) {
      console.error('❌ Token do Facebook não configurado');
      return;
    }

    // Enviar imagem como anexo via API do Facebook
    const response = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: 'image',
            payload: {
              is_reusable: false,
              url: `data:image/jpeg;base64,${imageBase64}`
            }
          }
        }
      })
    });

    if (response.ok) {
      console.log('✅ Imagem enviada para Facebook');
      
      // Enviar texto separado se houver
      if (text && text.trim()) {
        await sendFacebookMessage(recipientId, text, supabase);
      }
    } else {
      const errorData = await response.text();
      console.error('❌ Erro ao enviar imagem:', errorData);
      
      // Fallback: enviar só o texto
      await sendFacebookMessage(recipientId, text, supabase);
    }
    
  } catch (error) {
    console.error('❌ Erro ao processar envio de imagem:', error);
    // Fallback: enviar só o texto
    await sendFacebookMessage(recipientId, text, supabase);
  }
}
async function checkAndNotifyAdmin(userMessage: string, aiResponse: string, userId: string, supabase: any) {
  const triggers = [
    'entrega fora', 'entrega provincia', 'entrega nas provincia',
    'não sei', 'não tenho certeza', 'deixa-me contactar',
    'equipa especializada', 'informações mais precisas', 'orçamento',
    'problema técnico', 'não funciona'
  ];
  
  const shouldNotify = triggers.some(trigger => 
    userMessage.toLowerCase().includes(trigger) || 
    aiResponse.toLowerCase().includes(trigger)
  );
  
  if (shouldNotify) {
    console.log('🔔 Notificando admin - necessita ajuda especializada');
    
    try {
      await supabase.from('admin_notifications').insert({
        admin_user_id: 'admin',
        notification_type: 'user_needs_help',
        message: `Usuário ${userId} precisa de ajuda especializada. Mensagem: "${userMessage}". Resposta IA: "${aiResponse.substring(0, 200)}..."`
      });
      
      console.log('✅ Admin notificado - ajuda especializada');
    } catch (error) {
      console.error('❌ Erro ao notificar admin:', error);
    }
  }
}