import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useCookieAnalytics } from '@/hooks/useCookieAnalytics';

export const AnalyticsTracker: React.FC = () => {
  const location = useLocation();
  const { trackPageView, trackEvent } = useAnalytics();
  const { cookieData } = useCookieAnalytics();

  useEffect(() => {
    // Evitar rastreamento duplicado ao usar cookieData como dependência
    const timer = setTimeout(() => {
      trackPageView({
        page_url: window.location.href,
        page_title: document.title,
        referrer: document.referrer
      });

      // Rastrear navegação apenas se não for a primeira visita
      if (document.referrer && document.referrer !== window.location.href) {
        trackEvent('page_navigation', {
          from: document.referrer,
          to: window.location.href,
          pathname: location.pathname
        });
      }
    }, 100); // Delay pequeno para evitar duplicação

    return () => clearTimeout(timer);
  }, [location.pathname]); // Usar apenas pathname para evitar loops

  // Rastrear scroll
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollPercentage = Math.round(
          (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );
        
        if (scrollPercentage > 0 && scrollPercentage % 25 === 0) {
          trackEvent('scroll_depth', { 
            percentage: scrollPercentage,
            page: location.pathname 
          });
        }
      }, 1000);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [location.pathname, trackEvent]);

  // Rastrear cliques em links externos
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href) {
        const url = new URL(link.href);
        const currentDomain = window.location.hostname;
        
        if (url.hostname !== currentDomain) {
          trackEvent('external_link_click', {
            url: link.href,
            text: link.textContent || '',
            page: location.pathname
          });
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [location.pathname, trackEvent]);

  return null;
};