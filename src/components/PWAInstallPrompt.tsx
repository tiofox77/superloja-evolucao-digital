import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download, Smartphone } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [pwaSettings, setPWASettings] = useState({
    install_prompt_enabled: true,
    install_prompt_delay: 3000,
    name: 'SuperLoja'
  });
  
  const isMobile = useIsMobile();

  useEffect(() => {
    loadPWASettings();
  }, []);

  const loadPWASettings = async () => {
    try {
      const { data, error } = await supabase
        .from('pwa_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      if (data) {
        setPWASettings(data);
        console.log('Configurações PWA carregadas:', data);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações PWA:', error);
    }
  };

  useEffect(() => {
    if (!pwaSettings.install_prompt_enabled) return;

    console.log('PWA: Configurando listeners de instalação');

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA: Evento beforeinstallprompt capturado');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after delay
      setTimeout(() => {
        console.log('PWA: Exibindo prompt de instalação');
        setShowPrompt(true);
      }, pwaSettings.install_prompt_delay);
    };

    const handleAppInstalled = () => {
      console.log('PWA: App instalado com sucesso');
      setDeferredPrompt(null);
      setShowPrompt(false);
    };

    // Check if PWA criteria are met and show fallback prompt
    const checkPWAEligibility = () => {
      // Show prompt for mobile users after delay if no beforeinstallprompt event
      if (isMobile && !sessionStorage.getItem('pwa-prompt-dismissed')) {
        setTimeout(() => {
          if (!deferredPrompt) {
            console.log('PWA: Exibindo prompt fallback para mobile');
            setShowPrompt(true);
          }
        }, pwaSettings.install_prompt_delay + 2000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Check eligibility after settings are loaded
    if (pwaSettings.name !== 'SuperLoja' || pwaSettings.install_prompt_enabled) {
      checkPWAEligibility();
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [pwaSettings, isMobile, deferredPrompt]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('PWA instalado com sucesso');
        }
        
        setDeferredPrompt(null);
        setShowPrompt(false);
      } catch (error) {
        console.error('Erro ao instalar PWA:', error);
      }
    } else {
      // Fallback: provide manual installation instructions
      alert(`Para instalar ${pwaSettings.name}:\n\n1. No Chrome: Menu → "Instalar app"\n2. No Safari: Compartilhar → "Adicionar à Tela de Início"\n3. No Firefox: Menu → "Instalar"`);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if not mobile, already dismissed, or prompt disabled
  if (!isMobile || !showPrompt || sessionStorage.getItem('pwa-prompt-dismissed')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-fade-in">
      <Card className="bg-card/95 backdrop-blur-md border border-border shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">
                Instalar {pwaSettings.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Adicione nossa app à sua tela inicial para acesso rápido e experiência offline
              </p>
              
              <div className="flex gap-2 mt-3">
                <Button 
                  onClick={handleInstallClick}
                  size="sm"
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Instalar
                </Button>
                
                <Button 
                  onClick={handleDismiss}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};