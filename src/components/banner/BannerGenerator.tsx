import html2canvas from 'html2canvas';
import { toast } from '@/components/ui/use-toast';

export interface GenerateImageResult {
  blob: Blob;
  dataUrl: string;
}

export const generateBannerImage = async (
  bannerRef: React.RefObject<HTMLDivElement>,
  settings: { width: number; height: number }
): Promise<GenerateImageResult | null> => {
  if (!bannerRef.current) {
    toast({
      variant: 'destructive',
      title: 'Erro',
      description: 'Elemento do banner não encontrado.',
    });
    return null;
  }

  try {
    toast({
      title: 'Processando imagem...',
      description: 'Estamos a preparar o seu banner.',
    });

    // Remove transformação de escala temporariamente
    const originalTransform = bannerRef.current.style.transform;
    const originalBorder = bannerRef.current.style.border;
    const originalBorderRadius = bannerRef.current.style.borderRadius;
    
    bannerRef.current.style.transform = 'none';
    bannerRef.current.style.border = 'none';
    bannerRef.current.style.borderRadius = '0';

    const canvas = await html2canvas(bannerRef.current, {
      width: settings.width,
      height: settings.height,
      scale: 1,
      useCORS: true,
      backgroundColor: null,
      logging: false,
      allowTaint: true,
      imageTimeout: 15000,
      foreignObjectRendering: true,
      removeContainer: false,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.querySelector('#banner-element') as HTMLElement;
        if (clonedElement) {
          // Força as dimensões exatas e remove transformações
          clonedElement.style.width = `${settings.width}px`;
          clonedElement.style.height = `${settings.height}px`;
          clonedElement.style.transform = 'none';
          clonedElement.style.scale = '1';
          clonedElement.style.position = 'relative';
          clonedElement.style.overflow = 'hidden';
          clonedElement.style.margin = '0';
          clonedElement.style.padding = `${Math.max(20, settings.height * 0.05)}px`;
          clonedElement.style.boxSizing = 'border-box';
          clonedElement.style.borderRadius = '0';
          clonedElement.style.border = 'none';
        }
      }
    });

    // Restaura a transformação original
    bannerRef.current.style.transform = originalTransform;
    bannerRef.current.style.border = originalBorder;
    bannerRef.current.style.borderRadius = originalBorderRadius;

    // Gera um dataURL para uso direto
    const dataUrl = canvas.toDataURL('image/png', 1.0);

    // Também gera um blob para outros usos
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/png', 1.0);
    });

    if (!blob) {
      throw new Error('Falha ao gerar a imagem');
    }

    toast({
      title: 'Imagem processada com sucesso!',
      description: 'Banner pronto para download.',
    });

    return { blob, dataUrl };

  } catch (error) {
    console.error('Erro ao processar imagem:', error);
    toast({
      variant: 'destructive',
      title: 'Erro ao processar imagem',
      description: 'Não foi possível criar o banner. Por favor, tente novamente.',
    });
    
    // Restaura estilos originais em caso de erro
    if (bannerRef.current) {
      bannerRef.current.style.transform = bannerRef.current.style.transform || 'none';
      bannerRef.current.style.border = bannerRef.current.style.border || '';
      bannerRef.current.style.borderRadius = bannerRef.current.style.borderRadius || '';
    }
    
    return null;
  }
};

export const downloadBannerImage = async (
  bannerRef: React.RefObject<HTMLDivElement>,
  settings: { width: number; height: number }
): Promise<void> => {
  const result = await generateBannerImage(bannerRef, settings);

  if (result) {
    // Cria um objeto URL para o Blob
    const url = URL.createObjectURL(result.blob);

    // Cria um link para download
    const link = document.createElement('a');
    link.href = url;
    link.download = `banner-produto-${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Libera o objeto URL após uso
    setTimeout(() => URL.revokeObjectURL(url), 100);

    toast({
      title: 'Banner baixado com sucesso!',
      description: 'O arquivo foi salvo na sua pasta de downloads.',
    });
  }
};

export const shareBannerImage = async (
  bannerRef: React.RefObject<HTMLDivElement>,
  settings: { width: number; height: number },
  platform: 'facebook' | 'instagram' | 'whatsapp',
  productData: { title: string; price: string }
): Promise<void> => {
  // Gera a imagem
  const result = await generateBannerImage(bannerRef, settings);

  if (!result) {
    toast({
      variant: 'destructive',
      title: 'Erro ao compartilhar',
      description: 'Não foi possível gerar a imagem para compartilhamento.',
    });
    return;
  }

  try {
    // Texto para compartilhamento
    const shareText = `${productData.title} - AOA ${productData.price} | Confira este produto em nossa loja!`;

    // Cria um objeto URL para o Blob (para download)
    const blobUrl = URL.createObjectURL(result.blob);

    // Abre a janela de compartilhamento de acordo com a plataforma
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareText)}`, '_blank', 'width=600,height=400');
        
        // Também baixamos a imagem para o usuário adicionar manualmente
        const fbLink = document.createElement('a');
        fbLink.href = blobUrl;
        fbLink.download = `facebook-banner-${new Date().getTime()}.png`;
        document.body.appendChild(fbLink);
        fbLink.click();
        document.body.removeChild(fbLink);

        toast({
          title: 'Imagem baixada para Facebook',
          description: 'Adicione esta imagem ao seu post no Facebook manualmente.',
        });
        break;
        
      case 'instagram':
        toast({
          variant: 'default',
          title: 'Compartilhamento para Instagram',
          description: 'A imagem foi baixada. Faça upload manualmente no Instagram.',
        });
        const igLink = document.createElement('a');
        igLink.href = blobUrl;
        igLink.download = `instagram-banner-${new Date().getTime()}.png`;
        document.body.appendChild(igLink);
        igLink.click();
        document.body.removeChild(igLink);
        break;
        
      case 'whatsapp':
        // Para WhatsApp, baixamos a imagem e abrimos o compartilhamento com o texto
        const waLink = document.createElement('a');
        waLink.href = blobUrl;
        waLink.download = `whatsapp-banner-${new Date().getTime()}.png`;
        document.body.appendChild(waLink);
        waLink.click();
        document.body.removeChild(waLink);

        // Abrimos WhatsApp com o texto
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank', 'width=600,height=400');

        toast({
          title: 'Imagem baixada para WhatsApp',
          description: 'Adicione esta imagem à sua conversa no WhatsApp manualmente.',
        });
        break;
    }

    // Libera o objeto URL após uso
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

  } catch (error) {
    console.error('Erro ao compartilhar:', error);
    toast({
      variant: 'destructive',
      title: 'Erro ao compartilhar',
      description: 'Houve um problema ao processar o compartilhamento. Tente novamente.',
    });
  }
};