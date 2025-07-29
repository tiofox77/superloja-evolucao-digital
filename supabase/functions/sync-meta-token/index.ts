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
    console.log('🔄 === INICIANDO SINCRONIZAÇÃO TOKEN META ===');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar token das configurações Meta
    console.log('📋 Buscando token das configurações Meta...');
    const { data: metaSettings, error: metaError } = await supabase
      .from('meta_settings')
      .select('access_token')
      .limit(1)
      .maybeSingle();

    if (metaError) {
      console.error('❌ Erro ao buscar configurações Meta:', metaError);
      throw metaError;
    }

    if (!metaSettings?.access_token) {
      console.log('⚠️ Token não encontrado nas configurações Meta');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Token não encontrado nas configurações Meta'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    console.log('✅ Token encontrado nas configurações Meta');
    console.log('🔑 Token:', metaSettings.access_token.substring(0, 20) + '...');

    // Atualizar secret do Facebook
    console.log('💾 Atualizando secret FACEBOOK_PAGE_ACCESS_TOKEN...');
    
    // Chamada para a edge function de sincronização de secrets
    const { error: syncError } = await supabase.functions.invoke('sync-ai-secrets', {
      body: {
        facebook_page_token: metaSettings.access_token
      }
    });

    if (syncError) {
      console.error('❌ Erro ao sincronizar secret:', syncError);
      throw syncError;
    }

    console.log('✅ Secret sincronizado com sucesso!');
    console.log('🎉 === SINCRONIZAÇÃO CONCLUÍDA ===');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Token sincronizado com sucesso',
        token_preview: metaSettings.access_token.substring(0, 20) + '...'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
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