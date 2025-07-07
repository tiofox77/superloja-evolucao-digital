import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ShoppingBag, 
  Users, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Eye, 
  MapPin, 
  Clock,
  Bot,
  Sparkles,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import QuickActions from './QuickActions';

interface DashboardStats {
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  totalRevenue: number;
  onlineUsers: number;
  todayVisitors: number;
  todayOrders: number;
  todayRevenue: number;
  monthlyGrowth: number;
  topLocations: { country: string; visitors: number }[];
  recentOrders: any[];
  salesChart: { date: string; revenue: number; orders: number }[];
  categoryDistribution: { name: string; value: number; color: string }[];
}

interface AIInsight {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
  action?: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalRevenue: 0,
    onlineUsers: 0,
    todayVisitors: 0,
    todayOrders: 0,
    todayRevenue: 0,
    monthlyGrowth: 0,
    topLocations: [],
    recentOrders: [],
    salesChart: [],
    categoryDistribution: []
  });
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
    generateAIInsights();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Load basic stats
      const [productsResult, usersResult, ordersResult, analyticsResult] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total_amount, created_at, customer_name, order_status').order('created_at', { ascending: false }),
        supabase.from('visitor_analytics').select('*').gte('created_at', thirtyDaysAgo)
      ]);

      const orders = ordersResult.data || [];
      const analytics = analyticsResult.data || [];
      
      // Calculate stats
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const todayOrders = orders.filter(order => 
        new Date(order.created_at).toDateString() === new Date().toDateString()
      );
      const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      
      // Analytics data
      const todayVisitors = analytics.filter(visit => 
        new Date(visit.created_at).toDateString() === new Date().toDateString()
      ).length;

      // Online users (last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const onlineUsers = analytics.filter(visit => 
        new Date(visit.created_at) > fiveMinutesAgo
      ).length;

      // Top locations
      const locationCounts = analytics.reduce((acc: any, visit) => {
        const country = visit.country || 'Unknown';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {});
      
      const topLocations = Object.entries(locationCounts)
        .map(([country, visitors]) => ({ country, visitors: visitors as number }))
        .sort((a, b) => b.visitors - a.visitors)
        .slice(0, 5);

      // Sales chart data (last 7 days)
      const salesChart = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const dayOrders = orders.filter(order => 
          order.created_at.startsWith(dateStr)
        );
        const dayRevenue = dayOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
        
        salesChart.push({
          date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          revenue: dayRevenue,
          orders: dayOrders.length
        });
      }

      // Category distribution (mock data for now)
      const categoryDistribution = [
        { name: 'Eletrônicos', value: 45, color: COLORS[0] },
        { name: 'Roupas', value: 30, color: COLORS[1] },
        { name: 'Casa', value: 15, color: COLORS[2] },
        { name: 'Esportes', value: 10, color: COLORS[3] }
      ];

      setStats({
        totalOrders: orders.length,
        totalUsers: usersResult.count || 0,
        totalProducts: productsResult.count || 0,
        totalRevenue,
        onlineUsers,
        todayVisitors,
        todayOrders: todayOrders.length,
        todayRevenue,
        monthlyGrowth: 12.5, // Mock data
        topLocations,
        recentOrders: orders.slice(0, 5),
        salesChart,
        categoryDistribution
      });

    } catch (error) {
      console.error('Dashboard stats error:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as estatísticas do dashboard.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analytics-ai', {
        body: {}
      });

      if (error) throw error;

      if (data?.recommendations) {
        // Convert recommendations to insights format
        const insights = data.recommendations.map((rec: any, index: number) => ({
          id: `ai-${Date.now()}-${index}`,
          type: rec.priority === 'high' ? 'warning' : 'info',
          title: rec.title,
          message: rec.description,
          action: rec.actions?.[0] || 'Ver Detalhes'
        }));
        
        setAiInsights(insights);
      } else {
        // Fallback to mock insights
        setAiInsights(getMockInsights());
      }
    } catch (error) {
      console.error('AI insights error:', error);
      setAiInsights(getMockInsights());
    } finally {
      setAiLoading(false);
    }
  };

  const getMockInsights = () => [
    {
      id: 'mock-1',
      type: 'success' as const,
      title: 'Vendas em Alta',
      message: 'Suas vendas aumentaram 25% esta semana comparado à semana anterior.',
      action: 'Ver Relatório Detalhado'
    },
    {
      id: 'mock-2',
      type: 'warning' as const,
      title: 'Estoque Baixo',
      message: '3 produtos estão com estoque baixo e podem esgotar em breve.',
      action: 'Gerenciar Estoque'
    },
    {
      id: 'mock-3',
      type: 'info' as const,
      title: 'Novo Mercado',
      message: 'Detectamos um aumento de visitantes de Luanda. Considere campanhas específicas.',
      action: 'Ver Analytics'
    }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'warning': return <Activity className="w-4 h-4 text-orange-600" />;
      default: return <Bot className="w-4 h-4 text-blue-600" />;
    }
  };

  const getInsightBadgeVariant = (type: string) => {
    switch (type) {
      case 'success': return 'default';
      case 'warning': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Avançado</h1>
          <p className="text-muted-foreground">Visão completa da sua loja online</p>
        </div>
        <Button onClick={loadDashboardData} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</div>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +{stats.monthlyGrowth}% este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.todayOrders} hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Online</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onlineUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalUsers} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitantes Hoje</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayVisitors}</div>
            <p className="text-xs text-muted-foreground">
              {formatPrice(stats.todayRevenue)} vendido
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Vendas dos Últimos 7 Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.salesChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? formatPrice(value as number) : value,
                    name === 'revenue' ? 'Receita' : 'Pedidos'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Distribuição por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={stats.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                >
                  {stats.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Porcentagem']} />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-4">
              {stats.categoryDistribution.map((item, index) => (
                <div key={index} className="flex items-center gap-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights & Location Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Insights IA
              {aiLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiInsights.map((insight) => (
              <div key={insight.id} className="p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{insight.title}</h4>
                      <Badge variant={getInsightBadgeVariant(insight.type)}>
                        {insight.type === 'success' ? 'Positivo' : 
                         insight.type === 'warning' ? 'Atenção' : 'Info'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{insight.message}</p>
                    {insight.action && (
                      <Button size="sm" variant="outline">
                        {insight.action}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <Button 
              onClick={generateAIInsights} 
              className="w-full" 
              variant="outline"
              disabled={aiLoading}
            >
              <Bot className="w-4 h-4 mr-2" />
              Gerar Novos Insights
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Top Localizações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.topLocations.map((location, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {index + 1}
                  </div>
                  <span className="font-medium">{location.country}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{location.visitors}</div>
                  <div className="text-xs text-muted-foreground">visitantes</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pedidos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentOrders.map((order, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{order.customer_name || 'Cliente Anônimo'}</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatPrice(order.total_amount)}</div>
                  <Badge variant={order.order_status === 'completed' ? 'default' : 'secondary'}>
                    {order.order_status === 'completed' ? 'Concluído' : 'Pendente'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
};

export default AdminDashboard;