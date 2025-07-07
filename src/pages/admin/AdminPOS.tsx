import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Minus, ShoppingCart, Trash2, Calculator, CreditCard, FileText, Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateModernInvoicePDF } from '@/components/ModernInvoicePDF';

const AdminPOS = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('in_stock', true)
        .order('name');
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerInfo({ name: '', phone: '', email: '' });
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const processSale = async () => {
    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos antes de finalizar a venda.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Criar o pedido
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: customerInfo.name || null,
          customer_phone: customerInfo.phone || null,
          customer_email: customerInfo.email || null,
          total_amount: getTotalAmount(),
          payment_method: paymentMethod,
          payment_status: 'paid',
          order_status: 'completed',
          order_source: 'pos'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Criar os itens do pedido
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Atualizar estoque dos produtos
      for (const item of cart) {
        const newStock = (item.stock_quantity || 0) - item.quantity;
        await supabase
          .from('products')
          .update({ 
            stock_quantity: Math.max(0, newStock),
            in_stock: newStock > 0
          })
          .eq('id', item.id);
      }

      toast({
        title: "Venda realizada!",
        description: `Pedido #${orderData.order_number} - Total: ${formatPrice(getTotalAmount())}`,
        action: (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => generateModernInvoicePDF(orderData.id, false)}
            >
              <FileText className="w-4 h-4 mr-1" />
              Fatura
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => generateModernInvoicePDF(orderData.id, true)}
            >
              <FileText className="w-4 h-4 mr-1" />
              Recibo
            </Button>
          </div>
        )
      });

      clearCart();
    } catch (error: any) {
      toast({
        title: "Erro na venda",
        description: error.message,
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

  const generateReceiptPDF = (order, items) => {
    const printContent = `
      <html>
        <head>
          <title>Recibo - Pedido #${order.order_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; max-width: 400px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
            .info { margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border-bottom: 1px solid #ddd; padding: 5px; text-align: left; }
            .total { font-weight: bold; font-size: 1.1em; text-align: right; margin-top: 15px; border-top: 2px solid #333; padding-top: 10px; }
            .footer { text-align: center; margin-top: 20px; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>SuperLoja</h2>
            <p>Recibo de Venda #${order.order_number}</p>
          </div>
          
          <div class="info">
            <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <p><strong>Cliente:</strong> ${order.customer_name || 'Balcão'}</p>
            <p><strong>Pagamento:</strong> ${order.payment_method === 'cash' ? 'Dinheiro' : 'Transferência'}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qtd</th>
                <th>Preço</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>${formatPrice(item.price * item.quantity)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total">
            TOTAL: ${formatPrice(order.total_amount)}
          </div>

          <div class="footer">
            <p>Obrigado pela preferência!</p>
            <p>SuperLoja - A sua loja de confiança</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
          Ponto de Venda (POS)
        </h1>
        <p className="text-muted-foreground">Sistema de vendas diretas no balcão</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Produtos */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                className="hover-scale cursor-pointer transition-all duration-200 hover:shadow-lg"
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-4">
                  <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-lg mb-3 overflow-hidden">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <ShoppingCart className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-medium text-sm line-clamp-2 mb-2">{product.name}</h3>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-green-600">
                      {formatPrice(product.price)}
                    </span>
                    <Badge variant="outline">
                      Estoque: {product.stock_quantity || 0}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Carrinho */}
        <div className="space-y-4">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Carrinho ({getTotalItems()})
                </span>
                {cart.length > 0 && (
                  <Button size="sm" variant="outline" onClick={clearCart}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment Method */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Método de Pagamento</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">
                      <div className="flex items-center gap-2">
                        <span>💵</span>
                        Dinheiro
                      </div>
                    </SelectItem>
                    <SelectItem value="transfer">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Transferência
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Customer Info */}
              <div className="space-y-2">
                <Input
                  placeholder="Nome do cliente (opcional)"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                />
                <Input
                  placeholder="Telefone (opcional)"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                />
              </div>

              {/* Cart Items */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Carrinho vazio</p>
                    <p className="text-xs">Clique nos produtos para adicionar</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2 p-2 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium line-clamp-1">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(item.price)}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromCart(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* Total */}
              {cart.length > 0 && (
                <>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-2xl font-bold text-green-600">
                        {formatPrice(getTotalAmount())}
                      </span>
                    </div>
                    
                    <Button 
                      onClick={processSale} 
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      size="lg"
                    >
                      <Calculator className="w-4 h-4 mr-2" />
                      Finalizar Venda
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPOS;