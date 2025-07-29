import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧪 TESTE WEBHOOK FACEBOOK');
    
    // Simular webhook call para testar se nossa function funciona
    const webhookUrl = 'https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/facebook-webhook';
    
    // 1. Teste GET direto
    console.log('1️⃣ Testando GET direto...');
    const getResponse = await fetch(webhookUrl, { method: 'GET' });
    const getResult = await getResponse.text();
    console.log('Resultado GET:', getResponse.status, getResult);
    
    // 2. Teste POST com dados simulados do Facebook
    console.log('2️⃣ Testando POST com dados simulados...');
    const testData = {
      "object": "page",
      "entry": [{
        "id": "230190170178019",
        "time": Date.now(),
        "messaging": [{
          "sender": { "id": "test_user_webhook_direct" },
          "recipient": { "id": "230190170178019" },
          "timestamp": Date.now(),
          "message": {
            "mid": "test_mid_" + Date.now(),
            "text": "Teste direto do webhook"
          }
        }]
      }]
    };
    
    const postResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    const postResult = await postResponse.text();
    console.log('Resultado POST:', postResponse.status, postResult);
    
    return new Response(JSON.stringify({
      success: true,
      get_test: { status: getResponse.status, body: getResult },
      post_test: { status: postResponse.status, body: postResult },
      message: 'Testes concluídos! Verifique os logs.'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});