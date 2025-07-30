import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    console.log('📚 === ADICIONANDO CONHECIMENTOS EM FALTA ===');

    // Verificar se já existem conhecimentos sobre promoções
    const { data: existingPromo } = await supabase
      .from('ai_knowledge_base')
      .select('*')
      .eq('active', true)
      .or(`category.eq.promocao,keywords.cs.{promocao}`);

    console.log('🔍 Conhecimentos sobre promoção existentes:', existingPromo?.length || 0);

    // Se não existe conhecimento sobre promoções, criar
    if (!existingPromo || existingPromo.length === 0) {
      const { data: newPromo, error: promoError } = await supabase
        .from('ai_knowledge_base')
        .insert({
          category: 'promocao',
          question: 'Vocês fazem promoções?',
          answer: 'Sim! Fazemos promoções regulares com descontos especiais. Fique atento às nossas redes sociais e site para não perder as ofertas. Também enviamos alertas pelo WhatsApp para clientes cadastrados. Entre em contato conosco para saber sobre promoções atuais!',
          keywords: ['promocao', 'desconto', 'oferta', 'preco', 'barato'],
          priority: 3,
          active: true
        })
        .select();

      if (promoError) {
        console.error('❌ Erro ao criar conhecimento de promoção:', promoError);
      } else {
        console.log('✅ Conhecimento de promoção criado:', newPromo);
      }
    }

    // Verificar conhecimentos sobre entrega
    const { data: existingDelivery } = await supabase
      .from('ai_knowledge_base')
      .select('*')
      .eq('active', true)
      .or(`category.eq.entrega,keywords.cs.{entrega}`);

    if (!existingDelivery || existingDelivery.length === 0) {
      const { data: newDelivery, error: deliveryError } = await supabase
        .from('ai_knowledge_base')
        .insert({
          category: 'entrega',
          question: 'Como funciona a entrega?',
          answer: 'Entrega GRÁTIS em Luanda! Para outras províncias, calculamos o frete. Entregamos em 24-48h em Luanda. Entre em contato pelo WhatsApp +244 930 000 000 para confirmar endereço e prazo.',
          keywords: ['entrega', 'frete', 'envio', 'prazo', 'gratis'],
          priority: 3,
          active: true
        })
        .select();

      if (deliveryError) {
        console.error('❌ Erro ao criar conhecimento de entrega:', deliveryError);
      } else {
        console.log('✅ Conhecimento de entrega criado:', newDelivery);
      }
    }

    // Verificar todos os conhecimentos ativos após as adições
    const { data: allKnowledge } = await supabase
      .from('ai_knowledge_base')
      .select('*')
      .eq('active', true);

    const result = {
      success: true,
      totalKnowledge: allKnowledge?.length || 0,
      categories: allKnowledge?.reduce((acc: any, item: any) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {}) || {},
      knowledge: allKnowledge?.map((item: any) => ({
        category: item.category,
        question: item.question,
        keywords: item.keywords
      })) || []
    };

    console.log('📊 Resultado final:', result);

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro ao adicionar conhecimentos:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});