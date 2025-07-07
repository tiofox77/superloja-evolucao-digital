import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Gavel, Clock, TrendingUp, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  slug: string;
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

const LeilaoDetalhes = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [bids, setBids] = useState<AuctionBid[]>([]);
  const [user, setUser] = useState<SupabaseUser | null>(null);
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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    if (slug) {
      loadProduct();
    }

    return () => subscription.unsubscribe();
  }, [slug]);

  useEffect(() => {
    if (product && user) {
      loadBids(product.id);
      const minBid = (product.current_bid || product.starting_bid || 0) + (product.bid_increment || 1);
      setBidForm(prev => ({ 
        ...prev, 
        bid_amount: minBid,
        bidder_name: user.user_metadata?.full_name || '',
        bidder_email: user.email || ''
      }));
    }
  }, [product, user]);

  const loadProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('is_auction', true)
        .eq('active', true)
        .single();

      if (error) throw error;
      setProduct(data);
      
      if (data) {
        loadBids(data.id);
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do leilão.",
        variant: "destructive"
      });
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
        .limit(20);

      if (error) throw error;
      setBids(data || []);
    } catch (error) {
      console.error('Erro ao carregar lances:', error);
    }
  };

  const submitBid = async () => {
    if (!product || !user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para dar lances.",
        variant: "destructive"
      });
      return;
    }

    const minBid = (product.current_bid || product.starting_bid || 0) + (product.bid_increment || 1);
    
    if (bidForm.bid_amount < minBid) {
      toast({
        title: "Lance inválido",
        description: `O lance mínimo é ${minBid.toFixed(2)} Kz`,
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('auction_bids')
        .insert({
          product_id: product.id,
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
        loadProduct(),
        loadBids(product.id)
      ]);

      setDialogOpen(false);
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

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <h2 className="text-xl font-semibold mb-2">Leilão não encontrado</h2>
              <p className="text-muted-foreground mb-4">
                O leilão que você procura não existe ou foi finalizado.
              </p>
              <Button asChild>
                <Link to="/leiloes">Voltar aos Leilões</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {product && (
        <SEOHead 
          pageType="product"
          pageSlug={product.slug}
          title={`${product.name} - Leilão Ativo - SuperLoja`}
          description={product.description || `Participe do leilão do produto ${product.name}. Lance atual: ${(product.current_bid || product.starting_bid || 0).toFixed(2)} Kz`}
          keywords={`leilão, ${product.name}, ofertas, lance, Angola, ${product.auction_end_date ? 'ativo' : 'finalizado'}`}
          ogImage={product.image_url}
          schemaMarkup={{
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.name,
            "description": product.description,
            "image": product.image_url,
            "offers": {
              "@type": "Offer",
              "price": product.current_bid || product.starting_bid || 0,
              "priceCurrency": "AOA",
              "availability": "https://schema.org/InStock",
              "validFrom": product.auction_start_date,
              "validThrough": product.auction_end_date
            },
            "brand": {
              "@type": "Brand",
              "name": "SuperLoja"
            },
            "category": "Auction"
          }}
        />
      )}
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="outline" asChild className="mb-4">
            <Link to="/leiloes">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Leilões
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Imagem do produto */}
          <div>
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-96 object-cover rounded-lg shadow-lg"
              />
            )}
            
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {product.images.slice(1, 5).map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${product.name} ${index + 2}`}
                    className="w-full h-20 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Detalhes do leilão */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-red-500">
                  <Clock className="w-3 h-3 mr-1" />
                  {product.auction_end_date && formatTimeRemaining(product.auction_end_date)}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
              {product.description && (
                <p className="text-muted-foreground text-lg mb-6">
                  {product.description}
                </p>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Informações do Leilão</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Lance Atual:</span>
                    <div className="text-2xl font-bold text-primary">
                      {(product.current_bid || product.starting_bid || 0).toFixed(2)} Kz
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm text-muted-foreground">Próximo lance:</span>
                    <div className="text-xl font-medium">
                      {getMinimumBid(product).toFixed(2)} Kz
                    </div>
                  </div>
                </div>
                
                {product.auction_end_date && (
                  <div>
                    <span className="text-sm text-muted-foreground">Termina em:</span>
                    <div className="font-medium text-orange-600">
                      {formatTimeRemaining(product.auction_end_date)}
                    </div>
                  </div>
                )}

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full"
                      onClick={() => {
                        if (!user) {
                          toast({
                            title: "Login necessário",
                            description: "Você precisa estar logado para dar lances.",
                            variant: "destructive"
                          });
                          return;
                        }
                        setDialogOpen(true);
                      }}
                    >
                      <Gavel className="w-4 h-4 mr-2" />
                      Dar Lance
                    </Button>
                  </DialogTrigger>
                  
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Dar Lance - {product.name}</DialogTitle>
                    </DialogHeader>
                    
                    {!user ? (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Login Necessário</AlertTitle>
                        <AlertDescription>
                          Você precisa estar logado para dar lances. Faça login primeiro.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className="text-sm text-muted-foreground">Lance Atual</div>
                          <div className="text-2xl font-bold text-primary">
                            {(product.current_bid || product.starting_bid || 0).toFixed(2)} Kz
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Lance mínimo: {getMinimumBid(product).toFixed(2)} Kz
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
                              placeholder="+244 900 000 000"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="bid_amount">Valor do Lance (Kz)</Label>
                            <Input
                              id="bid_amount"
                              type="number"
                              step="0.01"
                              min={getMinimumBid(product)}
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
                            disabled={submitting || !bidForm.bidder_name || !bidForm.bidder_email || bidForm.bid_amount < getMinimumBid(product)}
                          >
                            {submitting ? 'Enviando...' : 'Confirmar Lance'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Histórico de lances */}
        {bids.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Histórico de Lances</CardTitle>
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
                        {bid.bid_amount.toFixed(2)} Kz
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

export default LeilaoDetalhes;