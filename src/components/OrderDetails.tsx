import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, User, Phone, Mail, Calendar, CreditCard, Download, FileText, Image } from 'lucide-react';

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

  const extractAttachmentFromNotes = (notes: string) => {
    if (!notes) return null;
    const urlMatch = notes.match(/Comprovante:\s*(https?:\/\/[^\s\n]+)/);
    return urlMatch ? urlMatch[1] : null;
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
    } catch (error) {
      console.error('Erro no download:', error);
    }
  };

  const attachmentUrl = extractAttachmentFromNotes(order.notes);

  return (
    <div className="space-y-6">
      {/* Informações do Pedido */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover-scale border-0 shadow-md">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardTitle className="flex items-center gap-2 text-lg text-blue-700 dark:text-blue-300">
              <User className="w-5 h-5" />
              Informações do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{order.customer_name || 'Não informado'}</span>
            </div>
            {order.customer_phone && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{order.customer_phone}</span>
              </div>
            )}
            {order.customer_email && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{order.customer_email}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover-scale border-0 shadow-md">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardTitle className="flex items-center gap-2 text-lg text-green-700 dark:text-green-300">
              <Package className="w-5 h-5" />
              Detalhes do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Data do Pedido</span>
              </div>
              <span className="font-medium">{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span>Pagamento</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="capitalize font-medium">{order.payment_method}</span>
                <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                  {order.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="font-medium">Status do Pedido:</span>
              <Select 
                value={order.order_status} 
                onValueChange={(value) => onStatusUpdate(order.id, value)}
              >
                <SelectTrigger className="w-36">
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
      <Card className="hover-scale border-0 shadow-md">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <Package className="w-5 h-5" />
            Itens do Pedido ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {items.map((item, index) => (
              <div key={item.id} className={`flex items-center gap-4 p-6 hover:bg-muted/30 transition-all animate-fade-in`} style={{animationDelay: `${index * 0.1}s`}}>
                <div className="w-16 h-16 bg-gradient-to-br from-muted to-muted/50 rounded-xl overflow-hidden shadow-sm">
                  {item.products?.image_url ? (
                    <img 
                      src={item.products.image_url} 
                      alt={item.products.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{item.products?.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(item.unit_price)} × {item.quantity} unidades
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-xl text-primary">{formatPrice(item.total_price)}</p>
                  <Badge variant="outline" className="text-xs">
                    Qtd: {item.quantity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-6 bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold">Total do Pedido:</span>
              <span className="text-2xl font-bold text-primary">{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notas e Anexos */}
      {(order.notes || attachmentUrl) && (
        <Card className="hover-scale border-0 shadow-md">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <FileText className="w-5 h-5" />
              Observações {attachmentUrl && "e Anexos"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {order.notes && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}
            {attachmentUrl && (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">Comprovante de Pagamento</p>
                    <p className="text-sm text-muted-foreground">Clique para baixar o arquivo</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadAttachment(attachmentUrl, `comprovante-pedido-${order.order_number}.jpg`)}
                  className="hover-scale"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderDetails;