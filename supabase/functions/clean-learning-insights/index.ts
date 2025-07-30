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

    console.log('🧹 === LIMPEZA DE INSIGHTS DUPLICADOS ===');

    // 1. Remover insights de erro relacionados a constraint duplicada
    const { data: deletedErrors } = await supabase
      .from('ai_learning_insights')
      .delete()
      .ilike('content', '%duplicate key value violates unique constraint%')
      .select();

    console.log('🗑️ Insights de erro removidos:', deletedErrors?.length || 0);

    // 2. Remover insights muito antigos (mais de 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: deletedOld } = await supabase
      .from('ai_learning_insights')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString())
      .select();

    console.log('📅 Insights antigos removidos:', deletedOld?.length || 0);

    // 3. Remover insights duplicados (manter apenas o mais recente)
    const { data: duplicates } = await supabase
      .from('ai_learning_insights')
      .select('content, created_at, id')
      .order('created_at', { ascending: false });

    if (duplicates) {
      const seen = new Set();
      const toDelete = [];

      for (const insight of duplicates) {
        if (seen.has(insight.content)) {
          toDelete.push(insight.id);
        } else {
          seen.add(insight.content);
        }
      }

      if (toDelete.length > 0) {
        const { data: deletedDupes } = await supabase
          .from('ai_learning_insights')
          .delete()
          .in('id', toDelete)
          .select();

        console.log('🔄 Insights duplicados removidos:', deletedDupes?.length || 0);
      }
    }

    // 4. Contar insights restantes
    const { count } = await supabase
      .from('ai_learning_insights')
      .select('*', { count: 'exact', head: true });

    const result = {
      success: true,
      removedErrors: deletedErrors?.length || 0,
      removedOld: deletedOld?.length || 0,
      remainingInsights: count || 0,
      message: 'Limpeza de insights concluída com sucesso!'
    };

    console.log('✅ Resultado da limpeza:', result);

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});