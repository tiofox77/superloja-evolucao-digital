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
    const { query } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    console.log('🧪 === TESTE DE BUSCA NA BASE DE CONHECIMENTO ===');
    console.log('🔍 Query recebida:', query);

    // 1. Verificar se existe base de conhecimento ativa
    const { data: allKnowledge, error: allError } = await supabase
      .from('ai_knowledge_base')
      .select('*')
      .eq('active', true);

    if (allError) {
      console.error('❌ Erro ao buscar base de conhecimento:', allError);
      throw allError;
    }

    console.log('📚 Total de conhecimentos ativos:', allKnowledge?.length || 0);
    
    if (allKnowledge && allKnowledge.length > 0) {
      console.log('📋 Conhecimentos disponíveis:');
      allKnowledge.forEach((item, index) => {
        console.log(`${index + 1}. ${item.category} - ${item.question}`);
        console.log(`   Keywords: ${item.keywords.join(', ')}`);
      });
    }

    // 2. Testar busca com a função melhorada
    const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    console.log('🔑 Palavras-chave extraídas:', keywords);
    
    const relevantKnowledge = allKnowledge?.filter(item => {
      const itemText = `${item.question} ${item.answer} ${item.keywords.join(' ')}`.toLowerCase();
      const matches = keywords.some(keyword => itemText.includes(keyword));
      if (matches) {
        console.log(`✅ Match encontrado em: ${item.question}`);
        console.log(`   Texto analisado: ${itemText.substring(0, 100)}...`);
      }
      return matches;
    }) || [];

    console.log('🎯 Conhecimentos relevantes encontrados:', relevantKnowledge.length);

    // 3. Testar busca original
    const { data: originalSearch, error: originalError } = await supabase
      .from('ai_knowledge_base')
      .select('question, answer, category, keywords')
      .eq('active', true)
      .or(`question.ilike.%${query}%,keywords.cs.{${query}}`)
      .limit(1);

    console.log('🔍 Busca original retornou:', originalSearch?.length || 0, 'resultado(s)');

    const result = {
      query,
      keywords,
      totalKnowledge: allKnowledge?.length || 0,
      relevantKnowledge: relevantKnowledge.length,
      originalSearchResults: originalSearch?.length || 0,
      foundKnowledge: relevantKnowledge[0] || null,
      originalResult: originalSearch?.[0] || null,
      allKnowledge: allKnowledge?.map(k => ({
        category: k.category,
        question: k.question,
        keywords: k.keywords
      })) || []
    };

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});