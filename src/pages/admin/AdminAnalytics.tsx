import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Users, Eye, MousePointerClick, Clock, Globe, Smartphone, Monitor, RefreshCw } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';

interface AnalyticsData {
  totalVisitors: number;
  uniqueVisitors: number;
  pageViews: number;
  avgSessionDuration: string;
  bounceRate: number;
  topCountries: Array<{ country: string; count: number; percentage: number }>;
  deviceBreakdown: Array<{ device: string; count: number; percentage: number }>;
  topPages: Array<{ page: string; views: number }>;
  trafficSources: Array<{ source: string; medium: string; count: number; percentage: number }>;
  hourlyData: Array<{ hour: string; visitors: number }>;
  dailyData: Array<{ date: string; visitors: number; pageViews: number }>;
  events: Array<{ eventType: string; count: number }>;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

export const AdminAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    from: startOfDay(subDays(new Date(), 30)),
    to: endOfDay(new Date())
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const fromDate = dateRange.from.toISOString();
      const toDate = dateRange.to.toISOString();

      // Fetch visitors data
      const { data: visitors, error: visitorsError } = await supabase
        .from('visitor_analytics')
        .select('*')
        .gte('created_at', fromDate)
        .lte('created_at', toDate);

      if (visitorsError) throw visitorsError;

      // Fetch events data
      const { data: events, error: eventsError } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('timestamp', fromDate)
        .lte('timestamp', toDate);

      if (eventsError) throw eventsError;

      // Process data
      const processedData = processAnalyticsData(visitors || [], events || []);
      setAnalyticsData(processedData);

    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (visitors: any[], events: any[]): AnalyticsData => {
    // Basic metrics
    const totalVisitors = visitors.length;
    const uniqueVisitors = new Set(visitors.map(v => v.visitor_id)).size;
    const pageViews = events.filter(e => e.event_type === 'page_view').length;

    // Traffic sources
    const trafficSourceEvents = events.filter(e => e.event_type === 'traffic_source');
    const trafficSources = processTrafficSources(trafficSourceEvents);

    // Top countries
    const countryMap = new Map();
    visitors.forEach(v => {
      const country = v.country || 'Unknown';
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    });
    const topCountries = Array.from(countryMap.entries())
      .map(([country, count]) => ({
        country,
        count,
        percentage: Math.round((count / totalVisitors) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Device breakdown
    const deviceMap = new Map();
    visitors.forEach(v => {
      const device = v.device_type || 'Unknown';
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
    });
    const deviceBreakdown = Array.from(deviceMap.entries())
      .map(([device, count]) => ({
        device: device === 'mobile' ? 'Mobile' : device === 'tablet' ? 'Tablet' : 'Desktop',
        count,
        percentage: Math.round((count / totalVisitors) * 100)
      }));

    // Top pages
    const pageMap = new Map();
    events.filter(e => e.event_type === 'page_view').forEach(e => {
      const url = new URL(e.page_url);
      const page = url.pathname;
      pageMap.set(page, (pageMap.get(page) || 0) + 1);
    });
    const topPages = Array.from(pageMap.entries())
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Session duration calculation
    const sessionDurations = events.filter(e => e.event_type === 'session_duration');
    const avgDuration = sessionDurations.length > 0 
      ? sessionDurations.reduce((sum, e) => sum + (e.event_data?.duration || 0), 0) / sessionDurations.length
      : 0;
    const avgSessionDuration = formatDuration(avgDuration);

    // Bounce rate (sessions with only one page view)
    const sessionPageViews = new Map();
    events.filter(e => e.event_type === 'page_view').forEach(e => {
      const sessionId = e.session_id;
      sessionPageViews.set(sessionId, (sessionPageViews.get(sessionId) || 0) + 1);
    });
    const singlePageSessions = Array.from(sessionPageViews.values()).filter(count => count === 1).length;
    const bounceRate = sessionPageViews.size > 0 ? Math.round((singlePageSessions / sessionPageViews.size) * 100) : 0;

    // Hourly data
    const hourlyMap = new Map();
    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i, 0);
    }
    visitors.forEach(v => {
      const hour = new Date(v.created_at).getHours();
      hourlyMap.set(hour, hourlyMap.get(hour) + 1);
    });
    const hourlyData = Array.from(hourlyMap.entries())
      .map(([hour, visitors]) => ({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        visitors
      }));

    // Daily data
    const dailyMap = new Map();
    const dayPageViewMap = new Map();
    
    visitors.forEach(v => {
      const date = format(new Date(v.created_at), 'yyyy-MM-dd');
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
    });
    
    events.filter(e => e.event_type === 'page_view').forEach(e => {
      const date = format(new Date(e.timestamp), 'yyyy-MM-dd');
      dayPageViewMap.set(date, (dayPageViewMap.get(date) || 0) + 1);
    });

    const dailyData = Array.from(dailyMap.entries())
      .map(([date, visitors]) => ({
        date: format(new Date(date), 'dd/MM'),
        visitors,
        pageViews: dayPageViewMap.get(date) || 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Event types
    const eventMap = new Map();
    events.forEach(e => {
      const type = e.event_type;
      eventMap.set(type, (eventMap.get(type) || 0) + 1);
    });
    const eventTypes = Array.from(eventMap.entries())
      .map(([eventType, count]) => ({ eventType, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalVisitors,
      uniqueVisitors,
      pageViews,
      avgSessionDuration,
      bounceRate,
      topCountries,
      deviceBreakdown,
      topPages,
      trafficSources,
      hourlyData,
      dailyData,
      events: eventTypes
    };
  };

  const processTrafficSources = (trafficEvents: any[]) => {
    const sourceMap = new Map();
    
    trafficEvents.forEach(e => {
      const source = e.event_data?.source || 'direct';
      const medium = e.event_data?.medium || 'none';
      const key = `${source}|${medium}`;
      sourceMap.set(key, (sourceMap.get(key) || 0) + 1);
    });

    const total = trafficEvents.length;
    return Array.from(sourceMap.entries())
      .map(([key, count]) => {
        const [source, medium] = key.split('|');
        return {
          source,
          medium,
          count,
          percentage: Math.round((count / total) * 100)
        };
      })
      .sort((a, b) => b.count - a.count);
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-destructive">Erro ao carregar dados: {error}</p>
        <Button onClick={fetchAnalytics}>Tentar Novamente</Button>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Análise detalhada das visitas e comportamento dos usuários</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-80 justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy")
                  )
                ) : (
                  <span>Selecione o período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                numberOfMonths={2}
              />
              <div className="p-3 border-t">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDateRange({
                      from: startOfDay(subDays(new Date(), 7)),
                      to: endOfDay(new Date())
                    })}
                  >
                    Últimos 7 dias
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDateRange({
                      from: startOfDay(subDays(new Date(), 30)),
                      to: endOfDay(new Date())
                    })}
                  >
                    Últimos 30 dias
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button onClick={fetchAnalytics} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Visitantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalVisitors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.uniqueVisitors.toLocaleString()} únicos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.pageViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.totalVisitors > 0 ? (analyticsData.pageViews / analyticsData.totalVisitors).toFixed(1) : '0'} por visitante
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Rejeição</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.bounceRate}%</div>
            <Progress value={analyticsData.bounceRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.avgSessionDuration}</div>
            <p className="text-xs text-muted-foreground">por sessão</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="traffic">Origem do Tráfego</TabsTrigger>
          <TabsTrigger value="behavior">Comportamento</TabsTrigger>
          <TabsTrigger value="devices">Dispositivos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Visitantes por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="visitors" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="pageViews" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Visitantes por Hora</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="visitors" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Países</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.topCountries.slice(0, 5).map((country, index) => (
                    <div key={country.country} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4" />
                        <span className="text-sm">{country.country}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{country.count}</span>
                        <Badge variant="secondary">{country.percentage}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Páginas Mais Visitadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.topPages.slice(0, 5).map((page, index) => (
                    <div key={page.page} className="flex items-center justify-between">
                      <span className="text-sm truncate max-w-[200px]">{page.page}</span>
                      <Badge variant="outline">{page.views} views</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Fontes de Tráfego</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.trafficSources}
                      dataKey="count"
                      nameKey="source"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ source, percentage }) => `${source} (${percentage}%)`}
                    >
                      {analyticsData.trafficSources.map((entry, index) => (
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
                <CardTitle>Detalhes das Fontes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.trafficSources.map((source, index) => (
                    <div key={`${source.source}-${source.medium}`} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{source.source}</span>
                          <span className="text-muted-foreground text-sm ml-2">({source.medium})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{source.count}</span>
                          <Badge variant="secondary">{source.percentage}%</Badge>
                        </div>
                      </div>
                      <Progress value={source.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.events} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="eventType" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Dispositivos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.deviceBreakdown}
                      dataKey="count"
                      nameKey="device"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ device, percentage }) => `${device} (${percentage}%)`}
                    >
                      {analyticsData.deviceBreakdown.map((entry, index) => (
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
                <CardTitle>Breakdown por Dispositivo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.deviceBreakdown.map((device, index) => (
                    <div key={device.device} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {device.device === 'Mobile' ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                          <span className="font-medium">{device.device}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{device.count}</span>
                          <Badge variant="secondary">{device.percentage}%</Badge>
                        </div>
                      </div>
                      <Progress value={device.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};