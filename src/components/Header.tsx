import { useState } from "react";
import { Search, ShoppingCart, Menu, User, Heart, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logoImage from "@/assets/superloja-logo.png";

interface HeaderProps {
  cartCount?: number;
}

export const Header = ({ cartCount = 0 }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
      {/* Top bar */}
      <div className="container mx-auto px-4 py-2 border-b border-border/50">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>+244 942 705 533</span>
            </div>
            <span className="hidden md:block">Chat Ao Vivo 24/7</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Frete grátis acima de 50.000 AOA</span>
            <select className="bg-transparent border-none text-sm">
              <option>AOA</option>
              <option>USD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img 
              src={logoImage} 
              alt="SuperLoja" 
              className="h-10 w-auto"
            />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-hero-gradient bg-clip-text text-transparent">
                SUPER LOJA
              </h1>
              <p className="text-xs text-muted-foreground">Sua loja moderna</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-2xl mx-4 hidden md:block">
            <div className="relative">
              <Input
                type="text"
                placeholder="Pesquisar produtos..."
                className="pl-10 pr-4 h-12 rounded-xl border-2 border-border/50 focus:border-primary bg-background/50"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Button 
                size="sm" 
                variant="hero"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8"
              >
                Buscar
              </Button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Mobile search */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Favorites */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative hidden sm:flex hover:bg-accent/50"
            >
              <Heart className="h-5 w-5" />
              <span className="cart-badge">2</span>
            </Button>

            {/* Account */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden sm:flex hover:bg-accent/50"
            >
              <User className="h-5 w-5" />
            </Button>

            {/* Cart */}
            <Button 
              variant="cart"
              size="lg"
              className="relative gap-2 animate-bounce-in"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden sm:inline">Carrinho</span>
              {cartCount > 0 && (
                <span className="cart-badge animate-pulse">
                  {cartCount}
                </span>
              )}
            </Button>

            {/* Mobile menu */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="mt-4 md:hidden">
          <div className="relative">
            <Input
              type="text"
              placeholder="Pesquisar produtos..."
              className="pl-10 h-12 rounded-xl border-2 border-border/50 focus:border-primary"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="border-t border-border/50 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-8 py-3 overflow-x-auto">
            <a href="#" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
              <span>📱</span> Smartphones
            </a>
            <a href="#" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
              <span>💻</span> Computadores
            </a>
            <a href="#" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
              <span>🎧</span> Áudio
            </a>
            <a href="#" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
              <span>⌚</span> Acessórios
            </a>
            <a href="#" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
              <span>🏠</span> Casa
            </a>
            <a href="#" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
              <span>🔥</span> Ofertas
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
};