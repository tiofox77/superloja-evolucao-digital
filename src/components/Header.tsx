import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Menu, X, User, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import NotificationBell from '@/components/NotificationBell';
import { CartSidebar } from './CartSidebar';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useSettings } from '@/contexts/SettingsContext';
import SuperLojaAvatar from '@/components/SuperLojaAvatar';
import { PromotionBanner } from '@/components/PromotionBanner';

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const { itemCount, setIsOpen } = useCart();
  const { settings } = useSettings();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-card">
        {/* Top bar com promoção */}
        <PromotionBanner />

        {/* Main header */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {settings.logo_url ? (
                  <SuperLojaAvatar 
                    src={settings.logo_url} 
                    alt={settings.store_name}
                    size="md"
                    className="rounded-lg"
                  />
                ) : (
                  <div className="w-10 h-10 hero-gradient rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {settings.store_name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold text-foreground">{settings.store_name}</h1>
                  <p className="text-xs text-muted-foreground">{settings.store_description}</p>
                </div>
              </div>
            </Link>

            {/* Search bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full rounded-full border-border focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              {/* Desktop Menu */}
              <nav className="hidden lg:flex items-center space-x-6">
                <Link to="/" className="text-foreground hover:text-primary transition-colors font-medium">
                  Home
                </Link>
                <Link to="/catalogo" className="text-foreground hover:text-primary transition-colors font-medium">
                  Catálogo
                </Link>
                <Link to="/categorias" className="text-foreground hover:text-primary transition-colors font-medium">
                  Categorias
                </Link>
                <Link to="/sobre" className="text-foreground hover:text-primary transition-colors font-medium">
                  Sobre
                </Link>
                <Link to="/contato" className="text-foreground hover:text-primary transition-colors font-medium">
                  Contato
                </Link>
              </nav>

              {/* User actions */}
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative hover:bg-muted transition-colors"
                >
                  <Heart className="w-5 h-5" />
                </Button>
                
                {user && <NotificationBell />}
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative hover:bg-muted transition-colors"
                  onClick={() => setIsOpen(true)}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {itemCount > 0 && (
                    <span className="cart-badge">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </Button>

                <Button 
                  variant="ghost" 
                  size="icon"
                  className="hover:bg-muted transition-colors"
                  asChild
                >
                  <Link to={user ? "/cliente" : "/auth"}>
                    <User className="w-5 h-5" />
                  </Link>
                </Button>
              </div>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-full"
              />
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden mt-4 py-4 border-t border-border animate-fade-in">
              <nav className="flex flex-col space-y-4">
                <Link to="/" className="text-foreground hover:text-primary transition-colors font-medium py-2">
                  Home
                </Link>
                <Link to="/catalogo" className="text-foreground hover:text-primary transition-colors font-medium py-2">
                  Catálogo
                </Link>
                <Link to="/categorias" className="text-foreground hover:text-primary transition-colors font-medium py-2">
                  Categorias
                </Link>
                <Link to="/sobre" className="text-foreground hover:text-primary transition-colors font-medium py-2">
                  Sobre
                </Link>
                <Link to="/contato" className="text-foreground hover:text-primary transition-colors font-medium py-2">
                  Contato
                </Link>
                <Link to={user ? "/cliente" : "/auth"} className="text-foreground hover:text-primary transition-colors font-medium py-2">
                  {user ? 'Área do Cliente' : 'Entrar'}
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>
      
      <CartSidebar />
    </>
  );
};