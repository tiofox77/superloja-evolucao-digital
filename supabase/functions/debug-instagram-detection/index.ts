import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 === DEBUG DETECÇÃO INSTAGRAM ===');

    // 1. Buscar últimas mensagens para análise
    const { data: recentMessages, error: messagesError } = await supabase
      .from('ai_conversations')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(20);

    console.log('📊 Últimas mensagens:', recentMessages?.length || 0);
    
    if (recentMessages) {
      const platforms = recentMessages.reduce((acc, msg) => {
        acc[msg.platform] = (acc[msg.platform] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📱 Plataformas detectadas:', platforms);
    }

    // 2. Verificar configurações das duas plataformas
    const { data: botSettings, error: settingsError } = await supabase
      .from('ai_settings')
      .select('key, value')
      .or('key.eq.bot_enabled,key.eq.instagram_bot_enabled,key.eq.facebook_page_id,key.eq.instagram_business_id');

    console.log('⚙️ Configurações bot:', botSettings);

    // 3. Analisar estrutura das mensagens Instagram vs Facebook
    const instagramMessages = recentMessages?.filter(msg => msg.platform === 'instagram') || [];
    const facebookMessages = recentMessages?.filter(msg => msg.platform === 'facebook') || [];

    console.log('📱 Mensagens Instagram:', instagramMessages.length);
    console.log('📘 Mensagens Facebook:', facebookMessages.length);

    // 4. Mostrar diferenças nas estruturas
    if (instagramMessages.length > 0) {
      console.log('📱 Exemplo de metadata Instagram:', instagramMessages[0].metadata);
    }
    
    if (facebookMessages.length > 0) {
      console.log('📘 Exemplo de metadata Facebook:', facebookMessages[0].metadata);
    }

    // 5. Verificar tokens e configurações
    const { data: socialSettings, error: socialError } = await supabase
      .from('social_media_settings')
      .select('*');

    console.log('🔧 Configurações sociais:', socialSettings);

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      analysis: {
        total_messages: recentMessages?.length || 0,
        instagram_messages: instagramMessages.length,
        facebook_messages: facebookMessages.length,
        platforms_ratio: recentMessages?.length ? {
          instagram: Math.round((instagramMessages.length / recentMessages.length) * 100),
          facebook: Math.round((facebookMessages.length / recentMessages.length) * 100)
        } : null,
        bot_settings: botSettings || [],
        social_config: socialSettings || [],
        recommendations: []
      }
    };

    // Gerar recomendações
    const recommendations = result.analysis.recommendations;
    
    if (instagramMessages.length === 0) {
      recommendations.push({
        level: 'warning',
        message: 'Nenhuma mensagem do Instagram detectada',
        action: 'Verificar se webhook está configurado corretamente no Instagram Business'
      });
    }
    
    if (!socialSettings?.find(s => s.platform === 'instagram' && s.is_active)) {
      recommendations.push({
        level: 'error', 
        message: 'Instagram não configurado nas redes sociais',
        action: 'Configurar credenciais do Instagram na página de configurações'
      });
    }
    
    if (!botSettings?.find(s => s.key === 'instagram_bot_enabled' && s.value === 'true')) {
      recommendations.push({
        level: 'warning',
        message: 'Bot Instagram não está habilitado',
        action: 'Ativar bot Instagram nas configurações de IA'
      });
    }

    const webhookUrls = {
      facebook: 'https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/facebook-webhook',
      instagram: 'https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/instagram-webhook',
      unified: 'https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/facebook-webhook'
    };

    recommendations.push({
      level: 'info',
      message: 'URLs dos webhooks configurados',
      details: webhookUrls
    });

    console.log('🎯 Recomendações geradas:', recommendations.length);

    return new Response(JSON.stringify(result, null, 2), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('❌ Erro no debug Instagram:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});