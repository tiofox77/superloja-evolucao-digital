import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Upload, ImageIcon, Loader2, Edit3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImageEditorModal } from '@/components/ImageEditorModal';

interface Variant {
  id: string;
  name: string;
  price?: number;
  image_url?: string;
  stock_quantity?: number;
  sku?: string;
}

interface ProductVariantsProps {
  variants: Variant[];
  onVariantsChange: (variants: Variant[]) => void;
}

export const ProductVariants: React.FC<ProductVariantsProps> = ({
  variants,
  onVariantsChange
}) => {
  const [newVariant, setNewVariant] = useState<Partial<Variant>>({
    name: '',
    price: undefined,
    stock_quantity: 0,
    sku: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [editingImageUrl, setEditingImageUrl] = useState('');
  const { toast } = useToast();

  const handleImageUpload = async (file: File, variantIndex?: number) => {
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `variants/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      if (variantIndex !== undefined) {
        // Update existing variant
        const updatedVariants = [...variants];
        updatedVariants[variantIndex] = {
          ...updatedVariants[variantIndex],
          image_url: publicUrl
        };
        onVariantsChange(updatedVariants);
      } else {
        // Update new variant
        setNewVariant(prev => ({
          ...prev,
          image_url: publicUrl
        }));
      }

      toast({
        title: "Imagem enviada!",
        description: "Imagem da variante carregada com sucesso."
      });
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const addVariant = () => {
    if (!newVariant.name) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para a variante.",
        variant: "destructive"
      });
      return;
    }

    const variant: Variant = {
      id: `variant_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      name: newVariant.name,
      price: newVariant.price,
      image_url: newVariant.image_url,
      stock_quantity: newVariant.stock_quantity || 0,
      sku: newVariant.sku || ''
    };

    onVariantsChange([...variants, variant]);
    setNewVariant({
      name: '',
      price: undefined,
      stock_quantity: 0,
      sku: ''
    });
  };

  const removeVariant = (variantId: string) => {
    onVariantsChange(variants.filter(v => v.id !== variantId));
  };

  const updateVariant = (variantId: string, field: keyof Variant, value: any) => {
    const updatedVariants = variants.map(variant =>
      variant.id === variantId
        ? { ...variant, [field]: value }
        : variant
    );
    onVariantsChange(updatedVariants);
  };

  const openImageEditor = (imageUrl: string, variantIndex: number) => {
    setEditingImageUrl(imageUrl);
    setEditingImageIndex(variantIndex);
    setImageEditorOpen(true);
  };

  const handleImageUpdate = (newImageUrl: string) => {
    if (editingImageIndex !== null) {
      const updatedVariants = [...variants];
      updatedVariants[editingImageIndex] = {
        ...updatedVariants[editingImageIndex],
        image_url: newImageUrl
      };
      onVariantsChange(updatedVariants);
    }
    setImageEditorOpen(false);
    setEditingImageIndex(null);
    setEditingImageUrl('');
  };

  return (
    <div className="space-y-6">
      {/* Nova Variante */}
      <Card className="border-dashed border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Plus className="w-5 h-5" />
            Adicionar Nova Variante
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="variant-name">Nome da Variante *</Label>
              <Input
                id="variant-name"
                value={newVariant.name}
                onChange={(e) => setNewVariant({...newVariant, name: e.target.value})}
                placeholder="Ex: Azul Marinho, Tamanho G"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="variant-price">Preço (opcional)</Label>
              <Input
                id="variant-price"
                type="number"
                step="0.01"
                min="0"
                value={newVariant.price || ''}
                onChange={(e) => setNewVariant({
                  ...newVariant, 
                  price: e.target.value ? parseFloat(e.target.value) : undefined
                })}
                placeholder="0.00"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="variant-stock">Estoque</Label>
              <Input
                id="variant-stock"
                type="number"
                min="0"
                value={newVariant.stock_quantity}
                onChange={(e) => setNewVariant({
                  ...newVariant, 
                  stock_quantity: parseInt(e.target.value) || 0
                })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="variant-sku">SKU (opcional)</Label>
              <Input
                id="variant-sku"
                value={newVariant.sku}
                onChange={(e) => setNewVariant({...newVariant, sku: e.target.value})}
                placeholder="SKU123"
                className="mt-1"
              />
            </div>
          </div>

          {/* Upload de Imagem da Nova Variante */}
          <div>
            <Label>Imagem da Variante (opcional)</Label>
            <div className="mt-2 flex items-center gap-4">
              {newVariant.image_url ? (
                <div className="relative">
                  <img
                    src={newVariant.image_url}
                    alt="Prévia"
                    className="w-16 h-16 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                    onClick={() => setNewVariant({...newVariant, image_url: undefined})}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="w-16 h-16 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  className="hidden"
                  id="new-variant-image"
                  disabled={uploadingImage}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={uploadingImage}
                >
                  <label htmlFor="new-variant-image" className="cursor-pointer">
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Escolher Imagem
                      </>
                    )}
                  </label>
                </Button>
              </div>
            </div>
          </div>

          <Button type="button" onClick={addVariant} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Variante
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Variantes Existentes */}
      {variants.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Variantes do Produto ({variants.length})</h3>
          <div className="grid gap-4">
            {variants.map((variant, index) => (
              <Card key={variant.id} className="hover-scale">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                    {/* Imagem */}
                    <div className="space-y-2">
                      <Label className="text-sm">Imagem</Label>
                      {variant.image_url ? (
                        <div className="relative group">
                          <img
                            src={variant.image_url}
                            alt={variant.name}
                            className="w-20 h-20 object-cover rounded-lg border"
                          />
                          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => openImageEditor(variant.image_url!, index)}
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-20 h-20 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, index);
                        }}
                        className="hidden"
                        id={`variant-image-${index}`}
                        disabled={uploadingImage}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        asChild
                        disabled={uploadingImage}
                      >
                        <label htmlFor={`variant-image-${index}`} className="cursor-pointer text-xs">
                          {variant.image_url ? 'Trocar' : 'Adicionar'}
                        </label>
                      </Button>
                    </div>

                    {/* Nome */}
                    <div>
                      <Label className="text-sm">Nome</Label>
                      <Input
                        value={variant.name}
                        onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    {/* Preço */}
                    <div>
                      <Label className="text-sm">Preço</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={variant.price || ''}
                        onChange={(e) => updateVariant(
                          variant.id, 
                          'price', 
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )}
                        className="mt-1"
                        placeholder="Opcional"
                      />
                    </div>

                    {/* Estoque */}
                    <div>
                      <Label className="text-sm">Estoque</Label>
                      <Input
                        type="number"
                        min="0"
                        value={variant.stock_quantity}
                        onChange={(e) => updateVariant(
                          variant.id, 
                          'stock_quantity', 
                          parseInt(e.target.value) || 0
                        )}
                        className="mt-1"
                      />
                    </div>

                    {/* Ações */}
                    <div className="flex items-end justify-between">
                      <div className="flex-1">
                        <Label className="text-sm">SKU</Label>
                        <Input
                          value={variant.sku}
                          onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                          className="mt-1"
                          placeholder="SKU"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeVariant(variant.id)}
                        className="ml-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Image Editor Modal */}
      <ImageEditorModal
        isOpen={imageEditorOpen}
        onClose={() => setImageEditorOpen(false)}
        imageUrl={editingImageUrl}
        onImageUpdate={handleImageUpdate}
      />
    </div>
  );
};