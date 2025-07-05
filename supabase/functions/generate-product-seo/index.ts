import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId, productName, productDescription, categoryName, price, generateOnly } = await req.json();
    
    if (!openAIApiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'OpenAI API key not configured'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Gerar SEO com IA
    const prompt = `
Gere conteúdo SEO otimizado para um produto de e-commerce em Angola:

Produto: ${productName}
Descrição: ${productDescription || 'Não informada'}
Categoria: ${categoryName || 'Eletrônicos'}
Preço: ${price ? `${price} AOA` : 'Não informado'}

Crie:
1. Título SEO (50-60 caracteres)
2. Meta descrição (150-160 caracteres)
3. Palavras-chave (separadas por vírgula)
4. Título para Open Graph
5. Descrição para Open Graph

Foque em:
- SEO para Angola e Luanda
- Palavras-chave relevantes em português
- Call-to-action atrativo
- Incluir benefícios do produto

Formato de resposta em JSON:
{
  "seo_title": "título aqui",
  "seo_description": "descrição aqui",
  "seo_keywords": "palavra1, palavra2, palavra3",
  "og_title": "título og aqui",
  "og_description": "descrição og aqui"
}
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um especialista em SEO para e-commerce em Angola. Crie conteúdo otimizado em português.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const aiResult = await response.json();
    const aiContent = aiResult.choices[0].message.content;

    let seoData;
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        seoData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON não encontrado na resposta');
      }
    } catch (parseError) {
      // Fallback: criar SEO básico se IA falhar
      seoData = {
        seo_title: `${productName} - SuperLoja Angola`,
        seo_description: `Compre ${productName} na SuperLoja com o melhor preço de Angola. ${productDescription?.substring(0, 100) || 'Produto de qualidade com entrega rápida.'}`,
        seo_keywords: `${productName}, ${categoryName}, Angola, Luanda, eletrônicos`,
        og_title: `${productName} - SuperLoja`,
        og_description: `${productDescription?.substring(0, 150) || `Compre ${productName} na SuperLoja Angola`}`
      };
    }

    // Se for apenas para gerar sugestões, retornar sem salvar
    if (generateOnly) {
      return new Response(JSON.stringify(seoData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se productId foi fornecido para salvar
    if (!productId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Product ID is required when not generating only'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Atualizar produto com dados SEO
    const { error: updateError } = await supabase
      .from('products')
      .update({
        seo_title: seoData.seo_title,
        seo_description: seoData.seo_description,
        seo_keywords: seoData.seo_keywords,
        og_image: null // Pode ser definido posteriormente
      })
      .eq('id', productId);

    if (updateError) {
      throw updateError;
    }

    // Salvar configuração SEO específica
    const { error: seoError } = await supabase
      .from('seo_settings')
      .upsert({
        page_type: 'product',
        page_slug: productId,
        title: seoData.seo_title,
        description: seoData.seo_description,
        keywords: seoData.seo_keywords,
        og_title: seoData.og_title,
        og_description: seoData.og_description,
        robots: 'index,follow'
      });

    if (seoError) {
      console.error('Erro ao salvar SEO settings:', seoError);
    }

    console.log(`SEO gerado com sucesso para produto ${productId}`);

    return new Response(JSON.stringify({
      success: true,
      seoData,
      message: 'SEO gerado e aplicado com sucesso'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro ao gerar SEO:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});