import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Edit, Trash2, FolderOpen, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CategoryForm } from '@/components/CategoryForm';

const AdminCategorias = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          products (count)
        `)
        .order('name');
      
      if (error) throw error;
      
      // Count products for each category
      const categoriesWithCount = await Promise.all(
        (data || []).map(async (category) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id);
          
          return {
            ...category,
            productCount: count || 0
          };
        })
      );

      setCategories(categoriesWithCount);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria? Todos os produtos vinculados serão desvinculados.')) return;

    try {
      // First, unlink products from this category
      await supabase
        .from('products')
        .update({ category_id: null })
        .eq('category_id', categoryId);

      // Then delete the category
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: "Categoria excluída!",
        description: "Categoria removida com sucesso."
      });

      loadCategories();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingCategory(null);
    loadCategories();
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Categorias
          </h1>
          <p className="text-muted-foreground">Organize seus produtos por categoria</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="hero-gradient hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover-scale border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <FolderOpen className="w-4 h-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Com Produtos</p>
                <p className="text-2xl font-bold">{categories.filter(c => c.productCount > 0).length}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Package className="w-4 h-4 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Produtos</p>
                <p className="text-2xl font-bold">{categories.reduce((sum, c) => sum + c.productCount, 0)}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="w-4 h-4 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar categorias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category, index) => (
          <Card key={category.id} className="hover-scale hover:shadow-lg transition-all duration-300 animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
            <CardHeader className="pb-3">
              {category.image_url && (
                <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-lg mb-3 overflow-hidden">
                  <img 
                    src={category.image_url} 
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {category.description || 'Sem descrição'}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">
                  {category.productCount} produto{category.productCount !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => {
                    setEditingCategory(category);
                    setShowForm(true);
                  }}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Editar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => handleDelete(category.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Nenhuma categoria encontrada</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Tente ajustar o termo de busca' : 'Crie sua primeira categoria para organizar os produtos'}
          </p>
        </div>
      )}

      {/* Category Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>
          <CategoryForm
            category={editingCategory}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingCategory(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCategorias;