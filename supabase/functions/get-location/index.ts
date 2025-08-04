import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    console.log('🌍 Iniciando geolocalização por IP...');
    
    // Tentar obter IP do cliente
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
    
    console.log('📍 IP do cliente:', clientIP);
    
    // Se não conseguir IP real, usar dados padrão de Angola
    if (!clientIP || clientIP === 'unknown') {
      console.log('⚠️ IP não detectado, usando localização padrão');
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            country: 'Angola',
            region: 'Luanda',
            city: 'Luanda',
            ip_address: null
          }
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Tentar APIs de geolocalização
    const geoApis = [
      `http://ip-api.com/json/${clientIP}?fields=country,regionName,city,query`,
      `https://ipapi.co/${clientIP}/json/`
    ];

    for (const apiUrl of geoApis) {
      try {
        console.log(`🔍 Tentando API: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
          headers: { 'User-Agent': 'SuperLoja-Analytics/1.0' },
          signal: AbortSignal.timeout(3000) // 3 segundos timeout
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Dados obtidos:', data);
          
          // Normalizar resposta baseado na API
          let normalizedData;
          if (apiUrl.includes('ip-api.com')) {
            normalizedData = {
              country: data.country || 'Angola',
              region: data.regionName || 'Luanda',
              city: data.city || 'Luanda',
              ip_address: data.query || null
            };
          } else {
            normalizedData = {
              country: data.country_name || 'Angola',
              region: data.region || 'Luanda',
              city: data.city || 'Luanda',
              ip_address: data.ip || null
            };
          }

          return new Response(
            JSON.stringify({
              success: true,
              data: normalizedData
            }),
            { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
      } catch (apiError) {
        console.warn(`❌ API ${apiUrl} falhou:`, apiError.message);
        continue;
      }
    }

    // Fallback se todas as APIs falharam
    console.log('⚠️ Todas as APIs falharam, usando dados padrão');
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          country: 'Angola',
          region: 'Luanda',
          city: 'Luanda',
          ip_address: clientIP !== 'unknown' ? clientIP : null
        }
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('❌ Erro na geolocalização:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        data: {
          country: 'Angola',
          region: 'Luanda', 
          city: 'Luanda',
          ip_address: null
        }
      }),
      { 
        status: 200, // Retorna 200 para não quebrar analytics
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});