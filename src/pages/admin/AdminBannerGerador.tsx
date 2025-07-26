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

// Fallback logo padrão caso não consiga carregar das configurações
const FALLBACK_LOGO = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiByeD0iMjAiIGZpbGw9IiM4QjRGQTMiLz4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0xMiAyQzEzLjEgMiAxNCAyLjkgMTQgNFYyMkMxNCAyMy4xIDEzLjEgMjQgMTIgMjRDMTAuOSAyNCAxMCAyMy4xIDEwIDIyVjRDMTAgMi45IDEwLjkgMiAxMiAyWiIvPgo8cGF0aCBkPSJNMTIgMTBDMTcuNSAxMCAyMiAxNC41IDIyIDIwSDJDMiAxNC41IDYuNSAxMCAxMiAxMFoiLz4KPHN2Zz4KPC9zdmc+';

/**
 * Componente gerador de banners promocionais para produtos
 * Permite selecionar produtos, personalizar banners e baixar/compartilhar
 */
const AdminBannerGerador: React.FC = () => {
  const { toast } = useToast();
  const bannerRef = useRef<HTMLDivElement>(null);

  // Função para carregar logo das configurações da loja
  const loadStoreLogo = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'store_info')
        .single();
      
      if (error) {
        console.warn('Erro ao carregar configurações da loja:', error);
        return FALLBACK_LOGO; // Fallback para logo padrão
      }
      
      const storeInfo = data?.value as any;
      return storeInfo?.logo_url || FALLBACK_LOGO;
    } catch (error) {
      console.warn('Erro ao carregar logo da loja:', error);
      return FALLBACK_LOGO; // Fallback para logo padrão
    }
  };
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
      const savedSettings = localStorage.getItem('banner-generator-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // Mescla com as configurações padrão para garantir que todas as propriedades existam
        const mergedSettings = {
          width: 800,
          height: 800,
          customBackground: '#8B4FA3',
          customTextColor: '#FFFFFF',
          priceEnabled: true,
          urlEnabled: true,
          produtoFundoBranco: false,
          logoEnabled: true,
          logoUrl: '', // Será carregado das configurações da loja
          logoSize: 80,
          useCustomLogo: false,
          selectedTemplate: 'custom',
          template: {
            pattern: 'none',
            patternColor: '#FFFFFF',
            patternOpacity: 0.1,
            patternSize: 'medium'
          },
          ...parsed
        };
        setSettings(mergedSettings);
        return mergedSettings;
      }
    } catch (error) {
      console.warn('Não foi possível carregar as configurações:', error);
    }
    return null;
  };

  const [selectedProduct, setSelectedProduct] = useState<string>('');

  // Estado para carrossel com IA
  const [carousel, setCarousel] = useState({
    slides: [] as string[], // Texto dos slides (manter compatibilidade)
    banners: [] as { id: string, dataUrl: string, settings: any, title: string, productData?: any }[], // Banners visuais gerados
    currentSlide: 0,
    isGenerating: false,
    prompt: '',
    slideCount: 5,
    isDownloadingAll: false,
    imageModel: 'dall-e-3' // Modelo de IA para geração de imagens
  });
  const [productData, setProductData] = useState({
    title: 'Conheça nosso novo Adaptador para leitor de cartões Micro Sd e SD',
    description: 'Compatível com todos os dispositivos Type-C',
    price: '69.90',
    imageUrl: '',
    productUrl: 'superloja.vip'
  });

  // useEffect para carregar logo da loja automaticamente
  useEffect(() => {
    const initializeSettings = async () => {
      // Carrega configurações salvas primeiro
      const savedSettings = loadSettings();
      
      // Se não há logo personalizado salvo, carrega o logo da loja
      if (!savedSettings?.useCustomLogo) {
        const storeLogo = await loadStoreLogo();
        setSettings(prev => ({
          ...prev,
          logoUrl: storeLogo,
          useCustomLogo: false
        }));
      }
    };
    
    initializeSettings();
  }, []);

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
      logoUrl: FALLBACK_LOGO,
      logoSize: 80,
      useCustomLogo: false,
      selectedTemplate: 'custom',
      template: {
        pattern: 'none',
        patternColor: '#FFFFFF'
      }
    };
  });

  const [bannerMode, setBannerMode] = useState('square'); // square, story, post

  // Templates pré-definidos
  const templates = {
    custom: {
      name: 'Personalizado',
      background: settings.customBackground || '#8B4FA3',
      textColor: settings.customTextColor || '#FFFFFF',
      style: 'custom'
    },
    magenta_circles: {
      name: 'Magenta Círculos',
      background: '#B83280',
      textColor: '#FFFFFF',
      style: 'rounded_card'
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
      style: 'lilac_bubbles_pattern'
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

  // Função para carregar logo personalizado
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const logoUrl = event.target?.result as string;
        handleSettingChange('logoUrl', logoUrl);
        handleSettingChange('useCustomLogo', true);
        toast({
          title: 'Logo personalizado carregado!',
          description: 'O seu logo foi adicionado ao banner.',
        });
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        variant: 'destructive',
        title: 'Formato inválido',
        description: 'Por favor, selecione uma imagem válida (PNG, JPG, etc.)',
      });
    }
  };

  // Função para usar logo da loja
  const handleUseSystemLogo = async () => {
    const storeLogo = await loadStoreLogo();
    handleSettingChange('logoUrl', storeLogo);
    handleSettingChange('useCustomLogo', false);
    toast({
      title: 'Logo da loja activado',
      description: 'Usando o logo configurado nas configurações da loja.',
    });
  };

  // Função para gerar carrossel de banners com IA
  const generateCarousel = async () => {
    if (!carousel.prompt.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um prompt para gerar o carrossel.',
        variant: 'destructive'
      });
      return;
    }

    setCarousel(prev => ({ ...prev, isGenerating: true }));

    try {
      // 1. Capturar o banner atual como referência
      const currentBanner = await generateImage();
      if (!currentBanner) {
        throw new Error('Não foi possível capturar o banner atual');
      }

      // 2. Buscar API key das configurações
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'seo_settings')
        .single();

      if (error || !data) {
        throw new Error('Configurações da API não encontradas');
      }

      const seoSettings = data.value as any;
      const apiKey = seoSettings?.openai_api_key;

      if (!apiKey) {
        throw new Error('API Key do OpenAI não configurada');
      }

      // 3. Gerar variações de conteúdo com IA
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'user',
            content: `Baseado no produto "${productData.title}" com descrição "${productData.description}", crie ${carousel.slideCount} variações promocionais.
            
            Prompt adicional: ${carousel.prompt}
            
            Para cada variação, crie:
            - Título chamativo e único (máximo 50 caracteres)
            - Descrição promocional diferente (máximo 70 caracteres)
            - Estilo/tom diferente (urgente, elegante, divertido, etc.)
            
            Formato de resposta:
            BANNER 1:
            Título: [título aqui]
            Descrição: [descrição aqui]
            Tom: [estilo/tom aqui]
            
            BANNER 2:
            Título: [título aqui]
            Descrição: [descrição aqui]
            Tom: [estilo/tom aqui]
            
            Continue para todos os ${carousel.slideCount} banners.`
          }],
          max_tokens: 1500,
          temperature: 0.8
        })
      });

      if (!response.ok) {
        throw new Error('Falha na chamada à API');
      }

      const data_api = await response.json();
      const content = data_api.choices[0]?.message?.content;

      if (!content) {
        throw new Error('Resposta vazia da API');
      }

      // 4. Processar resposta e gerar banners visuais
      const variations = parseCarouselResponse(content);
      const generatedBanners = await generateBannerVariations(variations);
      
      setCarousel(prev => ({
        ...prev,
        banners: generatedBanners,
        slides: variations, // Manter compatibilidade
        currentSlide: 0,
        isGenerating: false
      }));

      // Verificar se tem imagens diferentes contando os banners com URLs de imagem diferentes
      const hasMultipleImages = generatedBanners.length > 1 && 
        new Set(generatedBanners.map(b => b.productData?.imageUrl)).size > 1;
      
      toast({
        title: 'Carrossel gerado com sucesso!',
        description: `${generatedBanners.length} banners criados com textos únicos e ${hasMultipleImages ? 'imagens diferentes' : 'templates visuais únicos'}. Modelo usado: ${carousel.imageModel}.`
      });

    } catch (error) {
      console.error('Erro ao gerar carrossel:', error);
      toast({
        title: 'Erro ao gerar carrossel',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
      setCarousel(prev => ({ ...prev, isGenerating: false }));
    }
  };

  // Função para processar resposta da IA
  const parseCarouselResponse = (content: string): string[] => {
    const slides: string[] = [];
    const bannerMatches = content.match(/BANNER \d+:[\s\S]*?(?=BANNER \d+:|$)/g);
    
    if (bannerMatches) {
      bannerMatches.forEach(banner => {
        const titleMatch = banner.match(/Título: (.+)/);
        const descMatch = banner.match(/Descrição: (.+)/);
        const toneMatch = banner.match(/Tom: (.+)/);
        
        if (titleMatch && descMatch) {
          slides.push(`${titleMatch[1].trim()}|${descMatch[1].trim()}|${toneMatch ? toneMatch[1].trim() : 'normal'}`);
        }
      });
    }
    
    return slides.length > 0 ? slides : ['Erro ao processar banners'];
  };

  // Função para gerar variações de imagem usando IA
  const generateImageVariations = async (originalImageUrl: string, productTitle: string, count: number = 3, model: string = 'dall-e-3') => {
    if (!originalImageUrl) return Array(count).fill(originalImageUrl);
    
    console.log(`Preparando ${count} variações de imagem para: ${productTitle}`);
    
    try {
      // Buscar API key das configurações (mesmo método usado na função generateCarousel)
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'seo_settings')
        .single();

      if (error || !data) {
        console.warn('Configurações da API não encontradas');
        return Array(count).fill(originalImageUrl);
      }

      const seoSettings = data.value as any;
      const apiKey = seoSettings?.openai_api_key;

      if (!apiKey) {
        console.warn('API Key do OpenAI não configurada');
        return Array(count).fill(originalImageUrl);
      }

      // Usar o modelo selecionado pelo utilizador ou definido nas configurações
      const imageModel = model || seoSettings?.openai_image_model || 'dall-e-3';
      
      // Registar qual modelo está a ser usado
      console.log('Modelo selecionado para gerar imagens:', imageModel);
      
      // Determinar se estamos usando GPT-4 com Vision ou DALL-E
      const isGpt4Vision = imageModel.includes('gpt-4') && imageModel.includes('vision');
      
      if (isGpt4Vision) {
        // Usar GPT-4 Vision para geração de imagens via chat completions
        const imagePromises = [];
        
        for (let i = 0; i < count; i++) {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: 'gpt-4-vision-preview',
              messages: [
                {
                  role: 'system',
                  content: 'Você é um assistente especializado em geração de imagens.'
                },
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: `Crie uma imagem profissional do produto: ${productTitle}. Variação ${i+1} de ${count}.
                    Estilo: fotografia profissional de produto, fundo limpo, alta qualidade, ângulo diferente, iluminação adequada, pronto para e-commerce.` }
                  ]
                }
              ],
              max_tokens: 4096
            })
          });

          if (response.ok) {
            const data = await response.json();
            // Extrair a URL da imagem da resposta
            const responseContent = data.choices[0]?.message?.content;
            // Procurar URL na resposta (isso depende do formato exato da resposta)
            const imageUrlMatch = responseContent?.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i);
            if (imageUrlMatch && imageUrlMatch[0]) {
              imagePromises.push(imageUrlMatch[0]);
            }
          }
        }
        
        const generatedImages = await Promise.all(imagePromises.filter(Boolean));
        if (generatedImages.length > 0) {
          // Se conseguimos gerar imagens, retornamos elas + a original
          const allImages = [originalImageUrl, ...generatedImages];
          return allImages.slice(0, count); // Limitar ao número solicitado
        }
        
      } else {
        // Usar DALL-E para geração de imagens
        const imagePromises = [];
        
        for (let i = 0; i < count; i++) {
          const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: imageModel, // 'dall-e-2' ou 'dall-e-3'
              prompt: `Fotografia profissional de produto: ${productTitle}. 
              Variação ${i+1} de ${count}. Mostra o mesmo produto com ângulo, iluminação e fundo diferente.
              Estilo: limpo, profissional, qualidade para e-commerce, alta resolução`,
              n: 1,
              size: '1024x1024'
            })
          });

          if (response.ok) {
            const data = await response.json();
            const imageUrl = data.data?.[0]?.url;
            if (imageUrl) {
              imagePromises.push(imageUrl);
            }
          }
        }
        
        const generatedImages = await Promise.all(imagePromises.filter(Boolean));
        if (generatedImages.length > 0) {
          // Se conseguimos gerar imagens, retornamos elas + a original
          const allImages = [originalImageUrl, ...generatedImages];
          return allImages.slice(0, count); // Limitar ao número solicitado
        }
      }
    } catch (error) {
      console.warn('Erro ao gerar variações de imagem:', error);
    }
    
    // Fallback: retorna a imagem original para todos os banners
    return Array(count).fill(originalImageUrl);
  };

  // Função para gerar variações de banners visuais
  const generateBannerVariations = async (variations: string[]) => {
    const banners = [];
    
    // Templates e estilos para variações
    const templateVariations = [
      { template: 'magenta_gradient', background: '#D946EF' },
      { template: 'ocean_wave', background: '#0891B2' },
      { template: 'sunset_gradient', background: '#F97316' },
      { template: 'green_forest', background: '#059669' },
      { template: 'royal_purple', background: '#7C3AED' },
      { template: 'coral_reef', background: '#EF4444' },
      { template: 'golden_hour', background: '#F59E0B' },
      { template: 'midnight_blue', background: '#1E40AF' },
      { template: 'cherry_blossom', background: '#EC4899' },
      { template: 'luxury_emerald', background: '#10B981' }
    ];

    // Gerar variações de imagem antes de criar os banners
    console.log('Gerando variações de imagem com modelo:', carousel.imageModel);
    const imageVariations = await generateImageVariations(
      productData.imageUrl, 
      productData.title, 
      variations.length,
      carousel.imageModel // Passar o modelo de IA selecionado pelo usuário
    );
    console.log('Variações de imagem geradas:', imageVariations.length);

    for (let i = 0; i < variations.length; i++) {
      const [title, description, tone] = variations[i].split('|');
      
      // Selecionar template baseado no índice
      const templateIndex = i % templateVariations.length;
      const selectedTemplate = templateVariations[templateIndex];
      
      // Criar configurações únicas para este banner
      const bannerSettings = {
        ...settings,
        selectedTemplate: selectedTemplate.template,
        customBackground: selectedTemplate.background,
        // Variações no texto baseadas no tom
        customTextColor: tone?.includes('elegante') ? '#FFFFFF' : 
                        tone?.includes('divertido') ? '#FFFF00' : 
                        tone?.includes('urgente') ? '#FF0000' : '#FFFFFF'
      };
      
      // Dados do produto para este banner (com imagem diferente)
      const bannerProductData = {
        ...productData,
        title: title || productData.title,
        description: description || productData.description,
        imageUrl: imageVariations[i] || productData.imageUrl, // Imagem diferente para cada banner
        image_url: imageVariations[i] || productData.imageUrl // Para compatibilidade
      };
      
      try {
        // Gerar banner com as novas configurações
        const bannerImage = await generateBannerImage(bannerSettings, bannerProductData);
        
        if (bannerImage) {
          banners.push({
            id: `banner_${i + 1}_${Date.now()}`,
            dataUrl: bannerImage.dataUrl,
            settings: bannerSettings,
            title: `${title} (${selectedTemplate.template.replace('_', ' ')})`,
            productData: bannerProductData // Incluir dados do produto para referência
          });
        }
      } catch (error) {
        console.warn(`Erro ao gerar banner ${i + 1}:`, error);
      }
    }
    
    return banners;
  };

  // Função para gerar banner com configurações específicas
  const generateBannerImage = async (bannerSettings: any, bannerProductData: any) => {
    // Criar elemento temporário para capturar o banner
    const tempElement = document.createElement('div');
    tempElement.style.position = 'absolute';
    tempElement.style.left = '-9999px';
    tempElement.style.width = `${bannerSettings.width}px`;
    tempElement.style.height = `${bannerSettings.height}px`;
    
    // Aplicar estilos do banner
    const backgroundStyle = generateTemplateBackground(bannerSettings.selectedTemplate);
    tempElement.style.background = backgroundStyle;
    tempElement.style.backgroundSize = bannerSettings.selectedTemplate === 'lilac_bubbles' ? 'auto' : 'cover';
    tempElement.style.backgroundPosition = 'center';
    tempElement.style.backgroundRepeat = 'no-repeat';
    
    // Criar conteúdo do banner
    tempElement.innerHTML = `
      <div style="
        width: 100%; 
        height: 100%; 
        display: flex; 
        flex-direction: column; 
        justify-content: center; 
        align-items: center; 
        padding: 40px; 
        box-sizing: border-box;
        position: relative;
      ">
        ${bannerSettings.logoEnabled && bannerSettings.logoUrl ? `
          <img src="${bannerSettings.logoUrl}" 
               style="
                 position: absolute; 
                 top: 20px; 
                 left: 20px; 
                 width: ${bannerSettings.logoSize}px; 
                 height: ${bannerSettings.logoSize}px; 
                 object-fit: contain; 
                 background: rgba(255,255,255,0.9); 
                 padding: 8px; 
                 border-radius: 12px; 
                 box-shadow: 0 2px 8px rgba(0,0,0,0.1);
               " />
        ` : ''}
        
        <div style="
          background: ${bannerSettings.produtoFundoBranco ? 'rgba(255,255,255,0.95)' : 'transparent'}; 
          padding: ${bannerSettings.produtoFundoBranco ? '16px' : '0'}; 
          border-radius: ${bannerSettings.produtoFundoBranco ? '12px' : '0'}; 
          margin-bottom: 20px;
        ">
          ${bannerProductData.image_url ? `
            <img src="${bannerProductData.image_url}" 
                 style="width: 220px; height: 220px; object-fit: contain;" />
          ` : `
            <div style="
              width: 220px; 
              height: 220px; 
              background: #f0f0f0; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              border-radius: 8px; 
              color: #999;
            ">
              Sem Imagem
            </div>
          `}
        </div>
        
        <div style="text-align: center; color: ${bannerSettings.customTextColor}; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
          <h1 style="font-size: 28px; font-weight: bold; margin: 0 0 12px 0; line-height: 1.2;">
            ${bannerProductData.title}
          </h1>
          <p style="font-size: 18px; margin: 0 0 16px 0; line-height: 1.3;">
            ${bannerProductData.description}
          </p>
          ${bannerSettings.priceEnabled ? `
            <div style="font-size: 24px; font-weight: bold; margin: 8px 0;">
              AOA ${bannerProductData.price}
            </div>
          ` : ''}
          ${bannerSettings.urlEnabled ? `
            <div style="font-size: 16px; margin-top: 12px;">
              ${bannerProductData.productUrl}
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    document.body.appendChild(tempElement);
    
    try {
      // Capturar como imagem
      const canvas = await html2canvas(tempElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
      });
      
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png', 1.0);
      });
      
      return { dataUrl, blob };
    } finally {
      document.body.removeChild(tempElement);
    }
  };

  // Função para aplicar slide ao banner
  const applySlideToProduct = (slideIndex: number) => {
    const slide = carousel.slides[slideIndex];
    if (slide) {
      const [title, description] = slide.split('|');
      setProductData(prev => ({
        ...prev,
        title: title || prev.title,
        description: description || prev.description
      }));
      setCarousel(prev => ({ ...prev, currentSlide: slideIndex }));
      
      toast({
        title: 'Slide aplicado!',
        description: `Slide ${slideIndex + 1} aplicado ao banner.`
      });
    }
  };

  // Função para remover logo
  const handleLogoRemove = () => {
    handleSettingChange('logoUrl', '');
    handleSettingChange('logoEnabled', false);
    toast({
      title: 'Logo removido',
      description: 'O logo foi removido do banner.',
    });
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
        scale: 2, // Escala alta para melhor qualidade
        useCORS: true,
        backgroundColor: null,
        logging: false,
        allowTaint: true,
        imageTimeout: 5000,
        foreignObjectRendering: false, // Desativa renderização de objetos estrangeiros
        ignoreElements: (element) => {
          // Ignora elementos que podem causar problemas
          return element.tagName === 'IFRAME' || element.tagName === 'SCRIPT';
        },
        onclone: (clonedDoc, element) => {
          // Garante que o elemento clonado mantenha os estilos exatos
          const clonedElement = clonedDoc.querySelector('#banner-element') as HTMLElement;
          if (clonedElement) {
            // Define tamanhos exatos e força renderização consistente
            clonedElement.style.width = settings.width + 'px';
            clonedElement.style.height = settings.height + 'px';
            clonedElement.style.transform = 'none';
            clonedElement.style.maxWidth = 'none';
            clonedElement.style.maxHeight = 'none';
            clonedElement.style.minWidth = settings.width + 'px';
            clonedElement.style.minHeight = settings.height + 'px';
            clonedElement.style.border = 'none';
            clonedElement.style.margin = '0';
            clonedElement.style.padding = '0';
            clonedElement.style.position = 'relative';
            clonedElement.style.overflow = 'hidden';
            clonedElement.style.boxSizing = 'border-box';
            clonedElement.style.display = 'flex';
            clonedElement.style.flexDirection = 'column';
            clonedElement.style.justifyContent = 'center';
            clonedElement.style.alignItems = 'center';
            clonedElement.style.textAlign = 'center';
            
            // Força renderização de backgrounds gradientes
            clonedElement.style.backgroundAttachment = 'scroll';
            clonedElement.style.backgroundRepeat = 'no-repeat';
            clonedElement.style.backgroundClip = 'border-box';
            clonedElement.style.backgroundOrigin = 'padding-box';
            clonedElement.style.backgroundPosition = 'center';
            clonedElement.style.backgroundSize = 'cover';
            
            // Garante que o background seja recalculado
            const originalBackground = clonedElement.style.background;
            clonedElement.style.background = originalBackground;
            
            // Força reflow para garantir renderização
            clonedElement.offsetHeight;
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
    try {
      // Gera a imagem
      const result = await generateImage();
      if (!result) return;

      // Dados do produto
      const productTitle = productData.title;
      const productPrice = productData.price;
      const shareText = `${productTitle} - AOA ${productPrice} | Confira este produto em nossa loja!`;

      // Cria um objeto URL para o Blob (para download)
      const blobUrl = URL.createObjectURL(result.blob);
      const dataUrl = result.dataUrl;

      // Abre a janela de compartilhamento de acordo com a plataforma
      switch (platform) {
        case 'facebook':
          // Baixa a imagem automaticamente
          const fbLink = document.createElement('a');
          fbLink.href = blobUrl;
          fbLink.download = `facebook-banner-${new Date().getTime()}.png`;
          document.body.appendChild(fbLink);
          fbLink.click();
          document.body.removeChild(fbLink);

          // Tentar Web Share API primeiro
          if (navigator.share && navigator.canShare) {
            try {
              // Converter dataURL para File
              const response = await fetch(dataUrl);
              const blob = await response.blob();
              const file = new File([blob], `banner-${productData.title}.png`, { type: 'image/png' });
              
              const shareData = {
                title: productData.title,
                text: shareText,
                url: 'https://superloja.vip',
                files: [file]
              };

              if (navigator.canShare(shareData)) {
                await navigator.share(shareData);
                toast({
                  title: '✅ Partilhado com sucesso!',
                  description: 'Conteúdo partilhado via sistema nativo.',
                });
                break;
              }
            } catch (err) {
              console.log('Web Share API falhou:', err);
            }
          }

          // Facebook Share Dialog oficial
          const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?` +
            `u=${encodeURIComponent('https://superloja.vip')}&` +
            `quote=${encodeURIComponent(shareText)}&` +
            `hashtag=${encodeURIComponent('#SuperlojaVip')}`;
          
          // Abrir Facebook Share Dialog
          const fbWindow = window.open(
            facebookShareUrl,
            'facebook-share-dialog',
            'width=626,height=436,scrollbars=yes,resizable=yes'
          );
          
          if (fbWindow) {
            // Copiar texto para clipboard
            try {
              await navigator.clipboard.writeText(shareText);
            } catch (err) {
              // Fallback para browsers antigos
              const textArea = document.createElement('textarea');
              textArea.value = shareText;
              textArea.style.position = 'fixed';
              textArea.style.left = '-9999px';
              document.body.appendChild(textArea);
              textArea.select();
              document.execCommand('copy');
              document.body.removeChild(textArea);
            }
            
            toast({
              title: '🚀 Facebook Share Dialog aberto!',
              description: '📥 Imagem baixada | 📋 Texto copiado | Partilhe no Facebook!',
            });
            
            // Mostrar instruções após um delay
            setTimeout(() => {
              toast({
                title: '💡 Dica importante',
                description: 'Cole o texto (Ctrl+V) e anexe a imagem baixada no Facebook!',
              });
            }, 3000);
            
          } else {
            // Fallback: abrir Facebook diretamente
            window.open('https://www.facebook.com/', '_blank');
            
            toast({
              variant: 'destructive',
              title: '⚠️ Popup bloqueado',
              description: 'Facebook aberto. Use a imagem baixada e texto copiado para partilhar.',
            });
          }
          break;

        case 'instagram':
          // Baixa a imagem para Instagram
          const igLink = document.createElement('a');
          igLink.href = blobUrl;
          igLink.download = `instagram-banner-${new Date().getTime()}.png`;
          document.body.appendChild(igLink);
          igLink.click();
          document.body.removeChild(igLink);
          
          window.open('https://www.instagram.com/', '_blank');
          
          toast({
            title: 'Instagram',
            description: 'Imagem baixada! Publique no Instagram.',
          });
          break;

        case 'whatsapp':
          // Baixa a imagem para WhatsApp
          const waLink = document.createElement('a');
          waLink.href = blobUrl;
          waLink.download = `whatsapp-banner-${new Date().getTime()}.png`;
          document.body.appendChild(waLink);
          waLink.click();
          document.body.removeChild(waLink);
          
          // Abre WhatsApp com o texto
          const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
          window.open(whatsappUrl, '_blank');
          
          toast({
            title: 'WhatsApp',
            description: 'Imagem baixada e mensagem preparada!',
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
    const template = templates[templateKey as keyof typeof templates];
    if (!template) return settings.customBackground;

    const baseColor = template.background;
    const lightColor = adjustColorBrightness(baseColor, 30);
    const darkColor = adjustColorBrightness(baseColor, -40);
    const mediumColor = adjustColorBrightness(baseColor, -15);

    switch (template.style) {
      case 'rounded_card':
        // Magenta Círculos - círculos semi-transparentes sobre fundo magenta
        return `
          radial-gradient(circle at 20% 20%, rgba(255,255,255,0.3) 0%, transparent 2%),
          radial-gradient(circle at 60% 80%, rgba(255,255,255,0.2) 0%, transparent 3%),
          radial-gradient(circle at 90% 40%, rgba(255,255,255,0.25) 0%, transparent 2.5%),
          radial-gradient(circle at 30% 70%, rgba(255,255,255,0.15) 0%, transparent 4%),
          radial-gradient(circle at 80% 10%, rgba(255,255,255,0.2) 0%, transparent 3%),
          linear-gradient(135deg, ${baseColor} 0%, ${adjustColorBrightness(baseColor, -30)} 100%)
        `;
      
      case 'wave_pattern':
        // Onda Oceânica - padrão ondulado fluído
        return `
          linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%),
          linear-gradient(-45deg, transparent 30%, rgba(255,255,255,0.05) 50%, transparent 70%),
          radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.1) 0%, transparent 60%),
          linear-gradient(135deg, ${baseColor} 0%, ${adjustColorBrightness(baseColor, -35)} 100%)
        `;

      case 'gradient_circles':
        // Pôr do Sol - círculos gradientes com cores quentes
        return `
          radial-gradient(circle at 15% 25%, rgba(255,255,255,0.4) 0%, transparent 3%),
          radial-gradient(circle at 75% 75%, rgba(255,255,255,0.3) 0%, transparent 4%),
          radial-gradient(circle at 90% 15%, rgba(255,255,255,0.2) 0%, transparent 2.5%),
          radial-gradient(circle at 40% 85%, rgba(255,255,255,0.35) 0%, transparent 3.5%),
          linear-gradient(45deg, ${baseColor} 0%, ${adjustColorBrightness(baseColor, 20)} 50%, ${adjustColorBrightness(baseColor, -20)} 100%)
        `;

      case 'hexagon_pattern':
        // Verde Floresta - padrão hexagonal orgânico
        return `
          radial-gradient(circle at 20% 30%, rgba(255,255,255,0.15) 0%, transparent 8%),
          radial-gradient(circle at 70% 60%, rgba(255,255,255,0.1) 0%, transparent 6%),
          radial-gradient(circle at 40% 80%, rgba(255,255,255,0.2) 0%, transparent 5%),
          radial-gradient(circle at 85% 20%, rgba(255,255,255,0.12) 0%, transparent 7%),
          linear-gradient(60deg, ${baseColor} 0%, ${adjustColorBrightness(baseColor, -25)} 100%)
        `;

      case 'diamond_pattern':
        // Roxo Real - padrão de diamantes elegante
        return `
          linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.1) 49%, rgba(255,255,255,0.1) 51%, transparent 52%),
          linear-gradient(-45deg, transparent 48%, rgba(255,255,255,0.05) 49%, rgba(255,255,255,0.05) 51%, transparent 52%),
          radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 0%, transparent 4%),
          radial-gradient(circle at 75% 75%, rgba(255,255,255,0.15) 0%, transparent 3%),
          linear-gradient(135deg, ${baseColor} 0%, ${adjustColorBrightness(baseColor, -40)} 100%)
        `;

      case 'bubble_pattern':
        // Recife de Coral - bolhas orgânicas e vibrantes
        return `
          radial-gradient(circle at 25% 40%, rgba(255,255,255,0.3) 0%, transparent 4%),
          radial-gradient(circle at 60% 20%, rgba(255,255,255,0.25) 0%, transparent 3%),
          radial-gradient(circle at 80% 70%, rgba(255,255,255,0.2) 0%, transparent 5%),
          radial-gradient(circle at 15% 80%, rgba(255,255,255,0.35) 0%, transparent 3.5%),
          radial-gradient(circle at 90% 30%, rgba(255,255,255,0.15) 0%, transparent 2.5%),
          linear-gradient(45deg, ${baseColor} 0%, ${adjustColorBrightness(baseColor, -30)} 100%)
        `;

      case 'rays_pattern':
        // Hora Dourada - raios solares radiantes
        return `
          conic-gradient(from 0deg at 50% 50%, 
            transparent 0deg, rgba(255,255,255,0.1) 30deg, transparent 60deg,
            transparent 90deg, rgba(255,255,255,0.08) 120deg, transparent 150deg,
            transparent 180deg, rgba(255,255,255,0.12) 210deg, transparent 240deg,
            transparent 270deg, rgba(255,255,255,0.06) 300deg, transparent 330deg
          ),
          linear-gradient(135deg, ${baseColor} 0%, ${adjustColorBrightness(baseColor, -20)} 100%)
        `;

      case 'stars_pattern':
        // Azul Meia-Noite - constelação de estrelas
        return `
          radial-gradient(circle at 20% 30%, rgba(255,255,255,0.8) 0%, transparent 1px),
          radial-gradient(circle at 70% 15%, rgba(255,255,255,0.6) 0%, transparent 1.5px),
          radial-gradient(circle at 90% 70%, rgba(255,255,255,0.7) 0%, transparent 1px),
          radial-gradient(circle at 40% 85%, rgba(255,255,255,0.5) 0%, transparent 2px),
          radial-gradient(circle at 15% 60%, rgba(255,255,255,0.9) 0%, transparent 1px),
          radial-gradient(circle at 80% 40%, rgba(255,255,255,0.4) 0%, transparent 1.5px),
          linear-gradient(135deg, ${baseColor} 0%, ${adjustColorBrightness(baseColor, -45)} 100%)
        `;

      case 'lilac_bubbles_pattern':
        // Lilás com Bolinhas - padrão específico de bolinhas brancas translúcidas
        return `
          radial-gradient(circle at 15% 20%, rgba(255,255,255,0.4) 0%, transparent 4%),
          radial-gradient(circle at 55% 10%, rgba(255,255,255,0.3) 0%, transparent 3%),
          radial-gradient(circle at 85% 35%, rgba(255,255,255,0.5) 0%, transparent 2%),
          radial-gradient(circle at 25% 60%, rgba(255,255,255,0.2) 0%, transparent 5%),
          radial-gradient(circle at 70% 50%, rgba(255,255,255,0.35) 0%, transparent 3%),
          radial-gradient(circle at 90% 70%, rgba(255,255,255,0.5) 0%, transparent 2%),
          radial-gradient(circle at 40% 60%, rgba(255,255,255,0.8) 0%, transparent 3%),
          radial-gradient(circle at 60% 10%, rgba(255,255,255,0.6) 0%, transparent 2.5%),
          radial-gradient(circle at 10% 90%, rgba(255,255,255,0.7) 0%, transparent 3%),
          linear-gradient(135deg, ${baseColor} 0%, ${adjustColorBrightness(baseColor, -40)} 100%)
        `;

      case 'floral_pattern':
        // Flor de Cerejeira - pétalas suaves e orgânicas
        return `
          radial-gradient(ellipse 250px 120px at 20% 30%, rgba(255,255,255,0.2) 0%, transparent 40%),
          radial-gradient(ellipse 180px 90px at 70% 60%, rgba(255,255,255,0.15) 0%, transparent 35%),
          radial-gradient(ellipse 200px 100px at 85% 20%, rgba(255,255,255,0.25) 0%, transparent 45%),
          radial-gradient(ellipse 220px 110px at 30% 80%, rgba(255,255,255,0.18) 0%, transparent 38%),
          linear-gradient(45deg, ${baseColor} 0%, ${adjustColorBrightness(baseColor, -25)} 100%)
        `;

      case 'luxury_pattern':
        // Luxo Esmeralda - padrão sofisticado com detalhes dourados
        return `
          linear-gradient(45deg, transparent 30%, rgba(255,215,0,0.1) 50%, transparent 70%),
          linear-gradient(-45deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%),
          radial-gradient(circle at 30% 30%, rgba(255,215,0,0.15) 0%, transparent 3%),
          radial-gradient(circle at 70% 70%, rgba(255,255,255,0.1) 0%, transparent 4%),
          linear-gradient(135deg, ${baseColor} 0%, ${adjustColorBrightness(baseColor, -35)} 100%)
        `;

      case 'custom':
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
                  <TabsTrigger value="carrossel" className="flex-1">Carrossel</TabsTrigger>
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

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="logoEnabled"
                        checked={settings.logoEnabled}
                        onCheckedChange={(checked) => handleSettingChange('logoEnabled', checked)}
                      />
                      <Label htmlFor="logoEnabled">Mostrar Logo</Label>
                    </div>

                    {settings.logoEnabled && (
                      <>
                        <div className="space-y-3">
                          <div>
                            <Label>Tipo de Logo</Label>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              <Button
                                type="button"
                                variant={!settings.useCustomLogo ? 'default' : 'outline'}
                                size="sm"
                                onClick={handleUseSystemLogo}
                                className="flex flex-col h-auto p-3"
                              >
                                <div className="text-xs mb-1">Logo da Loja</div>
                                <img
                                  src={settings.logoUrl}
                                  alt="Logo da Loja"
                                  className="w-8 h-8 object-contain"
                                />
                              </Button>
                              <Button
                                type="button"
                                variant={settings.useCustomLogo ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => document.getElementById('logoUpload')?.click()}
                                className="flex flex-col h-auto p-3"
                              >
                                <div className="text-xs mb-1">Logo Personalizado</div>
                                {settings.useCustomLogo && settings.logoUrl ? (
                                  <img
                                    src={settings.logoUrl}
                                    alt="Logo personalizado"
                                    className="w-8 h-8 object-contain"
                                  />
                                ) : (
                                  <div className="w-8 h-8 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                                    <span className="text-xs text-gray-400">+</span>
                                  </div>
                                )}
                              </Button>
                            </div>
                            <Input
                              id="logoUpload"
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                          </div>

                          {settings.useCustomLogo && settings.logoUrl && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <img
                                  src={settings.logoUrl}
                                  alt="Preview do logo personalizado"
                                  className="w-12 h-12 object-contain border rounded"
                                />
                                <span className="text-sm text-gray-600">Logo personalizado</span>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleUseSystemLogo()}
                              >
                                Usar Logo da Loja
                              </Button>
                            </div>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="logoSize">Tamanho do Logo</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <input
                              id="logoSize"
                              type="range"
                              min="40"
                              max="150"
                              value={settings.logoSize}
                              onChange={(e) => handleSettingChange('logoSize', parseInt(e.target.value))}
                              className="flex-1"
                            />
                            <span className="text-sm text-gray-600 min-w-[40px]">{settings.logoSize}px</span>
                          </div>
                        </div>
                      </>
                    )}
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

                {/* Aba Carrossel */}
                <TabsContent value="carrossel" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="carrossel-prompt">Prompt para IA</Label>
                      <Textarea
                        id="carrossel-prompt"
                        placeholder="Descreva o tipo de carrossel que deseja criar. Ex: 'Crie slides promocionais destacando os benefícios do produto'"
                        value={carousel.prompt}
                        onChange={(e) => setCarousel(prev => ({ ...prev, prompt: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="carousel-slide-count">Número de Slides</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          id="carousel-slide-count" 
                          value={[carousel.slideCount]}
                          min={2}
                          max={10}
                          step={1}
                          onValueChange={(values) => setCarousel(prev => ({ ...prev, slideCount: values[0] }))}
                          className="flex-1"
                        />
                        <span className="min-w-10 text-center">{carousel.slideCount}</span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="carousel-model">Modelo de IA para Geração de Imagens</Label>
                      <Select 
                        value={carousel.imageModel || 'dall-e-3'} 
                        onValueChange={(value) => setCarousel(prev => ({ ...prev, imageModel: value }))}
                      >
                        <SelectTrigger id="carousel-model">
                          <SelectValue placeholder="Escolha um modelo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dall-e-3">DALL-E 3 (imagens de alta qualidade)</SelectItem>
                          <SelectItem value="dall-e-2">DALL-E 2 (mais rápido, menor custo)</SelectItem>
                          <SelectItem value="gpt-4-vision-preview">GPT-4 Vision (experimental)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      onClick={generateCarousel}
                      disabled={carousel.isGenerating || !carousel.prompt.trim()}
                      className="w-full"
                    >
                      {carousel.isGenerating ? 'Gerando...' : 'Gerar Carrossel com IA'}
                    </Button>

                    {carousel.slides.length > 0 && (
                      <div className="space-y-4">
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-3">Slides Gerados ({carousel.slides.length})</h3>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {carousel.slides.map((slide, index) => {
                              const [title, description] = slide.split('|');
                              return (
                                <div 
                                  key={index}
                                  className={`p-3 border rounded cursor-pointer transition-colors ${
                                    carousel.currentSlide === index 
                                      ? 'bg-blue-50 border-blue-300' 
                                      : 'bg-white hover:bg-gray-50'
                                  }`}
                                  onClick={() => applySlideToProduct(index)}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="font-medium text-sm mb-1">
                                        {title || 'Título não disponível'}
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        {description || 'Descrição não disponível'}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2 ml-2">
                                      <span className="text-xs text-gray-500">
                                        #{index + 1}
                                      </span>
                                      {carousel.currentSlide === index && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                          <strong>Dica:</strong> Clique em qualquer slide para aplicá-lo ao banner atual. 
                          O slide selecionado será usado para atualizar o título e descrição do produto.
                        </div>
                      </div>
                    )}
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
          <div className="border rounded-lg p-4 bg-gray-100 flex items-center justify-center overflow-auto">
            <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
              <div
                ref={bannerRef}
                id="banner-element"
                style={{
                  width: `${settings.width}px`, // Tamanho REAL - sem escala
                  height: `${settings.height}px`,
                  background: generateTemplateBackground(settings.selectedTemplate),
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  position: 'relative',
                  overflow: 'hidden',
                  maxWidth: '90vw', // Limita para caber na tela
                  maxHeight: '70vh',
                  transform: settings.width > 800 ? 'scale(0.6)' : 'scale(1)', // Escala visual apenas para tela
                  transformOrigin: 'center'
                }}
                className="flex flex-col items-center justify-start text-center rounded-lg shadow-lg border-2 border-gray-300"
              >
                {/* Logo no canto superior esquerdo */}
                {settings.logoEnabled && settings.logoUrl && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '20px',
                      left: '20px',
                      zIndex: 10,
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      borderRadius: '12px',
                      padding: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  >
                    <img
                      src={settings.logoUrl}
                      alt="Logo"
                      style={{
                        width: `${settings.logoSize}px`,
                        height: `${settings.logoSize}px`,
                        objectFit: 'contain',
                        display: 'block'
                      }}
                    />
                  </div>
                )}

                {/* Container para imagem e textos - adaptado para diferentes formatos */}
                <div style={{ 
                  height: bannerMode === 'post' ? '100%' : '50%', 
                  width: '100%', 
                  display: 'flex', 
                  flexDirection: bannerMode === 'post' ? 'row' : 'column', 
                  alignItems: 'center', 
                  justifyContent: bannerMode === 'post' ? 'space-between' : 'flex-start', 
                  paddingTop: bannerMode === 'post' ? '30px' : '20px',
                  paddingLeft: bannerMode === 'post' ? '40px' : '0',
                  paddingRight: bannerMode === 'post' ? '40px' : '0'
                }}>
                  {/* Imagem do Produto */}
                  {productData.imageUrl && (
                    <div className="flex items-center justify-center" style={{ marginBottom: bannerMode === 'post' ? '0' : '2%' }}>
                      <div 
                        style={{
                          backgroundColor: settings.produtoFundoBranco ? '#ffffff' : 'transparent',
                          padding: settings.produtoFundoBranco ? '20px 24px' : '0',
                          borderRadius: settings.produtoFundoBranco ? '16px' : '0',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: settings.produtoFundoBranco ? '0 8px 24px rgba(0,0,0,0.15)' : 'none'
                        }}
                      >
                        <img 
                          src={productData.imageUrl} 
                          alt={productData.title}
                          style={{
                            maxWidth: bannerMode === 'post' ? '350px' : '470px',
                            maxHeight: bannerMode === 'post' ? '350px' : '470px',
                            objectFit: 'contain'
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Conteúdo */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: bannerMode === 'post' ? '12px' : '2%', 
                    alignItems: bannerMode === 'post' ? 'flex-start' : 'center',
                    textAlign: bannerMode === 'post' ? 'left' : 'center',
                    maxWidth: bannerMode === 'post' ? '50%' : '100%',
                    paddingLeft: bannerMode === 'post' ? '20px' : '0'
                  }}>
                    {/* Título */}
                    {productData.title && (
                      <h2 
                        style={{ 
                          color: settings.customTextColor,
                          fontSize: bannerMode === 'post' 
                            ? `${Math.max(24, Math.min(48, 1500 / productData.title.length))}px`
                            : `${Math.max(28, Math.min(78, 2000 / productData.title.length))}px`,
                          margin: 0,
                          lineHeight: 1.1,
                          fontWeight: 'bold'
                        }}
                      >
                        {productData.title}
                      </h2>
                    )}
                    
                    {/* Descrição */}
                    {productData.description && (
                      <p 
                        style={{ 
                          color: settings.customTextColor,
                          fontSize: bannerMode === 'post'
                            ? `${Math.max(16, Math.min(32, 1000 / productData.description.length))}px`
                            : `${Math.max(22, Math.min(58, 1400 / productData.description.length))}px`,
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
                          fontSize: bannerMode === 'post' ? '28px' : '42px',
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
                          fontSize: bannerMode === 'post' ? '20px' : '32px',
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
            Pré-visualização em tamanho real. O que vê é exatamente o que será gerado.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBannerGerador;
