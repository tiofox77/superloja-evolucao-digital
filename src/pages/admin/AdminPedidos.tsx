import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Clock, CheckCircle, XCircle, Eye, Users, Package, TrendingUp, Trash2, Search, Filter, Download, FileText, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import OrderDetails from '@/components/OrderDetails';
import { useNotifications } from '@/hooks/useNotifications';

const AdminPedidos = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    revenue: 0
  });
  const { toast } = useToast();
  const { sendEmailNotification, sendSmsNotification } = useNotifications();

  useEffect(() => {
    loadOrders();
    loadStats();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const filterOrders = () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.order_number?.toString().includes(searchTerm) ||
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_phone?.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.order_status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('order_number', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
      setFilteredOrders(data || []);
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
      // Buscar dados do pedido antes de atualizar
      const { data: orderData } = await supabase
        .from('orders')
        .select('customer_email, customer_name, order_number')
        .eq('id', orderId)
        .single();

      const { error } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Atualizar estado local imediatamente
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, order_status: newStatus }
            : order
        )
      );
      
      setSelectedOrder(prev => 
        prev?.id === orderId 
          ? { ...prev, order_status: newStatus }
          : prev
      );

      // Enviar notificações de mudança de status
      if (orderData?.customer_email) {
        try {
          await sendEmailNotification({
            type: 'status_changed',
            to: orderData.customer_email,
            userName: orderData.customer_name || 'Cliente',
            orderNumber: orderData.order_number?.toString(),
            newStatus: newStatus
          });

          // Se tiver telefone, enviar SMS também
          const { data: profile } = await supabase
            .from('profiles')
            .select('phone')
            .eq('email', orderData.customer_email)
            .single();

          if (profile?.phone) {
            await sendSmsNotification({
              type: 'status_changed',
              to: profile.phone,
              userName: orderData.customer_name || 'Cliente',
              orderNumber: orderData.order_number?.toString(),
              newStatus: newStatus
            });
          }
        } catch (notificationError) {
          console.error('Erro ao enviar notificações:', notificationError);
          // Não falhar se não conseguir enviar notificações
        }
      }

      toast({
        title: "Status atualizado!",
        description: "Status do pedido foi atualizado com sucesso."
      });

      loadStats();
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const generateOrderPDF = (order, items) => {
    const printContent = `
      <html>
        <head>
          <title>Pedido #${order.order_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .section { margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { font-weight: bold; font-size: 1.2em; text-align: right; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SuperLoja</h1>
            <h2>Pedido #${order.order_number}</h2>
          </div>
          
          <div class="info">
            <div>
              <div class="section">
                <strong>Cliente:</strong> ${order.customer_name || 'Não informado'}<br>
                <strong>Telefone:</strong> ${order.customer_phone || 'Não informado'}<br>
                <strong>Email:</strong> ${order.customer_email || 'Não informado'}
              </div>
            </div>
            <div>
              <div class="section">
                <strong>Data:</strong> ${new Date(order.created_at).toLocaleDateString('pt-BR')}<br>
                <strong>Status:</strong> ${order.order_status}<br>
                <strong>Pagamento:</strong> ${order.payment_method}
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Preço Unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.products?.name}</td>
                  <td>${item.quantity}</td>
                  <td>${formatPrice(item.unit_price)}</td>
                  <td>${formatPrice(item.total_price)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total">
            Total: ${formatPrice(order.total_amount)}
          </div>

          ${order.notes ? `
            <div class="section" style="margin-top: 20px;">
              <strong>Observações:</strong><br>
              ${order.notes}
            </div>
          ` : ''}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
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
      pending: { 
        variant: 'secondary', 
        label: 'Pendente', 
        icon: Clock,
        className: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400'
      },
      processing: { 
        variant: 'default', 
        label: 'Processando', 
        icon: Package,
        className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
      },
      completed: { 
        variant: 'default', 
        label: 'Concluído', 
        icon: CheckCircle,
        className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400'
      },
      cancelled: { 
        variant: 'destructive', 
        label: 'Cancelado', 
        icon: XCircle,
        className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400'
      }
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge className={`flex items-center gap-1 ${config.className}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    loadOrderItems(order.id);
  };

  const downloadAttachment = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "Download concluído!",
        description: "Arquivo baixado com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar o arquivo.",
        variant: "destructive"
      });
    }
  };

  const extractAttachmentFromNotes = (notes: string) => {
    if (!notes) return null;
    const urlMatch = notes.match(/Comprovante:\s*(https?:\/\/[^\s\n]+)/);
    return urlMatch ? urlMatch[1] : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Pedidos
          </h1>
          <p className="text-muted-foreground">Gerencie todos os pedidos da loja</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar pedidos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-sm"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendente</option>
              <option value="processing">Processando</option>
              <option value="completed">Concluído</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover-scale border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <ShoppingCart className="w-4 h-4" />
              Total de Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</div>
            <p className="text-xs text-blue-600 dark:text-blue-400">Todos os pedidos</p>
          </CardContent>
        </Card>
        
        <Card className="hover-scale border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <Clock className="w-4 h-4" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.pending}</div>
            <p className="text-xs text-orange-600 dark:text-orange-400">Aguardando processamento</p>
          </CardContent>
        </Card>
        
        <Card className="hover-scale border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="w-4 h-4" />
              Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.completed}</div>
            <p className="text-xs text-green-600 dark:text-green-400">Pedidos finalizados</p>
          </CardContent>
        </Card>
        
        <Card className="hover-scale border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <TrendingUp className="w-4 h-4" />
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{formatPrice(stats.revenue)}</div>
            <p className="text-xs text-purple-600 dark:text-purple-400">Vendas pagas</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card className="hover-scale border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Pedidos Recentes
            {filteredOrders.length !== orders.length && (
              <Badge variant="secondary" className="ml-2">
                {filteredOrders.length} de {orders.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum pedido encontrado</p>
              <p className="text-sm">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca' 
                  : 'Os pedidos aparecerão aqui quando realizados'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredOrders.map((order, index) => {
                const attachmentUrl = extractAttachmentFromNotes(order.notes);
                return (
                  <div key={order.id} className={`p-6 hover:bg-muted/30 transition-all duration-200 animate-fade-in`} style={{animationDelay: `${index * 0.1}s`}}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-lg">#{order.order_number}</p>
                            {attachmentUrl && (
                              <Badge variant="outline" className="text-xs">
                                <FileText className="w-3 h-3 mr-1" />
                                Anexo
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {order.customer_name || 'Cliente não informado'}
                          </p>
                        </div>
                        {getStatusBadge(order.order_status)}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xl text-primary">{formatPrice(order.total_amount)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          <span>Fonte: {order.order_source === 'pos' ? 'POS' : 'Website'}</span>
                        </div>
                        {order.customer_phone && (
                          <div className="flex items-center gap-1">
                            <span>📞 {order.customer_phone}</span>
                          </div>
                        )}
                        {order.customer_email && (
                          <div className="flex items-center gap-1">
                            <span>✉️ {order.customer_email}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {attachmentUrl && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => downloadAttachment(attachmentUrl, `comprovante-pedido-${order.order_number}.jpg`)}
                            className="hover-scale"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        )}
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => openOrderDetails(order)}
                              className="hover-scale"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalhes
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="order-details-description">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                Pedido #{selectedOrder?.order_number}
                              </DialogTitle>
                              <p id="order-details-description" className="text-sm text-muted-foreground">
                                Detalhes completos do pedido e informações do cliente
                              </p>
                            </DialogHeader>
                            {selectedOrder && (
                              <OrderDetails 
                                order={selectedOrder} 
                                items={orderItems}
                                onStatusUpdate={updateOrderStatus}
                                onGeneratePDF={generateOrderPDF}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteOrder(order.id)}
                          className="hover-scale"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPedidos;