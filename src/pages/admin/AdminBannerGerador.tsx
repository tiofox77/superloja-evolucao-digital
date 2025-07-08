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
import { supabase } from '@/integrations/supabase/client';
import { Download, Facebook, Instagram, Smartphone } from 'lucide-react';
import { BannerPreview } from '@/components/banner/BannerPreview';
import { bannerTemplates, generateTemplateBackground } from '@/components/banner/BannerTemplates';
import { downloadBannerImage, shareBannerImage } from '@/components/banner/BannerGenerator';

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

/**
 * Componente gerador de banners promocionais para produtos
 * Permite selecionar produtos, personalizar banners e baixar/compartilhar
 */
const AdminBannerGerador: React.FC = () => {
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
      selectedTemplate: 'custom' as string
    };
  });

  const [bannerMode, setBannerMode] = useState('square'); // square, story, post

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

  // Função para aplicar template selecionado
  const applyTemplate = (templateKey: string) => {
    const template = bannerTemplates[templateKey];
    if (template && templateKey !== 'custom') {
      const newSettings = {
        ...settings,
        customBackground: template.background,
        customTextColor: template.textColor,
        selectedTemplate: templateKey,
        produtoFundoBranco: templateKey === 'magenta_circles'
      };
      setSettings(newSettings);
      saveSettings(newSettings); // Salva automaticamente
    }
  };

  // Função wrapper para gerar background do template
  const generateBackground = (templateKey: string): string => {
    return generateTemplateBackground(templateKey, settings.customBackground);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Gerador de Banners de Produtos</h1>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel de Controle */}
        <div className="lg:col-span-5 space-y-6">
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
                    <div className="grid grid-cols-2 gap-2 mt-2 max-h-60 overflow-y-auto">
                      {Object.entries(bannerTemplates).map(([key, template]) => (
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

          {/* Botões de Ação */}
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => downloadBannerImage(bannerRef, settings)} 
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button 
              onClick={() => shareBannerImage(bannerRef, settings, 'facebook', productData)} 
              variant="outline" 
              className="flex-1"
            >
              <Facebook className="mr-2 h-4 w-4" />
              Facebook
            </Button>
            <Button 
              onClick={() => shareBannerImage(bannerRef, settings, 'whatsapp', productData)} 
              variant="outline" 
              className="flex-1"
            >
              <Smartphone className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
          </div>
        </div>

        {/* Pré-visualização do Banner */}
        <div className="lg:col-span-7">
          <BannerPreview
            bannerRef={bannerRef}
            productData={productData}
            settings={settings}
            generateTemplateBackground={generateBackground}
          />
          
          <div className="mt-4 text-center text-sm text-gray-500">
            Pré-visualização em escala reduzida. O download será em tamanho real ({settings.width}x{settings.height}px).
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBannerGerador;