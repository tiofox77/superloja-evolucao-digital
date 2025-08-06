import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutoPostRequest {
  action: 'generate_content' | 'schedule_post' | 'post_now' | 'get_scheduled';
  platform?: 'facebook' | 'instagram' | 'both';
  product_id?: string;
  custom_prompt?: string;
  schedule_time?: string;
  post_type?: 'product' | 'promotional' | 'engagement' | 'custom';
  banner_base64?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { action, platform, product_id, custom_prompt, schedule_time, post_type, banner_base64 }: AutoPostRequest = await req.json();

    switch (action) {
      case 'generate_content':
        return await generateContent(product_id, post_type, custom_prompt, supabase);
      
      case 'schedule_post':
        return await schedulePost(platform, product_id, custom_prompt, schedule_time, post_type, supabase);
      
      case 'post_now':
        return await postNow(platform, product_id, custom_prompt, post_type, supabase, banner_base64);
      
      case 'get_scheduled':
        return await getScheduledPosts(supabase);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Ação inválida' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
    }

  } catch (error) {
    console.error('Erro no auto-post:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});

async function generateContent(product_id?: string, post_type?: string, custom_prompt?: string, supabase?: any) {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API Key não configurada');
  }

  let productInfo = '';
  let productData = null;
  
  if (product_id) {
    const { data: product } = await supabase
      .from('products')
      .select('id, name, description, price, image_url')
      .eq('id', product_id)
      .single();
    
    if (product) {
      productData = product;
      productInfo = `
PRODUTO:
- Nome: ${product.name}
- Descrição: ${product.description}
- Preço: ${product.price} AOA
- Imagem: ${product.image_url}
`;
    }
  }

  // Gerar banner automaticamente para qualquer post
  let bannerBase64 = null;
  if (productData) {
    try {
      bannerBase64 = await generateProductBanner(productData, post_type, supabase);
    } catch (error) {
      console.error('Erro ao gerar banner:', error);
    }
  }

  const systemPrompt = `Você é um especialista em marketing digital da SuperLoja Angola, criando posts para Facebook e Instagram.

IDENTIDADE DA MARCA:
- SuperLoja: Loja online líder em Angola
- Especialidade: Eletrônicos, gadgets, smartphones, acessórios
- Tom: Profissional mas descontraído, linguagem angolana moderna
- Público: Jovens e adultos interessados em tecnologia

DIRETRIZES PARA POSTS:
1. Use expressões angolanas naturais mas profissionais
2. Inclua sempre call-to-action
3. Use emojis relevantes mas sem exagero
4. Mencione entrega grátis em Luanda quando relevante
5. Inclua hashtags angolanas e de tecnologia
6. Máximo 280 caracteres para melhor engajamento
7. ${bannerBase64 ? 'IMPORTANTE: Uma imagem promocional será anexada automaticamente ao post' : 'Crie um texto atrativo e descritivo'}

TIPOS DE POST:
- product: Foco no produto específico
- promotional: Ofertas e promoções
- engagement: Perguntas e interação
- custom: Baseado no prompt personalizado

${productInfo}

HASHTAGS SUGERIDAS: #SuperLojaAngola #TecnologiaAngola #GadgetsLuanda #EletronicosAngola #EntregaGratis`;

  let userPrompt = '';
  
  switch (post_type) {
    case 'product':
      userPrompt = `Crie um post atrativo para o produto mencionado. Destaque os benefícios principais e chame para ação de compra.`;
      break;
    case 'promotional':
      userPrompt = `Crie um post promocional chamativo. Use linguagem de urgência e benefícios irresistíveis.`;
      break;
    case 'engagement':
      userPrompt = `Crie um post para gerar interação e comentários. Faça uma pergunta interessante relacionada à tecnologia.`;
      break;
    case 'custom':
      userPrompt = custom_prompt || 'Crie um post criativo para redes sociais.';
      break;
    default:
      userPrompt = 'Crie um post engajante para redes sociais.';
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-2025-04-14',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 200,
      temperature: 0.8,
    }),
  });

  const data = await response.json();
  
  if (data.choices && data.choices[0]) {
    const generatedContent = data.choices[0].message.content.trim();
    
    return new Response(
      JSON.stringify({ 
        content: generatedContent,
        banner_base64: bannerBase64,
        product_info: productInfo ? 'Produto incluído' : 'Sem produto específico',
        has_banner: !!bannerBase64
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } else {
    throw new Error('Erro ao gerar conteúdo com IA');
  }
}

// Função para gerar banner do produto com OpenAI
async function generateProductBanner(productData: any, postType: string, supabase: any) {
  try {
    console.log('🎨 [BANNER] Gerando imagem promocional com OpenAI...');
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.log('❌ [BANNER] OpenAI API Key não configurada');
      return null;
    }

    // Criar prompt para gerar banner promocional
    const backgroundStyle = postType === 'promotional' ? 'laranja vibrante (#E86C00)' : 'roxo moderno (#8B4FA3)';
    const promoText = postType === 'promotional' ? 'OFERTA ESPECIAL!' : '';
    
    const prompt = `Criar banner promocional para rede social (1080x1080px) para produto de tecnologia:
    
PRODUTO: ${productData.name}
PREÇO: ${productData.price} AOA
DESCRIÇÃO: ${productData.description}

DESIGN:
- Fundo: gradiente ${backgroundStyle}
- Logo: "SuperLoja" no topo
- Imagem do produto no centro (baseado na descrição)
- Preço em destaque com fonte grande e clara
- ${promoText ? `Tag "${promoText}" inclinada no canto` : ''}
- Texto "Entrega grátis em Luanda" na parte inferior
- WhatsApp: +244 939729902
- Estilo: moderno, profissional, clean
- Cores: predominantemente ${backgroundStyle} com texto branco

Ultra high resolution, professional marketing banner`;

    // Tentar primeiro com gpt-image-1, depois fallback para dall-e-3
    let response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'high'
      }),
    });

    let data = await response.json();
    
    // Se gpt-image-1 falhar, tentar dall-e-3
    if (data.error) {
      console.log('⚠️ [BANNER] gpt-image-1 falhou, tentando dall-e-3...');
      response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          quality: 'hd',
          response_format: 'b64_json'
        }),
      });
      
      data = await response.json();
    }
    
    if (data.data && data.data[0]) {
      console.log('✅ [BANNER] Imagem gerada com sucesso');
      // Para gpt-image-1, a resposta sempre vem em base64
      return data.data[0].b64_json || data.data[0]; 
    } else {
      console.error('❌ [BANNER] Erro na resposta da OpenAI:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ [BANNER] Erro ao gerar banner:', error);
    return null;
  }
}

// Função para criar HTML do banner
function createBannerHtml(product: any, config: any, postType: string, logoUrl: string) {
  const promoTag = postType === 'promotional' ? 
    `<div style="background: #FF6B35; color: white; padding: 10px 20px; border-radius: 20px; font-size: 24px; font-weight: bold; position: absolute; top: 80px; right: 40px; transform: rotate(15deg); box-shadow: 0 4px 15px rgba(0,0,0,0.3);">OFERTA ESPECIAL!</div>` : '';

  return `
    <div style="width: ${config.width}px; height: ${config.height}px; background: ${config.background}; color: ${config.textColor}; position: relative; font-family: Arial, sans-serif; overflow: hidden; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px; box-sizing: border-box;">
      ${promoTag}
      
      ${logoUrl ? `<div style="width: 120px; height: 120px; background: rgba(255,255,255,0.1); border-radius: 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); border: 2px solid rgba(255,255,255,0.2); margin-bottom: 30px;">
        <img src="${logoUrl}" style="max-width: 80px; max-height: 80px; object-fit: contain;" />
      </div>` : ''}
      
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
        ${product.image_url ? `<img src="${product.image_url}" style="max-width: 300px; max-height: 300px; object-fit: contain; border-radius: 15px; box-shadow: 0 8px 25px rgba(0,0,0,0.3); margin-bottom: 30px;" />` : ''}
        
        <h2 style="font-size: 48px; font-weight: bold; margin: 0 0 20px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); line-height: 1.2;">${product.name}</h2>
        
        <div style="font-size: 42px; font-weight: bold; background: rgba(255,255,255,0.2); padding: 15px 30px; border-radius: 25px; margin: 20px 0; border: 3px solid ${config.textColor};">${product.price.toLocaleString()} AOA</div>
      </div>
      
      <div style="font-size: 24px; opacity: 0.9; text-align: center;">
        <div style="font-weight: bold; margin-bottom: 5px;">SuperLoja</div>
        <div>Entrega grátis em Luanda • www.superloja.ao</div>
      </div>
    </div>
  `;
}

async function schedulePost(platform?: string, product_id?: string, custom_prompt?: string, schedule_time?: string, post_type?: string, supabase?: any) {
  // Gerar conteúdo primeiro
  const contentResponse = await generateContent(product_id, post_type, custom_prompt, supabase);
  const contentData = await contentResponse.json();
  
  // Salvar post agendado
  const { data: scheduledPost, error } = await supabase
    .from('scheduled_posts')
    .insert({
      platform: platform || 'both',
      content: contentData.content,
      product_id: product_id,
      scheduled_for: schedule_time,
      post_type: post_type || 'custom',
      status: 'scheduled',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error('Erro ao agendar post: ' + error.message);
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      scheduled_post: scheduledPost,
      message: 'Post agendado com sucesso!'
    }),
    { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

async function postNow(platform?: string, product_id?: string, custom_prompt?: string, post_type?: string, supabase?: any, banner_base64?: string) {
  try {
    console.log('🚀 Iniciando postagem imediata:', { platform, product_id, post_type });
    
    let content = custom_prompt;
    let bannerBase64 = banner_base64;

    // Se não há conteúdo custom, gera conteúdo
    if (!content) {
      const contentResponse = await generateContent(product_id, post_type, custom_prompt, supabase);
      const contentData = await contentResponse.json();
      content = contentData.content;
      
      // Se não foi fornecido banner, usar o gerado
      if (!bannerBase64) {
        bannerBase64 = contentData.banner_base64;
      }
    }
    
    console.log('📝 Conteúdo gerado:', {
      content,
      product_id,
      bannerBase64: bannerBase64 ? 'presente' : 'ausente',
      bannerLength: bannerBase64?.length
    });
    
    // Postar nas redes sociais
    const results = [];
    
    if (platform === 'facebook' || platform === 'both') {
      try {
        console.log('📘 Postando no Facebook...');
        const facebookResult = await postToFacebook(content, product_id, supabase, bannerBase64);
        results.push({ platform: 'facebook', ...facebookResult });
        console.log('✅ Facebook result:', facebookResult);
      } catch (error) {
        console.error('❌ Erro no Facebook:', error);
        results.push({ platform: 'facebook', success: false, error: error.message });
      }
    }
    
    if (platform === 'instagram' || platform === 'both') {
      try {
        console.log('📷 Postando no Instagram...');
        const instagramResult = await postToInstagram(content, product_id, supabase);
        results.push({ platform: 'instagram', ...instagramResult });
        console.log('✅ Instagram result:', instagramResult);
      } catch (error) {
        console.error('❌ Erro no Instagram:', error);
        results.push({ platform: 'instagram', success: false, error: error.message });
      }
    }

    // Salvar histórico
    console.log('💾 Salvando histórico...');
    const { error: historyError } = await supabase
      .from('social_posts_history')
      .insert({
        platform: platform,
        content: content,
        product_id: product_id,
        post_type: post_type,
        results: results,
        posted_at: new Date().toISOString()
      });

    if (historyError) {
      console.error('❌ Erro ao salvar histórico:', historyError);
    } else {
      console.log('✅ Histórico salvo com sucesso');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        content: content,
        results: results,
        has_banner: !!bannerBase64
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('❌ Erro geral em postNow:', error);
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
}

async function postToFacebook(content: string, product_id?: string, supabase?: any, bannerBase64?: string) {
  console.log('🔍 [FACEBOOK DEBUG] Iniciando postagem...');
  console.log('🔍 [FACEBOOK DEBUG] Parâmetros recebidos:', { 
    content: content ? 'presente' : 'ausente',
    product_id: product_id || 'não informado',
    bannerBase64: bannerBase64 ? 'presente' : 'ausente',
    bannerLength: bannerBase64 ? bannerBase64.length : 0
  });
  
  // Buscar configurações do banco de dados
  const { data: settings, error: settingsError } = await supabase
    .from('social_media_settings')
    .select('settings')
    .eq('platform', 'facebook')
    .eq('is_active', true)
    .single();
  
  console.log('🔍 [FACEBOOK DEBUG] Configurações encontradas:', {
    hasSettings: !!settings,
    settingsError,
    hasAccessToken: !!settings?.settings?.access_token,
    hasPageId: !!settings?.settings?.page_id,
    tokenPrefix: settings?.settings?.access_token?.substring(0, 10) + '...',
    pageId: settings?.settings?.page_id,
    hasBanner: !!bannerBase64
  });
  
  if (!settings?.settings?.access_token || !settings?.settings?.page_id) {
    throw new Error('Token do Facebook não configurado');
  }
  
  const FACEBOOK_PAGE_ACCESS_TOKEN = settings.settings.access_token;
  const FACEBOOK_PAGE_ID = settings.settings.page_id;

  // Primeiro obter o Page Access Token
  console.log('🔍 [FACEBOOK DEBUG] Obtendo Page Token...');
  const pageTokenResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${FACEBOOK_PAGE_ACCESS_TOKEN}`);
  const pageTokenData = await pageTokenResponse.json();
  
  console.log('🔍 [FACEBOOK DEBUG] Resposta das páginas:', {
    success: pageTokenResponse.ok,
    hasData: !!pageTokenData.data,
    pagesCount: pageTokenData.data?.length || 0,
    targetPageId: FACEBOOK_PAGE_ID
  });
  
  const pageInfo = pageTokenData.data?.find((page: any) => page.id === FACEBOOK_PAGE_ID);
  if (!pageInfo) {
    throw new Error('Página não encontrada ou sem acesso');
  }
  
  console.log('✅ [FACEBOOK DEBUG] Página encontrada:', {
    name: pageInfo.name,
    hasToken: !!pageInfo.access_token
  });

  // Se temos banner gerado, postar como foto com legenda
  if (bannerBase64) {
    console.log('📷 [FACEBOOK DEBUG] Postando imagem gerada...');
    
    // Converter base64 para blob
    console.log('🔍 [FACEBOOK DEBUG] Convertendo base64 para blob...');
    
    let imageBlob;
    try {
      const binaryString = atob(bannerBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      imageBlob = new Blob([bytes], { type: 'image/png' });
      console.log('✅ [FACEBOOK DEBUG] Base64 convertido, tamanho:', bytes.length, 'blob size:', imageBlob.size);
    } catch (error) {
      console.error('❌ [FACEBOOK DEBUG] Erro ao converter base64:', error);
      throw new Error('Erro ao processar imagem gerada: ' + error.message);
    }
    
    // Criar FormData para upload da imagem
    console.log('🔍 [FACEBOOK DEBUG] Criando FormData para upload...');
    const formData = new FormData();
    formData.append('source', imageBlob);
    formData.append('message', content);
    formData.append('access_token', pageInfo.access_token);
    
    console.log('🔍 [FACEBOOK DEBUG] FormData criado:', {
      blobSize: imageBlob.size,
      messageLength: content.length,
      hasAccessToken: !!pageInfo.access_token
    });
    
    console.log('🔍 [FACEBOOK DEBUG] Enviando para Facebook API...');
    const response = await fetch(`https://graph.facebook.com/v18.0/${FACEBOOK_PAGE_ID}/photos`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    console.log('🔍 [FACEBOOK DEBUG] Resposta da API:', {
      status: response.status,
      ok: response.ok,
      result: result
    });
    
    if (response.ok) {
      console.log('✅ [FACEBOOK DEBUG] Imagem postada com sucesso:', result.id);
      return { success: true, post_id: result.id, used_banner: true };
    } else {
      console.error('❌ [FACEBOOK DEBUG] Erro ao postar imagem:', result);
      throw new Error('Erro no Facebook: ' + JSON.stringify(result));
    }
  } else {
    // Post de texto apenas ou com link de imagem do produto
    console.log('📝 [FACEBOOK DEBUG] Postando texto...');
    
    let postData: any = {
      message: content,
      access_token: pageInfo.access_token
    };

    // Adicionar imagem do produto se houver
    if (product_id) {
      const { data: product } = await supabase
        .from('products')
        .select('image_url')
        .eq('id', product_id)
        .single();
      
      if (product?.image_url) {
        postData.link = product.image_url;
      }
    }
    
    const response = await fetch(`https://graph.facebook.com/v18.0/${FACEBOOK_PAGE_ID}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(postData).toString()
    });

    const result = await response.json();
    
    if (response.ok) {
      return { success: true, post_id: result.id };
    } else {
      throw new Error('Erro no Facebook: ' + JSON.stringify(result));
    }
  }
}

async function postToInstagram(content: string, product_id?: string, supabase?: any) {
  console.log('🔍 [INSTAGRAM DEBUG] Iniciando postagem...');
  
  // Buscar configurações do banco de dados
  const { data: settings, error: settingsError } = await supabase
    .from('social_media_settings')
    .select('settings')
    .eq('platform', 'instagram')
    .eq('is_active', true)
    .single();
  
  console.log('🔍 [INSTAGRAM DEBUG] Configurações encontradas:', {
    hasSettings: !!settings,
    settingsError,
    hasAccessToken: !!settings?.settings?.access_token,
    hasBusinessId: !!settings?.settings?.business_id,
    tokenPrefix: settings?.settings?.access_token?.substring(0, 10) + '...',
    businessId: settings?.settings?.business_id
  });
  
  if (!settings?.settings?.access_token || !settings?.settings?.business_id) {
    throw new Error('Credenciais do Instagram não configuradas');
  }
  
  const INSTAGRAM_ACCESS_TOKEN = settings.settings.access_token;
  const INSTAGRAM_BUSINESS_ID = settings.settings.business_id;

  // Instagram requer imagem para posts
  let imageUrl = 'https://fijbvihinhuedkvkxwir.supabase.co/storage/v1/object/public/product-images/default-post.jpg';
  
  if (product_id) {
    const { data: product } = await supabase
      .from('products')
      .select('image_url')
      .eq('id', product_id)
      .single();
    
    if (product?.image_url) {
      imageUrl = product.image_url;
    }
  }

  // Criar container de mídia
  const containerResponse = await fetch(`https://graph.facebook.com/v18.0/${INSTAGRAM_BUSINESS_ID}/media`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      image_url: imageUrl,
      caption: content,
      access_token: INSTAGRAM_ACCESS_TOKEN
    }).toString()
  });

  const containerResult = await containerResponse.json();
  
  if (!containerResponse.ok) {
    throw new Error('Erro ao criar container Instagram: ' + JSON.stringify(containerResult));
  }

  // Publicar o container
  const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${INSTAGRAM_BUSINESS_ID}/media_publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      creation_id: containerResult.id,
      access_token: INSTAGRAM_ACCESS_TOKEN
    }).toString()
  });

  const publishResult = await publishResponse.json();
  
  if (publishResponse.ok) {
    return { success: true, post_id: publishResult.id };
  } else {
    throw new Error('Erro ao publicar no Instagram: ' + JSON.stringify(publishResult));
  }
}

async function getScheduledPosts(supabase: any) {
  const { data: scheduledPosts, error } = await supabase
    .from('scheduled_posts')
    .select(`
      *,
      products(name, image_url)
    `)
    .eq('status', 'scheduled')
    .order('scheduled_for', { ascending: true });

  if (error) {
    throw new Error('Erro ao buscar posts agendados: ' + error.message);
  }

  return new Response(
    JSON.stringify({ scheduled_posts: scheduledPosts }),
    { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}