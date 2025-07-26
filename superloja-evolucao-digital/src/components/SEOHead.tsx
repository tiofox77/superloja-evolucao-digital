import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useSettings } from '@/contexts/SettingsContext';

interface SEOHeadProps {
  pageType?: 'global' | 'product' | 'category' | 'custom';
  pageSlug?: string;
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  schemaMarkup?: any;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  pageType = 'global',
  pageSlug,
  title,
  description,
  keywords,
  ogImage,
  canonicalUrl,
  schemaMarkup
}) => {
  const { settings } = useSettings();
  const [seoData, setSeoData] = useState<any>(null);

  useEffect(() => {
    const fetchSEOData = async () => {
      try {
        const { data } = await supabase
          .from('seo_settings')
          .select('*')
          .eq('page_type', pageType)
          .eq('page_slug', pageSlug || '')
          .single();
        
        if (data) {
          setSeoData(data);
        }
      } catch (error) {
        console.error('Erro ao carregar dados SEO:', error);
      }
    };

    if (pageType !== 'global') {
      fetchSEOData();
    }
  }, [pageType, pageSlug]);

  // Usar dados SEO do banco ou props como fallback
  const finalTitle = seoData?.title || title || `${settings.store_name} - ${settings.store_description}`;
  const finalDescription = seoData?.description || description || settings.store_description;
  const finalKeywords = seoData?.keywords || keywords || 'eletrônicos, tecnologia, smartphones, Angola';
  
  // Criar URL completa para imagens
  const getFullImageUrl = (imageUrl: string | undefined) => {
    if (!imageUrl) return `${window.location.origin}/src/assets/superloja-logo.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/')) return `${window.location.origin}${imageUrl}`;
    return `${window.location.origin}/${imageUrl}`;
  };
  
  const finalOgImage = getFullImageUrl(seoData?.og_image || ogImage || settings.logo_url);
  const finalCanonicalUrl = seoData?.canonical_url || canonicalUrl || window.location.href;

  const structuredData = seoData?.schema_markup || schemaMarkup || {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": settings.store_name,
    "description": settings.store_description,
    "url": window.location.origin,
    "logo": settings.logo_url || '/src/assets/superloja-logo.png',
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": settings.contact_phone,
      "contactType": "customer service",
      "email": settings.contact_email
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": settings.address
    }
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="robots" content={seoData?.robots || 'index,follow'} />
      <link rel="canonical" href={finalCanonicalUrl} />
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={seoData?.og_title || finalTitle} />
      <meta property="og:description" content={seoData?.og_description || finalDescription} />
      <meta property="og:image" content={finalOgImage} />
      <meta property="og:url" content={finalCanonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={settings.store_name} />
      
      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoData?.twitter_title || finalTitle} />
      <meta name="twitter:description" content={seoData?.twitter_description || finalDescription} />
      <meta name="twitter:image" content={seoData?.twitter_image || finalOgImage} />
      
      {/* Schema.org Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      
      {/* Additional Meta Tags */}
      <meta name="author" content={settings.store_name} />
      <meta name="language" content="pt-AO" />
      <meta name="geo.region" content="AO" />
      <meta name="geo.placename" content="Angola" />
    </Helmet>
  );
};