import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipient_id, message } = await req.json();
    
    if (!recipient_id || !message) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'recipient_id e message são obrigatórios'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    console.log('🧪 === TESTE REAL DE ENVIO FACEBOOK ===');
    console.log('📱 Recipient:', recipient_id);
    console.log('📝 Message:', message.substring(0, 50) + '...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar token igual ao webhook
    let PAGE_ACCESS_TOKEN = null;
    let tokenSource = 'none';
    
    // 1. Buscar na ai_settings primeiro
    try {
      const { data: aiSettings } = await supabase
        .from('ai_settings')
        .select('value')
        .eq('key', 'facebook_page_token')
        .maybeSingle();
      
      if (aiSettings?.value) {
        PAGE_ACCESS_TOKEN = aiSettings.value;
        tokenSource = 'ai_settings';
        console.log('✅ Token encontrado na ai_settings');
      }
    } catch (error) {
      console.log('⚠️ Erro ao buscar ai_settings');
    }

    // 2. Fallback para meta_settings
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
          console.log('✅ Token encontrado na meta_settings');
        }
      } catch (error) {
        console.log('⚠️ Erro ao buscar meta_settings');
      }
    }

    // 3. Fallback para secrets
    if (!PAGE_ACCESS_TOKEN) {
      PAGE_ACCESS_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
      tokenSource = 'secrets';
      console.log('✅ Token encontrado nas secrets');
    }

    if (!PAGE_ACCESS_TOKEN) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Nenhum token Facebook encontrado'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    console.log('🔑 Token source:', tokenSource);
    console.log('🔑 Token preview:', PAGE_ACCESS_TOKEN.substring(0, 20) + '...');

    // Tentar enviar mensagem
    console.log('📤 Enviando mensagem...');
    
    const sendResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipient_id },
          message: { text: message }
        }),
      }
    );
    
    const sendResult = await sendResponse.json();
    
    console.log('📊 Resposta Facebook:', {
      status: sendResponse.status,
      ok: sendResponse.ok,
      result: sendResult
    });

    if (sendResponse.ok) {
      console.log('✅ Mensagem enviada com sucesso!');
      console.log('📨 Message ID:', sendResult.message_id);
      console.log('📱 Recipient ID:', sendResult.recipient_id);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Mensagem enviada com sucesso!',
          facebook_response: sendResult,
          token_source: tokenSource,
          details: {
            message_id: sendResult.message_id,
            recipient_id: sendResult.recipient_id
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      console.error('❌ Erro ao enviar mensagem:');
      console.error('📊 Status:', sendResponse.status);
      console.error('💥 Error details:', sendResult);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Falha ao enviar mensagem',
          facebook_error: sendResult,
          token_source: tokenSource,
          status_code: sendResponse.status
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});