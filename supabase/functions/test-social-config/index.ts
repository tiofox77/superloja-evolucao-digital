import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 [CONFIG TEST] Iniciando teste de configurações...');

    // Buscar configurações do Facebook
    const { data: facebookSettings, error: fbError } = await supabase
      .from('social_media_settings')
      .select('*')
      .eq('platform', 'facebook')
      .single();

    // Buscar configurações do Instagram
    const { data: instagramSettings, error: igError } = await supabase
      .from('social_media_settings')
      .select('*')
      .eq('platform', 'instagram')
      .single();

    const testResults = {
      facebook: {
        found: !!facebookSettings,
        active: facebookSettings?.is_active || false,
        hasToken: !!facebookSettings?.settings?.access_token,
        hasPageId: !!facebookSettings?.settings?.page_id,
        tokenPrefix: facebookSettings?.settings?.access_token?.substring(0, 15) + '...',
        pageId: facebookSettings?.settings?.page_id,
        error: fbError?.message
      },
      instagram: {
        found: !!instagramSettings,
        active: instagramSettings?.is_active || false,
        hasToken: !!instagramSettings?.settings?.access_token,
        hasBusinessId: !!instagramSettings?.settings?.business_id,
        tokenPrefix: instagramSettings?.settings?.access_token?.substring(0, 15) + '...',
        businessId: instagramSettings?.settings?.business_id,
        error: igError?.message
      }
    };

    // Testar tokens se existirem
    if (facebookSettings?.settings?.access_token) {
      try {
        console.log('🔍 [CONFIG TEST] Testando token do Facebook...');
        const fbResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${facebookSettings.settings.access_token}`);
        const fbData = await fbResponse.json();
        
        testResults.facebook.tokenValid = fbResponse.ok;
        testResults.facebook.tokenError = fbData.error?.message;
        testResults.facebook.tokenCode = fbData.error?.code;
        
        if (fbResponse.ok) {
          console.log('✅ [CONFIG TEST] Token do Facebook válido');
        } else {
          console.log('❌ [CONFIG TEST] Token do Facebook inválido:', fbData.error?.message);
        }
      } catch (error) {
        testResults.facebook.tokenValid = false;
        testResults.facebook.tokenError = error.message;
        console.error('❌ [CONFIG TEST] Erro ao testar token do Facebook:', error);
      }
    }

    if (instagramSettings?.settings?.access_token) {
      try {
        console.log('🔍 [CONFIG TEST] Testando token do Instagram...');
        const igResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${instagramSettings.settings.access_token}`);
        const igData = await igResponse.json();
        
        testResults.instagram.tokenValid = igResponse.ok;
        testResults.instagram.tokenError = igData.error?.message;
        testResults.instagram.tokenCode = igData.error?.code;
        
        if (igResponse.ok) {
          console.log('✅ [CONFIG TEST] Token do Instagram válido');
        } else {
          console.log('❌ [CONFIG TEST] Token do Instagram inválido:', igData.error?.message);
        }
      } catch (error) {
        testResults.instagram.tokenValid = false;
        testResults.instagram.tokenError = error.message;
        console.error('❌ [CONFIG TEST] Erro ao testar token do Instagram:', error);
      }
    }

    console.log('🔍 [CONFIG TEST] Resultados completos:', JSON.stringify(testResults, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        results: testResults,
        summary: {
          facebookReady: testResults.facebook.found && testResults.facebook.active && testResults.facebook.hasToken && testResults.facebook.hasPageId && testResults.facebook.tokenValid,
          instagramReady: testResults.instagram.found && testResults.instagram.active && testResults.instagram.hasToken && testResults.instagram.hasBusinessId && testResults.instagram.tokenValid
        }
      }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('❌ [CONFIG TEST] Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});