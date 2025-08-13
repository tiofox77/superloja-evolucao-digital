import * as React from 'react';
import { useLocation } from 'react-router-dom';

interface SEOAnalyticsProps {
  pageTitle?: string;
  pageType?: string;
}

export const SEOAnalytics: React.FC<SEOAnalyticsProps> = ({ pageTitle, pageType }) => {
  const location = useLocation();

  React.useEffect(() => {
    // Notificar motores de busca sobre mudanças de página
    const notifySearchEngines = async () => {
      try {
        const currentUrl = `${window.location.origin}${location.pathname}`;
        
        // Ping do Google para indexação rápida
        if (window.gtag) {
          window.gtag('config', 'GA_MEASUREMENT_ID', {
            page_title: pageTitle,
            page_location: currentUrl,
            page_path: location.pathname
          });
        }
        
        // Estruturar dados para analytics
        const seoData = {
          url: currentUrl,
          title: pageTitle,
          type: pageType,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          referrer: document.referrer
        };
        
        // Log para debug
        console.log('SEO Analytics:', seoData);
        
        // Enviar para sistema de analytics (se implementado)
        // await fetch('/api/seo-analytics', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(seoData)
        // });
        
      } catch (error) {
        console.error('Erro no SEO Analytics:', error);
      }
    };
    
    // Aguardar um pouco para garantir que o SEO foi aplicado
    const timer = setTimeout(notifySearchEngines, 1000);
    
    return () => clearTimeout(timer);
  }, [location.pathname, pageTitle, pageType]);

  React.useEffect(() => {
    // Atualizar breadcrumb estruturado
    const updateBreadcrumb = () => {
      const breadcrumbScript = document.getElementById('breadcrumb-schema');
      if (breadcrumbScript) {
        breadcrumbScript.remove();
      }
      
      const pathParts = location.pathname.split('/').filter(part => part);
      if (pathParts.length > 0) {
        const breadcrumbList = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": window.location.origin
            }
          ]
        };
        
        let currentPath = '';
        pathParts.forEach((part, index) => {
          currentPath += `/${part}`;
          breadcrumbList.itemListElement.push({
            "@type": "ListItem",
            "position": index + 2,
            "name": part.charAt(0).toUpperCase() + part.slice(1),
            "item": `${window.location.origin}${currentPath}`
          });
        });
        
        const script = document.createElement('script');
        script.id = 'breadcrumb-schema';
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(breadcrumbList);
        document.head.appendChild(script);
      }
    };
    
    updateBreadcrumb();
  }, [location.pathname]);

  return null; // Este componente não renderiza nada visível
};

// Tipos para Google Analytics
declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: any) => void;
  }
}
