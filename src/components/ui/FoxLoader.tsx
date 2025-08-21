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
    sm: 'w-20 h-20',
    md: 'w-28 h-28',
    lg: 'w-36 h-36'
  };

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        {/* Container com animação flutuante */}
        <div className="absolute inset-0 animate-[float_3s_ease-in-out_infinite]">
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full filter drop-shadow-xl"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Definições de gradientes */}
            <defs>
              <linearGradient id="foxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff6b35" />
                <stop offset="50%" stopColor="#f7931e" />
                <stop offset="100%" stopColor="#ff4500" />
              </linearGradient>
              <linearGradient id="bellyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fff8dc" />
                <stop offset="100%" stopColor="#f5deb3" />
              </linearGradient>
              <linearGradient id="tailGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff4500" />
                <stop offset="50%" stopColor="#ff6b35" />
                <stop offset="100%" stopColor="#fff" />
              </linearGradient>
            </defs>
            
            {/* Cauda fluffy com animação de balanço */}
            <ellipse
              cx="95"
              cy="65"
              rx="12"
              ry="28"
              fill="url(#tailGradient)"
              transform="rotate(-15 95 65)"
              className="animate-[wiggle_2s_ease-in-out_infinite]"
              style={{ transformOrigin: '95px 65px' }}
            />
            
            {/* Ponta branca da cauda */}
            <ellipse
              cx="98"
              cy="45"
              rx="6"
              ry="12"
              fill="#ffffff"
              transform="rotate(-15 98 45)"
              className="animate-[wiggle_2s_ease-in-out_infinite]"
              style={{ transformOrigin: '98px 45px', animationDelay: '0.1s' }}
            />
            
            {/* Corpo principal */}
            <ellipse
              cx="60"
              cy="70"
              rx="20"
              ry="30"
              fill="url(#foxGradient)"
            />
            
            {/* Barriga clara */}
            <ellipse
              cx="58"
              cy="78"
              rx="12"
              ry="22"
              fill="url(#bellyGradient)"
            />
            
            {/* Cabeça */}
            <ellipse
              cx="60"
              cy="40"
              rx="18"
              ry="20"
              fill="url(#foxGradient)"
            />
            
            {/* Focinho claro */}
            <ellipse
              cx="60"
              cy="48"
              rx="10"
              ry="12"
              fill="url(#bellyGradient)"
            />
            
            {/* Orelhas com animação sutil */}
            <ellipse
              cx="50"
              cy="25"
              rx="6"
              ry="12"
              fill="url(#foxGradient)"
              transform="rotate(-25 50 25)"
              className="animate-[ear-twitch_4s_ease-in-out_infinite]"
            />
            <ellipse
              cx="70"
              cy="25"
              rx="6"
              ry="12"
              fill="url(#foxGradient)"
              transform="rotate(25 70 25)"
              className="animate-[ear-twitch_4s_ease-in-out_infinite]"
              style={{ animationDelay: '0.2s' }}
            />
            
            {/* Dentro das orelhas */}
            <ellipse
              cx="50"
              cy="28"
              rx="3"
              ry="7"
              fill="#ffb6c1"
              transform="rotate(-25 50 28)"
              className="animate-[ear-twitch_4s_ease-in-out_infinite]"
            />
            <ellipse
              cx="70"
              cy="28"
              rx="3"
              ry="7"
              fill="#ffb6c1"
              transform="rotate(25 70 28)"
              className="animate-[ear-twitch_4s_ease-in-out_infinite]"
              style={{ animationDelay: '0.2s' }}
            />
            
            {/* Olhos com piscadas */}
            <ellipse
              cx="55"
              cy="38"
              rx="3"
              ry="4"
              fill="#000"
              className="animate-[blink_3s_ease-in-out_infinite]"
            />
            <ellipse
              cx="65"
              cy="38"
              rx="3"
              ry="4"
              fill="#000"
              className="animate-[blink_3s_ease-in-out_infinite]"
              style={{ animationDelay: '0.1s' }}
            />
            
            {/* Brilho nos olhos */}
            <circle
              cx="56"
              cy="37"
              r="1"
              fill="#fff"
              className="animate-[blink_3s_ease-in-out_infinite]"
            />
            <circle
              cx="66"
              cy="37"
              r="1"
              fill="#fff"
              className="animate-[blink_3s_ease-in-out_infinite]"
              style={{ animationDelay: '0.1s' }}
            />
            
            {/* Nariz fofo */}
            <ellipse
              cx="60"
              cy="45"
              rx="2"
              ry="1.5"
              fill="#000"
            />
            
            {/* Boca sorridente */}
            <path
              d="M 60 47 Q 58 49 56 48"
              stroke="#000"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 60 47 Q 62 49 64 48"
              stroke="#000"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
            />
            
            {/* Patinhas */}
            <ellipse cx="48" cy="95" rx="4" ry="8" fill="url(#foxGradient)" />
            <ellipse cx="56" cy="95" rx="4" ry="8" fill="url(#foxGradient)" />
            <ellipse cx="64" cy="95" rx="4" ry="8" fill="url(#foxGradient)" />
            <ellipse cx="72" cy="95" rx="4" ry="8" fill="url(#foxGradient)" />
            
            {/* Almofadinhas das patas */}
            <circle cx="48" cy="98" r="2" fill="#000" />
            <circle cx="56" cy="98" r="2" fill="#000" />
            <circle cx="64" cy="98" r="2" fill="#000" />
            <circle cx="72" cy="98" r="2" fill="#000" />
          </svg>
        </div>

        {/* Círculo de loading com gradiente */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent bg-gradient-to-r from-primary via-accent to-primary bg-clip-border animate-spin" 
             style={{ 
               background: 'conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))',
               mask: 'radial-gradient(circle, transparent 70%, black 72%)',
               WebkitMask: 'radial-gradient(circle, transparent 70%, black 72%)'
             }}>
        </div>

        {/* Partículas flutuantes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-2 left-4 w-1 h-1 bg-accent rounded-full animate-ping"></div>
          <div className="absolute top-6 right-2 w-1 h-1 bg-primary rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-4 left-2 w-1 h-1 bg-accent rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-2 right-6 w-1 h-1 bg-primary rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
        </div>
      </div>

      {showText && (
        <div className="mt-6 text-center">
          <p className="text-muted-foreground font-medium text-sm animate-pulse">
            {text}
          </p>
          <div className="flex justify-center mt-3 space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}

    </div>
  );
};