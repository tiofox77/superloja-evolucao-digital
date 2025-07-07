import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Send, Package, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';

const SolicitarProduto = () => {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    estimated_price: '',
    contact_email: '',
    contact_phone: '',
    additional_notes: ''
  });
  const { toast } = useToast();

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
      // Upload images if any
      const imageUrls: string[] = [];
      
      for (const image of images) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `product-requests/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, image);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        imageUrls.push(data.publicUrl);
      }

      // Save request to database
      const { error } = await supabase
        .from('product_requests')
        .insert({
          product_name: formData.name,
          description: formData.description,
          category: formData.category,
          estimated_price: formData.estimated_price ? parseFloat(formData.estimated_price) : null,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          additional_notes: formData.additional_notes,
          images: imageUrls,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "✅ Solicitação enviada!",
        description: "Sua solicitação foi enviada com sucesso. Entraremos em contato em breve."
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        category: '',
        estimated_price: '',
        contact_email: '',
        contact_phone: '',
        additional_notes: ''
      });
      setImages([]);

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "❌ Erro ao enviar",
        description: "Não foi possível enviar sua solicitação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Solicitar Produto - SuperLoja"
        description="Não encontrou o produto que procura? Solicite e nós encontraremos para você!"
        keywords="solicitar produto, pedido especial, produto personalizado"
      />
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-hero-gradient">
                <Package className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-hero-gradient bg-clip-text text-transparent">
                Solicitar Produto
              </h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Não encontrou o produto que procura? Solicite e nós tentaremos encontrar para você!
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Formulário de Solicitação
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Produto *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: iPhone 15 Pro Max"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="Ex: Smartphones, Laptops, etc."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o produto que você está procurando: especificações, cor, modelo, etc."
                    className="min-h-[100px]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated_price">Faixa de Preço (Kz)</Label>
                  <Input
                    id="estimated_price"
                    type="number"
                    value={formData.estimated_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimated_price: e.target.value }))}
                    placeholder="Ex: 1500"
                  />
                </div>

                {/* Contact Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Telefone *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        +244
                      </span>
                      <Input
                        id="contact_phone"
                        value={formData.contact_phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                        placeholder="900 000 000"
                        className="pl-16"
                        pattern="^[0-9]{3}\s[0-9]{3}\s[0-9]{3}$"
                        title="Formato: 900 000 000"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Email para Contato</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-4">
                  <Label>Imagens de Referência (máximo 5)</Label>
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
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Clique para enviar imagens ou arraste aqui</p>
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
                          <Badge variant="secondary" className="absolute bottom-1 left-1 text-xs">
                            {index + 1}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional_notes">Observações Adicionais</Label>
                  <Textarea
                    id="additional_notes"
                    value={formData.additional_notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, additional_notes: e.target.value }))}
                    placeholder="Alguma informação adicional que possa ajudar..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="min-w-32"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Solicitação
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="mt-8 bg-muted/30">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">Como funciona?</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Preencha o formulário com as informações do produto desejado</li>
                <li>• Anexe imagens de referência se possível</li>
                <li>• Nossa equipe analisará sua solicitação</li>
                <li>• Entraremos em contato em até 48 horas com disponibilidade e preço</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SolicitarProduto;