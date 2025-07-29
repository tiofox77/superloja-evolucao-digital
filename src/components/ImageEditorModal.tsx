import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sun, 
  Contrast, 
  Palette, 
  Scissors, 
  Download, 
  RotateCcw,
  Wand2,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Loader2,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { pipeline, env } from '@huggingface/transformers';
import { supabase } from '@/integrations/supabase/client';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = false;

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onImageUpdate: (newImageUrl: string) => void;
}

const MAX_IMAGE_DIMENSION = 1024;

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  onImageUpdate
}) => {
  const [editedImage, setEditedImage] = useState<string>(imageUrl);
  const [originalImage, setOriginalImage] = useState<string>(imageUrl);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [hue, setHue] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Load image to canvas
  const loadImageToCanvas = (imageSrc: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Resize if needed
      let { width, height } = img;
      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
          width = MAX_IMAGE_DIMENSION;
        } else {
          width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
          height = MAX_IMAGE_DIMENSION;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      applyFilters();
    };
    img.src = imageSrc;
  };

  // Apply filters to canvas
  const applyFilters = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply CSS filters
    ctx.filter = `
      brightness(${brightness}%) 
      contrast(${contrast}%) 
      saturate(${saturation}%) 
      hue-rotate(${hue}deg)
    `;

    // Get original image and redraw with filters
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Update edited image state
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setEditedImage(dataUrl);
    };
    img.src = originalImage;
  };

  // Remove background using Hugging Face transformers
  const removeBackground = async () => {
    setLoading(true);
    setProgress(20);

    try {
      toast({
        title: "🎯 Removendo fundo...",
        description: "Processando imagem com IA avançada"
      });

      setProgress(40);

      // Use a better model specifically for background removal
      const segmenter = await pipeline('image-segmentation', 'Xenova/detr-resnet-50-panoptic', {
        device: 'webgpu',
      });

      setProgress(60);

      // Create a temporary canvas to get the current edited image
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) throw new Error('Não foi possível obter contexto do canvas');

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        // Preserve original dimensions for better quality
        tempCanvas.width = img.naturalWidth;
        tempCanvas.height = img.naturalHeight;
        tempCtx.drawImage(img, 0, 0);

        // Get high quality image data
        const currentImageData = tempCanvas.toDataURL('image/png', 1.0);

        try {
          // Process with advanced segmentation
          const result = await segmenter(currentImageData);

          if (!result || !Array.isArray(result) || result.length === 0) {
            throw new Error('Resultado de segmentação inválido');
          }

          setProgress(80);

          // Find the main object (usually the largest non-background segment)
          let mainObjectMask = null;
          let maxScore = 0;

          for (const segment of result) {
            if (segment.label && !segment.label.toLowerCase().includes('background') && 
                !segment.label.toLowerCase().includes('wall') &&
                !segment.label.toLowerCase().includes('floor') &&
                segment.score > maxScore) {
              maxScore = segment.score;
              mainObjectMask = segment.mask;
            }
          }

          if (!mainObjectMask) {
            // Fallback: use the first segment with highest score
            const sortedResults = result.sort((a, b) => (b.score || 0) - (a.score || 0));
            mainObjectMask = sortedResults[0]?.mask;
          }

          if (!mainObjectMask) {
            throw new Error('Não foi possível identificar o objeto principal');
          }

          // Create output canvas for masked image
          const outputCanvas = document.createElement('canvas');
          const outputCtx = outputCanvas.getContext('2d');
          if (!outputCtx) throw new Error('Não foi possível obter contexto de saída');

          outputCanvas.width = tempCanvas.width;
          outputCanvas.height = tempCanvas.height;
          outputCtx.drawImage(tempCanvas, 0, 0);

          // Apply mask with smoothing
          const imageData = outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
          const data = imageData.data;
          const maskData = mainObjectMask.data;

          for (let i = 0; i < maskData.length; i++) {
            // Use the mask directly (higher values = keep, lower = remove)
            const alpha = Math.round(maskData[i] * 255);
            data[i * 4 + 3] = alpha;
          }

          outputCtx.putImageData(imageData, 0, 0);
          
          const finalImage = outputCanvas.toDataURL('image/png', 1.0);
          setEditedImage(finalImage);
          setOriginalImage(finalImage);
          
          setProgress(100);
          
          toast({
            title: "✅ Fundo removido com IA avançada!",
            description: "Processamento inteligente concluído"
          });

        } catch (segmentError) {
          console.error('Erro na segmentação:', segmentError);
          throw new Error('Falha no processamento de IA. Tente com uma imagem diferente.');
        }

        setLoading(false);
        setProgress(0);
      };

      img.onerror = () => {
        throw new Error('Erro ao carregar imagem para processamento');
      };

      img.src = editedImage;

    } catch (error: any) {
      console.error('Erro na remoção de fundo:', error);
      toast({
        title: "❌ Erro ao remover fundo",
        description: error.message || "Tente com uma imagem de melhor qualidade",
        variant: "destructive"
      });
      setLoading(false);
      setProgress(0);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setHue(0);
    setEditedImage(originalImage);
  };

  // Upload edited image
  const uploadEditedImage = async () => {
    setLoading(true);
    try {
      // Convert data URL to blob
      const response = await fetch(editedImage);
      const blob = await response.blob();

      const fileName = `edited_${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(`products/${fileName}`, blob);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path);

      onImageUpdate(publicUrl);
      onClose();

      toast({
        title: "✅ Imagem atualizada!",
        description: "As edições foram salvas com sucesso"
      });

    } catch (error: any) {
      toast({
        title: "❌ Erro ao salvar",
        description: error.message || "Não foi possível salvar a imagem",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load image when modal opens
  React.useEffect(() => {
    if (isOpen && imageUrl) {
      setEditedImage(imageUrl);
      setOriginalImage(imageUrl);
      loadImageToCanvas(imageUrl);
    }
  }, [isOpen, imageUrl]);

  // Apply filters when values change
  React.useEffect(() => {
    if (isOpen) {
      applyFilters();
    }
  }, [brightness, contrast, saturation, hue, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            🎨 Editor de Imagem com IA
          </DialogTitle>
        </DialogHeader>

        {loading && progress > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processando...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preview */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Preview da Imagem
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative bg-gray-50 rounded-lg overflow-hidden">
                  <img 
                    src={editedImage} 
                    alt="Preview" 
                    className="w-full h-auto max-h-96 object-contain mx-auto"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={removeBackground}
                disabled={loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
                Remover Fundo
              </Button>

              <Button 
                onClick={resetFilters}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Resetar
              </Button>

              <Button 
                onClick={uploadEditedImage}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Salvar Edições
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wand2 className="w-5 h-5" />
                  Ajustes
                </CardTitle>
                <CardDescription>
                  Use os controles abaixo para ajustar a imagem
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Brightness */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Sun className="w-4 h-4" />
                      Brilho
                    </Label>
                    <Badge variant="secondary">{brightness}%</Badge>
                  </div>
                  <Slider
                    value={[brightness]}
                    onValueChange={(value) => setBrightness(value[0])}
                    min={0}
                    max={200}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Contrast */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Contrast className="w-4 h-4" />
                      Contraste
                    </Label>
                    <Badge variant="secondary">{contrast}%</Badge>
                  </div>
                  <Slider
                    value={[contrast]}
                    onValueChange={(value) => setContrast(value[0])}
                    min={0}
                    max={200}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Saturation */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Saturação
                    </Label>
                    <Badge variant="secondary">{saturation}%</Badge>
                  </div>
                  <Slider
                    value={[saturation]}
                    onValueChange={(value) => setSaturation(value[0])}
                    min={0}
                    max={200}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Hue */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Matiz</Label>
                    <Badge variant="secondary">{hue}°</Badge>
                  </div>
                  <Slider
                    value={[hue]}
                    onValueChange={(value) => setHue(value[0])}
                    min={-180}
                    max={180}
                    step={5}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* AI Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Ferramentas IA
                </CardTitle>
                <CardDescription>
                  Processamento avançado com inteligência artificial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={removeBackground}
                  disabled={loading}
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
                  Remover Fundo com IA
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={uploadEditedImage}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Salvar Edições
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};