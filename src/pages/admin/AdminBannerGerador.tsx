import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import html2canvas from 'html2canvas';
import { Download, Share2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  images?: string[];
}

const AdminBannerGerador: React.FC = () => {
  const { toast } = useToast();
  const bannerRef = useRef<HTMLDivElement>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState('');
  
  const [bannerData, setBannerData] = useState({
    title: 'Seu Produto Aqui',
    description: 'Descrição do produto',
    price: '99.90',
    imageUrl: '',
    website: 'superloja.vip'
  });
  
  const [bannerStyle, setBannerStyle] = useState({
    width: 1080,
    height: 1080,
    backgroundColor: '#667eea',
    textColor: '#ffffff',
    showPrice: true,
    showWebsite: true,
    template: 'gradient'
  });

  // Carregar produtos
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .limit(50);
        
        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, []);

  // Carregar produto selecionado
  useEffect(() => {
    if (selectedProduct && selectedProduct !== 'custom') {
      const product = products.find(p => p.id === selectedProduct);
      if (product) {
        setBannerData({
          title: product.name,
          description: product.description?.substring(0, 80) || '',
          price: product.price.toString(),
          imageUrl: product.images?.[0] || '',
          website: 'superloja.vip'
        });
      }
    }
  }, [selectedProduct, products]);

  const handleInputChange = (field: string, value: string) => {
    setBannerData(prev => ({ ...prev, [field]: value }));
  };

  const handleStyleChange = (field: string, value: any) => {
    setBannerStyle(prev => ({ ...prev, [field]: value }));
  };

  const generateBackground = () => {
    const { backgroundColor, template } = bannerStyle;
    
    switch (template) {
      case 'gradient':
        return `linear-gradient(135deg, ${backgroundColor}, ${adjustColor(backgroundColor, -30)})`;
      case 'circles':
        return `
          radial-gradient(circle at 20% 20%, ${adjustColor(backgroundColor, 20)}40 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, ${adjustColor(backgroundColor, -20)}40 0%, transparent 50%),
          ${backgroundColor}
        `;
      case 'waves':
        return `
          radial-gradient(ellipse at top, ${adjustColor(backgroundColor, 30)}30 0%, transparent 70%),
          radial-gradient(ellipse at bottom, ${adjustColor(backgroundColor, -30)}30 0%, transparent 70%),
          ${backgroundColor}
        `;
      default:
        return backgroundColor;
    }
  };

  const adjustColor = (hex: string, amount: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
  };

  const downloadBanner = async () => {
    if (!bannerRef.current) return;

    try {
      toast({ title: 'Gerando imagem...', description: 'Aguarde alguns segundos.' });

      const canvas = await html2canvas(bannerRef.current, {
        width: bannerStyle.width,
        height: bannerStyle.height,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `banner-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast({ title: 'Sucesso!', description: 'Banner baixado com sucesso.' });
        }
      }, 'image/png');

    } catch (error) {
      console.error('Erro ao gerar banner:', error);
      toast({ 
        variant: 'destructive',
        title: 'Erro', 
        description: 'Erro ao gerar banner. Tente novamente.' 
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Gerador de Banners</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controles */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="content">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="content">Conteúdo</TabsTrigger>
                  <TabsTrigger value="style">Estilo</TabsTrigger>
                </TabsList>
                
                <TabsContent value="content" className="space-y-4">
                  <div>
                    <Label>Produto</Label>
                    <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar produto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Personalizado</SelectItem>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Título</Label>
                    <Input 
                      value={bannerData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Descrição</Label>
                    <Textarea 
                      value={bannerData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>Preço (AOA)</Label>
                    <Input 
                      value={bannerData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>URL da Imagem</Label>
                    <Input 
                      value={bannerData.imageUrl}
                      onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="style" className="space-y-4">
                  <div>
                    <Label>Template</Label>
                    <Select 
                      value={bannerStyle.template} 
                      onValueChange={(value) => handleStyleChange('template', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">Cor Sólida</SelectItem>
                        <SelectItem value="gradient">Gradiente</SelectItem>
                        <SelectItem value="circles">Círculos</SelectItem>
                        <SelectItem value="waves">Ondas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Cor Principal</Label>
                    <Input 
                      type="color"
                      value={bannerStyle.backgroundColor}
                      onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Cor do Texto</Label>
                    <Input 
                      type="color"
                      value={bannerStyle.textColor}
                      onChange={(e) => handleStyleChange('textColor', e.target.value)}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={bannerStyle.showPrice}
                      onCheckedChange={(checked) => handleStyleChange('showPrice', checked)}
                    />
                    <Label>Mostrar Preço</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={bannerStyle.showWebsite}
                      onCheckedChange={(checked) => handleStyleChange('showWebsite', checked)}
                    />
                    <Label>Mostrar Website</Label>
                  </div>

                  <div>
                    <Label>Dimensões</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant={bannerStyle.width === 1080 && bannerStyle.height === 1080 ? 'default' : 'outline'}
                        onClick={() => {
                          handleStyleChange('width', 1080);
                          handleStyleChange('height', 1080);
                        }}
                      >
                        Quadrado
                      </Button>
                      <Button 
                        variant={bannerStyle.width === 1080 && bannerStyle.height === 1920 ? 'default' : 'outline'}
                        onClick={() => {
                          handleStyleChange('width', 1080);
                          handleStyleChange('height', 1920);
                        }}
                      >
                        Story
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Button onClick={downloadBanner} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Baixar Banner
          </Button>
        </div>

        {/* Preview */}
        <div className="flex items-center justify-center bg-gray-100 rounded-lg p-4">
          <div className="relative">
            <div
              ref={bannerRef}
              style={{
                width: `${bannerStyle.width}px`,
                height: `${bannerStyle.height}px`,
                background: generateBackground(),
                transform: `scale(${Math.min(400 / bannerStyle.width, 500 / bannerStyle.height)})`,
                transformOrigin: 'center',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                boxSizing: 'border-box',
                color: bannerStyle.textColor,
                textAlign: 'center',
                gap: '20px'
              }}
            >
              {bannerData.imageUrl && (
                <div style={{ flex: '0 0 auto', maxWidth: '60%', maxHeight: '40%' }}>
                  <img 
                    src={bannerData.imageUrl}
                    alt={bannerData.title}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                    }}
                  />
                </div>
              )}

              <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '15px' }}>
                <h1 style={{
                  fontSize: `${Math.max(32, bannerStyle.width * 0.04)}px`,
                  fontWeight: 'bold',
                  lineHeight: '1.2',
                  margin: 0,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                }}>
                  {bannerData.title}
                </h1>

                {bannerData.description && (
                  <p style={{
                    fontSize: `${Math.max(18, bannerStyle.width * 0.022)}px`,
                    lineHeight: '1.4',
                    margin: 0,
                    opacity: 0.9,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                  }}>
                    {bannerData.description}
                  </p>
                )}

                {bannerStyle.showPrice && (
                  <div style={{
                    fontSize: `${Math.max(24, bannerStyle.width * 0.03)}px`,
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.4)'
                  }}>
                    AOA {Number(bannerData.price).toLocaleString('pt-AO')}
                  </div>
                )}

                {bannerStyle.showWebsite && (
                  <p style={{
                    fontSize: `${Math.max(14, bannerStyle.width * 0.018)}px`,
                    margin: 0,
                    opacity: 0.8,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                  }}>
                    {bannerData.website}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBannerGerador;