import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Upload, Image as ImageIcon, Loader2, Star, Images, Sparkles, Package, Palette, Ruler, Edit3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ImageAIEditor from '@/components/ImageAIEditor';
import { ImageEditorModal } from '@/components/ImageEditorModal';
import { ProductVariants } from '@/components/ProductVariants';

interface ProductFormProps {
  product?: any;
  onSave: (product: any) => void;
  onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ product, onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [seoSuggestions, setSeoSuggestions] = useState(null);
  const [generatingSEO, setGeneratingSEO] = useState(false);
  const [newColor, setNewColor] = useState('');
  const [newSize, setNewSize] = useState('');
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [editingImageUrl, setEditingImageUrl] = useState('');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    original_price: product?.original_price || '',
    category_id: product?.category_id || '',
    subcategory_id: product?.subcategory_id || '',
    
    stock_quantity: product?.stock_quantity || 0,
    in_stock: product?.in_stock ?? true,
    featured: product?.featured ?? false,
    image_url: product?.image_url || '',
    images: product?.images || [],
    seo_title: product?.seo_title || '',
    seo_description: product?.seo_description || '',
    seo_keywords: product?.seo_keywords || '',
    product_type: product?.product_type || 'physical',
    is_digital: product?.is_digital ?? false,
    digital_file_url: product?.digital_file_url || '',
    license_key: product?.license_key || '',
    download_limit: product?.download_limit || 0,
    variants: product?.variants || [],
    colors: product?.colors || [],
    sizes: product?.sizes || [],
    material: product?.material || '',
    weight: product?.weight || '',
    dimensions: product?.dimensions || ''
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const handleImageUpload = async (file: File) => {
    setImageUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      if (!formData.image_url) {
        setFormData(prev => ({
          ...prev,
          image_url: publicUrl,
          images: [...prev.images, publicUrl]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, publicUrl]
        }));
      }

      toast({
        title: "Imagem enviada!",
        description: "Imagem carregada com sucesso."
      });
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = (imageUrl: string) => {
    setFormData(prev => {
      const newImages = prev.images.filter(img => img !== imageUrl);
      
      if (prev.image_url === imageUrl) {
        return {
          ...prev,
          image_url: newImages[0] || '',
          images: newImages
        };
      }
      
      return {
        ...prev,
        images: newImages
      };
    });
  };

  const setMainImage = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      image_url: imageUrl
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        slug: formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        subcategory_id: formData.subcategory_id || null,
        seo_title: formData.seo_title || null,
        seo_description: formData.seo_description || null,
        seo_keywords: formData.seo_keywords || null,
        product_type: formData.product_type,
        is_digital: formData.is_digital,
        digital_file_url: formData.digital_file_url || null,
        license_key: formData.license_key || null,
        download_limit: formData.download_limit || null,
        colors: formData.colors.length > 0 ? formData.colors : [],
        sizes: formData.sizes.length > 0 ? formData.sizes : [],
        material: formData.material || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        dimensions: formData.dimensions || null
      };

      let result;
      if (product?.id) {
        result = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast({
        title: product?.id ? "Produto atualizado!" : "Produto criado!",
        description: "Operação realizada com sucesso.",
      });

      onSave(result.data);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0
    }).format(price);
  };

  const generateSEOSuggestions = async () => {
    if (!formData.name || !formData.description) {
      toast({
        title: "Informações incompletas",
        description: "Preencha o nome e descrição do produto para gerar sugestões de SEO.",
        variant: "destructive"
      });
      return;
    }

    setGeneratingSEO(true);
    try {
      const categoryName = categories.find(cat => cat.id === formData.category_id)?.name || 'Produto';
      
      const { data, error } = await supabase.functions.invoke('generate-product-seo', {
        body: {
          productName: formData.name,
          productDescription: formData.description,
          categoryName,
          price: formData.price ? parseFloat(formData.price) : 0,
          generateOnly: true
        }
      });

      if (error) throw error;

      setSeoSuggestions(data);
      toast({
        title: "Sugestões geradas!",
        description: "Use as sugestões abaixo para otimizar o SEO do produto."
      });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar sugestões",
        description: error.message || "Verifique se a API OpenAI está configurada.",
        variant: "destructive"
      });
    } finally {
      setGeneratingSEO(false);
    }
  };

  const applySEOSuggestion = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    toast({
      title: "Sugestão aplicada!",
      description: `Campo ${field.replace('seo_', '').toUpperCase()} atualizado.`
    });
  };

  const addColor = () => {
    if (newColor && !formData.colors.includes(newColor)) {
      setFormData(prev => ({
        ...prev,
        colors: [...prev.colors, newColor]
      }));
      setNewColor('');
    }
  };

  const removeColor = (colorToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter(color => color !== colorToRemove)
    }));
  };

  const addSize = () => {
    if (newSize && !formData.sizes.includes(newSize)) {
      setFormData(prev => ({
        ...prev,
        sizes: [...prev.sizes, newSize]
      }));
      setNewSize('');
    }
  };

  const removeSize = (sizeToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter(size => size !== sizeToRemove)
    }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {product?.id ? 'Editar Produto' : 'Novo Produto'}
        </h2>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Básico
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Categorias
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Preços
            </TabsTrigger>
            <TabsTrigger value="variants" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Variantes
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-2">
              <Images className="w-4 h-4" />
              Mídia
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              SEO
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Informações Básicas */}
          <TabsContent value="basic" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informações Básicas */}
              <Card className="hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    Informações do Produto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome do Produto *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      className="mt-1"
                      placeholder="Ex: iPhone 15 Pro Max 256GB"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição Completa</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={6}
                      className="mt-1"
                      placeholder="Descreva detalhadamente o produto, suas características, benefícios e especificações técnicas..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 Uma descrição rica melhora o SEO e aumenta as conversões
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Tipo de Produto */}
              <Card className="hover-scale border-l-4 border-l-orange-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <Package className="w-5 h-5" />
                    Tipo de Produto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Tipo do Produto *</Label>
                    <Select 
                      value={formData.product_type} 
                      onValueChange={(value) => {
                        setFormData({
                          ...formData, 
                          product_type: value,
                          is_digital: value === 'digital'
                        });
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border shadow-lg z-50">
                        <SelectItem value="physical">
                          📦 Produto Físico - Precisa ser enviado
                        </SelectItem>
                        <SelectItem value="digital">
                          💾 Produto Digital - Download/Licença
                        </SelectItem>
                        <SelectItem value="service">
                          🛠️ Serviço - Consultoria/Trabalho
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Configurações para Produto Digital */}
                  {(formData.product_type === 'digital' || formData.is_digital) && (
                    <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <h4 className="font-semibold text-purple-800 dark:text-purple-200">
                          Configurações de Produto Digital
                        </h4>
                      </div>
                      
                      <div>
                        <Label htmlFor="digital_file_url">URL do Arquivo Digital</Label>
                        <Input
                          id="digital_file_url"
                          value={formData.digital_file_url}
                          onChange={(e) => setFormData({...formData, digital_file_url: e.target.value})}
                          placeholder="https://exemplo.com/arquivo.zip"
                          className="mt-1"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="license_key">Chave de Licença</Label>
                          <Input
                            id="license_key"
                            value={formData.license_key}
                            onChange={(e) => setFormData({...formData, license_key: e.target.value})}
                            placeholder="XXXX-XXXX-XXXX-XXXX"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="download_limit">Limite de Downloads</Label>
                          <Input
                            id="download_limit"
                            type="number"
                            min="0"
                            value={formData.download_limit}
                            onChange={(e) => setFormData({...formData, download_limit: parseInt(e.target.value) || 0})}
                            placeholder="0 = ilimitado"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Propriedades Físicas (apenas para produtos físicos) */}
            {formData.product_type === 'physical' && (
              <Card className="hover-scale border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-600">
                    <Ruler className="w-5 h-5" />
                    Propriedades Físicas
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Peso, dimensões e material para cálculo de frete
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="weight">⚖️ Peso (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.001"
                        min="0"
                        value={formData.weight}
                        onChange={(e) => setFormData({...formData, weight: e.target.value})}
                        placeholder="0.500"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="material">🏗️ Material</Label>
                      <Input
                        id="material"
                        value={formData.material}
                        onChange={(e) => setFormData({...formData, material: e.target.value})}
                        placeholder="Algodão, Plástico, Metal..."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dimensions">📐 Dimensões</Label>
                      <Input
                        id="dimensions"
                        value={formData.dimensions}
                        onChange={(e) => setFormData({...formData, dimensions: e.target.value})}
                        placeholder="20x15x5 cm"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab 2: Categorias e Subcategorias */}
          <TabsContent value="categories" className="space-y-6">
            <Card className="hover-scale border-l-4 border-l-indigo-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-600">
                  <Star className="w-5 h-5" />
                  Categorização do Produto
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Organize o produto em categorias e subcategorias para melhor navegação
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Categoria Principal */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="category" className="text-base font-semibold">
                      📂 Categoria Principal *
                    </Label>
                    <Select 
                      value={formData.category_id} 
                      onValueChange={(value) => setFormData({...formData, category_id: value, subcategory_id: ''})}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Selecione a categoria principal" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border shadow-lg z-50 max-h-60 overflow-y-auto">
                        {categories.filter(cat => !cat.parent_id).map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              {category.icon && <span className="text-lg">{category.icon}</span>}
                              <span>{category.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                   {/* Subcategorias */}
                   {formData.category_id && (() => {
                     const subcategories = categories.filter(cat => cat.parent_id === formData.category_id);
                     
                     if (subcategories.length === 0) return null;
                     
                     return (
                       <div className="space-y-3">
                         <Label className="text-base font-semibold flex items-center gap-2">
                           🏷️ Subcategoria (opcional)
                         </Label>
                         
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                           {subcategories.map((subcategory) => (
                             <Card 
                               key={subcategory.id}
                               className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                                 formData.subcategory_id === subcategory.id 
                                   ? 'ring-2 ring-primary bg-primary/5' 
                                   : 'hover:shadow-md'
                               }`}
                               onClick={() => setFormData({...formData, subcategory_id: subcategory.id})}
                             >
                               <CardContent className="p-4">
                                 <div className="flex items-center gap-3">
                                   {subcategory.icon && (
                                     <span className="text-2xl">{subcategory.icon}</span>
                                   )}
                                   <div className="flex-1">
                                     <h4 className="font-medium text-sm">{subcategory.name}</h4>
                                     {subcategory.description && (
                                       <p className="text-xs text-muted-foreground mt-1">
                                         {subcategory.description}
                                       </p>
                                     )}
                                   </div>
                                   {formData.subcategory_id === subcategory.id && (
                                     <div className="w-3 h-3 bg-primary rounded-full"></div>
                                   )}
                                 </div>
                               </CardContent>
                             </Card>
                           ))}
                         </div>
                         
                         {formData.subcategory_id && (
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => setFormData({...formData, subcategory_id: ''})}
                             className="mt-2"
                           >
                             <X className="w-4 h-4 mr-2" />
                             Remover Subcategoria
                           </Button>
                         )}
                       </div>
                     );
                   })()}

                 </div>

                   {/* Preview da Categorização */}
                   {formData.category_id && (
                     <div className="space-y-3">
                       <Label className="text-base font-semibold">📋 Preview da Categorização</Label>
                       <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
                         <div className="flex flex-wrap items-center gap-2">
                           <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                             {categories.find(cat => cat.id === formData.category_id)?.name}
                           </Badge>
                           
                           {formData.subcategory_id && (
                             <>
                               <span className="text-muted-foreground">›</span>
                               <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
                                 {categories.find(cat => cat.id === formData.subcategory_id)?.name}
                               </Badge>
                             </>
                           )}
                         </div>
                         
                         <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                           ✅ O produto será exibido na navegação conforme a categorização acima
                         </p>
                       </div>
                     </div>
                   )}
                    </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Preços e Estoque */}
          <TabsContent value="pricing" className="space-y-6">
            <Card className="hover-scale border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Star className="w-5 h-5" />
                  Preços e Estoque
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure preços, desconto e controle de estoque
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Preço de Venda (AOA) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      required
                      className="mt-1"
                      placeholder="0.00"
                    />
                    {formData.price && (
                      <p className="text-sm font-medium text-green-600 mt-1">
                        {formatPrice(parseFloat(formData.price))}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="original_price">Preço Original (AOA)</Label>
                    <Input
                      id="original_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.original_price}
                      onChange={(e) => setFormData({...formData, original_price: e.target.value})}
                      className="mt-1"
                      placeholder="Preço antes do desconto"
                    />
                    {formData.original_price && formData.price && parseFloat(formData.original_price) > parseFloat(formData.price) && (
                      <p className="text-sm text-red-500 mt-1">
                        Desconto: {Math.round((1 - parseFloat(formData.price) / parseFloat(formData.original_price)) * 100)}%
                      </p>
                    )}
                  </div>
                </div>

                {formData.product_type !== 'digital' && (
                  <div>
                    <Label htmlFor="stock">Quantidade em Estoque</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                      className="mt-1"
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Deixe 0 para produtos sem controle de estoque
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="in_stock"
                      checked={formData.in_stock}
                      onCheckedChange={(checked) => setFormData({...formData, in_stock: checked})}
                    />
                    <Label htmlFor="in_stock" className="font-medium">
                      {formData.in_stock ? '✅ Disponível' : '❌ Esgotado'}
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => setFormData({...formData, featured: checked})}
                    />
                    <Label htmlFor="featured" className="font-medium">
                      ⭐ Produto em Destaque
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Variantes */}
          <TabsContent value="variants" className="space-y-6">
            <Card className="hover-scale border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Palette className="w-5 h-5" />
                  Variantes do Produto
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Cores, tamanhos e outras variações disponíveis
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <ProductVariants
                  variants={formData.variants}
                  onVariantsChange={(variants) => setFormData({...formData, variants})}
                />

                {/* Cores e Tamanhos Simples */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cores */}
                  <div>
                    <Label className="text-base font-semibold flex items-center gap-2">
                      🎨 Cores Simples
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Para variações básicas sem imagens/preços específicos
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        placeholder="Ex: Azul, Vermelho, Preto..."
                        className="flex-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addColor();
                          }
                        }}
                      />
                      <Button type="button" onClick={addColor} variant="outline">
                        Adicionar
                      </Button>
                    </div>
                    {formData.colors.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.colors.map((color, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-2 py-1 px-3">
                            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"></span>
                            {color}
                            <button
                              type="button"
                              onClick={() => removeColor(color)}
                              className="ml-1 hover:text-destructive transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tamanhos */}
                  <div>
                    <Label className="text-base font-semibold flex items-center gap-2">
                      📏 Tamanhos Simples
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Para variações básicas sem imagens/preços específicos
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newSize}
                        onChange={(e) => setNewSize(e.target.value)}
                        placeholder="Ex: PP, P, M, G, GG, XG..."
                        className="flex-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addSize();
                          }
                        }}
                      />
                      <Button type="button" onClick={addSize} variant="outline">
                        Adicionar
                      </Button>
                    </div>
                    {formData.sizes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.sizes.map((size, index) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1 py-1 px-3">
                            <Ruler className="w-3 h-3" />
                            {size}
                            <button
                              type="button"
                              onClick={() => removeSize(size)}
                              className="ml-1 hover:text-destructive transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 5: Mídia */}
          <TabsContent value="media" className="space-y-6">
            <Card className="hover-scale border-l-4 border-l-teal-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-teal-600">
                  <Images className="w-5 h-5" />
                  Imagens do Produto
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Upload manual ou geração com IA
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">📤 Upload</TabsTrigger>
                    <TabsTrigger value="ai">🤖 IA</TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-4">
                    {/* Upload Area */}
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-teal-300 transition-colors">
                      <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Arraste imagens aqui ou clique para selecionar
                      </p>
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          files.forEach(file => handleImageUpload(file));
                        }}
                        className="hidden"
                        id="image-upload"
                        disabled={imageUploading}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        asChild 
                        disabled={imageUploading}
                      >
                        <label htmlFor="image-upload" className="cursor-pointer">
                          {imageUploading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Selecionar Imagens
                            </>
                          )}
                        </label>
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="ai" className="space-y-4">
                    <div className="text-center py-6">
                      <ImageAIEditor 
                        productName={formData.name}
                        onImageSelect={(imageUrl) => {
                          if (!formData.image_url) {
                            setFormData(prev => ({
                              ...prev,
                              image_url: imageUrl,
                              images: [...prev.images, imageUrl]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              images: [...prev.images, imageUrl]
                            }));
                          }
                        }}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Preview de Imagens */}
                {formData.image_url && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <Label className="font-medium">Imagem Principal</Label>
                    </div>
                    <div className="relative group">
                      <div className="aspect-square bg-muted rounded-lg overflow-hidden border-2 border-yellow-200">
                        <img
                          src={formData.image_url}
                          alt="Imagem principal"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
                        Principal
                      </Badge>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditingImageUrl(formData.image_url);
                            setImageEditorOpen(true);
                          }}
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            const newImages = formData.images.filter(img => img !== formData.image_url);
                            setFormData(prev => ({
                              ...prev,
                              image_url: newImages[0] || '',
                              images: newImages
                            }));
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Galeria de Imagens */}
                {formData.images.length > 1 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Images className="w-4 h-4" />
                      <Label>Galeria ({formData.images.length - 1})</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {formData.images.filter(img => img !== formData.image_url).map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                            <img
                              src={imageUrl}
                              alt={`Galeria ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setEditingImageUrl(imageUrl);
                                setImageEditorOpen(true);
                              }}
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => removeImage(imageUrl)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                            onClick={() => setMainImage(imageUrl)}
                          >
                            Principal
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 6: SEO */}
          <TabsContent value="seo" className="space-y-6">
            <Card className="hover-scale border-l-4 border-l-pink-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-pink-600">
                  <Sparkles className="w-5 h-5" />
                  Otimização SEO
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure títulos, descrições e palavras-chave para melhor posicionamento
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Gerar SEO Automaticamente</h3>
                    <p className="text-sm text-muted-foreground">
                      Use IA para criar títulos e descrições otimizados
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={generateSEOSuggestions}
                    disabled={generatingSEO || !formData.name}
                    variant="outline"
                  >
                    {generatingSEO ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Gerar SEO
                      </>
                    )}
                  </Button>
                </div>

                {seoSuggestions && (
                  <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                      🤖 Sugestões de SEO Geradas
                    </h4>
                    
                    {seoSuggestions.title && (
                      <div className="space-y-2">
                        <Label>Título SEO Sugerido</Label>
                        <div className="flex gap-2">
                          <Input
                            value={seoSuggestions.title}
                            readOnly
                            className="flex-1 bg-white"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => applySEOSuggestion('seo_title', seoSuggestions.title)}
                          >
                            Aplicar
                          </Button>
                        </div>
                      </div>
                    )}

                    {seoSuggestions.description && (
                      <div className="space-y-2">
                        <Label>Descrição SEO Sugerida</Label>
                        <div className="flex gap-2">
                          <Textarea
                            value={seoSuggestions.description}
                            readOnly
                            className="flex-1 bg-white"
                            rows={3}
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => applySEOSuggestion('seo_description', seoSuggestions.description)}
                          >
                            Aplicar
                          </Button>
                        </div>
                      </div>
                    )}

                    {seoSuggestions.keywords && (
                      <div className="space-y-2">
                        <Label>Palavras-chave Sugeridas</Label>
                        <div className="flex gap-2">
                          <Input
                            value={seoSuggestions.keywords}
                            readOnly
                            className="flex-1 bg-white"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => applySEOSuggestion('seo_keywords', seoSuggestions.keywords)}
                          >
                            Aplicar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="seo_title">Título SEO</Label>
                    <Input
                      id="seo_title"
                      value={formData.seo_title}
                      onChange={(e) => setFormData({...formData, seo_title: e.target.value})}
                      className="mt-1"
                      placeholder="Título otimizado para buscadores (50-60 caracteres)"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.seo_title.length}/60 caracteres
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="seo_description">Descrição SEO</Label>
                    <Textarea
                      id="seo_description"
                      value={formData.seo_description}
                      onChange={(e) => setFormData({...formData, seo_description: e.target.value})}
                      rows={3}
                      className="mt-1"
                      placeholder="Descrição que aparecerá nos resultados de busca (150-160 caracteres)"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.seo_description.length}/160 caracteres
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="seo_keywords">Palavras-chave</Label>
                    <Input
                      id="seo_keywords"
                      value={formData.seo_keywords}
                      onChange={(e) => setFormData({...formData, seo_keywords: e.target.value})}
                      className="mt-1"
                      placeholder="palavra1, palavra2, palavra3..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Separe as palavras-chave com vírgulas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botões de Ação */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="min-w-32">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                {product?.id ? 'Atualizar Produto' : 'Criar Produto'}
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Image Editor Modal */}
      <ImageEditorModal
        isOpen={imageEditorOpen}
        onClose={() => setImageEditorOpen(false)}
        imageUrl={editingImageUrl}
        onImageUpdate={(newImageUrl) => {
          if (editingImageUrl === formData.image_url) {
            // Updating main image
            setFormData(prev => ({
              ...prev,
              image_url: newImageUrl,
              images: prev.images.map(img => img === editingImageUrl ? newImageUrl : img)
            }));
          } else {
            // Updating gallery image
            setFormData(prev => ({
              ...prev,
              images: prev.images.map(img => img === editingImageUrl ? newImageUrl : img)
            }));
          }
        }}
      />
    </div>
  );
};