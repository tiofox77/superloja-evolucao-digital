import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useCookieAnalytics } from '@/hooks/useCookieAnalytics';

export const AnalyticsTracker: React.FC = () => {
  const location = useLocation();
  const { trackPageView, trackEvent } = useAnalytics();
  const { cookieData } = useCookieAnalytics();

  useEffect(() => {
    // Evitar rastreamento se não for nova visita do dia
    if (!cookieData?.isNewVisitorToday && cookieData?.todayPageViews > 1) {
      return; // Não rastrear se já visitou hoje
    }

    const timer = setTimeout(() => {
      // Só rastrear page view para novos visitantes do dia ou primeira página
      if (cookieData?.isNewVisitorToday || cookieData?.todayPageViews === 1) {
        trackPageView({
          page_url: window.location.href,
          page_title: document.title,
          referrer: document.referrer
        });
      }

      // Rastrear navegação apenas se for navegação real entre páginas
      if (document.referrer && 
          document.referrer !== window.location.href && 
          !document.referrer.includes(window.location.hostname) === false) {
        trackEvent('page_navigation', {
          from: document.referrer,
          to: window.location.href,
          pathname: location.pathname,
          isNewVisitorToday: cookieData?.isNewVisitorToday
        });
      }
    }, 200); // Delay para evitar duplicação

    return () => clearTimeout(timer);
  }, [location.pathname, cookieData?.isNewVisitorToday]); // Dependências otimizadas

  // Rastrear scroll (otimizado)
  useEffect(() => {
    if (!cookieData?.isNewVisitorToday) return; // Só rastrear scroll de novos visitantes

    let scrollTimeout: NodeJS.Timeout;
    let lastScrollPercentage = 0;
    
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollPercentage = Math.round(
          (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );
        
        // Só rastrear marcos importantes e se mudou significativamente
        if (scrollPercentage > lastScrollPercentage + 25 && 
            [25, 50, 75, 100].includes(Math.floor(scrollPercentage / 25) * 25)) {
          lastScrollPercentage = scrollPercentage;
          trackEvent('scroll_depth', { 
            percentage: Math.floor(scrollPercentage / 25) * 25,
            page: location.pathname,
            isNewVisitorToday: cookieData?.isNewVisitorToday
          });
        }
      }, 1500); // Aumentar delay para reduzir chamadas
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [location.pathname, trackEvent, cookieData?.isNewVisitorToday]);

  // Rastrear cliques em links externos (otimizado)
  useEffect(() => {
    if (!cookieData?.isNewVisitorToday) return; // Só rastrear de novos visitantes

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && !link.href.startsWith('javascript:')) {
        try {
          const url = new URL(link.href);
          const currentDomain = window.location.hostname;
          
          if (url.hostname !== currentDomain) {
            trackEvent('external_link_click', {
              url: link.href,
              text: link.textContent?.substring(0, 100) || '', // Limitar texto
              page: location.pathname,
              domain: url.hostname,
              isNewVisitorToday: cookieData?.isNewVisitorToday
            });
          }
        } catch (error) {
          // Ignorar URLs inválidas
          console.debug('Invalid URL in link click tracking:', link.href);
        }
      }
    };

    document.addEventListener('click', handleClick, { passive: true });
    return () => document.removeEventListener('click', handleClick);
  }, [location.pathname, trackEvent, cookieData?.isNewVisitorToday]);

  return null;
};