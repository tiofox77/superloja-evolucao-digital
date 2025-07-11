import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { ArrowLeft, CreditCard, Building, Banknote, User, Upload, MapPin, Globe } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { useNotifications } from '@/hooks/useNotifications';

const Checkout = () => {
  const { items, totalAmount, clearCart, setIsOpen } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { createOrderNotification } = useNotifications();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    country: '',
    province: '',
    city: '',
    street: '',
    paymentMethod: 'transfer',
    notes: ''
  });

  useEffect(() => {
    // Fechar carrinho quando entrar no checkout
    setIsOpen(false);
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Preencher dados do usuário logado
        if (session?.user) {
          loadUserProfile(session.user.id);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profile) {
        setFormData(prev => ({
          ...prev,
          name: profile.full_name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          country: profile.country || '',
          province: profile.province || '',
          city: profile.city || '',
          street: profile.street || ''
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validações básicas
      if (!formData.name || !formData.email || !formData.phone) {
        throw new Error('Preencha todos os campos obrigatórios');
      }

      let proofUrl = '';
      
      // Upload do comprovante se for transferência
      if (formData.paymentMethod === 'transfer' && paymentProof) {
        const fileExt = paymentProof.name.split('.').pop();
        const fileName = `payment_proof_${Date.now()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from('product-images')
          .upload(`payment-proofs/${fileName}`, paymentProof);

        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(`payment-proofs/${fileName}`);
        
        proofUrl = urlData.publicUrl;
      }

      // Criar o pedido
      const orderData = {
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        total_amount: totalAmount,
        payment_method: formData.paymentMethod,
        payment_status: formData.paymentMethod === 'cash' ? 'pending' : 'paid',
        order_status: 'pending',
        order_source: 'web',
        notes: `${formData.notes}\n\nEndereço: ${formData.address}\nCidade: ${formData.city}, ${formData.province}\nPaís: ${formData.country}\nRua: ${formData.street}${proofUrl ? `\nComprovante: ${proofUrl}` : ''}`
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Criar itens do pedido
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id, // Use product_id from cart item
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Atualizar perfil do usuário com os dados do checkout
      if (user) {
        try {
          await supabase
            .from('profiles')
            .upsert({
              user_id: user.id,
              email: formData.email,
              full_name: formData.name,
              phone: formData.phone,
              country: formData.country,
              province: formData.province,
              city: formData.city,
              street: formData.street
            });
        } catch (profileError) {
          console.error('Erro ao atualizar perfil:', profileError);
          // Não falhar se não conseguir salvar o perfil
        }
      }

      // Enviar notificações
      try {
        await createOrderNotification({
          userEmail: formData.email,
          userName: formData.name,
          orderNumber: order.order_number.toString(),
          orderTotal: totalAmount,
          userPhone: formData.phone ? `+244${formData.phone}` : undefined
        });
      } catch (notificationError) {
        console.error('Erro ao enviar notificações:', notificationError);
        // Não falhar se não conseguir enviar notificações
      }

      // Toast de sucesso
      toast({
        title: "✅ Pedido criado com sucesso!",
        description: "Seu pedido foi registrado. Redirecionando para a fatura..."
      });

      // Limpar carrinho
      clearCart();
      
      // Redirecionar para fatura após um delay
      setTimeout(() => {
        navigate(`/fatura/${order.id}`);
      }, 1500);

    } catch (error: any) {
      console.error('Erro ao processar pedido:', error);
      toast({
        title: "❌ Erro ao processar pedido",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Carrinho Vazio</h1>
          <p className="mb-6">Adicione produtos ao carrinho para fazer um pedido.</p>
          <Button asChild>
            <Link to="/catalogo">Ir às Compras</Link>
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
        <Button variant="ghost" className="mb-6" asChild>
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Finalizar Pedido</h1>
              {!user && (
                <Button variant="outline" asChild>
                  <Link to="/auth">
                    <User className="w-4 h-4 mr-2" />
                    Login / Cadastrar
                  </Link>
                </Button>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dados Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone *</Label>
                    <div className="flex mt-1">
                      <div className="flex items-center px-3 border border-r-0 border-input bg-muted rounded-l-md">
                        <span className="text-sm text-muted-foreground">+244</span>
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/\D/g, '').replace(/^244/, '');
                          setFormData({...formData, phone: cleaned});
                        }}
                        placeholder="912345678"
                        className="rounded-l-none"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Digite apenas os números sem o código do país
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Endereço de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="country">País</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData({...formData, country: e.target.value})}
                        placeholder="Ex: Angola"
                      />
                    </div>
                    <div>
                      <Label htmlFor="province">Província *</Label>
                      <Input
                        id="province"
                        value={formData.province}
                        onChange={(e) => setFormData({...formData, province: e.target.value})}
                        placeholder="Ex: Luanda"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">Cidade *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        placeholder="Ex: Luanda"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="street">Rua/Bairro *</Label>
                      <Input
                        id="street"
                        value={formData.street}
                        onChange={(e) => setFormData({...formData, street: e.target.value})}
                        placeholder="Ex: Rua da Independência"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Endereço Completo/Referência *</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="Detalhes do endereço, referências, número da casa..."
                      required
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Método de Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData({...formData, paymentMethod: value})}
                  >
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="transfer" id="transfer" />
                      <Building className="w-5 h-5 text-primary" />
                      <Label htmlFor="transfer" className="flex-1">
                        <strong>Transferência Bancária</strong>
                        <p className="text-sm text-muted-foreground">
                          Envie o comprovante após o pagamento
                        </p>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="cash" id="cash" />
                      <Banknote className="w-5 h-5 text-primary" />
                      <Label htmlFor="cash" className="flex-1">
                        <strong>Pagamento na Entrega</strong>
                        <p className="text-sm text-muted-foreground">
                          Pague em dinheiro na entrega
                        </p>
                      </Label>
                    </div>
                  </RadioGroup>

                  {formData.paymentMethod === 'transfer' && (
                    <div className="mt-4 space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-semibold mb-2">Dados Bancários:</h4>
                        <p className="text-sm">
                          <strong>Banco:</strong> BAI<br/>
                          <strong>Conta:</strong> 123456789<br/>
                          <strong>IBAN:</strong> AO06.0001.0000.1234.5678.9012.3<br/>
                          <strong>Titular:</strong> SuperLoja Lda
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="paymentProof">Comprovante de Pagamento</Label>
                        <div className="mt-2">
                          <Input
                            id="paymentProof"
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                            className="cursor-pointer"
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            Anexe o comprovante de transferência (imagem ou PDF)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Informações adicionais sobre o pedido..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processando...
                  </>
                ) : (
                  `Confirmar Pedido - ${formatPrice(totalAmount)}`
                )}
              </Button>
            </form>
          </div>

          {/* Resumo do Pedido */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Qtd: {item.quantity} x {formatPrice(item.product.price)}
                      </p>
                    </div>
                    <span className="font-semibold">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">{formatPrice(totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;