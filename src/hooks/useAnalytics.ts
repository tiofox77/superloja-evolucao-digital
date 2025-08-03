import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  page_url: string;
  page_title?: string;
  referrer?: string;
  event_type?: string;
  event_data?: any;
}

// Gerar ID único do visitante
const getVisitorId = () => {
  let visitorId = localStorage.getItem('visitor_id');
  if (!visitorId) {
    visitorId = 'visitor_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('visitor_id', visitorId);
  }
  return visitorId;
};

// Gerar ID único da sessão
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    sessionStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

// Detectar informações do dispositivo
const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  const screenRes = `${screen.width}x${screen.height}`;
  
  let deviceType = 'desktop';
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    deviceType = 'tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
    deviceType = 'mobile';
  }
  
  let browser = 'Unknown';
  if (userAgent.indexOf('Chrome') > -1) browser = 'Chrome';
  else if (userAgent.indexOf('Firefox') > -1) browser = 'Firefox';
  else if (userAgent.indexOf('Safari') > -1) browser = 'Safari';
  else if (userAgent.indexOf('Edge') > -1) browser = 'Edge';
  
  let os = 'Unknown';
  if (userAgent.indexOf('Windows') > -1) os = 'Windows';
  else if (userAgent.indexOf('Mac') > -1) os = 'MacOS';
  else if (userAgent.indexOf('Linux') > -1) os = 'Linux';
  else if (userAgent.indexOf('Android') > -1) os = 'Android';
  else if (userAgent.indexOf('iOS') > -1) os = 'iOS';
  
  return {
    device_type: deviceType,
    browser,
    os,
    screen_resolution: screenRes,
    language: navigator.language,
    user_agent: userAgent
  };
};

// Obter localização via IP (usando múltiplas APIs com fallback)
const getLocationData = async () => {
  const apis = [
    {
      url: 'https://ipapi.co/json/',
      parser: (data: any) => ({
        country: data.country_name || 'Angola',
        region: data.region || 'Luanda',
        city: data.city || 'Luanda',
        ip_address: data.ip || 'unknown'
      })
    }
  ];
  
  for (const api of apis) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 segundos timeout
      
      const response = await fetch(api.url, { 
        signal: controller.signal,
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        const parsed = api.parser(data);
        // Se conseguiu dados úteis, retornar
        if (parsed.country || parsed.ip_address) {
          return parsed;
        }
      }
    } catch (error: any) {
      console.info(`API ${api.url} falhou:`, error?.message || 'Unknown error');
      continue; // Tentar próxima API
    }
  }
  
  // Fallback padrão para Angola se todas as APIs falharam
  console.info('Usando localização padrão (Angola) - APIs indisponíveis');
  return {
    country: 'Angola',
    region: 'Luanda',
    city: 'Luanda',
    ip_address: 'unknown'
  };
};

export const useAnalytics = () => {
  const startTimeRef = useRef<number>(Date.now());
  const visitorId = getVisitorId();
  const sessionId = getSessionId();

  // Rastrear visualização de página
  const trackPageView = async (data: AnalyticsData) => {
    try {
      const deviceInfo = getDeviceInfo();
      const locationData = await getLocationData();
      
      const result = await supabase.from('visitor_analytics').insert({
        visitor_id: visitorId,
        session_id: sessionId,
        page_url: data.page_url,
        page_title: data.page_title || document.title,
        referrer: data.referrer || document.referrer,
        ip_address: locationData.ip_address || null,
        country: locationData.country || null,
        city: locationData.city || null,
        browser: deviceInfo.browser,
        device_type: deviceInfo.device_type
      });

      if (result.error) {
        console.warn('Analytics tracking error:', result.error);
      }

      // Rastrear evento de página
      await supabase.from('analytics_events').insert({
        visitor_id: visitorId,
        session_id: sessionId,
        event_type: 'page_view',
        event_data: { 
          page_title: data.page_title || document.title,
          ...deviceInfo 
        },
        page_url: data.page_url
      });
    } catch (error) {
      console.error('Erro ao rastrear página:', error);
    }
  };

  // Rastrear eventos personalizados
  const trackEvent = async (eventType: string, eventData: any = {}) => {
    try {
      await supabase.from('analytics_events').insert({
        visitor_id: visitorId,
        session_id: sessionId,
        event_type: eventType,
        event_data: eventData,
        page_url: window.location.href
      });
    } catch (error) {
      console.error('Erro ao rastrear evento:', error);
    }
  };

  // Rastrear tempo na página (quando sair)
  const trackPageDuration = async () => {
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    if (duration > 5) { // Só rastrear se ficar mais de 5 segundos
      try {
        await supabase.from('analytics_events').insert({
          visitor_id: visitorId,
          session_id: sessionId,
          event_type: 'page_duration',
          event_data: { duration_seconds: duration },
          page_url: window.location.href
        });
      } catch (error) {
        console.error('Erro ao rastrear duração:', error);
      }
    }
  };

  // Auto-rastrear quando componente monta
  useEffect(() => {
    trackPageView({
      page_url: window.location.href,
      page_title: document.title,
      referrer: document.referrer
    });

    // Rastrear quando sair da página
    const handleBeforeUnload = () => {
      trackPageDuration();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      trackPageDuration();
    };
  }, []);

  return {
    trackPageView,
    trackEvent,
    trackPageDuration,
    visitorId,
    sessionId
  };
};