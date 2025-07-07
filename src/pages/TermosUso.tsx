import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';

const TermosUso = () => {
  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        const { data, error } = await supabase
          .from('static_pages')
          .select('*')
          .eq('page_key', 'terms')
          .eq('is_active', true)
          .single();

        if (error) throw error;
        setPageData(data);
      } catch (error) {
        console.error('Erro ao carregar página:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        pageType="custom"
        title={pageData?.title || "Termos de Uso - SuperLoja Angola"}
        description={pageData?.meta_description || "Termos de uso da SuperLoja"}
      />
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-6">
            {pageData?.title || "Termos de Uso"}
          </h1>
          
          <div className="prose prose-lg max-w-none text-muted-foreground">
            <p>{pageData?.content || "Carregando conteúdo..."}</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermosUso;