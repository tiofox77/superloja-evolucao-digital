import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Save, Loader2 } from 'lucide-react';

interface CategoryFormProps {
  category?: any;
  onSave: () => void;
  onCancel: () => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({ category, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    parent_id: null as string | null,
    icon: ''
  });
  const [parentCategories, setParentCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Carregar categorias pai disponíveis
    const loadParentCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name')
        .is('parent_id', null)
        .order('name');
      
      setParentCategories(data || []);
    };

    loadParentCategories();

    if (category) {
      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        description: category.description || '',
        image_url: category.image_url || '',
        parent_id: category.parent_id || null,
        icon: category.icon || ''
      });
    }
  }, [category]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/[\s-]+/g, '-');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name)
    });
  };

  const uploadImage = async (file: File) => {
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `category-${Date.now()}.${fileExt}`;
      const filePath = `categories/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = formData.image_url;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const categoryData = {
        ...formData,
        image_url: imageUrl
      };

      let error;
      if (category) {
        ({ error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', category.id));
      } else {
        ({ error } = await supabase
          .from('categories')
          .insert([categoryData]));
      }

      if (error) throw error;

      toast({
        title: category ? "Categoria atualizada!" : "Categoria criada!",
        description: `${formData.name} foi ${category ? 'atualizada' : 'criada'} com sucesso.`
      });

      onSave();
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

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{category ? 'Editar Categoria' : 'Nova Categoria'}</span>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome da Categoria</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="Ex: Eletrônicos"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({...formData, slug: e.target.value})}
                placeholder="Ex: eletronicos"
                required
              />
            </div>
          </div>

          {/* Categoria Pai */}
          <div>
            <Label htmlFor="parent_id">Categoria Pai (opcional)</Label>
            <Select value={formData.parent_id || 'none'} onValueChange={(value) => 
              setFormData({...formData, parent_id: value === 'none' ? null : value})
            }>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria pai" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-lg z-50">
                <SelectItem value="none">Nenhuma (categoria principal)</SelectItem>
                {parentCategories
                  .filter(cat => !category || cat.id !== category.id) // Evita self-reference
                  .map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Deixe vazio para criar uma categoria principal
            </p>
          </div>

          {/* Ícone */}
          <div>
            <Label htmlFor="icon">Ícone (opcional)</Label>
            <Select value={formData.icon || 'none'} onValueChange={(value) => 
              setFormData({...formData, icon: value === 'none' ? '' : value})
            }>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um ícone" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-lg z-50">
                <SelectItem value="none">Nenhum ícone</SelectItem>
                <SelectItem value="heart">❤️ Coração</SelectItem>
                <SelectItem value="user">👤 Usuário</SelectItem>
                <SelectItem value="home">🏠 Casa</SelectItem>
                <SelectItem value="sparkles">✨ Brilho</SelectItem>
                <SelectItem value="leaf">🍃 Folha</SelectItem>
                <SelectItem value="package">📦 Pacote</SelectItem>
                <SelectItem value="phone">📱 Telefone</SelectItem>
                <SelectItem value="laptop">💻 Laptop</SelectItem>
                <SelectItem value="headphones">🎧 Fones</SelectItem>
                <SelectItem value="gamepad">🎮 Jogos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Descreva esta categoria..."
              rows={3}
            />
          </div>

          <div>
            <Label>Imagem da Categoria</Label>
            <div className="mt-2 space-y-2">
              {formData.image_url && (
                <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                  <img 
                    src={formData.image_url} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                    }
                  }}
                  className="flex-1"
                />
                {uploadingImage && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
              </div>
              
              {imageFile && (
                <p className="text-sm text-green-600">
                  ✓ Nova imagem selecionada: {imageFile.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              {category ? 'Atualizar' : 'Criar'} Categoria
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};