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

    console.log('🔍 Debugando configuração Instagram...');

    // 1. Verificar configurações do Instagram
    const { data: instagramSettings, error: settingsError } = await supabase
      .from('ai_settings')
      .select('key, value')
      .or('key.eq.instagram_bot_enabled,key.eq.instagram_page_token,key.eq.instagram_verify_token');

    console.log('⚙️ Configurações Instagram:', instagramSettings);

    // 2. Verificar últimas mensagens recebidas
    const { data: recentMessages, error: messagesError } = await supabase
      .from('ai_conversations')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10);

    console.log('💬 Últimas mensagens:', recentMessages);

    // 3. Testar webhook Instagram diretamente
    console.log('🧪 Testando webhook Instagram...');
    
    const testInstagramMessage = {
      object: 'instagram',
      entry: [{
        id: 'instagram_account_id',
        time: Date.now(),
        messaging: [{
          sender: { id: 'test_instagram_user' },
          recipient: { id: 'instagram_page_id' },
          timestamp: Date.now(),
          message: {
            mid: 'test_instagram_message_id',
            text: 'Mensagem de teste do Instagram'
          }
        }]
      }]
    };

    const webhookResponse = await fetch('https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/facebook-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testInstagramMessage)
    });

    const webhookResult = await webhookResponse.text();
    console.log('📤 Resposta webhook:', webhookResponse.status, webhookResult);

    // 4. Verificar se mensagem foi salva após teste
    const { data: afterTest, error: afterError } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('platform', 'instagram')
      .order('timestamp', { ascending: false })
      .limit(5);

    console.log('📋 Mensagens Instagram após teste:', afterTest);

    // 5. Testar token Instagram
    const instagramToken = instagramSettings?.find(s => s.key === 'instagram_page_token')?.value;
    
    let tokenTest = null;
    if (instagramToken) {
      try {
        const tokenResponse = await fetch(`https://graph.facebook.com/me?access_token=${instagramToken}`);
        tokenTest = {
          status: tokenResponse.status,
          valid: tokenResponse.ok,
          data: tokenResponse.ok ? await tokenResponse.json() : await tokenResponse.text()
        };
      } catch (error) {
        tokenTest = { error: error.message };
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      debug_info: {
        instagram_settings: instagramSettings || [],
        recent_messages_count: recentMessages?.length || 0,
        instagram_messages_count: afterTest?.length || 0,
        webhook_test: {
          status: webhookResponse.status,
          response: webhookResult
        },
        token_test: tokenTest,
        recommendations: []
      }
    };

    // Gerar recomendações
    const recommendations = result.debug_info.recommendations;
    
    if (!instagramSettings?.find(s => s.key === 'instagram_bot_enabled' && s.value === 'true')) {
      recommendations.push('❌ Bot Instagram não está habilitado');
    }
    
    if (!instagramSettings?.find(s => s.key === 'instagram_page_token')) {
      recommendations.push('❌ Token de página Instagram não configurado');
    }
    
    if (result.debug_info.instagram_messages_count === 0) {
      recommendations.push('❌ Nenhuma mensagem Instagram encontrada - webhook pode não estar configurado');
    }
    
    if (!webhookResponse.ok) {
      recommendations.push('❌ Webhook não está respondendo corretamente');
    }

    if (tokenTest && !tokenTest.valid) {
      recommendations.push('❌ Token Instagram inválido ou expirado');
    }

    console.log('✅ Debug Instagram completo');

    return new Response(JSON.stringify(result, null, 2), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('❌ Erro no debug Instagram:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});