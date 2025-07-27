import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Eye, Star, Grid2X2, List, Filter, Power, PowerOff, FileDown, Facebook } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProductForm } from '@/components/ProductForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SuperLojaAvatar from '@/components/SuperLojaAvatar';
import { useNavigate } from 'react-router-dom';

const AdminProdutos = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all', // 'all', 'active', 'inactive'
    featured: 'all', // 'all', 'featured', 'not_featured'
    stock: 'all' // 'all', 'in_stock', 'out_of_stock'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Produto excluído!",
        description: "Produto removido com sucesso."
      });

      loadProducts();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleToggleActive = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ active: !currentStatus })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: !currentStatus ? "Produto ativado!" : "Produto desativado!",
        description: `Produto ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`
      });

      loadProducts();
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
    setEditingProduct(null);
    loadProducts();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0
    }).format(price);
  };

  const filteredProducts = products.filter(product => {
    // Search filter
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = filters.category === 'all' || product.category_id === filters.category;
    
    // Status filter
    const matchesStatus = filters.status === 'all' || 
      (filters.status === 'active' && product.active !== false) ||
      (filters.status === 'inactive' && product.active === false);
    
    // Featured filter
    const matchesFeatured = filters.featured === 'all' ||
      (filters.featured === 'featured' && product.featured) ||
      (filters.featured === 'not_featured' && !product.featured);
    
    // Stock filter
    const matchesStock = filters.stock === 'all' ||
      (filters.stock === 'in_stock' && product.in_stock) ||
      (filters.stock === 'out_of_stock' && !product.in_stock);
    
    return matchesSearch && matchesCategory && matchesStatus && matchesFeatured && matchesStock;
  });

  const resetFilters = () => {
    setFilters({
      category: 'all',
      status: 'all',
      featured: 'all',
      stock: 'all'
    });
    setSearchTerm('');
  };

  const exportToFacebookCatalog = () => {
    try {
      // Preparar dados no formato do Facebook Catalog
      const facebookData = filteredProducts.map(product => ({
        id: product.id,
        title: product.name,
        description: product.description || '',
        availability: product.in_stock ? 'in stock' : 'out of stock',
        condition: 'new',
        price: `${product.price} AOA`,
        link: `${window.location.origin}/produto/${product.slug || product.id}`,
        image_link: product.image_url || '',
        brand: 'SuperLoja'
      }));

      // Criar workbook
      const wb = XLSX.utils.book_new();
      
      // Adicionar cabeçalhos obrigatórios
      const headers = [
        'Obrigatório #',
        'Obrigatório #',
        'Obrigatório #',
        'Obrigatório #',
        'Obrigatório #',
        'Obrigatório #',
        'Obrigatório #',
        'Obrigatório #'
      ];
      
      const fieldNames = [
        'title',
        'description',
        'availability',
        'condition',
        'price',
        'link',
        'image_link',
        'brand'
      ];

      // Criar dados para a planilha
      const worksheetData = [
        headers,
        fieldNames,
        ...facebookData.map(product => [
          product.title,
          product.description,
          product.availability,
          product.condition,
          product.price,
          product.link,
          product.image_link,
          product.brand
        ])
      ];

      // Criar worksheet
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Catálogo Facebook');

      // Exportar arquivo
      const fileName = `catalogo-facebook-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Exportação concluída!",
        description: `Arquivo ${fileName} foi baixado com ${facebookData.length} produtos.`
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível exportar o catálogo.",
        variant: "destructive"
      });
    }
  };

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
            Produtos
          </h1>
          <p className="text-muted-foreground">Gerencie o catálogo de produtos</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => navigate('/admin/catalogo-produtos')}
            className="hover:scale-105 transition-transform"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Gerar Catálogo PDF
          </Button>
          <Button 
            variant="outline"
            onClick={exportToFacebookCatalog}
            className="hover:scale-105 transition-transform border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <Facebook className="w-4 h-4 mr-2" />
            Exportar Facebook XLS
          </Button>
          <Button 
            onClick={() => setShowForm(true)}
            className="hero-gradient hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover-scale border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Eye className="w-4 h-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold">{products.filter(p => p.active !== false).length}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Power className="w-4 h-4 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Destaque</p>
                <p className="text-2xl font-bold">{products.filter(p => p.featured).length}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inativos</p>
                <p className="text-2xl font-bold">{products.filter(p => p.active === false).length}</p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <PowerOff className="w-4 h-4 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <Filter className="w-4 h-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid2X2 className="w-4 h-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Categoria:</label>
            <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Status:</label>
            <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Destaque:</label>
            <Select value={filters.featured} onValueChange={(value) => setFilters({...filters, featured: value})}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="featured">Destaque</SelectItem>
                <SelectItem value="not_featured">Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Estoque:</label>
            <Select value={filters.stock} onValueChange={(value) => setFilters({...filters, stock: value})}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="in_stock">Em Estoque</SelectItem>
                <SelectItem value="out_of_stock">Fora de Estoque</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Products Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover-scale hover:shadow-lg transition-all duration-300 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-lg mb-3 overflow-hidden relative">
                  <SuperLojaAvatar 
                    src={product.image_url} 
                    alt={product.name}
                    size="xl"
                    className="w-full h-full hover:scale-105 transition-transform duration-300"
                  />
                  
                  {product.active === false && (
                    <Badge variant="secondary" className="absolute top-2 left-2">
                      Inativo
                    </Badge>
                  )}
                  
                  {product.featured && (
                    <Badge className="absolute top-2 right-2 bg-yellow-500">
                      <Star className="w-3 h-3 mr-1" />
                      Destaque
                    </Badge>
                  )}
                  
                  {product.original_price && product.original_price > product.price && (
                    <Badge variant="destructive" className="absolute bottom-2 right-2">
                      -{Math.round((1 - product.price / product.original_price) * 100)}%
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-sm line-clamp-2">{product.name}</CardTitle>
                {product.categories && (
                  <p className="text-xs text-muted-foreground">{product.categories.name}</p>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(product.price)}
                      </span>
                      {product.original_price && product.original_price > product.price && (
                        <span className="text-sm text-muted-foreground line-through ml-2">
                          {formatPrice(product.original_price)}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant={product.in_stock ? "default" : "secondary"} className="text-xs">
                        {product.in_stock ? `${product.stock_quantity || 0} unid.` : "Sem estoque"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => {
                        setEditingProduct(product);
                        setShowForm(true);
                      }}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className={product.active === false ? "text-green-600 hover:bg-green-50" : "text-orange-600 hover:bg-orange-50"}
                      onClick={() => handleToggleActive(product.id, product.active !== false)}
                    >
                      {product.active === false ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="space-y-1">
              {filteredProducts.map((product) => (
                <div key={product.id} className="flex items-center p-4 border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                  <SuperLojaAvatar 
                    src={product.image_url} 
                    alt={product.name}
                    size="md"
                    className="mr-4"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{product.name}</h4>
                      {product.active === false && (
                        <Badge variant="secondary" className="text-xs">Inativo</Badge>
                      )}
                      {product.featured && (
                        <Badge className="bg-yellow-500 text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Destaque
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {product.categories && <span>{product.categories.name}</span>}
                      <span className="font-bold text-primary">{formatPrice(product.price)}</span>
                      <Badge variant={product.in_stock ? "default" : "secondary"}>
                        {product.in_stock ? "Em estoque" : "Fora de estoque"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setEditingProduct(product);
                        setShowForm(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className={product.active === false ? "text-green-600" : "text-orange-600"}
                      onClick={() => handleToggleActive(product.id, product.active !== false)}
                    >
                      {product.active === false ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-destructive"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Eye className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Nenhum produto encontrado</p>
        </div>
      )}

      {/* Product Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingProduct(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProdutos;