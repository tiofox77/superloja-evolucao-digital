import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gavel, Clock, TrendingUp, Eye, Plus, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_auction: boolean;
  auction_start_date?: string;
  auction_end_date?: string;
  starting_bid?: number;
  current_bid?: number;
  bid_increment?: number;
  reserve_price?: number;
  auto_extend_minutes?: number;
}

interface AuctionBid {
  id: string;
  bidder_name: string;
  bidder_email: string;
  bid_amount: number;
  bid_time: string;
  is_winning: boolean;
}

const AdminLeiloes = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [bids, setBids] = useState<AuctionBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_auction', true)
        .order('auction_end_date', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao carregar leilões:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBids = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('auction_bids')
        .select('*')
        .eq('product_id', productId)
        .order('bid_amount', { ascending: false });

      if (error) throw error;
      setBids(data || []);
    } catch (error) {
      console.error('Erro ao carregar lances:', error);
    }
  };

  const saveAuction = async () => {
    if (!selectedProduct) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          is_auction: selectedProduct.is_auction,
          auction_start_date: selectedProduct.auction_start_date,
          auction_end_date: selectedProduct.auction_end_date,
          starting_bid: selectedProduct.starting_bid,
          bid_increment: selectedProduct.bid_increment,
          reserve_price: selectedProduct.reserve_price,
          auto_extend_minutes: selectedProduct.auto_extend_minutes,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProduct.id);

      if (error) throw error;

      toast({
        title: "Leilão salvo",
        description: "Configurações do leilão foram atualizadas com sucesso."
      });

      setDialogOpen(false);
      await loadProducts();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações do leilão.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const convertToAuction = async (product: Product) => {
    setSelectedProduct({
      ...product,
      is_auction: true,
      starting_bid: product.price,
      bid_increment: 10,
      auto_extend_minutes: 5,
      auction_start_date: new Date().toISOString(),
      auction_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
    });
    setDialogOpen(true);
  };

  const getAuctionStatus = (product: Product) => {
    const now = new Date();
    const startDate = product.auction_start_date ? new Date(product.auction_start_date) : null;
    const endDate = product.auction_end_date ? new Date(product.auction_end_date) : null;

    if (!startDate || !endDate) return 'Configuração incompleta';
    
    if (now < startDate) return 'Agendado';
    if (now > endDate) return 'Finalizado';
    return 'Ativo';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Ativo':
        return <Badge variant="default">Ativo</Badge>;
      case 'Agendado':
        return <Badge variant="secondary">Agendado</Badge>;
      case 'Finalizado':
        return <Badge variant="outline">Finalizado</Badge>;
      default:
        return <Badge variant="destructive">Incompleto</Badge>;
    }
  };

  const formatTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Finalizado';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Leilões</h1>
          <p className="text-muted-foreground">
            Gerencie leilões de produtos e acompanhe lances
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedProduct(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Leilão
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedProduct?.id ? 'Editar Leilão' : 'Criar Novo Leilão'}
              </DialogTitle>
            </DialogHeader>
            {/* Dialog content will be added here */}
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Leilões Ativos</TabsTrigger>
          <TabsTrigger value="scheduled">Agendados</TabsTrigger>
          <TabsTrigger value="finished">Finalizados</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products
              .filter(p => getAuctionStatus(p) === 'Ativo')
              .map((product) => (
                <Card key={product.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      {getStatusBadge(getAuctionStatus(product))}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-32 object-cover rounded"
                      />
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Lance Atual:</span>
                        <span className="font-bold text-primary">
                          R$ {(product.current_bid || product.starting_bid || 0).toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Tempo Restante:</span>
                        <span className="font-medium text-orange-600">
                          {product.auction_end_date && formatTimeRemaining(product.auction_end_date)}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProduct(product);
                          loadBids(product.id);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver Lances
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProduct(product);
                          setDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products
              .filter(p => getAuctionStatus(p) === 'Agendado')
              .map((product) => (
                <Card key={product.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      {getStatusBadge(getAuctionStatus(product))}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-32 object-cover rounded"
                      />
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Lance Inicial:</span>
                        <span className="font-bold">
                          R$ {(product.starting_bid || 0).toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Inicia em:</span>
                        <span className="font-medium">
                          {product.auction_start_date && format(
                            new Date(product.auction_start_date), 
                            'dd/MM/yyyy HH:mm', 
                            { locale: ptBR }
                          )}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProduct(product);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="finished" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products
              .filter(p => getAuctionStatus(p) === 'Finalizado')
              .map((product) => (
                <Card key={product.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      {getStatusBadge(getAuctionStatus(product))}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-32 object-cover rounded"
                      />
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Lance Vencedor:</span>
                        <span className="font-bold text-green-600">
                          R$ {(product.current_bid || product.starting_bid || 0).toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Finalizado em:</span>
                        <span className="font-medium">
                          {product.auction_end_date && format(
                            new Date(product.auction_end_date), 
                            'dd/MM/yyyy HH:mm', 
                            { locale: ptBR }
                          )}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProduct(product);
                        loadBids(product.id);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Resultado
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todos os Leilões</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div>
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Lance: R$ {(product.current_bid || product.starting_bid || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(getAuctionStatus(product))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProduct(product);
                          setDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLeiloes;