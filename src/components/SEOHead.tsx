import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSettings } from '@/contexts/SettingsContext';
import { useLocation } from 'react-router-dom';
import { SEOAnalytics } from './SEOAnalytics';

interface SEOHeadProps {
  pageType?: 'global' | 'product' | 'category' | 'admin' | 'custom';
  pageSlug?: string;
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  schemaMarkup?: any;
  productData?: any;
  categoryData?: any;
}

// Dados SEO dinâmicos para diferentes tipos de página
const getDynamicSEOData = (pageType: string, slug?: string, productData?: any, categoryData?: any, location?: any, settings?: any) => {
  const baseUrl = window.location.origin;
  const currentPath = location?.pathname || '/';
  
  // Usar configurações dinâmicas do admin ou fallback para valores padrão
  const storeName = settings?.store_name || 'SuperLoja';
  const storeDescription = settings?.store_description || 'A melhor loja de eletrônicos de Angola';
  const logoUrl = settings?.logo_url || `${baseUrl}/src/assets/superloja-logo.png`;
  
  const defaultSEO = {
    title: `${storeName} - ${storeDescription}`,
    description: `Descubra os melhores produtos tecnológicos com ofertas imperdíveis. Smartphones, computadores, acessórios e muito mais na ${storeName}!`,
    keywords: `eletrônicos Angola, tecnologia Luanda, smartphones, computadores, loja online Angola, ${storeName}`,
    ogImage: logoUrl,
    canonical: `${baseUrl}${currentPath}`,
    robots: 'index,follow',
    siteName: storeName,
    favicon: settings?.favicon_url || `${baseUrl}/favicon.ico`
  };

  switch (pageType) {
    case 'product':
      const productName = productData?.name || (slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Produto');
      const productPrice = productData?.price ? `por apenas ${productData.price} AOA` : 'com o melhor preço';
      
      return {
        ...defaultSEO,
        title: `${productName} - ${storeName}`,
        description: `Compre ${productName} na ${storeName} ${productPrice}. Produto de qualidade com garantia. Entrega rápida em Angola.`,
        keywords: `${productName.toLowerCase()}, Angola, eletrônicos, ${storeName}, tecnologia, ${productData?.category || 'produtos'}, comprar online`,
        ogImage: productData?.image || defaultSEO.ogImage,
        canonical: `${baseUrl}/produto/${slug}`,
        schema: {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: productName,
          description: `Compre ${productName} na ${storeName} ${productPrice}. Produto de qualidade com garantia.`,
          image: productData?.image || defaultSEO.ogImage,
          brand: {
            '@type': 'Brand',
            name: storeName
          },
          offers: {
            '@type': 'Offer',
            price: productData?.price || '0',
            priceCurrency: 'AOA',
            availability: 'https://schema.org/InStock',
            seller: {
              '@type': 'Organization',
              name: storeName
            }
          }
        }
      };

    case 'category':
      const categoryName = categoryData?.name || (slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Categoria');
      
      return {
        ...defaultSEO,
        title: `${categoryName} - ${storeName}`,
        description: `Explore nossa seleção de ${categoryName.toLowerCase()} com os melhores preços de Angola. Produtos de qualidade na ${storeName}!`,
        keywords: `${categoryName.toLowerCase()}, Angola, eletrônicos, ${storeName}, tecnologia, produtos, loja online`,
        canonical: `${baseUrl}/categoria/${slug}`,
        schema: {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `${categoryName} - ${storeName}`,
          description: `Explore nossa seleção de ${categoryName.toLowerCase()} com os melhores preços de Angola.`,
          url: `${baseUrl}/categoria/${slug}`
        }
      };

    case 'admin':
      return {
        ...defaultSEO,
        title: `Administração - ${storeName}`,
        description: `Painel administrativo da ${storeName} para gerenciar produtos, pedidos e configurações.`,
        keywords: `admin, administração, painel, gerenciar, ${storeName}, Angola`,
        canonical: `${baseUrl}/admin`,
        robots: 'noindex,nofollow' // Páginas admin não devem ser indexadas
      };

    default:
      // Páginas específicas baseadas no path
      if (currentPath.includes('/catalogo')) {
        return {
          ...defaultSEO,
          title: `Catálogo de Produtos - ${storeName}`,
          description: `Explore nosso catálogo completo de produtos tecnológicos com os melhores preços de Angola. Smartphones, computadores, acessórios e muito mais na ${storeName}!`,
          keywords: `catálogo, produtos, eletrônicos, Angola, ${storeName}, tecnologia, smartphones, computadores`,
          canonical: `${baseUrl}/catalogo`
        };
      }
      
      if (currentPath.includes('/leiloes')) {
        return {
          ...defaultSEO,
          title: `Leilões - ${storeName}`,
          description: `Participe dos nossos leilões e ganhe produtos tecnológicos com preços incríveis! Leilões diários na ${storeName}.`,
          keywords: `leilões, produtos, ofertas, Angola, ${storeName}, tecnologia, promoções`,
          canonical: `${baseUrl}/leiloes`
        };
      }
      
      if (currentPath.includes('/contato')) {
        return {
          ...defaultSEO,
          title: `Contato - ${storeName}`,
          description: `Entre em contato conosco! Atendimento especializado, suporte técnico e informações sobre produtos na ${storeName}.`,
          keywords: `contato, atendimento, suporte, Angola, ${storeName}, ajuda, informações`,
          canonical: `${baseUrl}/contato`
        };
      }
      
      return defaultSEO;
  }
};

export const SEOHead: React.FC<SEOHeadProps> = ({
  pageType = 'global',
  pageSlug,
  title,
  description,
  keywords,
  ogImage,
  canonicalUrl,
  schemaMarkup,
  productData,
  categoryData
}) => {
  const { settings } = useSettings();
  const location = useLocation();
  const [dynamicFavicon, setDynamicFavicon] = useState<string | null>(null);

  // Buscar favicon dinâmico das configurações
  useEffect(() => {
    const fetchDynamicFavicon = async () => {
      try {
        if (settings?.favicon_url) {
          setDynamicFavicon(settings.favicon_url);
        }
      } catch (error) {
        console.error('Erro ao carregar favicon dinâmico:', error);
      }
    };

    fetchDynamicFavicon();
  }, [settings?.favicon_url]);

  // Obter dados SEO dinâmicos baseados no tipo de página e configurações
  const seoData = getDynamicSEOData(pageType, pageSlug, productData, categoryData, location, settings);
  
  // Usar dados SEO estáticos ou props como fallback
  const finalTitle = title || seoData.title;
  const finalDescription = description || seoData.description;
  const finalKeywords = keywords || seoData.keywords;
  const finalOgImage = ogImage || seoData.ogImage;
  const finalCanonicalUrl = canonicalUrl || seoData.canonical;
  const finalRobots = seoData.robots || 'index,follow';
  
  // Favicon dinâmico com fallback para arquivo estático
  const faviconUrl = dynamicFavicon || settings?.favicon_url || '/favicon.ico';
  
  // Atualizar favicon dinamicamente no DOM
  useEffect(() => {
    const updateFavicon = () => {
      // Remover favicons existentes
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
      existingFavicons.forEach(link => link.remove());
      
      // Adicionar novos favicons
      const iconLink = document.createElement('link');
      iconLink.rel = 'icon';
      iconLink.type = 'image/x-icon';
      iconLink.href = faviconUrl;
      document.head.appendChild(iconLink);
      
      const shortcutLink = document.createElement('link');
      shortcutLink.rel = 'shortcut icon';
      shortcutLink.href = faviconUrl;
      document.head.appendChild(shortcutLink);
      
      const appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      appleLink.href = faviconUrl;
      document.head.appendChild(appleLink);
    };
    
    updateFavicon();
  }, [faviconUrl]);

  // Schema.org estruturado
  const structuredData = schemaMarkup || {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": settings?.store_name || 'SuperLoja',
    "description": settings?.store_description || 'A melhor loja de eletrônicos de Angola',
    "url": window.location.origin,
    "logo": settings?.logo_url || '/src/assets/superloja-logo.png',
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": "pt"
    }
  };

  return (
    <>
      <Helmet>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="robots" content={finalRobots} />
      <meta name="googlebot" content={finalRobots} />
      <link rel="canonical" href={finalCanonicalUrl} />
      
      {/* Favicon */}
      <link rel="icon" type="image/x-icon" href={faviconUrl} />
      <link rel="shortcut icon" href={faviconUrl} />
      <link rel="apple-touch-icon" href={faviconUrl} />
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalOgImage} />
      <meta property="og:url" content={finalCanonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={settings?.store_name || 'SuperLoja'} />
      
      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalOgImage} />
      
      {/* Schema.org Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      </Helmet>
      <SEOAnalytics pageTitle={finalTitle} pageType={pageType} />
    </>
  );
};