import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🧪 TEST FUNCTION CALLED - Method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    console.log('📦 Request headers:', Object.fromEntries(req.headers.entries()));
    
    const body = await req.json();
    console.log('📥 Request body:', body);
    
    const { recipient_id, message } = body;
    
    if (!recipient_id || !message) {
      console.error('❌ Missing parameters');
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

    console.log('🧪 === TESTE FACEBOOK SEND ===');
    console.log('📱 Recipient:', recipient_id);
    console.log('📝 Message:', message);

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Supabase vars missing');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Configuração Supabase incompleta'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get token from ai_settings (where admin saves it)
    console.log('🔍 Buscando token...');
    const { data: aiSettings, error: tokenError } = await supabase
      .from('ai_settings')
      .select('value')
      .eq('key', 'facebook_page_token')
      .maybeSingle();
    
    if (tokenError) {
      console.error('❌ Token error:', tokenError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Erro ao buscar token: ' + tokenError.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    if (!aiSettings?.value) {
      console.error('❌ Token not found');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Token Facebook não encontrado na configuração'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    const PAGE_ACCESS_TOKEN = aiSettings.value;
    console.log('✅ Token found:', PAGE_ACCESS_TOKEN.substring(0, 20) + '...');

    // Send message to Facebook
    console.log('📤 Sending to Facebook...');
    const facebookUrl = `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
    
    const sendResponse = await fetch(facebookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipient_id },
        message: { text: message }
      }),
    });
    
    const sendResult = await sendResponse.json();
    
    console.log('📊 Facebook response:', {
      status: sendResponse.status,
      ok: sendResponse.ok,
      result: sendResult
    });

    if (sendResponse.ok) {
      console.log('✅ SUCCESS! Message sent');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Mensagem enviada com sucesso!',
          facebook_response: sendResult,
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
      console.error('❌ Facebook API error:', sendResult);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Falha na API Facebook',
          facebook_error: sendResult,
          status_code: sendResponse.status
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

  } catch (error) {
    console.error('❌ Function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro interno'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});