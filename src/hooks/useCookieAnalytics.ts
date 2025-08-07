import { useState, useEffect } from 'react';
import { useAnalytics } from './useAnalytics';

interface CookieData {
  visitorId: string;
  sessionId: string;
  firstVisit: string;
  lastVisit: string;
  visitCount: number;
  lastVisitDate: string; // Data da última visita (YYYY-MM-DD)
  todayPageViews: number; // Visualizações de hoje
  isNewVisitorToday: boolean; // Se é novo visitante hoje
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export const useCookieAnalytics = () => {
  const [cookieData, setCookieData] = useState<CookieData | null>(null);
  const { trackEvent } = useAnalytics();

  // Extrair parâmetros UTM da URL
  const extractUTMParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      utmSource: urlParams.get('utm_source'),
      utmMedium: urlParams.get('utm_medium'),
      utmCampaign: urlParams.get('utm_campaign'),
    };
  };

  // Gerenciar cookies de analytics
  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  const setCookie = (name: string, value: string, days: number = 365) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax;Secure=${location.protocol === 'https:'}`;
  };

  const initializeCookieData = () => {
    const now = new Date().toISOString();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const utmParams = extractUTMParams();
    
    // Verificar se já existe dados do visitante
    let existingData = getCookie('superloja_analytics');
    
    if (existingData) {
      try {
        const data = JSON.parse(decodeURIComponent(existingData));
        const lastVisitDate = data.lastVisitDate || data.firstVisit?.split('T')[0];
        const isNewDay = lastVisitDate !== today;
        
        // Gerar nova sessão se necessário
        let currentSessionId = sessionStorage.getItem('session_id');
        if (!currentSessionId) {
          currentSessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
          sessionStorage.setItem('session_id', currentSessionId);
        }
        
        // Atualizar dados do visitante
        const updatedData = {
          ...data,
          lastVisit: now,
          lastVisitDate: today,
          sessionId: currentSessionId,
          visitCount: isNewDay ? (data.visitCount || 1) + 1 : (data.visitCount || 1),
          todayPageViews: isNewDay ? 1 : ((data.todayPageViews || 0) + 1),
          isNewVisitorToday: isNewDay,
          // Manter UTM do primeiro acesso, a menos que seja uma nova campanha
          ...(!data.utmSource && utmParams.utmSource ? utmParams : {})
        };
        
        setCookieData(updatedData);
        setCookie('superloja_analytics', encodeURIComponent(JSON.stringify(updatedData)));
        
        // Rastrear apenas se for um novo dia ou primeira visita hoje
        if (isNewDay) {
          trackEvent('daily_visitor', {
            visitCount: updatedData.visitCount,
            daysSinceFirst: Math.ceil((new Date(now).getTime() - new Date(data.firstVisit).getTime()) / (1000 * 60 * 60 * 24)),
            isReturning: updatedData.visitCount > 1
          });
        } else {
          // Apenas rastrear como sessão adicional, não como novo visitante
          trackEvent('additional_session', {
            todayPageViews: updatedData.todayPageViews,
            sessionId: currentSessionId
          });
        }
        
      } catch (error) {
        console.error('Erro ao parsear cookie de analytics:', error);
        // Se cookie corrompido, criar novo
        createNewVisitorData(now, today, utmParams);
      }
    } else {
      // Novo visitante
      createNewVisitorData(now, today, utmParams);
    }
  };

  const createNewVisitorData = (now: string, today: string, utmParams: any) => {
    const visitorId = localStorage.getItem('visitor_id') || 
      'visitor_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    const sessionId = sessionStorage.getItem('session_id') || 
      'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    
    const newData: CookieData = {
      visitorId,
      sessionId,
      firstVisit: now,
      lastVisit: now,
      lastVisitDate: today,
      visitCount: 1,
      todayPageViews: 1,
      isNewVisitorToday: true,
      referrer: document.referrer,
      ...utmParams
    };
    
    setCookieData(newData);
    setCookie('superloja_analytics', encodeURIComponent(JSON.stringify(newData)));
    
    // Armazenar IDs no storage
    localStorage.setItem('visitor_id', visitorId);
    sessionStorage.setItem('session_id', sessionId);
    
    // Rastrear novo visitante
    trackEvent('new_visitor', {
      referrer: document.referrer,
      firstTime: true,
      ...utmParams
    });
  };

  // Rastrear origem do tráfego
  const trackTrafficSource = () => {
    if (!cookieData) return;
    
    let source = 'direct';
    let medium = 'none';
    
    // UTM tem prioridade
    if (cookieData.utmSource) {
      source = cookieData.utmSource;
      medium = cookieData.utmMedium || 'unknown';
    } else if (cookieData.referrer) {
      const referrerDomain = new URL(cookieData.referrer).hostname;
      
      // Identificar fontes conhecidas
      if (referrerDomain.includes('google')) {
        source = 'google';
        medium = 'organic';
      } else if (referrerDomain.includes('facebook')) {
        source = 'facebook';
        medium = 'social';
      } else if (referrerDomain.includes('instagram')) {
        source = 'instagram';
        medium = 'social';
      } else if (referrerDomain.includes('whatsapp')) {
        source = 'whatsapp';
        medium = 'social';
      } else {
        source = referrerDomain;
        medium = 'referral';
      }
    }
    
    trackEvent('traffic_source', {
      source,
      medium,
      campaign: cookieData.utmCampaign,
      visitCount: cookieData.visitCount
    });
  };

  // Rastrear tempo de sessão (otimizado)
  const trackSessionTime = () => {
    const startTime = Date.now();
    let hasTracked = false;
    
    const sendSessionTime = () => {
      if (hasTracked) return; // Evitar múltiplas chamadas
      
      const sessionDuration = Math.round((Date.now() - startTime) / 1000);
      if (sessionDuration > 10) { // Só rastrear sessões > 10 segundos
        hasTracked = true;
        trackEvent('session_duration', {
          duration: sessionDuration,
          visitorId: cookieData?.visitorId,
          visitCount: cookieData?.visitCount,
          isNewVisitorToday: cookieData?.isNewVisitorToday
        });
      }
    };
    
    // Rastrear quando sair da página (com debounce)
    let timeout: NodeJS.Timeout;
    const debouncedTrack = () => {
      clearTimeout(timeout);
      timeout = setTimeout(sendSessionTime, 1000);
    };
    
    window.addEventListener('beforeunload', sendSessionTime);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        debouncedTrack();
      }
    });
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('beforeunload', sendSessionTime);
    };
  };

  // Inicializar quando carregar
  useEffect(() => {
    initializeCookieData();
  }, []);

  // Rastrear origem quando dados estiverem prontos
  useEffect(() => {
    if (cookieData) {
      trackTrafficSource();
      const cleanup = trackSessionTime();
      return cleanup;
    }
  }, [cookieData]);

  return {
    cookieData,
    trackTrafficSource,
    getCookie,
    setCookie
  };
};