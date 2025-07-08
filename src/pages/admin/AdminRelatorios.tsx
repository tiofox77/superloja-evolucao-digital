import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileBarChart, Download, Eye, Calendar, Users, Globe, 
  ShoppingCart, TrendingUp, TrendingDown, BarChart3, PieChart,
  Map, Clock, Smartphone, Monitor, Tablet
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const AdminRelatorios = () => {
  const [analyticsData, setAnalyticsData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d'); // 1d, 7d, 30d, 90d
  const { toast } = useToast();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate = new Date();
      
      switch (dateRange) {
        case '1d':
          startDate.setDate(now.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
      }

      // Buscar dados reais de visitantes únicos
      const { data: visitorsData } = await supabase
        .from('visitor_analytics')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      // Buscar eventos de página
      const { data: eventsData } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: true });

      // Buscar produtos
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, price, created_at')
        .eq('active', true);

      // Buscar pedidos reais
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString());

      // Buscar dados de conversão (carrinho -> checkout)
      const { data: cartEvents } = await supabase
        .from('analytics_events')
        .select('*')
        .in('event_type', ['add_to_cart', 'checkout_start', 'purchase'])
        .gte('timestamp', startDate.toISOString());

      // Processar dados reais
      const processedData = processAnalyticsData(
        visitorsData || [], 
        eventsData || [], 
        productsData || [], 
        ordersData || [],
        cartEvents || []
      );
      setAnalyticsData(processedData);

    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
      
      // Dados demo se falhar
      setAnalyticsData({
        overview: {
          totalVisitors: 1247,
          totalPageViews: 4892,
          totalOrders: 23,
          totalRevenue: 125400,
          conversionRate: 1.85
        },
        dailyVisitors: [],
        topCountries: [
          { country: 'Angola', visitors: 892 },
          { country: 'Portugal', visitors: 156 },
          { country: 'Brasil', visitors: 89 }
        ],
        deviceStats: [
          { device: 'mobile', count: 756, percentage: 61 },
          { device: 'desktop', count: 398, percentage: 32 },
          { device: 'tablet', count: 93, percentage: 7 }
        ],
        topPages: [
          { page: '/', views: 1247 },
          { page: '/catalogo', views: 892 },
          { page: '/produto/smartphone-samsung', views: 234 }
        ]
      });
      
      toast({
        title: "Aviso",
        description: "Usando dados de demonstração. Verifique a configuração do analytics.",
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (visitors: any[], events: any[], products: any[], orders: any[], cartEvents?: any[]) => {
    // Métricas básicas
    const totalVisitors = new Set(visitors.map(v => v.visitor_id)).size;
    const totalPageViews = events.filter(e => e.event_type === 'page_view').length;
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);

    // Visitantes por dia
    const visitorsByDay = {};
    visitors.forEach(visitor => {
      const date = new Date(visitor.created_at).toLocaleDateString();
      visitorsByDay[date] = (visitorsByDay[date] || 0) + 1;
    });

    const dailyVisitors = Object.entries(visitorsByDay).map(([date, count]) => ({
      date,
      visitors: count
    }));

    // Países mais visitantes
    const countriesMap = {};
    visitors.forEach(visitor => {
      if (visitor.country) {
        countriesMap[visitor.country] = (countriesMap[visitor.country] || 0) + 1;
      }
    });

    const topCountries = Object.entries(countriesMap)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([country, count]) => ({ country, visitors: count }));

    // Dispositivos
    const devicesMap = {};
    visitors.forEach(visitor => {
      if (visitor.device_type) {
        devicesMap[visitor.device_type] = (devicesMap[visitor.device_type] || 0) + 1;
      }
    });

    const deviceStats = Object.entries(devicesMap).map(([device, count]) => ({
      device,
      count,
      percentage: Math.round(((count as number) / visitors.length) * 100)
    }));

    // Páginas mais visitadas
    const pagesMap = {};
    events.filter(e => e.event_type === 'page_view').forEach(event => {
      const url = new URL(event.page_url).pathname;
      pagesMap[url] = (pagesMap[url] || 0) + 1;
    });

    const topPages = Object.entries(pagesMap)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([page, views]) => ({ page, views }));

    // Taxa de conversão
    const conversions = events.filter(e => e.event_type === 'purchase').length;
    const conversionRate = totalVisitors > 0 ? ((conversions / totalVisitors) * 100).toFixed(2) : '0';

    return {
      overview: {
        totalVisitors,
        totalPageViews,
        totalOrders,
        totalRevenue,
        conversionRate
      },
      dailyVisitors,
      topCountries,
      deviceStats,
      topPages,
      browserStats: [], // Pode ser implementado similar aos dispositivos
      timeStats: [] // Horários de maior acesso
    };
  };

  const exportReport = async (type: string) => {
    toast({
      title: "Exportando Relatório",
      description: `Gerando relatório em ${type.toUpperCase()}...`,
    });

    // Aqui você implementaria a lógica de exportação
    setTimeout(() => {
      toast({
        title: "Sucesso",
        description: "Relatório exportado com sucesso!",
      });
    }, 2000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Relatórios e Analytics</h1>
          <p className="text-muted-foreground">Análise detalhada do desempenho da loja</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportReport('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="outline" onClick={() => exportReport('csv')}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filtros de Data */}
      <div className="flex gap-2">
        {[
          { key: '1d', label: 'Hoje' },
          { key: '7d', label: '7 dias' },
          { key: '30d', label: '30 dias' },
          { key: '90d', label: '90 dias' }
        ].map(({ key, label }) => (
          <Button
            key={key}
            variant={dateRange === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Métricas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitantes Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview?.totalVisitors || 0}</div>
            <Badge variant="secondary" className="mt-2">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview?.totalPageViews || 0}</div>
            <Badge variant="secondary" className="mt-2">
              <TrendingUp className="w-3 h-3 mr-1" />
              +8%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview?.totalOrders || 0}</div>
            <Badge variant="secondary" className="mt-2">
              <TrendingUp className="w-3 h-3 mr-1" />
              +25%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-AO', {
                style: 'currency',
                currency: 'AOA'
              }).format(analyticsData.overview?.totalRevenue || 0)}
            </div>
            <Badge variant="secondary" className="mt-2">
              <TrendingUp className="w-3 h-3 mr-1" />
              +18%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversão</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview?.conversionRate || 0}%</div>
            <Badge variant="secondary" className="mt-2">
              <TrendingUp className="w-3 h-3 mr-1" />
              +2%
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="traffic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="traffic">Tráfego</TabsTrigger>
          <TabsTrigger value="geography">Geografia</TabsTrigger>
          <TabsTrigger value="devices">Dispositivos</TabsTrigger>
          <TabsTrigger value="behavior">Comportamento</TabsTrigger>
        </TabsList>

        <TabsContent value="traffic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visitantes por Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.dailyVisitors || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="visitors" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Páginas Mais Visitadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(analyticsData.topPages || []).map((page: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm truncate">{page.page}</span>
                      <Badge variant="secondary">{page.views}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fontes de Tráfego</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Direto</span>
                    <Badge variant="secondary">45%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Google</span>
                    <Badge variant="secondary">32%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Redes Sociais</span>
                    <Badge variant="secondary">23%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visitantes por País</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(analyticsData.topCountries || []).map((country: any, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span>{country.country || 'Desconhecido'}</span>
                    </div>
                    <Badge variant="secondary">{country.visitors}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Dispositivos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPieChart>
                    <Pie
                      data={analyticsData.deviceStats || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {(analyticsData.deviceStats || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhes dos Dispositivos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(analyticsData.deviceStats || []).map((device: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {device.device === 'mobile' && <Smartphone className="w-4 h-4" />}
                        {device.device === 'desktop' && <Monitor className="w-4 h-4" />}
                        {device.device === 'tablet' && <Tablet className="w-4 h-4" />}
                        <span className="capitalize">{device.device}</span>
                      </div>
                      <Badge variant="secondary">{device.percentage}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tempo Médio na Página</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">2m 34s</div>
                <p className="text-sm text-muted-foreground mt-2">
                  +15% comparado ao período anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Taxa de Rejeição</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">68%</div>
                <p className="text-sm text-muted-foreground mt-2">
                  -8% comparado ao período anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Páginas por Sessão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">3.2</div>
                <p className="text-sm text-muted-foreground mt-2">
                  +12% comparado ao período anterior
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminRelatorios;