import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import html2canvas from 'html2canvas';
import { Download, Facebook, Instagram, Smartphone } from 'lucide-react';
// Definição da interface de produto
interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  images?: string[];
  image?: string;
  currency?: string;
}

// Hook personalizado para carregar produtos do Supabase
const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .limit(100);

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading };
};

// Templates predefinidos para banners
const BANNER_TEMPLATES = [
  {
    id: 'template1',
    name: 'Circular Roxo',
    background: '#8E1D54',
    textColor: '#FFFFFF',
    pattern: 'circles',
    patternColor: 'rgba(255,255,255,0.2)'
  },
  {
    id: 'template2',
    name: 'Moderno Azul',
    background: '#1D4E8E',
    textColor: '#FFFFFF',
    pattern: 'lines',
    patternColor: 'rgba(255,255,255,0.1)'
  },
  {
    id: 'template3',
    name: 'Minimalista Verde',
    background: '#1D8E4E',
    textColor: '#FFFFFF',
    pattern: 'dots',
    patternColor: 'rgba(255,255,255,0.15)'
  },
  {
    id: 'template4',
    name: 'Laranja Vibrante',
    background: '#E86C00',
    textColor: '#FFFFFF',
    pattern: 'zigzag',
    patternColor: 'rgba(255,255,255,0.2)'
  }
];

/**
 * Componente gerador de banners promocionais para produtos
 * Permite selecionar produtos, personalizar banners e baixar/compartilhar
 */
const AdminBannerGerador: React.FC = () => {
  const { toast } = useToast();
  const bannerRef = useRef<HTMLDivElement>(null);
  const { products, loading } = useProducts();

  // Função para salvar configurações no localStorage
  const saveSettings = (newSettings: any) => {
    try {
      localStorage.setItem('bannerGeneratorSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.warn('Não foi possível salvar as configurações:', error);
    }
  };

  // Função para carregar configurações do localStorage
  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('bannerGeneratorSettings');
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        // Mescla com as configurações padrão para garantir que todas as propriedades existam
        return {
          customBackground: '#8B4FA3',
          customTextColor: '#FFFFFF',
          width: 1080,
          height: 1080,
          priceEnabled: true,
          urlEnabled: true,
          produtoFundoBranco: false,
          logoEnabled: true,
          selectedTemplate: 'custom',
          template: {
            pattern: 'none',
            patternColor: '#FFFFFF'
          },
          ...parsedSettings
        };
      }
    } catch (error) {
      console.warn('Não foi possível carregar as configurações:', error);
    }
    return null;
  };

  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [productData, setProductData] = useState({
    title: 'Conheça nosso novo Adaptador para leitor de cartões Micro Sd e SD',
    description: 'Compatível com todos os dispositivos Type-C',
    price: '69.90',
    imageUrl: '',
    productUrl: 'superloja.vip'
  });

  const [settings, setSettings] = useState(() => {
    const savedSettings = loadSettings();
    return savedSettings || {
      customBackground: '#8B4FA3',
      customTextColor: '#FFFFFF',
      width: 1080,
      height: 1080,
      priceEnabled: true,
      urlEnabled: true,
      produtoFundoBranco: false,
      logoEnabled: true,
      selectedTemplate: 'custom' as string,
      template: {
        pattern: 'none' as 'none' | 'circles' | 'lines' | 'dots' | 'zigzag',
        patternColor: '#FFFFFF'
      }
    };
  });

  const [bannerMode, setBannerMode] = useState('square'); // square, story, post

  // Templates pré-definidos
  const templates = {
    custom: {
      name: 'Personalizado',
      background: '#8B4FA3',
      textColor: '#FFFFFF',
      style: 'custom'
    },
    magenta_circles: {
      name: 'Magenta Círculos',
      background: '#B83280',
      textColor: '#4A1D3A',
      style: 'rounded_card',
      description: 'Estilo similar ao anexo'
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
    lilac_bubbles: {
      name: 'Lilás com Bolinhas',
      background: '#B83280',
      textColor: '#FFFFFF',
      style: 'lilac_bubbles_pattern',
      description: 'Estilo lilás com padrão de bolinhas'
    }
  };



  // Efeito para carregar detalhes do produto quando seleciona um
  useEffect(() => {
    if (selectedProduct && products) {
      const product = products.find(p => p.id.toString() === selectedProduct);
      if (product) {
        setProductData({
          title: product.name,
          description: product.description?.substring(0, 100) || '',
          price: product.price.toString(),
          imageUrl: product.images?.[0] || '',
          productUrl: 'superloja.vip'
        });
      }
    }
  }, [selectedProduct, products]);

  // Função para atualizar o produto selecionado
  const handleProductChange = (productId: string) => {
    setSelectedProduct(productId);

    // Limpar campos se selecionar personalizado
    if (productId === 'custom') {
      setProductData({
        title: 'Adicione um título aqui',
        description: 'Descreva o seu produto',
        price: '0',
        imageUrl: '',
        productUrl: 'superloja.vip'
      });
    }
  };

  // Função para atualizar os dados do produto
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductData(prev => ({ ...prev, [name]: value }));
  };

  // Função para atualizar as configurações do banner
  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings); // Salva automaticamente
  };

  // Função para selecionar um template predefinido
  const selectTemplate = (templateId: string) => {
    const template = templates[templateId as keyof typeof templates];
    if (template) {
      setSettings(prev => ({
        ...prev,
        customBackground: template.background,
        customTextColor: template.textColor,
        selectedTemplate: templateId,
        produtoFundoBranco: templateId === 'magenta_circles'
      }));
    }
  };

  // Função para ajustar o tamanho do banner conforme o modo
  const handleBannerModeChange = (mode: string) => {
    setBannerMode(mode);

    switch (mode) {
      case 'square':
        setSettings(prev => ({ ...prev, width: 1080, height: 1080 }));
        break;
      case 'story':
        setSettings(prev => ({ ...prev, width: 1080, height: 1920 }));
        break;
      case 'post':
        setSettings(prev => ({ ...prev, width: 1200, height: 630 }));
        break;
      default:
        break;
    }
  };

  // Função para gerar imagem a partir do banner
  const generateImage = async (): Promise<{ blob: Blob, dataUrl: string } | null> => {
    if (!bannerRef.current) return null;

    try {
      toast({
        title: 'Processando imagem...',
        description: 'Estamos a preparar o seu banner.',
      });

      const canvas = await html2canvas(bannerRef.current, {
        scale: 4, // Escala alta para qualidade máxima
        useCORS: true,
        backgroundColor: null,
        logging: false,
        allowTaint: true,
        imageTimeout: 0,
        ignoreElements: (element) => {
          // Ignora elementos que podem interferir na captura
          return element.classList?.contains('ignore-capture') || false;
        },
        onclone: (clonedDoc) => {
          // Garante que o elemento clonado mantenha EXATAMENTE o mesmo estilo
          const clonedElement = clonedDoc.querySelector('#banner-element') as HTMLElement;
          if (clonedElement && bannerRef.current) {
            // Copia todas as propriedades CSS computadas
            const originalStyles = window.getComputedStyle(bannerRef.current);
            clonedElement.style.width = originalStyles.width;
            clonedElement.style.height = originalStyles.height;
            clonedElement.style.transform = originalStyles.transform;
            clonedElement.style.background = originalStyles.background;
            clonedElement.style.backgroundSize = originalStyles.backgroundSize;
            clonedElement.style.position = originalStyles.position;
            clonedElement.style.overflow = originalStyles.overflow;
            clonedElement.style.padding = originalStyles.padding;
            clonedElement.style.margin = originalStyles.margin;
          }
        }
      });

      // Gera um dataURL para uso direto
      const dataUrl = canvas.toDataURL('image/png', 1.0);

      // Também gera um blob para outros usos
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png', 1.0);
      });

      if (!blob) {
        throw new Error('Falha ao gerar a imagem');
      }

      return { blob, dataUrl };

    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao processar imagem',
        description: 'Não foi possível criar o banner. Por favor, tente novamente.',
      });
      return null;
    }
  };

  // Função para download do banner como imagem
  const handleDownload = async () => {
    const result = await generateImage();

    if (result) {
      // Cria um objeto URL para o Blob
      const url = URL.createObjectURL(result.blob);

      // Cria um link para download
      const link = document.createElement('a');
      link.href = url;
      link.download = `banner-produto-${new Date().getTime()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Libera o objeto URL após uso
      setTimeout(() => URL.revokeObjectURL(url), 100);

      toast({
        title: 'Banner baixado com sucesso!',
        description: 'O arquivo foi salvo na sua pasta de downloads.',
      });
    }
  };

  // Função para compartilhar nas redes sociais
  const handleShare = async (platform: 'facebook' | 'instagram' | 'whatsapp') => {
    // Gera a imagem
    const result = await generateImage();

    if (!result) {
      toast({
        variant: 'destructive',
        title: 'Erro ao compartilhar',
        description: 'Não foi possível gerar a imagem para compartilhamento.',
      });
      return;
    }

    try {
      // Texto para compartilhamento
      const productTitle = productData.title;
      const productPrice = productData.price;
      const shareText = `${productTitle} - AOA ${productPrice} | Confira este produto em nossa loja!`;

      // Cria um objeto URL para o Blob (para download)
      const blobUrl = URL.createObjectURL(result.blob);

      // Usamos o dataUrl para compartilhamento
      const dataUrl = result.dataUrl;

      // Abre a janela de compartilhamento de acordo com a plataforma
      switch (platform) {
        case 'facebook':
          // Facebook precisa de uma URL externa, como não temos,
          // vamos apenas compartilhar o texto e instruir o usuário a anexar a imagem
          window.open(`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareText)}`, '_blank', 'width=600,height=400');

          // Também baixamos a imagem para o usuário adicionar manualmente
          const fbLink = document.createElement('a');
          fbLink.href = blobUrl;
          fbLink.download = `facebook-banner-${new Date().getTime()}.png`;
          document.body.appendChild(fbLink);
          fbLink.click();
          document.body.removeChild(fbLink);

          toast({
            title: 'Imagem baixada para Facebook',
            description: 'Adicione esta imagem ao seu post no Facebook manualmente.',
          });
          break;
        case 'instagram':
          toast({
            variant: 'default',
            title: 'Compartilhamento para Instagram',
            description: 'A imagem foi baixada. Faça upload manualmente no Instagram.',
          });
          const igLink = document.createElement('a');
          igLink.href = blobUrl;
          igLink.download = `instagram-banner-${new Date().getTime()}.png`;
          document.body.appendChild(igLink);
          igLink.click();
          document.body.removeChild(igLink);
          break;
        case 'whatsapp':
          // Para WhatsApp, baixamos a imagem e abrimos o compartilhamento com o texto
          const waLink = document.createElement('a');
          waLink.href = blobUrl;
          waLink.download = `whatsapp-banner-${new Date().getTime()}.png`;
          document.body.appendChild(waLink);
          waLink.click();
          document.body.removeChild(waLink);

          // Abrimos WhatsApp com o texto
          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank', 'width=600,height=400');

          toast({
            title: 'Imagem baixada para WhatsApp',
            description: 'Adicione esta imagem à sua conversa no WhatsApp manualmente.',
          });
          break;
      }

      // Libera o objeto URL após uso
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao compartilhar',
        description: 'Houve um problema ao processar o compartilhamento. Tente novamente.',
      });
    }
  };

  // Função para gerar um padrão de fundo
  const generatePattern = () => {
    const { pattern, patternColor } = settings.template;

    switch (pattern) {
      case 'circles':
        return `radial-gradient(circle at 33% 33%, ${patternColor} 4%, transparent 5%),
                radial-gradient(circle at 66% 66%, ${patternColor} 4%, transparent 5%)`;
      case 'lines':
        return `repeating-linear-gradient(45deg, ${patternColor}, ${patternColor} 10px, transparent 10px, transparent 20px)`;
      case 'dots':
        return `radial-gradient(${patternColor} 3px, transparent 4px)`;
      case 'zigzag':
        return `linear-gradient(135deg, ${patternColor} 25%, transparent 25%) 0 0,
                linear-gradient(225deg, ${patternColor} 25%, transparent 25%) 0 0`;
      default:
        return 'none';
    }
  };

  // Função para aplicar template selecionado
  const applyTemplate = (templateKey: string) => {
    const template = templates[templateKey as keyof typeof templates];
    if (template && templateKey !== 'custom') {
      const newSettings = {
        ...settings,
        customBackground: template.background,
        customTextColor: template.textColor,
        selectedTemplate: templateKey,
        produtoFundoBranco: templateKey === 'magenta_circles' || templateKey === 'lilac_bubbles'
      };
      setSettings(newSettings);
      saveSettings(newSettings); // Salva automaticamente
    }
  };

  // Função para gerar background baseado no template
  const generateTemplateBackground = (templateKey: string) => {
    const baseColor = settings.customBackground;
    const lightColor = adjustColorBrightness(baseColor, 30);
    const darkColor = adjustColorBrightness(baseColor, -40);
    const mediumColor = adjustColorBrightness(baseColor, -15);

    const template = templates[templateKey as keyof typeof templates];
    if (!template) return baseColor;

    switch (template.style) {
      case 'rounded_card':
        // Estilo da imagem anexa - fundo com círculos
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
      
      case 'lilac_bubbles_pattern':
        // Estilo lilás com bolinhas similar à imagem anexa
        return `
          radial-gradient(circle at 12% 15%, ${adjustColorBrightness(baseColor, -12)}70 0%, transparent 20%),
          radial-gradient(circle at 88% 25%, ${adjustColorBrightness(baseColor, -8)}60 0%, transparent 18%),
          radial-gradient(circle at 20% 45%, ${adjustColorBrightness(baseColor, -15)}50 0%, transparent 15%),
          radial-gradient(circle at 75% 55%, ${adjustColorBrightness(baseColor, -10)}65 0%, transparent 22%),
          radial-gradient(circle at 35% 75%, ${adjustColorBrightness(baseColor, -18)}45 0%, transparent 16%),
          radial-gradient(circle at 65% 85%, ${adjustColorBrightness(baseColor, -5)}55 0%, transparent 20%),
          radial-gradient(circle at 50% 30%, ${adjustColorBrightness(baseColor, -20)}40 0%, transparent 12%),
          radial-gradient(circle at 25% 90%, ${adjustColorBrightness(baseColor, -7)}48 0%, transparent 17%),
          radial-gradient(circle at 85% 70%, ${adjustColorBrightness(baseColor, -14)}52 0%, transparent 19%),
          ${baseColor}
        `;

      default:
        return baseColor;
    }
  };

  // Função auxiliar para ajustar brilho da cor
  const adjustColorBrightness = (color: string, percent: number) => {
    // Converte hex para rgb, ajusta brilho e retorna
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + percent));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + percent));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + percent));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-6">Gerador de Banners de Produtos</h1>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Painel de Controle */}
        <div className="md:col-span-5 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="produto" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="produto" className="flex-1">Produto</TabsTrigger>
                  <TabsTrigger value="estilo" className="flex-1">Estilo</TabsTrigger>
                  <TabsTrigger value="tamanho" className="flex-1">Tamanho</TabsTrigger>
                </TabsList>

                {/* Aba Produto */}
                <TabsContent value="produto" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="product">Selecionar Produto</Label>
                    <Select
                      value={selectedProduct}
                      onValueChange={handleProductChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um produto ou personalize" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Personalizado</SelectItem>
                        {!loading && products?.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      name="title"
                      value={productData.title}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={productData.description}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="price">Preço (AOA)</Label>
                    <Input
                      id="price"
                      name="price"
                      value={productData.price}
                      onChange={handleInputChange}
                      type="number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="imageUrl">URL da Imagem</Label>
                    <Input
                      id="imageUrl"
                      name="imageUrl"
                      value={productData.imageUrl}
                      onChange={handleInputChange}
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="productUrl">URL do Produto</Label>
                    <Input
                      id="productUrl"
                      name="productUrl"
                      value={productData.productUrl}
                      onChange={handleInputChange}
                    />
                  </div>
                </TabsContent>

                {/* Aba Estilo */}
                <TabsContent value="estilo" className="space-y-4 mt-4">
                  <div>
                    <Label>Templates Pré-definidos</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {Object.entries(templates).slice(0, 6).map(([key, template]) => (
                        <Button
                          key={key}
                          variant={settings.selectedTemplate === key ? 'default' : 'outline'}
                          onClick={() => applyTemplate(key)}
                          className="h-auto p-2 text-xs flex flex-col items-center"
                          style={{
                            background: key !== 'custom' && settings.selectedTemplate === key
                              ? `linear-gradient(135deg, ${template.background}40, ${template.background})`
                              : undefined
                          }}
                        >
                          <div
                            className="w-8 h-6 rounded mb-1 border"
                            style={{
                              background: key === 'custom' ? 'linear-gradient(45deg, #ccc, #999)' : template.background
                            }}
                          ></div>
                          <span className="text-center leading-tight">{template.name}</span>
                        </Button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {Object.entries(templates).slice(6).map(([key, template]) => (
                        <Button
                          key={key}
                          variant={settings.selectedTemplate === key ? 'default' : 'outline'}
                          onClick={() => applyTemplate(key)}
                          className="h-auto p-2 text-xs flex flex-col items-center"
                          style={{
                            background: settings.selectedTemplate === key
                              ? `linear-gradient(135deg, ${template.background}40, ${template.background})`
                              : undefined
                          }}
                        >
                          <div
                            className="w-8 h-6 rounded mb-1 border"
                            style={{ background: template.background }}
                          ></div>
                          <span className="text-center leading-tight">{template.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="customBackground">Cor de Fundo</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="customBackground"
                        type="color"
                        value={settings.customBackground}
                        onChange={(e) => handleSettingChange('customBackground', e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        type="text"
                        value={settings.customBackground}
                        onChange={(e) => handleSettingChange('customBackground', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="customTextColor">Cor do Texto</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="customTextColor"
                        type="color"
                        value={settings.customTextColor}
                        onChange={(e) => handleSettingChange('customTextColor', e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        type="text"
                        value={settings.customTextColor}
                        onChange={(e) => handleSettingChange('customTextColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="priceEnabled"
                      checked={settings.priceEnabled}
                      onCheckedChange={(checked) => handleSettingChange('priceEnabled', checked)}
                    />
                    <Label htmlFor="priceEnabled">Mostrar Preço</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="urlEnabled"
                      checked={settings.urlEnabled}
                      onCheckedChange={(checked) => handleSettingChange('urlEnabled', checked)}
                    />
                    <Label htmlFor="urlEnabled">Mostrar URL</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="produtoFundoBranco"
                      checked={settings.produtoFundoBranco}
                      onCheckedChange={(checked) => handleSettingChange('produtoFundoBranco', checked)}
                    />
                    <Label htmlFor="produtoFundoBranco">Fundo branco para produto</Label>
                  </div>
                </TabsContent>

                {/* Aba Tamanho */}
                <TabsContent value="tamanho" className="space-y-4 mt-4">
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={bannerMode === 'square' ? 'default' : 'outline'}
                      onClick={() => handleBannerModeChange('square')}
                      className="flex flex-col h-20 text-xs"
                    >
                      <div className="w-10 h-10 border-2 border-current mb-1"></div>
                      Quadrado 1:1
                    </Button>

                    <Button
                      variant={bannerMode === 'story' ? 'default' : 'outline'}
                      onClick={() => handleBannerModeChange('story')}
                      className="flex flex-col h-20 text-xs"
                    >
                      <div className="w-6 h-10 border-2 border-current mb-1"></div>
                      Story 9:16
                    </Button>

                    <Button
                      variant={bannerMode === 'post' ? 'default' : 'outline'}
                      onClick={() => handleBannerModeChange('post')}
                      className="flex flex-col h-20 text-xs"
                    >
                      <div className="w-10 h-6 border-2 border-current mb-1"></div>
                      Post 1.91:1
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="width">Largura (px)</Label>
                    <div className="flex items-center space-x-2">
                      <Slider
                        id="width"
                        min={300}
                        max={2000}
                        step={10}
                        value={[settings.width]}
                        onValueChange={([value]) => handleSettingChange('width', value)}
                        className="flex-1"
                      />
                      <span className="w-14 text-right">{settings.width}</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="height">Altura (px)</Label>
                    <div className="flex items-center space-x-2">
                      <Slider
                        id="height"
                        min={300}
                        max={2000}
                        step={10}
                        value={[settings.height]}
                        onValueChange={([value]) => handleSettingChange('height', value)}
                        className="flex-1"
                      />
                      <span className="w-14 text-right">{settings.height}</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleDownload} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button onClick={() => handleShare('facebook')} variant="outline" className="flex-1">
              <Facebook className="mr-2 h-4 w-4" />
              Facebook
            </Button>
            <Button onClick={() => handleShare('whatsapp')} variant="outline" className="flex-1">
              <Smartphone className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
          </div>
        </div>

        {/* Pré-visualização do Banner */}
        <div className="md:col-span-7">
          <div className="border rounded-lg p-4 bg-gray-100 flex items-center justify-center">
            <div className="overflow-hidden" style={{ maxWidth: '100%', maxHeight: '80vh' }}>
              <div
                ref={bannerRef}
                id="banner-element"
                style={{
                  width: `${settings.width / 2}px`, // Escala maior para preview mais próximo do final
                  height: `${settings.height / 2}px`,
                  background: generateTemplateBackground(settings.selectedTemplate),
                  backgroundSize: 'cover',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                className="flex flex-col items-center justify-start text-center p-2 rounded-lg shadow-lg transform scale-100 origin-center"
              >
                {/* Container para imagem e textos - bem no topo */}
                <div style={{ height: '50%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', marginTop: '-10%', paddingTop: '8px' }}>
                  {/* Imagem do Produto */}
                  {productData.imageUrl && (
                    <div className="flex items-center justify-center" style={{ marginBottom: '2%' }}>
                      <div 
                        style={{
                          backgroundColor: settings.produtoFundoBranco ? '#ffffff' : 'transparent',
                          padding: settings.produtoFundoBranco ? '4px 6px' : '0',
                          borderRadius: settings.produtoFundoBranco ? '8px' : '0',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: settings.produtoFundoBranco ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                        }}
                      >
                        <img 
                          src={productData.imageUrl} 
                          alt={productData.title}
                          style={{ 
                            maxHeight: bannerMode === 'square' 
                              ? (settings.produtoFundoBranco ? '100px' : '120px')
                              : (settings.produtoFundoBranco ? '140px' : '160px'),
                            maxWidth: bannerMode === 'square' 
                              ? (settings.produtoFundoBranco ? '100px' : '120px')
                              : (settings.produtoFundoBranco ? '140px' : '160px'),
                            objectFit: 'contain'
                          }}
                          className="drop-shadow-lg"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Conteúdo */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1%', alignItems: 'center' }}>
                    {/* Título */}
                    <h2 
                      style={{ 
                        color: settings.customTextColor,
                        fontSize: `${Math.max(4, Math.min(14, 350 / productData.title.length))}px`,
                        margin: 0,
                        lineHeight: 1.2
                      }}
                      className="font-bold"
                    >
                      {productData.title}
                    </h2>
                    
                    {/* Descrição */}
                    {productData.description && (
                      <p 
                        style={{ 
                          color: settings.customTextColor,
                          fontSize: `${Math.max(5, Math.min(14, 350 / productData.description.length))}px`,
                          margin: 0,
                          lineHeight: 1.1,
                          opacity: 0.9
                        }}
                      >
                        {productData.description}
                      </p>
                    )}
                    
                    {/* Preço */}
                    {settings.priceEnabled && productData.price && (
                      <p 
                        style={{ 
                          color: settings.customTextColor,
                          fontSize: '10px',
                          margin: 0,
                          lineHeight: 1.1,
                          fontWeight: 'bold'
                        }}
                      >
                        AOA {Number(productData.price).toLocaleString('pt-AO')}
                      </p>
                    )}
                    
                    {/* URL */}
                    {settings.urlEnabled && (
                      <p 
                        style={{ 
                          color: settings.customTextColor,
                          fontSize: '8px',
                          margin: 0,
                          lineHeight: 1.1,
                          opacity: 0.8
                        }}
                      >
                        {productData.productUrl}
                      </p>
                    )}

                  </div>
                </div>


              </div>
            </div>
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-500">
            Pré-visualização em escala reduzida. O download será em tamanho real.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBannerGerador;
