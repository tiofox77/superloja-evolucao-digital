import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileDown, 
  Search, 
  Filter, 
  Sliders, 
  Grid2X2, 
  List, 
  CheckCircle2, 
  BookOpen,
  Download,
  Image,
  FileText,
  LayoutGrid,
  Printer,
  RefreshCw,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import pdfService from '@/services/pdfService';
import { useToast } from '@/hooks/use-toast';
import SuperLojaAvatar from '@/components/SuperLojaAvatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const AdminCatalogoProdutos = () => {
  // Estado para produtos e categorias
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Estado para a geração do PDF
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdfSettings, setShowPdfSettings] = useState(false);
  
  // Configurações do catálogo
  const [catalogueSettings, setCatalogueSettings] = useState({
    title: 'Catálogo de Produtos',
    subtitle: 'Ofertas e Novidades',
    showPrices: true,
    pageSize: 'a4',
    orientation: 'portrait',
    columns: 2,
    groupByCategory: true
  });
  
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  // Efeito para limpar o URL do PDF quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Carregar produtos do Supabase
  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(id, name)
        `)
        .eq('active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setProducts(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  // Carregar categorias do Supabase
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

  // Obter a lista de produtos filtrada para o catálogo
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.categories?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        // Primeiro ordenar por categoria se agrupado
        if (catalogueSettings.groupByCategory) {
          const catA = a.categories?.name || '';
          const catB = b.categories?.name || '';
          if (catA !== catB) return catA.localeCompare(catB);
        }
        
        // Depois ordenar por nome
        return a.name.localeCompare(b.name);
      });
  }, [products, searchTerm, catalogueSettings.groupByCategory]);

  // Selecionar ou desselecionar todos os produtos
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(product => product.id));
    }
    setSelectAll(!selectAll);
  };

  // Selecionar ou desselecionar um produto individual
  const handleSelectProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
      setSelectAll(false);
    } else {
      setSelectedProducts([...selectedProducts, productId]);
      if (selectedProducts.length + 1 === filteredProducts.length) {
        setSelectAll(true);
      }
    }
  };

  // Referência para o elemento do catálogo que será convertido em PDF
  const catalogueRef = useRef<HTMLDivElement>(null);
  
  // Referência oculta para pré-renderizar o catálogo para PDF
  const hiddenCatalogueRef = useRef<HTMLDivElement>(null);
  
  // Estado para armazenar informações da loja
  const [storeInfo, setStoreInfo] = useState<any>({});
  
  // Carregar informações da loja
  useEffect(() => {
    const loadStoreInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('id', 'store_settings')
          .single();
          
        if (error) throw error;
        
        setStoreInfo(data?.value || {});
      } catch (error) {
        console.error('Erro ao carregar informações da loja:', error);
      }
    };
    
    loadStoreInfo();
  }, []);

  // Gerar PDF do catálogo
  const generateCatalogue = async () => {
    try {
      setGeneratingPdf(true);
      
      // Obter os produtos selecionados ou todos se nenhum estiver selecionado
      const productsToInclude = selectedProducts.length > 0
        ? products.filter(p => selectedProducts.includes(p.id))
        : products;
      
      if (productsToInclude.length === 0) {
        toast({
          title: "Aviso",
          description: "Nenhum produto selecionado para o catálogo."
        });
        setGeneratingPdf(false);
        return;
      }
      
      // Fechar o diálogo de configurações se estiver aberto
      setShowPdfSettings(false);
      
      // Gerar o PDF utilizando o novo layout do catálogo
      const pdfUrl = await pdfService.generateNewCatalogPdf(
        catalogueSettings,
        storeInfo,
        productsToInclude
      );
      
      setPdfUrl(pdfUrl);
      setGeneratingPdf(false);
      
      toast({
        title: "✅ Catálogo gerado!",
        description: `${productsToInclude.length} produtos incluídos no catálogo.`
      });
      
    } catch (error) {
      console.error('Erro ao gerar catálogo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o catálogo PDF.",
        variant: "destructive"
      });
      setGeneratingPdf(false);
    }
  };

  // Componente do produto no modo grid
  const ProductGridItem = ({ product }) => (
    <Card className="overflow-hidden hover-scale">
      <div className="relative">
        <div className="aspect-square relative overflow-hidden bg-gray-100">
          <SuperLojaAvatar
            src={product.image_url}
            alt={product.name}
            size="xl"
            className="object-cover transition-all hover:scale-105"
          />
          <div className="absolute top-2 right-2">
            <Checkbox
              checked={selectedProducts.includes(product.id)}
              onCheckedChange={() => handleSelectProduct(product.id)}
              className="bg-white border-2 data-[state=checked]:bg-primary"
            />
          </div>
          {product.featured && (
            <Badge className="absolute bottom-2 left-2 bg-amber-500 hover:bg-amber-600">
              Destaque
            </Badge>
          )}
          {product.discount_price && (
            <Badge className="absolute bottom-2 right-2 bg-red-500 hover:bg-red-600">
              {Math.round((1 - product.discount_price / product.price) * 100)}% OFF
            </Badge>
          )}
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold truncate">{product.name}</h3>
        <div className="flex justify-between items-center mt-2">
          {product.discount_price ? (
            <div>
              <p className="text-muted-foreground line-through text-sm">{product.price.toLocaleString('pt-AO')} Kz</p>
              <p className="font-bold text-red-600">{product.discount_price.toLocaleString('pt-AO')} Kz</p>
            </div>
          ) : (
            <p className="font-bold">{product.price?.toLocaleString('pt-AO')} Kz</p>
          )}
          <Badge variant="outline" className="border-primary text-primary">
            {product.categories?.name || "Sem categoria"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  // Componente do produto no modo lista
  const ProductListItem = ({ product }) => (
    <Card className="overflow-hidden hover:bg-accent/5 hover-scale-subtle">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <Checkbox
              checked={selectedProducts.includes(product.id)}
              onCheckedChange={() => handleSelectProduct(product.id)}
            />
          </div>
          <div className="h-16 w-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
            <SuperLojaAvatar
              src={product.image_url}
              alt={product.name}
              size="md"
              className="object-cover w-full h-full"
            />
          </div>
          <div className="flex-grow">
            <h3 className="font-semibold">{product.name}</h3>
            <div className="flex justify-between items-center mt-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-primary text-primary">
                  {product.categories?.name || "Sem categoria"}
                </Badge>
                {product.featured && (
                  <Badge className="bg-amber-500 hover:bg-amber-600">
                    Destaque
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            {product.discount_price ? (
              <div>
                <p className="text-muted-foreground line-through text-sm">{product.price?.toLocaleString('pt-AO')} Kz</p>
                <p className="font-bold text-red-600">{product.discount_price.toLocaleString('pt-AO')} Kz</p>
              </div>
            ) : (
              <p className="font-bold">{product.price?.toLocaleString('pt-AO')} Kz</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Dialog de configurações do PDF
  const PdfSettingsDialog = () => (
    <Dialog open={showPdfSettings} onOpenChange={setShowPdfSettings}>
      <DialogContent className="w-[90%] sm:w-[80%] md:w-[80%] max-w-[1200px]">
        <DialogHeader>
          <DialogTitle>Configurações do Catálogo</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
          {/* Primeira coluna - Informações básicas */}
          <div className="space-y-5 md:col-span-1">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-primary">Informações Básicas</h3>
            
              <div className="space-y-2">
                <Label htmlFor="catalogTitle">Título do Catálogo</Label>
                <Input 
                  id="catalogTitle"
                  value={catalogueSettings.title}
                  onChange={(e) => setCatalogueSettings({...catalogueSettings, title: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="catalogSubtitle">Subtítulo</Label>
                <Input 
                  id="catalogSubtitle"
                  value={catalogueSettings.subtitle}
                  onChange={(e) => setCatalogueSettings({...catalogueSettings, subtitle: e.target.value})}
                />
              </div>
              
            </div>
          </div>
          
          {/* Segunda coluna - Configurações de Layout */}
          <div className="space-y-3 md:col-span-1 row-span-2">
            <h3 className="text-sm font-medium text-primary">Configurações de Layout</h3>
            <div className="bg-muted rounded-lg p-3 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="catalogColumns">Número de Colunas</Label>
                <Select 
                  value={catalogueSettings.columns.toString()}
                  onValueChange={(value) => setCatalogueSettings({...catalogueSettings, columns: parseInt(value)})}
                >
                  <SelectTrigger id="catalogColumns">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Coluna</SelectItem>
                    <SelectItem value="2">2 Colunas</SelectItem>
                    <SelectItem value="3">3 Colunas</SelectItem>
                    <SelectItem value="4">4 Colunas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="catalogOrientation">Orientação</Label>
                <Select 
                  value={catalogueSettings.orientation}
                  onValueChange={(value) => setCatalogueSettings({...catalogueSettings, orientation: value})}
                >
                  <SelectTrigger id="catalogOrientation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Retrato</SelectItem>
                    <SelectItem value="landscape">Paisagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="pt-2">
              <div className="flex items-center gap-1">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => generateCatalogue()}
                >
                  <Printer className="h-4 w-4 mr-1" /> Gerar PDF
                </Button>
                <Button 
                  size="sm" 
                  variant="default" 
                  className="flex-1"
                  onClick={() => {
                    setShowPdfSettings(false);
                    generateCatalogue();
                  }}
                >
                  <Download className="h-4 w-4 mr-1" /> Baixar
                </Button>
              </div>
            </div>
          </div>
          
          {/* Terceira coluna - Configurações de página */}
          <div className="space-y-5 md:col-span-1">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-primary">Formato do Documento</h3>
            
              <div className="space-y-2">
                <Label htmlFor="pageSize">Tamanho da Página</Label>
                <Select 
                  value={catalogueSettings.pageSize}
                  onValueChange={(value) => setCatalogueSettings({...catalogueSettings, pageSize: value})}
                >
                  <SelectTrigger id="pageSize">
                    <SelectValue placeholder="Selecionar tamanho" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a4">A4</SelectItem>
                    <SelectItem value="letter">Carta</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="orientation">Orientação</Label>
                <Select 
                  value={catalogueSettings.orientation}
                  onValueChange={(value) => setCatalogueSettings({...catalogueSettings, orientation: value})}
                >
                  <SelectTrigger id="orientation">
                    <SelectValue placeholder="Selecionar orientação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Retrato</SelectItem>
                    <SelectItem value="landscape">Paisagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="columns">Colunas por Página</Label>
                <Select 
                  value={catalogueSettings.columns.toString()}
                  onValueChange={(value) => setCatalogueSettings({...catalogueSettings, columns: parseInt(value)})}
                >
                  <SelectTrigger id="columns">
                    <SelectValue placeholder="Selecionar número de colunas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Coluna</SelectItem>
                    <SelectItem value="2">2 Colunas</SelectItem>
                    <SelectItem value="3">3 Colunas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Terceira coluna - Opções de conteúdo */}
          <div className="space-y-5 md:col-span-1">
            <div className="space-y-3 bg-slate-50 p-3 rounded-md">
              <h3 className="text-sm font-medium text-primary">Opções de Conteúdo</h3>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showPrices"
                    checked={catalogueSettings.showPrices}
                    onCheckedChange={(checked) => setCatalogueSettings({...catalogueSettings, showPrices: checked})}
                  />
                  <Label htmlFor="showPrices">Mostrar Preços</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="groupByCategory"
                    checked={catalogueSettings.groupByCategory}
                    onCheckedChange={(checked) => setCatalogueSettings({...catalogueSettings, groupByCategory: checked})}
                  />
                  <Label htmlFor="groupByCategory">Agrupar por Categoria</Label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Rodapé com botões */}
          <div className="flex justify-end gap-2 md:col-span-3 pt-4 mt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setShowPdfSettings(false)} className="px-6">
              <FileText className="w-4 h-4 mr-2" /> Cancelar
            </Button>
            <Button onClick={() => {
              setShowPdfSettings(false);
              generateCatalogue();
            }} className="px-6">
              <Download className="w-4 h-4 mr-2" /> Gerar Catálogo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Catálogo de Produtos
          </h1>
          <p className="text-muted-foreground">
            Gere catálogos promocionais em PDF dos seus produtos
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPdfSettings(true)}
            disabled={generatingPdf}
            className="flex items-center gap-1"
          >
            <Settings className="w-4 h-4" />
            Configurar
          </Button>
          
          <Button 
            onClick={generateCatalogue} 
            disabled={generatingPdf}
            className="hero-gradient hover:scale-105 transition-transform"
          >
            {generatingPdf ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                A gerar PDF...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 mr-2" />
                Gerar Catálogo
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover-scale border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Produtos</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <LayoutGrid className="w-4 h-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categorias</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Selecionados</p>
                <p className="text-2xl font-bold">{selectedProducts.length}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Catálogo</p>
                <p className="text-lg font-bold">Produtos</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de filtro e layout */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center md:w-1/2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Procurar produtos..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <Checkbox
              id="selectAll"
              checked={selectAll}
              onCheckedChange={handleSelectAll}
              className="mr-2"
            />
            <Label htmlFor="selectAll" className="text-sm cursor-pointer">
              {selectAll ? 'Desselecionar' : 'Selecionar'} todos
            </Label>
          </div>
          

          
          <div className="ml-4 flex items-center rounded-md bg-muted p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('grid')}
            >
              <Grid2X2 className="h-4 w-4" />
              <span className="sr-only">Grid view</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
              <span className="sr-only">List view</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de produtos */}
      {filteredProducts.length > 0 ? (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            : "space-y-2"
        }>
          {filteredProducts.map((product) => (
            viewMode === 'grid' 
              ? <ProductGridItem key={product.id} product={product} />
              : <ProductListItem key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Image className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-xl">Nenhum produto encontrado</h3>
          <p className="text-muted-foreground">
            Tente ajustar os filtros ou adicionar novos produtos.
          </p>
        </div>
      )}

      {/* Botão de download de PDF (visível apenas quando o PDF estiver pronto) */}
      {pdfUrl && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button 
            className="shadow-lg bg-green-600 hover:bg-green-700 text-white"
            onClick={() => {
              // Abre o PDF numa nova aba
              window.open(pdfUrl, '_blank');
              
              toast({
                title: "PDF aberto",
                description: "O seu catálogo foi aberto numa nova aba."
              });
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar Catálogo PDF
          </Button>
        </div>
      )}

      {/* Dialog de configurações do PDF */}
      <PdfSettingsDialog />
    </div>
  );
};

export default AdminCatalogoProdutos;
