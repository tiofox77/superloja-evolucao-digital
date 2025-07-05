import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Wand2, 
  Search, 
  Download, 
  Sparkles, 
  ImageIcon, 
  Loader2,
  RefreshCw,
  Palette,
  Sun
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageAIEditorProps {
  productName: string;
  onImageSelect: (imageUrl: string) => void;
}

const ImageAIEditor: React.FC<ImageAIEditorProps> = ({ productName, onImageSelect }) => {
  const [searchQuery, setSearchQuery] = useState(productName);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enhanceLoading, setEnhanceLoading] = useState(false);
  const { toast } = useToast();

  const searchProductImages = async () => {
    setLoading(true);
    try {
      // Buscar imagens reais baseadas no nome do produto
      const query = encodeURIComponent(searchQuery);
      
      // Simular API de busca mais realista
      const categories = {
        'smartphone': ['phone', 'mobile', 'smartphone', 'celular'],
        'laptop': ['laptop', 'notebook', 'computer'],
        'headphone': ['headphone', 'fone', 'audio'],
        'tablet': ['tablet', 'ipad'],
        'watch': ['watch', 'smartwatch', 'relógio'],
        'camera': ['camera', 'foto']
      };
      
      let searchTerms = [searchQuery.toLowerCase()];
      
      // Detectar categoria e adicionar termos relacionados
      for (const [category, terms] of Object.entries(categories)) {
        if (terms.some(term => searchQuery.toLowerCase().includes(term))) {
          searchTerms = [...searchTerms, ...terms];
          break;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Gerar URLs mais relevantes baseadas nos termos de busca
      const baseQueries = searchTerms.slice(0, 4);
      const mockResults = baseQueries.map((term, index) => ({
        url: `https://images.unsplash.com/photo-${1500000000 + index * 100000000}?w=400&h=400&fit=crop&q=${term}`,
        title: `${searchQuery} - ${term} (${index + 1})`,
        source: 'Unsplash',
        relevance: Math.floor(Math.random() * 30) + 70 // 70-100% relevância
      }));
      
      setSuggestions(mockResults);
      
      toast({
        title: "Busca concluída!",
        description: `Encontradas ${mockResults.length} imagens relevantes para "${searchQuery}"`
      });
    } catch (error) {
      toast({
        title: "Erro na busca",
        description: "Não foi possível buscar imagens no momento.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const enhanceWithAI = async (imageUrl: string, enhancement: string) => {
    setEnhanceLoading(true);
    try {
      // Simular processamento de IA (em produção, usar API real)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Por enquanto retornar a mesma imagem com parâmetros modificados
      const enhancedUrl = imageUrl + '&auto=enhance&sat=15&con=10';
      
      toast({
        title: "Imagem melhorada!",
        description: `Aplicado: ${enhancement}`,
      });
      
      return enhancedUrl;
    } catch (error) {
      toast({
        title: "Erro no processamento",
        description: "Não foi possível processar a imagem.",
        variant: "destructive"
      });
      return imageUrl;
    } finally {
      setEnhanceLoading(false);
    }
  };

  const enhancements = [
    { id: 'brightness', label: 'Melhorar Brilho', icon: Sun },
    { id: 'contrast', label: 'Aumentar Contraste', icon: Palette },
    { id: 'quality', label: 'Melhorar Qualidade', icon: Sparkles },
    { id: 'background', label: 'Remover Fundo', icon: RefreshCw }
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Wand2 className="w-4 h-4" />
          IA Editor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Editor de Imagens com IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Buscar Imagens
              </TabsTrigger>
              <TabsTrigger value="enhance" className="flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                Melhorar com IA
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="search">Buscar imagens para o produto</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ex: smartphone, tênis esportivo, etc..."
                      onKeyPress={(e) => e.key === 'Enter' && searchProductImages()}
                    />
                    <Button 
                      onClick={searchProductImages} 
                      disabled={loading || !searchQuery.trim()}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {suggestions.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-3">Sugestões de Imagens ({suggestions.length})</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {suggestions.map((suggestion, index) => (
                        <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
                          <CardContent className="p-3">
                            <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-2">
                              <img
                                src={suggestion.url}
                                alt={suggestion.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm font-medium line-clamp-1">{suggestion.title}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {suggestion.source}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {suggestion.relevance}% relevante
                                  </Badge>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    onImageSelect(suggestion.url);
                                    toast({
                                      title: "Imagem selecionada!",
                                      description: "A imagem foi adicionada ao produto."
                                    });
                                  }}
                                >
                                  <Download className="w-3 h-3 mr-1" />
                                  Usar
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="enhance" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-3">Melhoramentos Disponíveis</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Selecione uma imagem já carregada e aplique melhoramentos com IA:
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {enhancements.map((enhancement) => {
                      const Icon = enhancement.icon;
                      return (
                        <Button
                          key={enhancement.id}
                          variant="outline"
                          className="h-auto p-4 flex-col gap-2"
                          disabled={enhanceLoading}
                          onClick={() => {
                            toast({
                              title: "Funcionalidade em desenvolvimento",
                              description: "Esta funcionalidade será implementada em breve!",
                            });
                          }}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-sm">{enhancement.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Funcionalidades de IA</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          • Melhoria automática de qualidade e cores<br/>
                          • Remoção inteligente de fundo<br/>
                          • Ajuste automático de brilho e contraste<br/>
                          • Busca inteligente de imagens similares
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageAIEditor;