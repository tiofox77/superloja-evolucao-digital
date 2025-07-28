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
        .limit(1);
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data && data.length > 0) {
        setPWASettings(data[0]);
        console.log('Configurações PWA carregadas:', data[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações PWA:', error);
      // Use default settings on error
      setPWASettings({
        install_prompt_enabled: false,
        install_prompt_delay: 3000,
        name: 'SuperLoja'
      });
    }
  };

  useEffect(() => {
    if (!pwaSettings.install_prompt_enabled) return;

    // Check if we should show the prompt (not dismissed in last 7 days)
    const nextShowTime = localStorage.getItem('pwa-prompt-next-show');
    if (nextShowTime && new Date().getTime() < parseInt(nextShowTime)) {
      console.log('PWA: Prompt ainda em cooldown de 7 dias');
      return;
    }

    // Check if PWA is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true) {
      console.log('PWA: App já está instalado');
      return;
    }

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
      // Clear the cooldown since app was installed
      localStorage.removeItem('pwa-prompt-next-show');
    };

    // Force show prompt for mobile users even without beforeinstallprompt
    const forceShowPrompt = () => {
      if (isMobile) {
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
        } else {
          // If user declined, set 7-day cooldown
          const nextShow = new Date();
          nextShow.setDate(nextShow.getDate() + 7);
          localStorage.setItem('pwa-prompt-next-show', nextShow.getTime().toString());
        }
        
        setDeferredPrompt(null);
        setShowPrompt(false);
      } catch (error) {
        console.error('Erro ao instalar PWA:', error);
      }
    } else {
      // Trigger native browser installation flow
      try {
        // For iOS Safari
        if (/(iPad|iPhone|iPod)/g.test(navigator.userAgent) && !(window as any).MSStream) {
          const instructionDiv = document.createElement('div');
          instructionDiv.innerHTML = `
            <div style="
              position: fixed; 
              top: 0; left: 0; right: 0; bottom: 0; 
              background: rgba(0,0,0,0.9); 
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
                max-width: 350px; 
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
              ">
                <div style="font-size: 40px; margin-bottom: 15px;">📱</div>
                <h3 style="margin: 0 0 15px 0; color: #333; font-size: 20px;">Instalar ${pwaSettings.name}</h3>
                <p style="margin: 0 0 20px 0; color: #666; line-height: 1.5;">
                  1. Toque no ícone <strong>Compartilhar</strong> (□↗) abaixo<br>
                  2. Selecione <strong>"Adicionar à Tela de Início"</strong><br>
                  3. Toque em <strong>"Adicionar"</strong>
                </p>
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
        } 
        // For Android Chrome/Edge
        else if (/Android/i.test(navigator.userAgent)) {
          // Try to trigger Chrome's native install prompt
          if ('serviceWorker' in navigator) {
            const instructionDiv = document.createElement('div');
            instructionDiv.innerHTML = `
              <div style="
                position: fixed; 
                top: 0; left: 0; right: 0; bottom: 0; 
                background: rgba(0,0,0,0.9); 
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
                  max-width: 350px; 
                  text-align: center;
                  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                ">
                  <div style="font-size: 40px; margin-bottom: 15px;">🚀</div>
                  <h3 style="margin: 0 0 15px 0; color: #333; font-size: 20px;">Instalar ${pwaSettings.name}</h3>
                  <p style="margin: 0 0 20px 0; color: #666; line-height: 1.5;">
                    1. Toque no menu <strong>(⋮)</strong> no canto superior<br>
                    2. Selecione <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong><br>
                    3. Confirme a instalação
                  </p>
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
          }
        }
        
        setShowPrompt(false);
      } catch (error) {
        console.error('Erro ao mostrar instruções:', error);
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for 7 days
    const nextShow = new Date();
    nextShow.setDate(nextShow.getDate() + 7);
    localStorage.setItem('pwa-prompt-next-show', nextShow.getTime().toString());
  };

  // Show prompt for mobile users when enabled and not in cooldown
  const nextShowTime = localStorage.getItem('pwa-prompt-next-show');
  const inCooldown = nextShowTime && new Date().getTime() < parseInt(nextShowTime);
  
  if (!isMobile || !showPrompt || inCooldown) {
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