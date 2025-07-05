import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download, Printer, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SuperLojaAvatar from '@/components/SuperLojaAvatar';

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  notes: string;
  created_at: string;
}

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products: {
    name: string;
    image_url?: string;
  };
}

const Fatura = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (orderId) {
      loadOrderDetails();
    }
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      // Carregar dados do pedido
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Carregar itens do pedido
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products (
            name,
            image_url
          )
        `)
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      setOrder(orderData);
      setOrderItems(itemsData || []);
    } catch (error: any) {
      console.error('Erro ao carregar pedido:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do pedido.",
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
      completed: { label: 'Concluído', variant: 'default' as const, icon: CheckCircle },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const, icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentBadge = (method: string, status: string) => {
    const methodLabel = method === 'cash' ? 'Dinheiro' : 'Transferência';
    const statusLabel = status === 'paid' ? 'Pago' : 'Pendente';
    const variant = status === 'paid' ? 'default' : 'secondary';
    
    return (
      <Badge variant={variant}>
        {methodLabel} - {statusLabel}
      </Badge>
    );
  };

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Fatura - Pedido #${order?.id.slice(-6)}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .invoice-header { text-align: center; margin-bottom: 30px; }
                .invoice-details { margin-bottom: 20px; }
                .items-table { width: 100%; border-collapse: collapse; }
                .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .items-table th { background-color: #f5f5f5; }
                .total-section { margin-top: 20px; text-align: right; font-weight: bold; }
                @media print { .no-print { display: none; } }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Pedido não encontrado</h1>
          <p className="mb-6">O pedido solicitado não foi encontrado ou não existe.</p>
          <Button asChild>
            <Link to="/">Voltar ao Início</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          
          <div className="flex gap-2 no-print">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>

        <div id="invoice-content">
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="text-center border-b">
              <div className="flex items-center justify-center gap-4 mb-4">
                <SuperLojaAvatar size="lg" interactive={false} />
                <div>
                  <CardTitle className="text-2xl">SuperLoja</CardTitle>
                  <p className="text-muted-foreground">Tecnologia & Inovação</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">FATURA</h2>
                  <p className="text-sm text-muted-foreground">
                    Pedido #{order.id.slice(-6)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Data do Pedido</p>
                  <p className="font-semibold">
                    {new Date(order.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 p-6">
              {/* Informações do Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Dados do Cliente</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Nome:</strong> {order.customer_name}</p>
                    <p><strong>Email:</strong> {order.customer_email}</p>
                    <p><strong>Telefone:</strong> {order.customer_phone}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Status do Pedido</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Status:</span>
                      {getStatusBadge(order.order_status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Pagamento:</span>
                      {getPaymentBadge(order.payment_method, order.payment_status)}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Itens do Pedido */}
              <div>
                <h3 className="font-semibold mb-4">Itens do Pedido</h3>
                <div className="space-y-4">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <SuperLojaAvatar 
                        src={item.products.image_url}
                        alt={item.products.name}
                        size="sm"
                        className="print:w-6 print:h-6"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{item.products.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(item.unit_price)} x {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatPrice(item.total_price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Total */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold">Subtotal:</span>
                  <span>{formatPrice(order.total_amount)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Frete:</span>
                  <span>Grátis</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>Total:</span>
                  <span className="text-primary">{formatPrice(order.total_amount)}</span>
                </div>
              </div>

              {/* Observações */}
              {order.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Observações</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {order.notes}
                    </p>
                  </div>
                </>
              )}

              {/* Rodapé */}
              <Separator />
              <div className="text-center text-sm text-muted-foreground">
                <p>Obrigado pela sua compra!</p>
                <p>SuperLoja - Luanda, Angola</p>
                <p>Telefone: +244 900 000 000 | Email: contato@superloja.com</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Fatura;