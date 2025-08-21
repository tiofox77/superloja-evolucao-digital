import React from 'react';
import { cn } from '@/lib/utils';

interface FoxLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  text?: string;
}

export const FoxLoader: React.FC<FoxLoaderProps> = ({
  className,
  size = 'md',
  showText = true,
  text = 'Carregando...'
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        {/* Raposa animada */}
        <div className="absolute inset-0 animate-bounce">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-lg"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Cauda */}
            <ellipse
              cx="85"
              cy="60"
              rx="8"
              ry="20"
              fill="hsl(var(--primary))"
              className="animate-pulse"
              style={{ animationDelay: '0.5s' }}
            />
            
            {/* Corpo */}
            <ellipse
              cx="50"
              cy="60"
              rx="18"
              ry="25"
              fill="hsl(var(--primary))"
            />
            
            {/* Cabeça */}
            <circle
              cx="50"
              cy="35"
              r="15"
              fill="hsl(var(--primary))"
            />
            
            {/* Orelhas */}
            <ellipse
              cx="42"
              cy="25"
              rx="4"
              ry="8"
              fill="hsl(var(--primary))"
              transform="rotate(-20 42 25)"
            />
            <ellipse
              cx="58"
              cy="25"
              rx="4"
              ry="8"
              fill="hsl(var(--primary))"
              transform="rotate(20 58 25)"
            />
            
            {/* Dentro das orelhas */}
            <ellipse
              cx="42"
              cy="27"
              rx="2"
              ry="5"
              fill="hsl(var(--accent))"
              transform="rotate(-20 42 27)"
            />
            <ellipse
              cx="58"
              cy="27"
              rx="2"
              ry="5"
              fill="hsl(var(--accent))"
              transform="rotate(20 58 27)"
            />
            
            {/* Focinho */}
            <ellipse
              cx="50"
              cy="40"
              rx="8"
              ry="6"
              fill="hsl(var(--muted))"
            />
            
            {/* Nariz */}
            <circle
              cx="50"
              cy="38"
              r="2"
              fill="hsl(var(--foreground))"
            />
            
            {/* Olhos */}
            <circle
              cx="46"
              cy="32"
              r="2"
              fill="hsl(var(--foreground))"
              className="animate-pulse"
              style={{ animationDelay: '0.2s' }}
            />
            <circle
              cx="54"
              cy="32"
              r="2"
              fill="hsl(var(--foreground))"
              className="animate-pulse"
              style={{ animationDelay: '0.2s' }}
            />
            
            {/* Pernas */}
            <rect
              x="40"
              y="75"
              width="4"
              height="15"
              fill="hsl(var(--primary))"
              rx="2"
            />
            <rect
              x="48"
              y="75"
              width="4"
              height="15"
              fill="hsl(var(--primary))"
              rx="2"
            />
            <rect
              x="56"
              y="75"
              width="4"
              height="15"
              fill="hsl(var(--primary))"
              rx="2"
            />
            <rect
              x="64"
              y="75"
              width="4"
              height="15"
              fill="hsl(var(--primary))"
              rx="2"
            />
          </svg>
        </div>

        {/* Círculo de loading */}
        <div className="absolute inset-0 border-2 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>

      {showText && (
        <div className="mt-4 text-center">
          <p className="text-muted-foreground font-medium animate-pulse">
            {text}
          </p>
          <div className="flex justify-center mt-2 space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};