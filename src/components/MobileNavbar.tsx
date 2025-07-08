import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, User, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useIsMobile } from '@/hooks/use-mobile';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Grid3X3, label: 'Catálogo', path: '/catalogo' },
  { icon: Search, label: 'Buscar', path: '/categorias' },
  { icon: ShoppingCart, label: 'Carrinho', path: '/checkout', isCart: true },
  { icon: User, label: 'Conta', path: '/cliente' },
];

export const MobileNavbar: React.FC = () => {
  const location = useLocation();
  const { itemCount, setIsOpen } = useCart();
  const isMobile = useIsMobile();

  // Only show on mobile and not in admin routes
  if (!isMobile || location.pathname.startsWith('/admin')) {
    return null;
  }

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(true);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-lg">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const IconComponent = item.icon;
          
          if (item.isCart) {
            return (
              <Button
                key={item.label}
                variant="ghost"
                size="sm"
                className={`relative flex flex-col items-center justify-center h-full rounded-none border-0 ${
                  isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={handleCartClick}
              >
                <IconComponent className="h-5 w-5" />
                <span className="text-xs mt-1">{item.label}</span>
                {itemCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center rounded-full"
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </Badge>
                )}
              </Button>
            );
          }

          return (
            <Button
              key={item.label}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center justify-center h-full rounded-none border-0 ${
                isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
              }`}
              asChild
            >
              <Link to={item.path}>
                <IconComponent className="h-5 w-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
};