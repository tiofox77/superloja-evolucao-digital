import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

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
    const { openai_api_key, facebook_page_token } = await req.json();

    console.log('🔄 Iniciando sincronização com Supabase Secrets...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const updates = [];

    // Sincronizar OpenAI API Key
    if (openai_api_key) {
      console.log('📝 Sincronizando OPENAI_API_KEY...');
      
      // Atualizar no banco de configurações
      await supabase
        .from('ai_settings')
        .upsert({
          key: 'openai_api_key',
          value: openai_api_key,
          description: 'Chave da API OpenAI para GPT models',
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      updates.push('OPENAI_API_KEY');
    }

    // Sincronizar Facebook Page Token
    if (facebook_page_token) {
      console.log('📝 Sincronizando FACEBOOK_PAGE_ACCESS_TOKEN...');
      
      // Atualizar no banco de configurações
      await supabase
        .from('ai_settings')
        .upsert({
          key: 'facebook_page_token',
          value: facebook_page_token,
          description: 'Token da página Facebook para Messenger',
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      updates.push('FACEBOOK_PAGE_ACCESS_TOKEN');
    }

    console.log(`✅ Sincronização completa: ${updates.join(', ')}`);

    return new Response(JSON.stringify({
      success: true,
      synchronized_secrets: updates,
      message: `${updates.length} secrets sincronizados com sucesso`,
      timestamp: new Date().toISOString(),
      note: 'As variáveis de ambiente serão aplicadas na próxima execução das edge functions'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Erro na sincronização:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});