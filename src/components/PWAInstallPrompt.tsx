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

    // Force show prompt for mobile users even without beforeinstallprompt
    const forceShowPrompt = () => {
      if (isMobile && !sessionStorage.getItem('pwa-prompt-dismissed')) {
        setTimeout(() => {
          console.log('PWA: Forçando exibição do prompt para mobile');
          setShowPrompt(true);
        }, pwaSettings.install_prompt_delay);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Always try to show prompt after settings load
    if (pwaSettings.install_prompt_enabled) {
      forceShowPrompt();
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [pwaSettings, isMobile]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Native PWA installation
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('PWA instalado com sucesso via prompt nativo');
        }
        
        setDeferredPrompt(null);
        setShowPrompt(false);
      } catch (error) {
        console.error('Erro ao instalar PWA:', error);
      }
    } else {
      // Show browser-specific instructions for installation
      const userAgent = navigator.userAgent.toLowerCase();
      let instructions = '';
      
      if (userAgent.includes('chrome') || userAgent.includes('edge')) {
        instructions = 'Toque no menu (⋮) e selecione "Instalar app" ou "Adicionar à tela inicial"';
      } else if (userAgent.includes('safari')) {
        instructions = 'Toque no botão Compartilhar (□↗) e selecione "Adicionar à Tela de Início"';
      } else if (userAgent.includes('firefox')) {
        instructions = 'Toque no menu (☰) e selecione "Instalar"';
      } else {
        instructions = 'Procure por "Instalar app" ou "Adicionar à tela inicial" no menu do navegador';
      }
      
      // Create a more user-friendly instruction dialog
      const instructionDiv = document.createElement('div');
      instructionDiv.innerHTML = `
        <div style="
          position: fixed; 
          top: 0; left: 0; right: 0; bottom: 0; 
          background: rgba(0,0,0,0.8); 
          z-index: 9999; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          padding: 20px;
        ">
          <div style="
            background: white; 
            padding: 30px; 
            border-radius: 15px; 
            max-width: 400px; 
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          ">
            <h3 style="margin: 0 0 15px 0; color: #333; font-size: 20px;">📱 Instalar ${pwaSettings.name}</h3>
            <p style="margin: 0 0 20px 0; color: #666; line-height: 1.5;">${instructions}</p>
            <button onclick="this.parentElement.parentElement.remove()" style="
              background: #4F46E5; 
              color: white; 
              border: none; 
              padding: 12px 24px; 
              border-radius: 8px; 
              font-size: 16px; 
              cursor: pointer;
            ">Entendi</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(instructionDiv);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Show prompt for mobile users when enabled
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