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
import { X, Upload, Image as ImageIcon, Loader2, Star, Images, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ImageAIEditor from '@/components/ImageAIEditor';

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
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    original_price: product?.original_price || '',
    category_id: product?.category_id || '',
    stock_quantity: product?.stock_quantity || 0,
    in_stock: product?.in_stock ?? true,
    featured: product?.featured ?? false,
    image_url: product?.image_url || '',
    images: product?.images || [],
    seo_title: product?.seo_title || '',
    seo_description: product?.seo_description || '',
    seo_keywords: product?.seo_keywords || ''
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

      // Se é a primeira imagem, definir como imagem principal
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
      
      // Se removeu a imagem principal, definir a primeira das restantes como principal
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
        seo_title: formData.seo_title || null,
        seo_description: formData.seo_description || null,
        seo_keywords: formData.seo_keywords || null
      };

      let result;
      if (product?.id) {
        // Atualizar produto existente
        result = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)
          .select()
          .single();
      } else {
        // Criar novo produto
        result = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      // Se for um novo produto, gerar SEO automaticamente
      if (!product?.id) {
        try {
          const categoryName = categories.find(cat => cat.id === formData.category_id)?.name;
          
          await supabase.functions.invoke('generate-product-seo', {
            body: {
              productId: result.data.id,
              productName: formData.name,
              productDescription: formData.description,
              categoryName,
              price: parseFloat(formData.price)
            }
          });
          
          toast({
            title: "SEO gerado automaticamente!",
            description: "Títulos e descrições SEO foram criados para este produto.",
          });
        } catch (seoError) {
          console.error('Erro ao gerar SEO:', seoError);
          // Não bloquear o salvamento se SEO falhar
        }
      }

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
          generateOnly: true // Flag para só gerar, não salvar
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {product?.id ? 'Editar Produto' : 'Novo Produto'}
        </h2>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Básicas */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
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
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={4}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Uma boa descrição ajuda a gerar melhor SEO automaticamente
                  </p>
                </div>

                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({...formData, category_id: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Aviso sobre SEO automático */}
                {!product?.id && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-800 dark:text-blue-200">
                          SEO Automático Ativado
                        </p>
                        <p className="text-blue-700 dark:text-blue-300 mt-1">
                          Após salvar, será gerado automaticamente título SEO, descrição e palavras-chave otimizadas para este produto.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sugestões SEO com IA */}
            <Card className="hover-scale border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-600">
                  <Sparkles className="w-5 h-5" />
                  Sugestões SEO com IA
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Gere título, descrição e palavras-chave otimizadas usando inteligência artificial
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={generateSEOSuggestions}
                    disabled={generatingSEO || !formData.name || !formData.description}
                    className="bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-purple-200"
                  >
                    {generatingSEO ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando sugestões...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Gerar Sugestões SEO
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-center text-xs text-muted-foreground">
                  💡 Configure a chave OpenAI em Configurações → SEO & API para ativar
                </div>

                {!formData.name || !formData.description ? (
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Preencha o nome e descrição do produto para gerar sugestões de SEO
                    </p>
                  </div>
                ) : null}

                {seoSuggestions && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-3">✨ Título SEO Sugerido</h4>
                      <div className="bg-white p-3 rounded border border-purple-100 mb-2">
                        <p className="text-sm">{seoSuggestions.seo_title}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          type="button"
                          size="sm" 
                          variant="outline"
                          onClick={() => applySEOSuggestion('seo_title', seoSuggestions.seo_title)}
                        >
                          Aplicar
                        </Button>
                        <div className="text-xs text-muted-foreground flex items-center">
                          {seoSuggestions.seo_title?.length || 0}/60 caracteres
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-3">📝 Descrição SEO Sugerida</h4>
                      <div className="bg-white p-3 rounded border border-purple-100 mb-2">
                        <p className="text-sm">{seoSuggestions.seo_description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          type="button"
                          size="sm" 
                          variant="outline"
                          onClick={() => applySEOSuggestion('seo_description', seoSuggestions.seo_description)}
                        >
                          Aplicar
                        </Button>
                        <div className="text-xs text-muted-foreground flex items-center">
                          {seoSuggestions.seo_description?.length || 0}/160 caracteres
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-3">🔑 Palavras-chave Sugeridas</h4>
                      <div className="bg-white p-3 rounded border border-purple-100 mb-2">
                        <p className="text-sm">{seoSuggestions.seo_keywords}</p>
                      </div>
                      <Button 
                        type="button"
                        size="sm" 
                        variant="outline"
                        onClick={() => applySEOSuggestion('seo_keywords', seoSuggestions.seo_keywords)}
                      >
                        Aplicar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Campos SEO Atuais */}
                {(formData.seo_title || formData.seo_description || formData.seo_keywords) && (
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-semibold text-sm">SEO Atual do Produto</h4>
                    
                    {formData.seo_title && (
                      <div>
                        <Label>Título SEO</Label>
                        <div className="bg-muted/50 p-2 rounded text-sm mt-1">
                          {formData.seo_title}
                        </div>
                      </div>
                    )}

                    {formData.seo_description && (
                      <div>
                        <Label>Descrição SEO</Label>
                        <div className="bg-muted/50 p-2 rounded text-sm mt-1">
                          {formData.seo_description}
                        </div>
                      </div>
                    )}

                    {formData.seo_keywords && (
                      <div>
                        <Label>Palavras-chave</Label>
                        <div className="bg-muted/50 p-2 rounded text-sm mt-1">
                          {formData.seo_keywords}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader>
                <CardTitle>Preços e Estoque</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Preço de Venda (Kz) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      required
                      className="mt-1"
                    />
                    {formData.price && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatPrice(parseFloat(formData.price))}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="original_price">Preço Original (Kz)</Label>
                    <Input
                      id="original_price"
                      type="number"
                      step="0.01"
                      value={formData.original_price}
                      onChange={(e) => setFormData({...formData, original_price: e.target.value})}
                      className="mt-1"
                    />
                    {formData.original_price && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatPrice(parseFloat(formData.original_price))}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="stock">Quantidade em Estoque</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="in_stock"
                        checked={formData.in_stock}
                        onCheckedChange={(checked) => setFormData({...formData, in_stock: checked})}
                      />
                      <Label htmlFor="in_stock">Em Estoque</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="featured"
                        checked={formData.featured}
                        onCheckedChange={(checked) => setFormData({...formData, featured: checked})}
                      />
                      <Label htmlFor="featured">Produto em Destaque</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upload de Imagens */}
          <div className="space-y-6">
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Images className="w-5 h-5" />
                  Imagens do Produto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">Upload Manual</TabsTrigger>
                    <TabsTrigger value="ai">IA Assistant</TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-4">
                    {/* Upload Area */}
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
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

                {/* Imagem de Destaque */}
                {formData.image_url && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <Label className="font-medium">Imagem de Destaque</Label>
                    </div>
                    <div className="relative group">
                      <div className="aspect-square bg-muted rounded-lg overflow-hidden border-2 border-yellow-200">
                        <img
                          src={formData.image_url}
                          alt="Imagem de destaque"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Badge className="absolute top-2 left-2 bg-yellow-500">
                        Destaque
                      </Badge>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Images className="w-4 h-4" />
                      <Label>Galeria ({formData.images.length - 1} imagens)</Label>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {formData.images.filter(img => img !== formData.image_url).map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                            <img
                              src={imageUrl}
                              alt={`Galeria ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                            <Star className="w-3 h-3 mr-1" />
                            Destaque
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              product?.id ? 'Atualizar Produto' : 'Criar Produto'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};