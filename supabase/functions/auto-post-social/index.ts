import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutoPostRequest {
  action?: 'generate_content' | 'schedule_post' | 'post_now' | 'get_scheduled';
  platform?: 'facebook' | 'instagram' | 'both';
  product_id?: string;
  custom_prompt?: string;
  schedule_time?: string;
  post_type?: 'product' | 'promotional' | 'engagement' | 'custom';
  banner_base64?: string;
  banner_url?: string;
  // Novos campos para posts diretos
  content?: string;
  post_id?: string;
  table_name?: 'scheduled_posts' | 'weekly_plan_posts';
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
    const requestBody: AutoPostRequest = await req.json();
    const { action, platform, product_id, custom_prompt, schedule_time, post_type, banner_base64, banner_url, content, post_id, table_name } = requestBody;

    // Se recebemos conteúdo direto e post_id, é uma chamada direta para postar um post específico
    if (content && post_id && table_name) {
      console.log('📤 Postagem direta solicitada:', { post_id, table_name, platform });
      
      const result = await postNow(platform, product_id, content, post_type, supabase, banner_base64, banner_url);
      
      // Atualizar status do post na tabela específica
      const { error: updateError } = await supabase
        .from(table_name)
        .update({ 
          status: 'posted',
          scheduled_for: new Date().toISOString()
        })
        .eq('id', post_id);

      if (updateError) {
        console.error('Erro ao atualizar status do post:', updateError);
      }

      return result;
    }

    // Fluxo normal baseado em actions
    switch (action) {
      case 'generate_content':
        return await generateContent(product_id, post_type, custom_prompt, supabase);
      
      case 'schedule_post':
        return await schedulePost(platform, product_id, custom_prompt, schedule_time, post_type, supabase);
      
      case 'post_now':
        return await postNow(platform, product_id, custom_prompt, post_type, supabase, banner_base64, banner_url);
      
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

  const systemPrompt = `Você é um especialista em marketing digital da Superloja, criando posts para Facebook e Instagram.

IDENTIDADE DA MARCA:
- Superloja: Loja online líder em Angola
- Website: www.superloja.ao
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
8. SEMPRE crie 3 sugestões diferentes

TIPOS DE POST:
- product: Foco no produto específico
- promotional: Ofertas e promoções
- engagement: Perguntas e interação
- custom: Baseado no prompt personalizado

${productInfo}

HASHTAGS SUGERIDAS: #Superloja #TecnologiaAngola #GadgetsLuanda #EletronicosAngola #EntregaGratis`;

  let userPrompt = '';
  
  switch (post_type) {
    case 'product':
      userPrompt = `Crie 3 sugestões diferentes de posts atrativos para o produto mencionado. Cada post deve ter abordagem única: 1) Benefícios técnicos, 2) Apelo emocional, 3) Urgência/oferta. Separe cada sugestão com "---".`;
      break;
    case 'promotional':
      userPrompt = `Crie 3 sugestões de posts promocionais chamativos. Varie entre: 1) Desconto/economia, 2) Benefício exclusivo, 3) Oportunidade limitada. Separe cada sugestão com "---".`;
      break;
    case 'engagement':
      userPrompt = `Crie 3 sugestões de posts para gerar interação. Varie entre: 1) Pergunta sobre preferências, 2) Dica útil, 3) Enquete/comparação. Separe cada sugestão com "---".`;
      break;
    case 'custom':
      userPrompt = `${custom_prompt || 'Crie um post criativo para redes sociais'}. Crie 3 variações diferentes do conteúdo. Separe cada sugestão com "---".`;
      break;
    default:
      userPrompt = 'Crie 3 sugestões de posts engajantes para redes sociais. Separe cada sugestão com "---".';
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
      max_tokens: 500,
      temperature: 0.8,
    }),
  });

  const data = await response.json();
  
  if (data.choices && data.choices[0]) {
    const generatedContent = data.choices[0].message.content.trim();
    const suggestions = generatedContent.split('---').map(s => s.trim()).filter(s => s.length > 0);
    
    return new Response(
      JSON.stringify({ 
        suggestions: suggestions.length >= 3 ? suggestions.slice(0, 3) : suggestions,
        content: suggestions[0] || generatedContent, // Para compatibilidade
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
MARCA: Superloja
WEBSITE: www.superloja.ao
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
          quality: 'high',
          response_format: 'b64_json'
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
      
      // Para gpt-image-1 e dall-e-3, obter o base64
      const imageBase64 = data.data[0].b64_json;
      
      if (imageBase64) {
        console.log('✅ [BANNER] Base64 obtido, tamanho:', imageBase64.length);
        return imageBase64;
      } else {
        console.error('❌ [BANNER] Base64 não encontrado na resposta');
        return null;
      }
    } else {
      console.error('❌ [BANNER] Erro na resposta da OpenAI:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ [BANNER] Erro ao gerar banner:', error);
    return null;
  }
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

async function postNow(platform?: string, product_id?: string, custom_prompt?: string, post_type?: string, supabase?: any, banner_base64?: string, banner_url?: string) {
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

    // Se ainda não temos base64 mas recebemos uma URL de banner (ex.: dos planos semanais), converter para base64 para o Facebook
    if (!bannerBase64 && banner_url) {
      try {
        console.log('🖼️ Convertendo banner_url para base64...');
        const imgResp = await fetch(banner_url);
        const buf = await imgResp.arrayBuffer();
        const binary = Array.from(new Uint8Array(buf)).map(b => String.fromCharCode(b)).join('');
        bannerBase64 = btoa(binary);
        console.log('✅ Conversão concluída, tamanho:', bannerBase64.length);
      } catch (e) {
        console.warn('⚠️ Falha ao converter banner_url para base64:', e);
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
        const instagramResult = await postToInstagram(content, product_id, supabase, banner_url);
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
        message: 'Post enviado com sucesso!'
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('❌ Erro no postNow:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

async function postToFacebook(content: string, product_id?: string, supabase?: any, banner_base64?: string) {
  const FACEBOOK_PAGE_ACCESS_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
  
  if (!FACEBOOK_PAGE_ACCESS_TOKEN) {
    throw new Error('Facebook Page Access Token não configurado');
  }

  const FACEBOOK_PAGE_ID = '476690778850970';

  try {
    console.log('📘 [FACEBOOK] Iniciando postagem...');
    
    // Se há uma imagem em base64, fazer upload primeiro
    let photoId = null;
    if (banner_base64) {
      console.log('📷 [FACEBOOK] Fazendo upload da imagem...');
      
      // Converter base64 para blob
      const imageData = Uint8Array.from(atob(banner_base64), c => c.charCodeAt(0));
      
      // Criar form data
      const formData = new FormData();
      formData.append('source', new Blob([imageData], { type: 'image/png' }));
      formData.append('access_token', FACEBOOK_PAGE_ACCESS_TOKEN);
      formData.append('published', 'false'); // Upload não publicado para depois anexar ao post

      const uploadResponse = await fetch(`https://graph.facebook.com/v18.0/${FACEBOOK_PAGE_ID}/photos`, {
        method: 'POST',
        body: formData
      });

      const uploadResult = await uploadResponse.json();
      console.log('📷 [FACEBOOK] Resultado upload:', uploadResult);

      if (uploadResponse.ok && uploadResult.id) {
        photoId = uploadResult.id;
        console.log('✅ [FACEBOOK] Imagem carregada com ID:', photoId);
      } else {
        console.error('❌ [FACEBOOK] Erro no upload da imagem:', uploadResult);
      }
    }

    // Criar o post
    console.log('📝 [FACEBOOK] Criando post...');
    const postData = new URLSearchParams({
      message: content,
      access_token: FACEBOOK_PAGE_ACCESS_TOKEN
    });

    // Se temos uma foto, adicionar ao post
    if (photoId) {
      postData.append('attached_media[0]', JSON.stringify({ media_fbid: photoId }));
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/${FACEBOOK_PAGE_ID}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: postData.toString()
    });

    const result = await response.json();
    console.log('📘 [FACEBOOK] Resultado final:', result);
    
    if (response.ok) {
      return { success: true, post_id: result.id };
    } else {
      throw new Error('Erro ao postar no Facebook: ' + JSON.stringify(result));
    }
  } catch (error) {
    console.error('❌ [FACEBOOK] Erro:', error);
    throw error;
  }
}

async function postToInstagram(content: string, product_id?: string, supabase?: any, banner_url?: string) {
  const INSTAGRAM_ACCESS_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
  const INSTAGRAM_BUSINESS_ID = '17841470006070925';
  
  if (!INSTAGRAM_ACCESS_TOKEN) {
    throw new Error('Instagram Access Token não configurado');
  }

  // Se não há imagem, não podemos postar no Instagram
  if (!banner_url) {
    throw new Error('Instagram requer uma imagem. Banner URL não fornecida.');
  }

  // Criar container de mídia
  const containerResponse = await fetch(`https://graph.facebook.com/v18.0/${INSTAGRAM_BUSINESS_ID}/media`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      image_url: banner_url,
      caption: content,
      access_token: INSTAGRAM_ACCESS_TOKEN
    }).toString()
  });

  const containerResult = await containerResponse.json();
  
  if (!containerResponse.ok) {
    throw new Error('Erro ao criar container do Instagram: ' + JSON.stringify(containerResult));
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