import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import { 
  AlertTriangle, Package, ShoppingCart, TrendingUp, TrendingDown, 
  RefreshCw, Download, Eye, Filter, Calendar, DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  category_name?: string;
  image_url?: string;
  total_sold?: number;
  revenue?: number;
  last_sold?: string;
}

interface StockAlert {
  id: string;
  name: string;
  current_stock: number;
  min_stock: number;
  category: string;
  image_url?: string;
  price: number;
}

interface SalesData {
  period: string;
  sales: number;
  revenue: number;
}

const AdminRelatoriosProdutos = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<StockAlert[]>([]);
  const [topSellingProducts, setTopSellingProducts] = useState<Product[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('30d');
  const { toast } = useToast();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    loadReportsData();
  }, [timeRange]);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      
      // Load all products with stock info
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id, name, price, stock_quantity, image_url,
          categories!left(name)
        `)
        .eq('active', true);

      if (productsError) throw productsError;

      // Process products data
      const processedProducts = productsData?.map(product => ({
        ...product,
        category_name: product.categories?.name || 'Sem categoria'
      })) || [];

      setProducts(processedProducts);

      // Find low stock products (less than 10 items)
      const lowStock = processedProducts
        .filter(product => (product.stock_quantity || 0) < 10)
        .map(product => ({
          id: product.id,
          name: product.name,
          current_stock: product.stock_quantity || 0,
          min_stock: 10,
          category: product.category_name || 'Sem categoria',
          image_url: product.image_url,
          price: product.price
        }))
        .sort((a, b) => a.current_stock - b.current_stock);

      setLowStockProducts(lowStock);

      // Mock top selling products (since we don't have order data yet)
      const topSelling = processedProducts
        .sort(() => Math.random() - 0.5)
        .slice(0, 10)
        .map((product, index) => ({
          ...product,
          total_sold: Math.floor(Math.random() * 50) + 10,
          revenue: (Math.floor(Math.random() * 50) + 10) * product.price,
          last_sold: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        }))
        .sort((a, b) => (b.total_sold || 0) - (a.total_sold || 0));

      setTopSellingProducts(topSelling);

      // Generate mock sales data
      const salesData = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          period: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          sales: Math.floor(Math.random() * 20) + 5,
          revenue: Math.floor(Math.random() * 500000) + 100000
        };
      });

      setSalesData(salesData);

      // Generate category data
      const categoryStats = Object.entries(
        processedProducts.reduce((acc, product) => {
          const category = product.category_name || 'Sem categoria';
          if (!acc[category]) {
            acc[category] = { count: 0, revenue: 0 };
          }
          acc[category].count += 1;
          acc[category].revenue += product.price * Math.floor(Math.random() * 10);
          return acc;
        }, {} as Record<string, { count: number; revenue: number }>)
      ).map(([name, data]) => ({
        name,
        value: data.count,
        revenue: data.revenue
      }));

      setCategoryData(categoryStats);

    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: "❌ Erro ao carregar relatórios",
        description: "Não foi possível carregar os dados dos relatórios.",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart className="h-8 w-8 text-primary" />
            Relatórios de Produtos
          </h1>
          <p className="text-muted-foreground">Análises detalhadas de estoque e vendas</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadReportsData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produtos em Falta</p>
                <p className="text-2xl font-bold text-red-600">{lowStockProducts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Produtos</p>
                <p className="text-2xl font-bold text-blue-600">{products.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mais Vendidos</p>
                <p className="text-2xl font-bold text-green-600">{topSellingProducts.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatPrice(salesData.reduce((sum, day) => sum + day.revenue, 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="estoque" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="estoque">Controle de Estoque</TabsTrigger>
          <TabsTrigger value="vendas">Top Vendas</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="categorias">Por Categoria</TabsTrigger>
        </TabsList>

        {/* Estoque Tab */}
        <TabsContent value="estoque" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Produtos com Estoque Baixo (menos de 10 unidades)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Todos os produtos têm estoque adequado!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lowStockProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg bg-red-50 dark:bg-red-950/20">
                      <div className="flex items-center gap-4">
                        {product.image_url && (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        )}
                        <div>
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-sm text-muted-foreground">{product.category}</p>
                          <p className="text-sm font-medium">{formatPrice(product.price)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive" className="mb-2">
                          {product.current_stock} unidades
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          Recomendado: {product.min_stock}+ unidades
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendas Tab */}
        <TabsContent value="vendas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <TrendingUp className="h-5 w-5" />
                Produtos Mais Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topSellingProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      {product.image_url && (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <h4 className="font-semibold">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">{product.category_name}</p>
                        <p className="text-sm font-medium">{formatPrice(product.price)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="default" className="mb-1">
                        {product.total_sold} vendas
                      </Badge>
                      <p className="text-sm font-medium text-green-600">
                        {formatPrice(product.revenue || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Última venda: {new Date(product.last_sold || '').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Vendas por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="sales" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Receita por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatPrice(Number(value)), 'Receita']} />
                    <Line type="monotone" dataKey="revenue" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Categorias Tab */}
        <TabsContent value="categorias" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Produtos por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Receita por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatPrice(Number(value)), 'Receita']} />
                    <Bar dataKey="revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminRelatoriosProdutos;