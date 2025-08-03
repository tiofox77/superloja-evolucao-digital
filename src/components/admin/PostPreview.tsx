import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Image, Smartphone, Monitor } from 'lucide-react';

interface PostPreviewProps {
  content: string;
  platform: string;
  productData?: {
    name: string;
    price: number;
    image_url?: string;
  };
  postType: string;
  hasBanner?: boolean;
}

export const PostPreview: React.FC<PostPreviewProps> = ({
  content,
  platform,
  productData,
  postType,
  hasBanner = false
}) => {
  const getPlatformInfo = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return { name: 'Facebook', color: 'bg-blue-500', icon: '📘' };
      case 'instagram':
        return { name: 'Instagram', color: 'bg-pink-500', icon: '📷' };
      default:
        return { name: 'Facebook + Instagram', color: 'bg-purple-500', icon: '🚀' };
    }
  };

  const platInfo = getPlatformInfo(platform);

  return (
    <div className="space-y-4">
      {/* Header do Preview */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{platInfo.icon}</span>
          <Badge className={`${platInfo.color} text-white`}>
            {platInfo.name}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {postType}
          </Badge>
        </div>
        {hasBanner && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Image className="h-3 w-3" />
            Banner Incluído
          </Badge>
        )}
      </div>

      {/* Simulação do Post */}
      <Card className="border-2 border-dashed border-muted-foreground/30">
        <CardContent className="p-4">
          {/* Header da Simulação */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
              SL
            </div>
            <div>
              <p className="font-semibold text-sm">SuperLoja Angola</p>
              <p className="text-xs text-muted-foreground">agora • 🌐</p>
            </div>
          </div>

          {/* Conteúdo do Post */}
          <div className="space-y-4">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
            
            {/* Banner/Imagem Simulada */}
            {hasBanner && productData && (
              <div className="border rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                <div className="aspect-square relative bg-primary/20 flex items-center justify-center">
                  {productData.image_url ? (
                    <div className="relative w-full h-full">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg" />
                      <div className="absolute bottom-4 left-4 text-white">
                        <h3 className="font-bold text-lg">{productData.name}</h3>
                        <p className="text-xl font-bold">{productData.price.toLocaleString()} AOA</p>
                      </div>
                      <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-lg p-2">
                        <span className="text-xs font-medium text-white">SuperLoja</span>
                      </div>
                      <Image className="absolute bottom-4 right-4 h-8 w-8 text-white/80" />
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <Image className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Banner promocional</p>
                      <p className="text-lg font-bold mt-2">{productData.name}</p>
                      <p className="text-xl font-bold text-primary">{productData.price.toLocaleString()} AOA</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer da Simulação */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-muted">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                👍 <span>Curtir</span>
              </span>
              <span className="flex items-center gap-1">
                💬 <span>Comentar</span>
              </span>
              <span className="flex items-center gap-1">
                📤 <span>Compartilhar</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações Adicionais */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Monitor className="h-3 w-3" />
          <span>Otimizado para desktop</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Smartphone className="h-3 w-3" />
          <span>Compatível com mobile</span>
        </div>
      </div>
    </div>
  );
};