import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin, CreditCard, Truck, Shield, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logoImage from "@/assets/superloja-logo.png";
import { useSettings } from "@/contexts/SettingsContext";

export const Footer = () => {
  const { settings, loading } = useSettings();

  const openSocialMedia = (url: string) => {
    if (url) {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      window.open(fullUrl, '_blank');
    }
  };

  return (
    <footer className="bg-card border-t border-border">
      {/* Features section */}
      <div className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3 p-4 rounded-lg hover:bg-background transition-colors">
              <div className="bg-hero-gradient p-2 rounded-lg">
                <Truck className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Frete Grátis</h4>
                <p className="text-sm text-muted-foreground">Acima de 50.000 AOA</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg hover:bg-background transition-colors">
              <div className="bg-hero-gradient p-2 rounded-lg">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Garantia</h4>
                <p className="text-sm text-muted-foreground">Em todos os produtos</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg hover:bg-background transition-colors">
              <div className="bg-hero-gradient p-2 rounded-lg">
                <Headphones className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Suporte 24h</h4>
                <p className="text-sm text-muted-foreground">Chat e telefone</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg hover:bg-background transition-colors">
              <div className="bg-hero-gradient p-2 rounded-lg">
                <CreditCard className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Pagamento</h4>
                <p className="text-sm text-muted-foreground">100% seguro</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
          {/* Brand section */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-300">
              {settings.logo_url ? (
                <div className="relative">
                  <img 
                    src={settings.logo_url} 
                    alt={settings.store_name} 
                    className="h-16 w-auto rounded-lg shadow-lg" 
                  />
                  <div className="absolute inset-0 rounded-lg ring-2 ring-primary/20 ring-offset-2 ring-offset-background"></div>
                </div>
              ) : (
                <div className="h-16 w-16 hero-gradient rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">
                    {settings.store_name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="space-y-1">
                <h3 className="text-2xl font-bold bg-hero-gradient bg-clip-text text-transparent">
                  {settings.store_name.toUpperCase()}
                </h3>
                <p className="text-sm text-muted-foreground font-medium">
                  {settings.store_description}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{settings.address}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-primary" />
                <span>{settings.contact_phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-primary" />
                <span>{settings.contact_email}</span>
              </div>
            </div>

            <div className="flex gap-3">
              {settings.facebook && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full"
                  onClick={() => openSocialMedia(settings.facebook)}
                >
                  <Facebook className="h-4 w-4" />
                </Button>
              )}
              {settings.instagram && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full"
                  onClick={() => openSocialMedia(settings.instagram)}
                >
                  <Instagram className="h-4 w-4" />
                </Button>
              )}
              {settings.whatsapp && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full"
                  onClick={() => openSocialMedia(`https://wa.me/${settings.whatsapp.replace(/[^\d]/g, '')}`)}
                >
                  <Phone className="h-4 w-4" />
                </Button>
              )}
              {settings.website && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full"
                  onClick={() => openSocialMedia(settings.website)}
                >
                  <Youtube className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-foreground">Links Rápidos</h4>
            <nav className="space-y-3">
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                Sobre Nós
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                Contato
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                FAQ
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                Termos de Uso
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                Política de Privacidade
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                Política de Devolução
              </a>
            </nav>
          </div>

          {/* Categories */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-foreground">Categorias</h4>
            <nav className="space-y-3">
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                📱 Smartphones
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                💻 Computadores
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                🎧 Áudio & Vídeo
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                ⌚ Wearables
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                🏠 Casa Inteligente
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                🔥 Ofertas Especiais
              </a>
            </nav>
          </div>

          {/* Newsletter */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-foreground">Newsletter</h4>
            <p className="text-muted-foreground">
              Receba ofertas exclusivas e novidades por email.
            </p>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input 
                  type="email" 
                  placeholder="Seu email"
                  className="flex-1"
                />
                <Button variant="default">
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Ao se inscrever, você concorda com nossa política de privacidade.
              </p>
            </div>

            <div className="space-y-3">
              <h5 className="font-medium text-foreground">Formas de Pagamento</h5>
              <div className="flex flex-wrap gap-2">
                <div className="bg-muted p-2 rounded text-xs font-semibold">VISA</div>
                <div className="bg-muted p-2 rounded text-xs font-semibold">MASTER</div>
                <div className="bg-muted p-2 rounded text-xs font-semibold">BFA</div>
                <div className="bg-muted p-2 rounded text-xs font-semibold">BAI</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border bg-muted/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © 2024 {settings.store_name}. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};