import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gavel, Clock, User, Trophy, Ban, CheckCircle, Eye, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Product {
  id: string;
  name: string;
  current_bid: number | null;
  starting_bid: number | null;
  auction_start_date: string | null;
  auction_end_date: string | null;
  is_auction: boolean;
  active: boolean;
}

interface AuctionBid {
  id: string;
  product_id: string;
  bidder_name: string;
  bidder_email: string;
  bidder_phone: string | null;
  bid_amount: number;
  bid_time: string;
  is_winning: boolean;
  product?: Product;
}

const AdminLeiloesBids = () => {
  const [auctions, setAuctions] = useState<Product[]>([]);
  const [bids, setBids] = useState<AuctionBid[]>([]);
  const [selectedAuction, setSelectedAuction] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedBid, setSelectedBid] = useState<AuctionBid | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAuctions();
    loadBids();
  }, []);

  const loadAuctions = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_auction', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAuctions(data || []);
    } catch (error) {
      console.error('Error loading auctions:', error);
      toast({
        title: "Erro ao carregar leilões",
        description: "Não foi possível carregar os leilões.",
        variant: "destructive"
      });
    }
  };

  const loadBids = async () => {
    try {
      const { data, error } = await supabase
        .from('auction_bids')
        .select(`
          *,
          products!inner(
            id,
            name,
            current_bid,
            starting_bid,
            auction_start_date,
            auction_end_date,
            is_auction,
            active
          )
        `)
        .order('bid_time', { ascending: false });

      if (error) throw error;
      setBids(data?.map(bid => ({ ...bid, product: bid.products })) || []);
    } catch (error) {
      console.error('Error loading bids:', error);
      toast({
        title: "Erro ao carregar lances",
        description: "Não foi possível carregar os lances.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const closeAuction = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          active: false,
          auction_end_date: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Leilão encerrado!",
        description: "O leilão foi encerrado com sucesso."
      });

      // Reload data
      await Promise.all([loadAuctions(), loadBids()]);
    } catch (error) {
      console.error('Error closing auction:', error);
      toast({
        title: "Erro ao encerrar leilão",
        description: "Não foi possível encerrar o leilão.",
        variant: "destructive"
      });
    }
  };

  const updateBidStatus = async (bidId: string, isWinning: boolean) => {
    try {
      const { error } = await supabase
        .from('auction_bids')
        .update({ is_winning: isWinning })
        .eq('id', bidId);

      if (error) throw error;

      toast({
        title: "Status atualizado!",
        description: `Lance ${isWinning ? 'marcado como vencedor' : 'removido da vitória'}.`
      });

      await loadBids();
    } catch (error) {
      console.error('Error updating bid status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status do lance.",
        variant: "destructive"
      });
    }
  };

  const formatTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Finalizado';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Menos de 1h';
  };

  const filteredBids = selectedAuction === 'all' 
    ? bids 
    : bids.filter(bid => bid.product_id === selectedAuction);

  const getAuctionStats = () => {
    return {
      total: auctions.length,
      active: auctions.filter(a => a.active && new Date(a.auction_end_date || '') > new Date()).length,
      ended: auctions.filter(a => !a.active || new Date(a.auction_end_date || '') <= new Date()).length,
      totalBids: bids.length,
    };
  };

  const stats = getAuctionStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Leilões</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie leilões, lances e encerramentos
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Leilões</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-muted-foreground">Ativos</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.ended}</div>
              <div className="text-sm text-muted-foreground">Finalizados</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalBids}</div>
              <div className="text-sm text-muted-foreground">Total Lances</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auction Filter */}
      <div className="flex gap-4">
        <Select value={selectedAuction} onValueChange={setSelectedAuction}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filtrar por leilão" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os leilões</SelectItem>
            {auctions.map((auction) => (
              <SelectItem key={auction.id} value={auction.id}>
                {auction.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Auctions Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Leilões Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {auctions.filter(auction => auction.active && new Date(auction.auction_end_date || '') > new Date()).map((auction) => (
              <div key={auction.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold">{auction.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span>Lance atual: {(auction.current_bid || auction.starting_bid || 0).toFixed(2)} Kz</span>
                    <span>Total de lances: {bids.filter(b => b.product_id === auction.id).length}</span>
                    {auction.auction_end_date && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeRemaining(auction.auction_end_date)}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => closeAuction(auction.id)}
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Encerrar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bids List */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Lances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredBids.map((bid) => (
              <div key={bid.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{bid.product?.name}</h3>
                    {bid.is_winning && (
                      <Badge className="bg-green-500">
                        <Trophy className="w-3 h-3 mr-1" />
                        Vencedor
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Licitante:</span> {bid.bidder_name}
                    </div>
                    <div>
                      <span className="font-medium">Valor:</span> {bid.bid_amount.toFixed(2)} Kz
                    </div>
                    <div>
                      <span className="font-medium">Data:</span> {
                        format(new Date(bid.bid_time), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                      }
                    </div>
                    <div>
                      <span className="font-medium">Contato:</span> {bid.bidder_email}
                      {bid.bidder_phone && <div className="text-xs">📱 {bid.bidder_phone}</div>}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedBid(bid)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Detalhes do Lance</DialogTitle>
                      </DialogHeader>
                      {selectedBid && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="font-semibold">Produto</Label>
                              <p>{selectedBid.product?.name}</p>
                            </div>
                            <div>
                              <Label className="font-semibold">Valor do Lance</Label>
                              <p className="text-2xl font-bold text-primary">
                                {selectedBid.bid_amount.toFixed(2)} Kz
                              </p>
                            </div>
                            <div>
                              <Label className="font-semibold">Licitante</Label>
                              <p>{selectedBid.bidder_name}</p>
                            </div>
                            <div>
                              <Label className="font-semibold">Email</Label>
                              <p>{selectedBid.bidder_email}</p>
                            </div>
                            <div>
                              <Label className="font-semibold">Telefone</Label>
                              <p>{selectedBid.bidder_phone || 'Não informado'}</p>
                            </div>
                            <div>
                              <Label className="font-semibold">Data/Hora</Label>
                              <p>{format(new Date(selectedBid.bid_time), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}</p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant={selectedBid.is_winning ? "destructive" : "default"}
                              onClick={() => updateBidStatus(selectedBid.id, !selectedBid.is_winning)}
                            >
                              {selectedBid.is_winning ? (
                                <>
                                  <Ban className="w-4 h-4 mr-2" />
                                  Remover Vitória
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Marcar como Vencedor
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>

          {filteredBids.length === 0 && (
            <div className="text-center py-8">
              <Gavel className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum lance encontrado</h3>
              <p className="text-muted-foreground">
                {selectedAuction === 'all' 
                  ? 'Ainda não há lances registrados.'
                  : 'Não há lances para o leilão selecionado.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLeiloesBids;