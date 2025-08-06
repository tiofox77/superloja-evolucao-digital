import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Verificar se há uma ação específica no body da request
    let action = 'process_all'; // default
    try {
      const body = await req.json();
      action = body.action || 'process_all';
    } catch {
      // Se não conseguir fazer parse do JSON, usa a ação padrão
    }
    console.log(`🔄 Ação solicitada: ${action}`);

    let statusFilter = [];
    let shouldGenerateContent = false;
    let shouldPostContent = false;

    switch (action) {
      case 'generate_only':
        statusFilter = ['pending'];
        shouldGenerateContent = true;
        shouldPostContent = false;
        break;
      case 'post_generated':
        statusFilter = ['generated'];
        shouldGenerateContent = false;
        shouldPostContent = true;
        break;
      default:
        statusFilter = ['pending', 'generated'];
        shouldGenerateContent = true;
        shouldPostContent = true;
    }

    // Buscar posts para processar baseado na ação
    const now = new Date();
    const { data: pendingPosts, error: postsError } = await supabase
      .from('weekly_plan_posts')
      .select(`
        *,
        weekly_posting_plans!inner(status),
        products(id, name, price, image_url)
      `)
      .in('status', statusFilter)
      .eq('weekly_posting_plans.status', 'active')
      .lte('scheduled_for', now.toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(10);

    if (postsError) {
      console.error('❌ Erro ao buscar posts pendentes:', postsError);
      throw postsError;
    }

    console.log(`📝 Encontrados ${pendingPosts?.length || 0} posts para processar`);

    const results = [];

    for (const post of pendingPosts || []) {
      try {
        console.log(`🚀 Processando post ID ${post.id} - ${post.post_type} - Status: ${post.status} - Ação: ${action}`);

        let contentResult = null;
        
        // Se deve gerar conteúdo e o post não tem conteúdo ainda
        if (shouldGenerateContent && (!post.generated_content || post.status === 'pending')) {
          contentResult = await generateContent(post, supabase);
          
          if (contentResult) {
            // Atualizar status para 'generated'
            await supabase
              .from('weekly_plan_posts')
              .update({
                status: 'generated',
                generated_content: contentResult.content,
                banner_url: contentResult.banner_url,
                updated_at: new Date().toISOString()
              })
              .eq('id', post.id);
            console.log('📝 Conteúdo gerado e salvo');
          }
        } else if (post.status === 'generated' && post.generated_content) {
          // Se o post já tem conteúdo gerado, usa ele
          contentResult = {
            content: post.generated_content,
            banner_url: post.banner_url
          };
          console.log('📝 Usando conteúdo já gerado');
        }
        
        // Se deve postar e temos conteúdo
        if (shouldPostContent && contentResult) {
          const postResult = await postToSocialMedia(post, contentResult, supabase);
          
          if (postResult.success) {
            await supabase
              .from('weekly_plan_posts')
              .update({
                status: 'posted',
                updated_at: new Date().toISOString()
              })
              .eq('id', post.id);
            
            results.push({
              post_id: post.id,
              status: 'posted',
              platform: post.platform,
              success: true
            });
          } else {
            await supabase
              .from('weekly_plan_posts')
              .update({
                status: 'failed',
                error_message: postResult.error,
                updated_at: new Date().toISOString()
              })
              .eq('id', post.id);

            results.push({
              post_id: post.id,
              status: 'failed',
              platform: post.platform,
              success: false,
              error: postResult.error
            });
          }
        } else if (!shouldPostContent && contentResult) {
          // Se só estava gerando conteúdo
          results.push({
            post_id: post.id,
            status: 'generated',
            platform: post.platform,
            success: true
          });
        } else {
          console.error('❌ Falha ao obter conteúdo para o post');
          results.push({
            post_id: post.id,
            status: 'failed',
            platform: post.platform,
            success: false,
            error: 'Falha ao gerar conteúdo'
          });
        }
      } catch (error) {
        console.error(`❌ Erro ao processar post ${post.id}:`, error);
        
        await supabase
          .from('weekly_plan_posts')
          .update({
            status: 'failed',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', post.id);

        results.push({
          post_id: post.id,
          status: 'failed',
          platform: post.platform,
          success: false,
          error: error.message
        });
      }
    }

    console.log('✅ Processamento concluído:', results);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results: results
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('❌ Erro geral no processamento:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});

async function generateContent(post: any, supabase: any) {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  
  if (!OPENAI_API_KEY) {
    console.warn('⚠️ OpenAI API Key não configurada');
    return null;
  }

  try {
    let productInfo = '';
    if (post.products) {
      productInfo = `
PRODUTO:
- Nome: ${post.products.name}
- Preço: ${post.products.price} AOA
- Imagem: ${post.products.image_url}
`;
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

${productInfo}

HASHTAGS SUGERIDAS: #SuperLojaAngola #TecnologiaAngola #GadgetsLuanda #EletronicosAngola #EntregaGratis`;

    let userPrompt = '';
    switch (post.post_type) {
      case 'product':
        userPrompt = 'Crie um post atrativo para o produto mencionado. Destaque os benefícios principais e chame para ação de compra.';
        break;
      case 'promotional':
        userPrompt = 'Crie um post promocional chamativo. Use linguagem de urgência e benefícios irresistíveis.';
        break;
      case 'engagement':
        userPrompt = 'Crie um post para gerar interação e comentários. Faça uma pergunta interessante relacionada à tecnologia.';
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
      return {
        content: data.choices[0].message.content.trim(),
        banner_url: null // Banner será gerado no frontend se necessário
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erro ao gerar conteúdo IA:', error);
    return null;
  }
}

async function postToSocialMedia(post: any, content: any, supabase: any) {
  try {
    console.log(`📱 Postando no ${post.platform}: ${content.content.substring(0, 50)}...`);
    
    const { data: result, error } = await supabase.functions.invoke('auto-post-social', {
      body: {
        action: 'post_now',
        platform: post.platform,
        product_id: post.product_id,
        custom_prompt: content.content,
        post_type: post.post_type
      }
    });

    if (error) {
      console.error('❌ Erro ao chamar auto-post-social:', error);
      return { success: false, error: error.message };
    }

    if (result?.success) {
      console.log('✅ Post publicado com sucesso no', post.platform);
      return { success: true };
    } else {
      console.error('❌ Falha na publicação:', result?.error);
      return { success: false, error: result?.error || 'Falha na publicação' };
    }
  } catch (error) {
    console.error('❌ Erro ao postar nas redes sociais:', error);
    return { success: false, error: error.message };
  }
}