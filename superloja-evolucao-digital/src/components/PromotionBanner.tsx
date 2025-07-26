import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Promotion {
  id: string;
  name: string;
  description: string;
  active: boolean;
  start_date: string;
  end_date: string;
}

export const PromotionBanner: React.FC = () => {
  const [activePromotion, setActivePromotion] = useState<Promotion | null>(null);

  useEffect(() => {
    loadActivePromotion();
  }, []);

  const loadActivePromotion = async () => {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('active', true)
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      setActivePromotion(data);
    } catch (error) {
      console.error('Erro ao carregar promoção:', error);
    }
  };

  if (!activePromotion) {
    return null;
  }

  return (
    <div className="bg-primary text-primary-foreground py-2">
      <div className="container mx-auto px-4 text-center text-sm">
        <span className="animate-pulse">
          🔥 {activePromotion.name} - {activePromotion.description}
        </span>
      </div>
    </div>
  );
};