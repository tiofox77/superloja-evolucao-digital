export interface BannerTemplate {
  name: string;
  background: string;
  textColor: string;
  style: string;
  description?: string;
}

export const bannerTemplates: Record<string, BannerTemplate> = {
  custom: {
    name: 'Personalizado',
    background: '#8B4FA3',
    textColor: '#FFFFFF',
    style: 'custom'
  },
  magenta_circles: {
    name: 'Magenta Círculos',
    background: '#B83280',
    textColor: '#FFFFFF',
    style: 'rounded_card',
    description: 'Estilo moderno com círculos'
  },
  ocean_wave: {
    name: 'Onda Oceânica',
    background: '#0EA5E9',
    textColor: '#FFFFFF',
    style: 'wave_pattern'
  },
  sunset_gradient: {
    name: 'Pôr do Sol',
    background: '#F97316',
    textColor: '#FFFFFF',
    style: 'gradient_circles'
  },
  forest_green: {
    name: 'Verde Floresta',
    background: '#059669',
    textColor: '#FFFFFF',
    style: 'hexagon_pattern'
  },
  royal_purple: {
    name: 'Roxo Real',
    background: '#7C3AED',
    textColor: '#FFFFFF',
    style: 'diamond_pattern'
  },
  coral_reef: {
    name: 'Recife de Coral',
    background: '#F43F5E',
    textColor: '#FFFFFF',
    style: 'bubble_pattern'
  },
  golden_hour: {
    name: 'Hora Dourada',
    background: '#FBBF24',
    textColor: '#92400E',
    style: 'rays_pattern'
  },
  midnight_blue: {
    name: 'Azul Meia-Noite',
    background: '#1E40AF',
    textColor: '#FFFFFF',
    style: 'stars_pattern'
  },
  cherry_blossom: {
    name: 'Flor de Cerejeira',
    background: '#EC4899',
    textColor: '#FFFFFF',
    style: 'floral_pattern'
  },
  emerald_luxury: {
    name: 'Luxo Esmeralda',
    background: '#10B981',
    textColor: '#FFFFFF',
    style: 'luxury_pattern'
  },
  neon_cyber: {
    name: 'Cyber Neon',
    background: '#0A0A0A',
    textColor: '#00FF88',
    style: 'neon_cyber_pattern'
  },
  holographic: {
    name: 'Holográfico',
    background: '#1A1A2E',
    textColor: '#FFFFFF',
    style: 'holographic_pattern'
  },
  tropical_sunset: {
    name: 'Tropical Sunset',
    background: '#FF6B6B',
    textColor: '#FFFFFF',
    style: 'tropical_pattern'
  },
  minimalist_glass: {
    name: 'Vidro Minimalista',
    background: '#F8F9FA',
    textColor: '#495057',
    style: 'glass_morphism'
  },
  dark_elegance: {
    name: 'Elegância Escura',
    background: '#1A1A1A',
    textColor: '#D4D4D4',
    style: 'dark_elegance_pattern'
  },
  retro_wave: {
    name: 'Retro Wave',
    background: '#2D1B69',
    textColor: '#F72585',
    style: 'retro_wave_pattern'
  },
  geometric_modern: {
    name: 'Geométrico Moderno',
    background: '#667EEA',
    textColor: '#FFFFFF',
    style: 'geometric_pattern'
  },
  marble_luxury: {
    name: 'Mármore Luxo',
    background: '#FFFFFF',
    textColor: '#2C3E50',
    style: 'marble_pattern'
  }
};

// Função auxiliar para ajustar brilho da cor
export const adjustColorBrightness = (color: string, percent: number): string => {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + percent));
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + percent));
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + percent));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

export const generateTemplateBackground = (templateKey: string, baseColor: string): string => {
  const lightColor = adjustColorBrightness(baseColor, 30);
  const darkColor = adjustColorBrightness(baseColor, -40);
  const mediumColor = adjustColorBrightness(baseColor, -15);

  const template = bannerTemplates[templateKey];
  if (!template) return baseColor;

  switch (template.style) {
    case 'rounded_card':
      return `
        radial-gradient(circle at 15% 85%, ${adjustColorBrightness(baseColor, -15)}60 0%, transparent 25%),
        radial-gradient(circle at 85% 15%, ${adjustColorBrightness(baseColor, -10)}50 0%, transparent 25%),
        radial-gradient(circle at 25% 25%, ${adjustColorBrightness(baseColor, -20)}40 0%, transparent 20%),
        radial-gradient(circle at 75% 75%, ${adjustColorBrightness(baseColor, -5)}45 0%, transparent 25%),
        radial-gradient(circle at 45% 55%, ${adjustColorBrightness(baseColor, -25)}35 0%, transparent 20%),
        radial-gradient(circle at 65% 35%, ${adjustColorBrightness(baseColor, -12)}55 0%, transparent 30%),
        ${baseColor}
      `;

    case 'wave_pattern':
      return `
        radial-gradient(ellipse 1200px 400px at 50% 0%, ${lightColor}30 0%, transparent 60%),
        radial-gradient(ellipse 800px 600px at 0% 100%, ${adjustColorBrightness(baseColor, 10)}25 0%, transparent 50%),
        linear-gradient(135deg, ${baseColor} 0%, ${darkColor} 100%)
      `;

    case 'gradient_circles':
      return `
        radial-gradient(circle at 30% 70%, ${adjustColorBrightness(baseColor, 40)}40 0%, transparent 40%),
        radial-gradient(circle at 70% 30%, ${lightColor}35 0%, transparent 40%),
        linear-gradient(45deg, ${baseColor} 0%, ${adjustColorBrightness(baseColor, 25)} 50%, ${darkColor} 100%)
      `;

    case 'hexagon_pattern':
      return `
        conic-gradient(from 0deg at 33% 33%, ${lightColor}40 0deg, transparent 60deg, ${lightColor}40 120deg, transparent 180deg),
        conic-gradient(from 120deg at 66% 66%, ${adjustColorBrightness(baseColor, 15)}35 0deg, transparent 60deg, ${adjustColorBrightness(baseColor, 15)}35 120deg, transparent 180deg),
        linear-gradient(135deg, ${baseColor} 0%, ${mediumColor} 100%)
      `;

    case 'diamond_pattern':
      return `
        linear-gradient(45deg, ${baseColor} 25%, transparent 25%, transparent 75%, ${baseColor} 75%),
        linear-gradient(-45deg, ${lightColor}30 25%, transparent 25%, transparent 75%, ${lightColor}30 75%),
        radial-gradient(circle at center, ${adjustColorBrightness(baseColor, 10)} 0%, ${darkColor} 70%)
      `;

    case 'bubble_pattern':
      return `
        radial-gradient(circle at 20% 20%, ${lightColor}50 0%, transparent 30%),
        radial-gradient(circle at 80% 80%, ${adjustColorBrightness(baseColor, 20)}45 0%, transparent 35%),
        radial-gradient(circle at 60% 40%, ${adjustColorBrightness(baseColor, 10)}40 0%, transparent 25%),
        radial-gradient(circle at 40% 80%, ${lightColor}35 0%, transparent 30%),
        ${baseColor}
      `;

    case 'rays_pattern':
      return `
        conic-gradient(from 0deg at 50% 50%, ${lightColor} 0deg, transparent 45deg, ${adjustColorBrightness(baseColor, 15)} 90deg, transparent 135deg, ${lightColor} 180deg, transparent 225deg, ${adjustColorBrightness(baseColor, 15)} 270deg, transparent 315deg),
        radial-gradient(circle at center, transparent 30%, ${baseColor} 70%)
      `;

    case 'stars_pattern':
      return `
        radial-gradient(circle at 10% 20%, ${lightColor}20 0%, transparent 10%),
        radial-gradient(circle at 90% 80%, ${adjustColorBrightness(baseColor, 30)}25 0%, transparent 8%),
        radial-gradient(circle at 30% 90%, ${lightColor}15 0%, transparent 12%),
        radial-gradient(circle at 80% 10%, ${adjustColorBrightness(baseColor, 20)}20 0%, transparent 15%),
        radial-gradient(circle at 60% 60%, ${lightColor}18 0%, transparent 10%),
        linear-gradient(135deg, ${baseColor} 0%, ${darkColor} 100%)
      `;

    case 'floral_pattern':
      return `
        radial-gradient(ellipse 300px 150px at 25% 25%, ${lightColor}40 0%, transparent 50%),
        radial-gradient(ellipse 200px 300px at 75% 75%, ${adjustColorBrightness(baseColor, 15)}35 0%, transparent 50%),
        radial-gradient(ellipse 250px 200px at 50% 10%, ${adjustColorBrightness(baseColor, 25)}30 0%, transparent 60%),
        linear-gradient(135deg, ${baseColor} 0%, ${mediumColor} 100%)
      `;

    case 'luxury_pattern':
      return `
        linear-gradient(45deg, ${baseColor} 0%, ${lightColor}30 25%, ${baseColor} 50%, ${darkColor} 75%, ${baseColor} 100%),
        radial-gradient(circle at 30% 70%, ${adjustColorBrightness(baseColor, 35)}20 0%, transparent 40%),
        radial-gradient(circle at 70% 30%, ${lightColor}25 0%, transparent 35%)
      `;

    case 'neon_cyber_pattern':
      return `
        linear-gradient(45deg, ${baseColor} 0%, #0F0F23 25%, ${baseColor} 50%, #001122 75%, ${baseColor} 100%),
        radial-gradient(circle at 20% 20%, #00FF8850 0%, transparent 40%),
        radial-gradient(circle at 80% 80%, #FF004450 0%, transparent 30%),
        conic-gradient(from 0deg at 50% 50%, transparent 0deg, #00FFFF20 60deg, transparent 120deg, #FF006020 180deg, transparent 240deg)
      `;

    case 'holographic_pattern':
      return `
        linear-gradient(135deg, ${baseColor} 0%, #4C1D95 25%, #7C3AED 50%, #3B82F6 75%, ${baseColor} 100%),
        radial-gradient(ellipse at 30% 30%, #FF00FF40 0%, transparent 50%),
        radial-gradient(ellipse at 70% 70%, #00FFFF30 0%, transparent 60%),
        conic-gradient(from 45deg at 50% 50%, transparent 0deg, #FFFFFF10 45deg, transparent 90deg)
      `;

    case 'tropical_pattern':
      return `
        linear-gradient(135deg, ${baseColor} 0%, #FF8A80 25%, #FFD54F 50%, #81C784 75%, ${baseColor} 100%),
        radial-gradient(circle at 25% 75%, #FFA726aa 0%, transparent 40%),
        radial-gradient(circle at 75% 25%, #66BB6Aaa 0%, transparent 45%),
        radial-gradient(ellipse 200px 300px at 10% 90%, #FF7043aa 0%, transparent 60%)
      `;

    case 'glass_morphism':
      return `
        linear-gradient(135deg, ${baseColor}dd 0%, ${adjustColorBrightness(baseColor, 20)}cc 100%),
        radial-gradient(circle at 30% 30%, #FFFFFF30 0%, transparent 50%),
        radial-gradient(circle at 70% 70%, #FFFFFF20 0%, transparent 40%)
      `;

    case 'dark_elegance_pattern':
      return `
        linear-gradient(45deg, ${baseColor} 0%, #2D2D2D 25%, #404040 50%, #1A1A1A 75%, ${baseColor} 100%),
        radial-gradient(circle at 20% 80%, #4A90E2aa 0%, transparent 30%),
        radial-gradient(circle at 80% 20%, #D4A574aa 0%, transparent 35%),
        linear-gradient(0deg, transparent 40%, #FFFFFF05 50%, transparent 60%)
      `;

    case 'retro_wave_pattern':
      return `
        linear-gradient(135deg, ${baseColor} 0%, #FF006E 25%, #FB5607 50%, #FFBE0B 75%, ${baseColor} 100%),
        repeating-linear-gradient(90deg, transparent 0px, #FF1744aa 2px, transparent 4px, transparent 20px),
        radial-gradient(ellipse at center, transparent 30%, ${adjustColorBrightness(baseColor, -20)}80 70%)
      `;

    case 'geometric_pattern':
      return `
        conic-gradient(from 0deg at 25% 25%, ${baseColor} 0deg, ${lightColor} 90deg, ${baseColor} 180deg, ${darkColor} 270deg),
        conic-gradient(from 90deg at 75% 75%, ${adjustColorBrightness(baseColor, 15)} 0deg, ${baseColor} 90deg, ${lightColor} 180deg, ${baseColor} 270deg),
        linear-gradient(45deg, transparent 25%, ${baseColor}aa 25%, ${baseColor}aa 75%, transparent 75%)
      `;

    case 'marble_pattern':
      return `
        linear-gradient(135deg, ${baseColor} 0%, #F8F9FA 20%, #E9ECEF 40%, ${baseColor} 60%, #DEE2E6 80%, ${baseColor} 100%),
        radial-gradient(ellipse 400px 200px at 30% 70%, #6C757Daa 0%, transparent 60%),
        radial-gradient(ellipse 300px 400px at 70% 30%, #495057aa 0%, transparent 50%),
        linear-gradient(45deg, transparent 30%, #ADB5BD20 50%, transparent 70%)
      `;

    default:
      return baseColor;
  }
};