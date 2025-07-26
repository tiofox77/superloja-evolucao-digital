import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FolderOpen, 
  Package, 
  ChevronRight,
  Folder,
  FileText
} from 'lucide-react';
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
          parent:parent_id(name),
          subcategories:categories!parent_id(*)
        `)
        .order('name');
      
      if (error) throw error;
      
      // Organizar em hierarquia e contar produtos
      const categoriesWithCount = await Promise.all(
        (data || []).map(async (category) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id);

          // Se é uma categoria pai, contar produtos das subcategorias também
          let totalCount = count || 0;
          if (category.subcategories && Array.isArray(category.subcategories) && category.subcategories.length > 0) {
            for (const subcat of category.subcategories) {
              const { count: subCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('category_id', subcat.id);
              totalCount += subCount || 0;
            }
          }
          
          return {
            ...category,
            productCount: count || 0,
            totalProductCount: totalCount
          };
        })
      );

      // Separar categorias principais e subcategorias
      const mainCategories = categoriesWithCount.filter(cat => !cat.parent_id);
      const organized = mainCategories.map(main => ({
        ...main,
        subcategories: categoriesWithCount.filter(cat => cat.parent_id === main.id) || []
      }));

      setCategories(organized);
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

  const handleDelete = async (categoryId: string, hasSubcategories = false) => {
    const message = hasSubcategories 
      ? 'Esta categoria possui subcategorias. Tem certeza que deseja excluí-la? Todas as subcategorias e produtos vinculados serão desvinculados.'
      : 'Tem certeza que deseja excluir esta categoria? Todos os produtos vinculados serão desvinculados.';
    
    if (!confirm(message)) return;

    try {
      // First, unlink products from this category and subcategories
      await supabase
        .from('products')
        .update({ category_id: null })
        .eq('category_id', categoryId);

      // If has subcategories, also unlink their products and delete them
      if (hasSubcategories) {
        const { data: subcategories } = await supabase
          .from('categories')
          .select('id')
          .eq('parent_id', categoryId);

        if (subcategories) {
          for (const subcat of subcategories) {
            await supabase
              .from('products')
              .update({ category_id: null })
              .eq('category_id', subcat.id);
          }

          await supabase
            .from('categories')
            .delete()
            .eq('parent_id', categoryId);
        }
      }

      // Then delete the main category
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

  const handleCreateSubcategory = (parentCategory) => {
    setEditingCategory({ parent_id: parentCategory.id, isSubcategory: true });
    setShowForm(true);
  };

  const getTotalCategories = () => {
    return categories.reduce((total, cat) => total + 1 + (cat.subcategories?.length || 0), 0);
  };

  const getTotalProducts = () => {
    return categories.reduce((total, cat) => total + (cat.totalProductCount || 0), 0);
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.subcategories && category.subcategories.some(sub => 
      sub.name.toLowerCase().includes(searchTerm.toLowerCase())
    ))
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
            Categorias e Subcategorias
          </h1>
          <p className="text-muted-foreground">Organize seus produtos em uma estrutura hierárquica</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover-scale border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Categorias</p>
                <p className="text-2xl font-bold">{getTotalCategories()}</p>
              </div>
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <FolderOpen className="w-4 h-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Principais</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Folder className="w-4 h-4 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Subcategorias</p>
                <p className="text-2xl font-bold">
                  {categories.reduce((total, cat) => total + (cat.subcategories?.length || 0), 0)}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="w-4 h-4 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Produtos</p>
                <p className="text-2xl font-bold">{getTotalProducts()}</p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Package className="w-4 h-4 text-orange-500" />
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

      {/* Categories Hierarchy */}
      <div className="space-y-4">
        {filteredCategories.map((category, index) => (
          <Card key={category.id} className="animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value={category.id} className="border-none">
                <div className="p-6">
                  {/* Main Category Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <AccordionTrigger className="hover:no-underline p-0 h-auto">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <FolderOpen className="w-6 h-6 text-primary" />
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-semibold">{category.name}</h3>
                              <Badge variant="outline" className="bg-primary/10">
                                Principal
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {category.description || 'Sem descrição'}
                            </p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {category.subcategories?.length || 0} subcategoria{(category.subcategories?.length || 0) !== 1 ? 's' : ''}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {category.totalProductCount} produto{category.totalProductCount !== 1 ? 's' : ''} total
                              </span>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCreateSubcategory(category)}
                        className="hover:bg-blue-50 hover:text-blue-600 border-blue-200"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Subcategoria
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="hover:bg-primary hover:text-primary-foreground transition-colors"
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
                        onClick={() => handleDelete(category.id, category.subcategories?.length > 0)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Subcategories */}
                  <AccordionContent className="pt-4 border-t">
                    {category.subcategories && category.subcategories.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {category.subcategories.map((subcategory) => (
                          <Card key={subcategory.id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{subcategory.name}</h4>
                                    <Badge variant="secondary" className="text-xs mt-1">
                                      {subcategory.productCount} produto{subcategory.productCount !== 1 ? 's' : ''}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              
                              {subcategory.description && (
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                  {subcategory.description}
                                </p>
                              )}

                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="flex-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                                  onClick={() => {
                                    setEditingCategory(subcategory);
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
                                  onClick={() => handleDelete(subcategory.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhuma subcategoria criada</p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => handleCreateSubcategory(category)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Criar primeira subcategoria
                        </Button>
                      </div>
                    )}
                  </AccordionContent>
                </div>
              </AccordionItem>
            </Accordion>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCategory?.isSubcategory 
                ? 'Nova Subcategoria' 
                : editingCategory?.id 
                  ? 'Editar Categoria' 
                  : 'Nova Categoria'
              }
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