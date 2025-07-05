import React from 'react';
import { cn } from '@/lib/utils';
import { Package, ShoppingBag, Store } from 'lucide-react';

interface SuperLojaAvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  interactive?: boolean;
}

const SuperLojaAvatar: React.FC<SuperLojaAvatarProps> = ({ 
  src, 
  alt = 'Produto', 
  size = 'md',
  className,
  interactive = false
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-lg',
    lg: 'w-24 h-24 text-2xl',
    xl: 'w-32 h-32 text-4xl'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  if (src) {
    return (
      <div className="relative">
        <img 
          src={src} 
          alt={alt}
          className={cn(
            'object-cover rounded-lg',
            sizeClasses[size],
            className,
            interactive && 'hover:scale-105 transition-transform duration-300'
          )}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
            if (nextElement) {
              nextElement.style.display = 'flex';
            }
          }}
        />
        <div 
          className={cn(
            'hidden bg-gradient-to-br from-primary via-blue-600 to-purple-600 text-white font-bold flex-col items-center justify-center rounded-lg shadow-lg relative overflow-hidden',
            sizeClasses[size],
            className,
            interactive && 'hover:scale-105 transition-all duration-300 hover:shadow-xl cursor-pointer'
          )}
          style={{ display: 'none' }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-grid-white/10 opacity-30"></div>
          <div className="absolute top-2 right-2 opacity-20">
            <Store className={iconSizes[size]} />
          </div>
          
          {/* Main Logo */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="text-white font-black text-3xl drop-shadow-lg">S</div>
            {size !== 'sm' && (
              <div className="text-xs font-semibold tracking-wide opacity-90 mt-1">
                SUPERLOJA
              </div>
            )}
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute bottom-2 left-2 opacity-20">
            <ShoppingBag className={cn(iconSizes[size], 'w-3 h-3')} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'bg-gradient-to-br from-primary via-blue-600 to-purple-600 text-white font-bold flex flex-col items-center justify-center rounded-lg shadow-lg relative overflow-hidden',
      sizeClasses[size],
      className,
      interactive && 'hover:scale-105 transition-all duration-300 hover:shadow-xl cursor-pointer'
    )}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/10 opacity-30"></div>
      <div className="absolute top-2 right-2 opacity-20">
        <Store className={iconSizes[size]} />
      </div>
      
      {/* Main Logo */}
      <div className="relative z-10 flex flex-col items-center">
        <div className={cn(
          'text-white font-black drop-shadow-lg',
          size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : size === 'lg' ? 'text-3xl' : 'text-5xl'
        )}>
          S
        </div>
        {size !== 'sm' && (
          <div className="text-xs font-semibold tracking-wide opacity-90 mt-1">
            SUPERLOJA
          </div>
        )}
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute bottom-2 left-2 opacity-20">
        <ShoppingBag className={cn(iconSizes[size], 'w-3 h-3')} />
      </div>
    </div>
  );
};

export default SuperLojaAvatar;