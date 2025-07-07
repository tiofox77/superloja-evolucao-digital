import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, ShoppingBag, Settings, LogOut, Eye, Package, Phone, FileText, Download } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import SuperLojaAvatar from '@/components/SuperLojaAvatar';
import { DigitalProductArea } from '@/components/DigitalProductArea';

const Cliente = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    country: '',
    province: '',
    city: '',
    street: ''
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate('/auth');
        } else {
          loadProfile(session.user.id);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate('/auth');
      } else {
        loadProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadOrders = async (userEmail: string) => {
    if (!userEmail) return;
    
    try {
      setOrdersLoading(true);
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_email', userEmail)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setOrdersLoading(false);
    }
  };
  const loadProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (profileData) {
        setProfile(profileData);
        setProfileData({
          full_name: profileData.full_name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          country: profileData.country || '',
          province: profileData.province || '',
          city: profileData.city || '',
          street: profileData.street || ''
        });
        
        // Load orders using email from profile
        if (profileData.email) {
          loadOrders(profileData.email);
        }
      } else {
        // Create profile if doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            email: user?.email || '',
            full_name: user?.user_metadata?.full_name || ''
          })
          .select()
          .single();

        if (createError) throw createError;
        setProfile(newProfile);
        
        // Load orders using user email
        if (user?.email) {
          loadOrders(user.email);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "✅ Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso."
      });

      loadProfile(user?.id || '');
    } catch (error: any) {
      toast({
        title: "❌ Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (loading && !user) {
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Minha Conta
            </h1>
            <p className="text-muted-foreground">
              Bem-vindo, {profile?.full_name || user?.email}!
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Pedidos
            </TabsTrigger>
            <TabsTrigger value="digital" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Digital
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Perfil</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <SuperLojaAvatar 
                    src={profile?.avatar_url}
                    alt="Avatar do usuário"
                    size="xl"
                    className="mx-auto"
                    interactive
                  />
                  <div>
                    <h3 className="font-semibold">{profile?.full_name || 'Nome não informado'}</h3>
                    <p className="text-sm text-muted-foreground">{profile?.email}</p>
                    <Badge variant="outline" className="mt-2">
                      {profile?.role === 'admin' ? 'Administrador' : 'Cliente'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Form */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="full_name">Nome Completo</Label>
                        <Input
                          id="full_name"
                          value={profileData.full_name}
                          onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                          placeholder="Digite seu nome completo"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <div className="flex mt-1">
                        <div className="flex items-center px-3 border border-r-0 border-input bg-muted rounded-l-md">
                          <span className="text-sm text-muted-foreground">+244</span>
                        </div>
                        <Input
                          id="phone"
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/\D/g, '').replace(/^244/, '');
                            setProfileData({...profileData, phone: cleaned});
                          }}
                          placeholder="912345678"
                          className="rounded-l-none"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Digite apenas os números sem o código do país
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Localização
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="country">País</Label>
                          <Input
                            id="country"
                            value={profileData.country}
                            onChange={(e) => setProfileData({...profileData, country: e.target.value})}
                            placeholder="Ex: Angola"
                          />
                        </div>
                        <div>
                          <Label htmlFor="province">Província</Label>
                          <Input
                            id="province"
                            value={profileData.province}
                            onChange={(e) => setProfileData({...profileData, province: e.target.value})}
                            placeholder="Ex: Luanda"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">Cidade</Label>
                          <Input
                            id="city"
                            value={profileData.city}
                            onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                            placeholder="Ex: Luanda"
                          />
                        </div>
                        <div>
                          <Label htmlFor="street">Rua/Bairro</Label>
                          <Input
                            id="street"
                            value={profileData.street}
                            onChange={(e) => setProfileData({...profileData, street: e.target.value})}
                            placeholder="Ex: Rua da Independência"
                          />
                        </div>
                      </div>
                    </div>

                    <Button type="submit" disabled={loading}>
                      {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Meus Pedidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Você ainda não fez nenhum pedido.</p>
                    <Button asChild className="mt-4">
                      <Link to="/catalogo">Fazer Primeiro Pedido</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">Pedido #{order.order_number}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <Badge variant={order.order_status === 'completed' ? 'default' : 'secondary'}>
                            {order.order_status}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">
                            {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(order.total_amount)}
                          </span>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/fatura/${order.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalhes
                              </Link>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                // Generate PDF functionality will be implemented
                                window.open(`/fatura/${order.id}?pdf=true`, '_blank');
                              }}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              PDF
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="digital">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Produtos Digitais & Serviços
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DigitalProductArea orders={orders} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Preferências
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Informações da Conta</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Conta criada em:</strong> {new Date(user?.created_at || '').toLocaleDateString('pt-BR')}</p>
                    <p><strong>Último login:</strong> {new Date(user?.last_sign_in_at || '').toLocaleDateString('pt-BR')}</p>
                    <p><strong>Status:</strong> <Badge variant="outline">Ativo</Badge></p>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <Button variant="destructive" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Encerrar Sessão
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Cliente;