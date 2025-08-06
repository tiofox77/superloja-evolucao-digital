import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';

export interface ProductData {
  id: string;
  name: string;
  price: number;
  image_url?: string;
}

export class BannerService {
  static async generateProductBanner(
    product: ProductData, 
    postType: string = 'product'
  ): Promise<string | null> {
    try {
      console.log('Gerando banner para produto:', product.name);
      
      // Configurações baseadas no tipo de post - novos templates
      const templates = [
        { bg: '#8B4FA3', accent: '#9F4F96', name: 'Roxo Clássico' },
        { bg: '#2563EB', accent: '#3B82F6', name: 'Azul Moderno' },
        { bg: '#DC2626', accent: '#EF4444', name: 'Vermelho Energia' },
        { bg: '#059669', accent: '#10B981', name: 'Verde Sucesso' },
        { bg: '#7C3AED', accent: '#8B5CF6', name: 'Violeta Premium' }
      ];
      
      // Selecionar template baseado no hash do produto para consistência
      const templateIndex = product.id ? 
        parseInt(product.id.slice(-1), 16) % templates.length : 
        Math.floor(Math.random() * templates.length);
      
      const selectedTemplate = templates[templateIndex];
      const bgColor = postType === 'promotional' ? '#E86C00' : selectedTemplate.bg;
      const accentColor = postType === 'promotional' ? '#FF6B35' : selectedTemplate.accent;
      
      // Criar elemento do banner
      const bannerElement = this.createBannerElement(product, bgColor, accentColor, postType);
      
      // Adicionar temporariamente ao DOM (fora da tela)
      bannerElement.style.position = 'fixed';
      bannerElement.style.left = '-9999px';
      bannerElement.style.top = '-9999px';
      document.body.appendChild(bannerElement);
      
      // Aguardar um pouco para o DOM processar
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        // Gerar imagem usando html2canvas
        const canvas = await html2canvas(bannerElement, {
          width: 1080,
          height: 1080,
          scale: 1,
          useCORS: true,
          allowTaint: false,
          backgroundColor: bgColor,
          logging: false
        });

        // Converter para base64
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        console.log('Banner gerado com sucesso!');
        
        return dataUrl;
      } finally {
        // Sempre remover elemento temporário
        document.body.removeChild(bannerElement);
      }
    } catch (error) {
      console.error('Erro ao gerar banner:', error);
      return null;
    }
  }

  private static createBannerElement(
    product: ProductData, 
    bgColor: string,
    accentColor: string,
    postType: string
  ): HTMLDivElement {
    const bannerDiv = document.createElement('div');
    bannerDiv.style.cssText = `
      width: 1080px;
      height: 1080px;
      background: linear-gradient(135deg, ${bgColor} 0%, ${accentColor} 100%);
      color: white;
      position: relative;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      box-sizing: border-box;
    `;

    // Container principal com layout mais organizado
    const mainContainer = document.createElement('div');
    mainContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      width: 100%;
      height: 100%;
      position: relative;
    `;

    // Logo/Header no topo
    const logoContainer = document.createElement('div');
    logoContainer.style.cssText = `
      background: rgba(255,255,255,0.2);
      border-radius: 15px;
      padding: 12px 30px;
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255,255,255,0.3);
      font-size: 22px;
      font-weight: bold;
      margin-bottom: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 20px;
    `;
    logoContainer.textContent = 'Superloja';
    mainContainer.appendChild(logoContainer);

    // Container da imagem do produto centralizada
    const imageContainer = document.createElement('div');
    imageContainer.style.cssText = `
      width: 350px;
      height: 350px;
      background: rgba(255,255,255,0.9);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 40px;
      box-shadow: 0 15px 35px rgba(0,0,0,0.3);
    `;

    // Imagem do produto
    if (product.image_url) {
      const productImage = document.createElement('img');
      productImage.src = product.image_url;
      productImage.crossOrigin = 'anonymous';
      productImage.style.cssText = `
        max-width: 300px;
        max-height: 300px;
        object-fit: contain;
        border-radius: 10px;
      `;
      imageContainer.appendChild(productImage);
    }
    mainContainer.appendChild(imageContainer);

    // Nome do produto
    const productName = document.createElement('h1');
    productName.textContent = product.name;
    productName.style.cssText = `
      font-size: 42px;
      font-weight: bold;
      margin: 0 0 30px 0;
      text-shadow: 2px 2px 8px rgba(0,0,0,0.5);
      line-height: 1.1;
      max-width: 100%;
      word-wrap: break-word;
      text-align: center;
      padding: 0 20px;
    `;
    mainContainer.appendChild(productName);

    // Container do preço com destaque
    const priceContainer = document.createElement('div');
    priceContainer.style.cssText = `
      background: rgba(255,255,255,0.25);
      border: 3px solid white;
      border-radius: 20px;
      padding: 15px 35px;
      margin-bottom: 40px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60px;
    `;

    const priceElement = document.createElement('div');
    priceElement.textContent = `${product.price.toLocaleString()} AOA`;
    priceElement.style.cssText = `
      font-size: 44px;
      font-weight: bold;
      margin: 0;
      text-shadow: 1px 1px 4px rgba(0,0,0,0.3);
      white-space: nowrap;
    `;
    priceContainer.appendChild(priceElement);
    mainContainer.appendChild(priceContainer);

    // Badge promocional (se for promocional)
    if (postType === 'promotional') {
      const promoTag = document.createElement('div');
      promoTag.textContent = 'OFERTA ESPECIAL!';
      promoTag.style.cssText = `
        background: #FF6B35;
        color: white;
        padding: 12px 25px;
        border-radius: 20px;
        font-size: 20px;
        font-weight: bold;
        position: absolute;
        top: 80px;
        right: 40px;
        transform: rotate(12deg);
        box-shadow: 0 8px 20px rgba(0,0,0,0.4);
        z-index: 3;
      `;
      bannerDiv.appendChild(promoTag);
    }

    // Informações da loja no rodapé
    const storeInfo = document.createElement('div');
    storeInfo.style.cssText = `
      margin-top: auto;
      font-size: 18px;
      opacity: 0.95;
      text-align: center;
      background: rgba(255,255,255,0.15);
      padding: 15px 25px;
      border-radius: 15px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
    `;
    storeInfo.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">✨ Entrega grátis em Luanda</div>
      <div style="font-size: 16px;">www.superloja.vip</div>
    `;
    mainContainer.appendChild(storeInfo);

    bannerDiv.appendChild(mainContainer);
    return bannerDiv;
  }
}