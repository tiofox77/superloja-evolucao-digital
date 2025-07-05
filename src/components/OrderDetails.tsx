import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, User, Phone, Mail, Calendar, CreditCard } from 'lucide-react';

interface OrderDetailsProps {
  order: any;
  items: any[];
  onStatusUpdate: (orderId: string, newStatus: string) => void;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ order, items, onStatusUpdate }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0
    }).format(price);
  };

  const statusOptions = [
    { value: 'pending', label: 'Pendente' },
    { value: 'processing', label: 'Processando' },
    { value: 'completed', label: 'Concluído' },
    { value: 'cancelled', label: 'Cancelado' }
  ];

  return (
    <div className="space-y-6">
      {/* Informações do Pedido */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5" />
              Informações do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{order.customer_name || 'Não informado'}</span>
            </div>
            {order.customer_phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{order.customer_phone}</span>
              </div>
            )}
            {order.customer_email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{order.customer_email}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5" />
              Detalhes do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{new Date(order.created_at).toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <span className="capitalize">{order.payment_method}</span>
              <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                {order.payment_status === 'paid' ? 'Pago' : 'Pendente'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <Select 
                value={order.order_status} 
                onValueChange={(value) => onStatusUpdate(order.id, value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Itens do Pedido */}
      <Card>
        <CardHeader>
          <CardTitle>Itens do Pedido ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden">
                  {item.products?.image_url ? (
                    <img 
                      src={item.products.image_url} 
                      alt={item.products.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium">{item.products?.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(item.unit_price)} × {item.quantity}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="font-bold">{formatPrice(item.total_price)}</p>
                </div>
              </div>
            ))}
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total do Pedido:</span>
            <span className="text-primary">{formatPrice(order.total_amount)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Notas */}
      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{order.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderDetails;