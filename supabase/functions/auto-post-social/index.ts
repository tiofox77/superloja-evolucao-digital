import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para buscar configurações dos tokens das tabelas do banco
async function getSocialMediaTokens(supabase: any) {
  console.log('🔑 Buscando tokens das configurações...');
  
  try {
    // Buscar configurações do Facebook/Instagram
    const { data: socialSettings, error: socialError } = await supabase
      .from('social_media_settings')
      .select('platform, settings, is_active')
      .in('platform', ['facebook', 'instagram'])
      .eq('is_active', true);

    if (socialError) {
      console.error('❌ Erro ao buscar social_media_settings:', socialError);
    }

    // Buscar configurações da Meta (nova tabela)
    const { data: metaSettings, error: metaError } = await supabase
      .from('meta_settings')
      .select('access_token, page_id, instagram_id, app_id, app_secret')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (metaError) {
      console.error('❌ Erro ao buscar meta_settings:', metaError);
    }

    const tokens = {
      facebook: {
        access_token: '',
        page_id: ''
      },
      instagram: {
        access_token: '',
        business_id: ''
      }
    };

    // Priorizar meta_settings se disponível
    if (metaSettings?.access_token) {
      console.log('✅ Usando tokens da meta_settings');
      tokens.facebook.access_token = metaSettings.access_token;
      tokens.facebook.page_id = metaSettings.page_id || '';
      tokens.instagram.access_token = metaSettings.access_token;
      tokens.instagram.business_id = metaSettings.instagram_id || '';
    } else if (socialSettings?.length > 0) {
      console.log('✅ Usando tokens da social_media_settings');
      // Fallback para social_media_settings
      socialSettings.forEach(setting => {
        if (setting.platform === 'facebook' && setting.settings) {
          tokens.facebook.access_token = setting.settings.access_token || '';
          tokens.facebook.page_id = setting.settings.page_id || '';
        } else if (setting.platform === 'instagram' && setting.settings) {
          tokens.instagram.access_token = setting.settings.access_token || '';
          tokens.instagram.business_id = setting.settings.business_id || '';
        }
      });
    }

    console.log('🔑 Tokens carregados:', {
      facebook: { 
        hasToken: !!tokens.facebook.access_token,
        hasPageId: !!tokens.facebook.page_id 
      },
      instagram: { 
        hasToken: !!tokens.instagram.access_token,
        hasBusinessId: !!tokens.instagram.business_id 
      }
    });

    return tokens;
  } catch (error) {
    console.error('❌ Erro ao buscar tokens:', error);
    return {
      facebook: { access_token: '', page_id: '' },
      instagram: { access_token: '', business_id: '' }
    };
  }
}

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
      
      const result: any = await postNow(platform, product_id, content, post_type, supabase, banner_base64, banner_url);
      
      const overallSuccess = !!result?.success;
      
      // Atualizar status do post na tabela específica
      const { error: updateError } = await supabase
        .from(table_name)
        .update({ 
          status: overallSuccess ? 'posted' : 'failed',
          scheduled_for: new Date().toISOString()
        })
        .eq('id', post_id);

      if (updateError) {
        console.error('Erro ao atualizar status do post:', updateError);
      }

      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Fluxo normal baseado em actions
    switch (action) {
      case 'generate_content':
        return await generateContent(product_id, post_type, custom_prompt, supabase);
      
      case 'schedule_post':
        return await schedulePost(platform, product_id, custom_prompt, schedule_time, post_type, supabase);
      
      case 'post_now': {
        const result: any = await postNow(platform, product_id, custom_prompt, post_type, supabase, banner_base64, banner_url);
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      
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

    const overallSuccess = results.some((r: any) => r?.success === true);

    return {
      success: overallSuccess,
      content,
      results,
      message: overallSuccess ? 'Post enviado com sucesso!' : 'Falha ao postar — ver detalhes',
    } as any;

  } catch (error: any) {
    console.error('❌ Erro no postNow:', error);
    return {
      success: false,
      content: content ?? '',
      results: [],
      message: 'Erro ao enviar post',
      error: error.message,
    } as any;
  }
}

async function postToFacebook(content: string, product_id?: string, supabase?: any, banner_base64?: string) {
  // Buscar tokens das configurações do banco
  const tokens = await getSocialMediaTokens(supabase);
  
  if (!tokens.facebook.access_token) {
    throw new Error('Facebook Access Token não configurado nas configurações');
  }

  if (!tokens.facebook.page_id) {
    throw new Error('Facebook Page ID não configurado nas configurações');
  }

  const FACEBOOK_PAGE_ACCESS_TOKEN = tokens.facebook.access_token;
  const FACEBOOK_PAGE_ID = tokens.facebook.page_id;

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

      const uploadResponse = await fetch(`https://graph.facebook.com/v23.0/${FACEBOOK_PAGE_ID}/photos`, {
        method: 'POST',
        body: formData
      });

      const uploadResult = await uploadResponse.json();
      console.log('📷 [FACEBOOK] Resultado upload:', uploadResult);

      if (uploadResponse.ok && uploadResult.id) {
        photoId = uploadResult.id;
        console.log('✅ [FACEBOOK] Upload da imagem bem-sucedido, ID:', photoId);
      } else {
        console.error('❌ [FACEBOOK] Falha no upload da imagem:', uploadResult);
        // Continue sem imagem se o upload falhar
      }
    }

    // Criar o post
    const postUrl = `https://graph.facebook.com/v23.0/${FACEBOOK_PAGE_ID}/feed`;
    const postData: any = {
      message: content,
      access_token: FACEBOOK_PAGE_ACCESS_TOKEN
    };

    // Adicionar imagem se disponível
    if (photoId) {
      postData.object_attachment = photoId;
    }

    console.log('📘 [FACEBOOK] Criando post com dados:', { 
      hasMessage: !!postData.message, 
      hasPhoto: !!photoId,
      pageId: FACEBOOK_PAGE_ID 
    });
    
    const postResponse = await fetch(postUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });

    const postResult = await postResponse.json();
    console.log('📘 [FACEBOOK] Resultado do post:', postResult);

    if (postResponse.ok && postResult.id) {
      console.log('✅ [FACEBOOK] Post criado com sucesso:', postResult.id);
      return { success: true, post_id: postResult.id };
    } else {
      console.error('❌ [FACEBOOK] Erro ao criar post:', postResult);
      
      // Verificar se é erro de permissões
      if (postResult.error?.code === 200) {
        return { 
          success: false, 
          error: `Erro de permissões: ${postResult.error.message}. Verifique se o token tem as permissões 'pages_manage_posts' e 'pages_read_engagement'.`
        };
      }
      
      return { 
        success: false, 
        error: postResult.error?.message || 'Erro desconhecido ao postar no Facebook' 
      };
    }
  } catch (error: any) {
    console.error('❌ [FACEBOOK] Erro geral:', error);
    return { success: false, error: error.message };
  }
}

async function postToInstagram(content: string, product_id?: string, supabase?: any, banner_url?: string) {
  // Buscar tokens das configurações do banco
  const tokens = await getSocialMediaTokens(supabase);
  
  if (!tokens.instagram.access_token) {
    throw new Error('Instagram Access Token não configurado nas configurações');
  }

  if (!tokens.instagram.business_id) {
    throw new Error('Instagram Business ID não configurado nas configurações');
  }

  const INSTAGRAM_ACCESS_TOKEN = tokens.instagram.access_token;
  const INSTAGRAM_BUSINESS_ID = tokens.instagram.business_id;

  try {
    console.log('📷 [INSTAGRAM] Iniciando postagem...');
    
    if (banner_url) {
      // Post com imagem
      console.log('📷 [INSTAGRAM] Postando com imagem...');
      
      // Primeiro, criar container de mídia
      const containerResponse = await fetch(`https://graph.facebook.com/v23.0/${INSTAGRAM_BUSINESS_ID}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: banner_url,
          caption: content,
          access_token: INSTAGRAM_ACCESS_TOKEN
        })
      });

      const containerResult = await containerResponse.json();
      console.log('📷 [INSTAGRAM] Container criado:', containerResult);

      if (!containerResponse.ok || !containerResult.id) {
        console.error('❌ [INSTAGRAM] Erro ao criar container:', containerResult);
        return { success: false, error: containerResult.error?.message || 'Erro ao criar container de mídia' };
      }

      // Aguardar processamento e publicar
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2 segundos
        
        const publishResponse = await fetch(`https://graph.facebook.com/v23.0/${INSTAGRAM_BUSINESS_ID}/media_publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: containerResult.id,
            access_token: INSTAGRAM_ACCESS_TOKEN
          })
        });

        const publishResult = await publishResponse.json();
        console.log(`📷 [INSTAGRAM] Tentativa ${attempts + 1} de publicação:`, publishResult);

        if (publishResponse.ok && publishResult.id) {
          console.log('✅ [INSTAGRAM] Post publicado com sucesso:', publishResult.id);
          return { success: true, post_id: publishResult.id };
        } else if (publishResult.error?.message?.includes('try again')) {
          attempts++;
          continue;
        } else {
          console.error('❌ [INSTAGRAM] Erro na publicação:', publishResult);
          return { success: false, error: publishResult.error?.message || 'Erro ao publicar no Instagram' };
        }
      }
      
      return { success: false, error: 'Timeout ao publicar no Instagram' };
    } else {
      // Post apenas com texto (não suportado no Instagram)
      console.log('⚠️ [INSTAGRAM] Instagram requer imagem - pulando post somente texto');
      return { success: false, error: 'Instagram requer uma imagem para posts' };
    }
    
  } catch (error: any) {
    console.error('❌ [INSTAGRAM] Erro geral:', error);
    return { success: false, error: error.message };
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