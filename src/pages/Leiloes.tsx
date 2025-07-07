import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Gavel, Clock, TrendingUp, User, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  images?: string[];
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
  bid_amount: number;
  bid_time: string;
  is_winning: boolean;
}

interface BidForm {
  bidder_name: string;
  bidder_email: string;
  bidder_phone: string;
  bid_amount: number;
}

const Leiloes = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [bids, setBids] = useState<AuctionBid[]>([]);
  const [bidForm, setBidForm] = useState<BidForm>({
    bidder_name: '',
    bidder_email: '',
    bidder_phone: '',
    bid_amount: 0
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadActiveAuctions();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      loadBids(selectedProduct.id);
      const minBid = (selectedProduct.current_bid || selectedProduct.starting_bid || 0) + (selectedProduct.bid_increment || 1);
      setBidForm(prev => ({ ...prev, bid_amount: minBid }));
    }
  }, [selectedProduct]);

  const loadActiveAuctions = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_auction', true)
        .eq('active', true)
        .lte('auction_start_date', now)
        .gte('auction_end_date', now)
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
        .order('bid_amount', { ascending: false })
        .limit(10);

      if (error) throw error;
      setBids(data || []);
    } catch (error) {
      console.error('Erro ao carregar lances:', error);
    }
  };

  const submitBid = async () => {
    if (!selectedProduct) return;

    const minBid = (selectedProduct.current_bid || selectedProduct.starting_bid || 0) + (selectedProduct.bid_increment || 1);
    
    if (bidForm.bid_amount < minBid) {
      toast({
        title: "Lance inválido",
        description: `O lance mínimo é R$ ${minBid.toFixed(2)}`,
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('auction_bids')
        .insert({
          product_id: selectedProduct.id,
          bidder_name: bidForm.bidder_name,
          bidder_email: bidForm.bidder_email,
          bidder_phone: bidForm.bidder_phone,
          bid_amount: bidForm.bid_amount
        });

      if (error) throw error;

      toast({
        title: "Lance enviado!",
        description: "Seu lance foi registrado com sucesso."
      });

      // Recarregar dados
      await Promise.all([
        loadActiveAuctions(),
        loadBids(selectedProduct.id)
      ]);

      setDialogOpen(false);
      setBidForm({
        bidder_name: '',
        bidder_email: '',
        bidder_phone: '',
        bid_amount: 0
      });
    } catch (error) {
      console.error('Erro ao enviar lance:', error);
      toast({
        title: "Erro ao enviar lance",
        description: "Não foi possível registrar seu lance. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
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

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getMinimumBid = (product: Product) => {
    return (product.current_bid || product.starting_bid || 0) + (product.bid_increment || 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Leilões - SuperLoja"
        description="Participe dos nossos leilões online e encontre produtos únicos com preços especiais."
        keywords="leilão, leilões online, ofertas, produtos únicos"
      />
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Leilões Ativos</h1>
          <p className="text-xl text-muted-foreground">
            Participe dos nossos leilões e garanta produtos únicos
          </p>
        </div>

        {products.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Gavel className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Nenhum leilão ativo</h2>
              <p className="text-muted-foreground">
                No momento não há leilões ativos. Volte em breve!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <Badge className="absolute top-2 right-2 bg-red-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {product.auction_end_date && formatTimeRemaining(product.auction_end_date)}
                  </Badge>
                </div>
                
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  {product.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Lance Atual:</span>
                      <span className="text-xl font-bold text-primary">
                        R$ {(product.current_bid || product.starting_bid || 0).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Próximo lance:</span>
                      <span className="font-medium">
                        R$ {getMinimumBid(product).toFixed(2)}
                      </span>
                    </div>
                    
                    {product.auction_end_date && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Termina em:</span>
                        <span className="font-medium text-orange-600">
                          {formatTimeRemaining(product.auction_end_date)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        setSelectedProduct(product);
                        setDialogOpen(true);
                      }}
                    >
                      <Gavel className="w-4 h-4 mr-2" />
                      Dar Lance
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedProduct(product);
                        loadBids(product.id);
                      }}
                    >
                      <TrendingUp className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog para dar lance */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Dar Lance - {selectedProduct?.name}</DialogTitle>
            </DialogHeader>
            
            {selectedProduct && (
              <div className="space-y-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Lance Atual</div>
                  <div className="text-2xl font-bold text-primary">
                    R$ {(selectedProduct.current_bid || selectedProduct.starting_bid || 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Lance mínimo: R$ {getMinimumBid(selectedProduct).toFixed(2)}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bidder_name">Nome Completo</Label>
                    <Input
                      id="bidder_name"
                      value={bidForm.bidder_name}
                      onChange={(e) => setBidForm({...bidForm, bidder_name: e.target.value})}
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bidder_email">E-mail</Label>
                    <Input
                      id="bidder_email"
                      type="email"
                      value={bidForm.bidder_email}
                      onChange={(e) => setBidForm({...bidForm, bidder_email: e.target.value})}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bidder_phone">Telefone</Label>
                    <Input
                      id="bidder_phone"
                      value={bidForm.bidder_phone}
                      onChange={(e) => setBidForm({...bidForm, bidder_phone: e.target.value})}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bid_amount">Valor do Lance</Label>
                    <Input
                      id="bid_amount"
                      type="number"
                      step="0.01"
                      min={getMinimumBid(selectedProduct)}
                      value={bidForm.bid_amount}
                      onChange={(e) => setBidForm({...bidForm, bid_amount: parseFloat(e.target.value) || 0})}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={submitBid}
                    disabled={submitting || !bidForm.bidder_name || !bidForm.bidder_email || bidForm.bid_amount < getMinimumBid(selectedProduct)}
                  >
                    {submitting ? 'Enviando...' : 'Confirmar Lance'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Histórico de lances */}
        {selectedProduct && bids.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Histórico de Lances - {selectedProduct.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bids.map((bid, index) => (
                  <div key={bid.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        bid.is_winning ? 'bg-green-500' : 'bg-gray-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{bid.bidder_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(bid.bid_time), { addSuffix: true, locale: ptBR })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        R$ {bid.bid_amount.toFixed(2)}
                      </div>
                      {bid.is_winning && (
                        <Badge variant="default" className="text-xs">
                          Vencendo
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Leiloes;