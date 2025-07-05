import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ShoppingCart, Clock, CheckCircle, XCircle, Eye, Users, Package, TrendingUp, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import OrderDetails from '@/components/OrderDetails';

const AdminPedidos = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    revenue: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
    loadStats();
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Total de pedidos
      const { count: totalCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Pedidos pendentes
      const { count: pendingCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('order_status', 'pending');

      // Pedidos completos
      const { count: completedCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('order_status', 'completed');

      // Receita total
      const { data: revenueData } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('payment_status', 'paid');

      const totalRevenue = revenueData?.reduce((sum, order) => sum + (typeof order.total_amount === 'string' ? parseFloat(order.total_amount) : order.total_amount), 0) || 0;

      setStats({
        total: totalCount || 0,
        pending: pendingCount || 0,
        completed: completedCount || 0,
        revenue: totalRevenue
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const loadOrderItems = async (orderId) => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          products (
            name,
            image_url
          )
        `)
        .eq('order_id', orderId);
      
      if (error) throw error;
      setOrderItems(data || []);
    } catch (error) {
      console.error('Erro ao carregar itens do pedido:', error);
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Pedido excluído!",
        description: "Pedido removido com sucesso."
      });

      loadOrders();
      loadStats();
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Status atualizado!",
        description: "Status do pedido foi atualizado com sucesso."
      });

      loadOrders();
      loadStats();
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary', label: 'Pendente', icon: Clock },
      processing: { variant: 'default', label: 'Processando', icon: Package },
      completed: { variant: 'default', label: 'Concluído', icon: CheckCircle },
      cancelled: { variant: 'destructive', label: 'Cancelado', icon: XCircle }
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    loadOrderItems(order.id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pedidos</h1>
        <p className="text-muted-foreground">Gerencie todos os pedidos da loja</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover-scale">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Total de Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Todos os pedidos</p>
          </CardContent>
        </Card>
        
        <Card className="hover-scale">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Aguardando processamento</p>
          </CardContent>
        </Card>
        
        <Card className="hover-scale">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Pedidos finalizados</p>
          </CardContent>
        </Card>
        
        <Card className="hover-scale">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.revenue)}</div>
            <p className="text-xs text-muted-foreground">Vendas pagas</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card className="hover-scale">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Pedidos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum pedido encontrado</p>
              <p className="text-sm">Os pedidos aparecerão aqui quando realizados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">#{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.customer_name || 'Cliente não informado'}
                        </p>
                      </div>
                      {getStatusBadge(order.order_status)}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatPrice(order.total_amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Fonte: {order.order_source === 'pos' ? 'POS' : 'Website'}</span>
                      {order.customer_phone && <span>Tel: {order.customer_phone}</span>}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openOrderDetails(order)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Pedido #{selectedOrder?.id.slice(0, 8)}</DialogTitle>
                          </DialogHeader>
                          {selectedOrder && (
                            <OrderDetails 
                              order={selectedOrder} 
                              items={orderItems}
                              onStatusUpdate={updateOrderStatus}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteOrder(order.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPedidos;