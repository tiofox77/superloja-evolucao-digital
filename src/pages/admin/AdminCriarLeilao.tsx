import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Plus, X, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface ProductForm {
  name: string;
  description: string;
  starting_bid: number;
  bid_increment: number;
  auction_start_date: string;
  auction_end_date: string;
  auto_extend_minutes: number;
  reserve_price?: number;
  category_id?: string;
}

const AdminCriarLeilao = () => {
  const [formData, setFormData] = useState<ProductForm>({
    name: '',
    description: '',
    starting_bid: 0,
    bid_increment: 10,
    auction_start_date: new Date().toISOString().slice(0, 16),
    auction_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    auto_extend_minutes: 5,
    reserve_price: 0
  });
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      toast({
        title: "Limite excedido",
        description: "Máximo de 5 imagens permitidas.",
        variant: "destructive"
      });
      return;
    }
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload images
      const imageUrls: string[] = [];
      
      for (const image of images) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `auction-products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, image);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        imageUrls.push(data.publicUrl);
      }

      // Create product with auction settings
      const { error } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          description: formData.description,
          price: formData.starting_bid,
          starting_bid: formData.starting_bid,
          bid_increment: formData.bid_increment,
          auction_start_date: new Date(formData.auction_start_date).toISOString(),
          auction_end_date: new Date(formData.auction_end_date).toISOString(),
          auto_extend_minutes: formData.auto_extend_minutes,
          reserve_price: formData.reserve_price,
          is_auction: true,
          active: true,
          in_stock: true,
          slug: formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          image_url: imageUrls[0] || null,
          images: imageUrls
        });

      if (error) throw error;

      toast({
        title: "Leilão criado!",
        description: "O produto foi adicionado como leilão com sucesso."
      });

      navigate('/admin/leiloes');
    } catch (error) {
      console.error('Erro ao criar leilão:', error);
      toast({
        title: "Erro ao criar leilão",
        description: "Não foi possível criar o leilão. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="p-3 rounded-full bg-hero-gradient">
          <Package className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Criar Novo Leilão</h1>
          <p className="text-muted-foreground">
            Crie um leilão para produtos não registrados no sistema
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Produto e Leilão</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Nome do produto"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="starting_bid">Lance Inicial (Kz) *</Label>
                <Input
                  id="starting_bid"
                  type="number"
                  step="0.01"
                  value={formData.starting_bid}
                  onChange={(e) => setFormData({...formData, starting_bid: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição do Produto</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descreva o produto detalhadamente..."
                rows={4}
              />
            </div>

            {/* Configurações do leilão */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bid_increment">Incremento do Lance (Kz)</Label>
                <Input
                  id="bid_increment"
                  type="number"
                  step="0.01"
                  value={formData.bid_increment}
                  onChange={(e) => setFormData({...formData, bid_increment: parseFloat(e.target.value) || 1})}
                  placeholder="10.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reserve_price">Preço de Reserva (Kz)</Label>
                <Input
                  id="reserve_price"
                  type="number"
                  step="0.01"
                  value={formData.reserve_price}
                  onChange={(e) => setFormData({...formData, reserve_price: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="auto_extend_minutes">Extensão Automática (min)</Label>
                <Input
                  id="auto_extend_minutes"
                  type="number"
                  value={formData.auto_extend_minutes}
                  onChange={(e) => setFormData({...formData, auto_extend_minutes: parseInt(e.target.value) || 5})}
                  placeholder="5"
                />
              </div>
            </div>

            {/* Datas do leilão */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="auction_start_date">Data de Início *</Label>
                <Input
                  id="auction_start_date"
                  type="datetime-local"
                  value={formData.auction_start_date}
                  onChange={(e) => setFormData({...formData, auction_start_date: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="auction_end_date">Data de Término *</Label>
                <Input
                  id="auction_end_date"  
                  type="datetime-local"
                  value={formData.auction_end_date}
                  onChange={(e) => setFormData({...formData, auction_end_date: e.target.value})}
                  required
                />
              </div>
            </div>

            {/* Upload de imagens */}
            <div className="space-y-4">
              <Label>Imagens do Produto (máximo 5)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Clique para enviar imagens</p>
                    <Button type="button" variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Escolher Arquivos
                    </Button>
                  </div>
                </label>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/leiloes')}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Criando...' : 'Criar Leilão'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCriarLeilao;