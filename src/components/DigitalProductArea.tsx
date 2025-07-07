import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Key, Service, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DigitalProduct {
  id: string;
  name: string;
  product_type: string;
  digital_file_url: string | null;
  license_key: string | null;
  download_limit: number | null;
}

interface DigitalProductAreaProps {
  orders: any[];
}

export const DigitalProductArea: React.FC<DigitalProductAreaProps> = ({ orders }) => {
  const [digitalProducts, setDigitalProducts] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDigitalProducts();
  }, [orders]);

  const loadDigitalProducts = async () => {
    if (!orders.length) return;
    
    setLoading(true);
    try {
      const orderIds = orders.map(order => order.id);
      
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          products:product_id (
            id,
            name,
            product_type,
            digital_file_url,
            license_key,
            download_limit,
            is_digital
          )
        `)
        .in('order_id', orderIds);

      if (error) throw error;

      const digitalItems = orderItems
        ?.filter(item => item.products?.is_digital || 
                        item.products?.product_type === 'digital' ||
                        item.products?.product_type === 'service')
        .map(item => item.products) || [];

      setDigitalProducts(digitalItems);
    } catch (error) {
      console.error('Erro ao carregar produtos digitais:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (product: DigitalProduct) => {
    if (!product.digital_file_url) {
      toast({
        title: "Arquivo não disponível",
        description: "O arquivo digital não está disponível para download.",
        variant: "destructive"
      });
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = product.digital_file_url;
      link.download = product.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download iniciado",
        description: `Download de ${product.name} foi iniciado.`
      });
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Não foi possível fazer o download do arquivo.",
        variant: "destructive"
      });
    }
  };

  const copyLicenseKey = (licenseKey: string) => {
    navigator.clipboard.writeText(licenseKey);
    toast({
      title: "Chave copiada",
      description: "A chave de licença foi copiada para a área de transferência."
    });
  };

  const getProductIcon = (productType: string) => {
    switch (productType) {
      case 'digital':
        return <Download className="w-5 h-5" />;
      case 'service':
        return <Service className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (digitalProducts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Você não possui produtos digitais ou serviços.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {digitalProducts.map((product) => (
        <Card key={product.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getProductIcon(product.product_type)}
              {product.name}
              <Badge variant="secondary">
                {product.product_type === 'digital' ? 'Digital' : 
                 product.product_type === 'service' ? 'Serviço' : 'Produto'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Download de arquivo digital */}
            {product.digital_file_url && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Arquivo Digital</span>
                  {product.download_limit && (
                    <Badge variant="outline" className="text-xs">
                      Limite: {product.download_limit}
                    </Badge>
                  )}
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleDownload(product)}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Baixar
                </Button>
              </div>
            )}

            {/* Chave de licença */}
            {product.license_key && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Chave de Licença</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-background px-2 py-1 rounded border">
                    {product.license_key}
                  </code>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyLicenseKey(product.license_key!)}
                  >
                    Copiar
                  </Button>
                </div>
              </div>
            )}

            {/* Serviços */}
            {product.product_type === 'service' && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Service className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Serviço Contratado</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Entraremos em contato para agendar o serviço. 
                  Verifique seu email e telefone regularmente.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};