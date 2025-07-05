import React from 'react';
import { cn } from '@/lib/utils';

interface SuperLojaAvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SuperLojaAvatar: React.FC<SuperLojaAvatarProps> = ({ 
  src, 
  alt = 'Produto', 
  size = 'md',
  className 
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-lg',
    lg: 'w-24 h-24 text-2xl',
    xl: 'w-32 h-32 text-4xl'
  };

  if (src) {
    return (
      <img 
        src={src} 
        alt={alt}
        className={cn(
          'object-cover rounded-lg',
          sizeClasses[size],
          className
        )}
        onError={(e) => {
          // If image fails to load, replace with the S avatar
          e.currentTarget.style.display = 'none';
          const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
          if (nextElement) {
            nextElement.style.display = 'flex';
          }
        }}
      />
    );
  }

  return (
    <div className={cn(
      'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold flex items-center justify-center rounded-lg shadow-md',
      sizeClasses[size],
      className
    )}>
      S
    </div>
  );
};

export default SuperLojaAvatar;