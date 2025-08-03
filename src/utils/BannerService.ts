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
      
      // Configurações baseadas no tipo de post
      const bgColor = postType === 'promotional' ? '#E86C00' : '#8B4FA3';
      const accentColor = postType === 'promotional' ? '#FF6B35' : '#9F4F96';
      
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
      justify-content: space-between;
      align-items: center;
      padding: 60px;
      box-sizing: border-box;
    `;

    // Adicionar padrão de fundo
    const patternDiv = document.createElement('div');
    patternDiv.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      opacity: 0.1;
      background: radial-gradient(circle at 20% 20%, rgba(255,255,255,0.3) 40px, transparent 41px),
                  radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2) 30px, transparent 31px),
                  radial-gradient(circle at 40% 70%, rgba(255,255,255,0.25) 50px, transparent 51px);
    `;
    bannerDiv.appendChild(patternDiv);

    // Container principal
    const mainContainer = document.createElement('div');
    mainContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      z-index: 2;
      position: relative;
      width: 100%;
      height: 100%;
      justify-content: space-between;
    `;

    // Logo/Header
    const logoContainer = document.createElement('div');
    logoContainer.style.cssText = `
      background: rgba(255,255,255,0.15);
      border-radius: 25px;
      padding: 20px 40px;
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255,255,255,0.2);
      font-size: 28px;
      font-weight: bold;
    `;
    logoContainer.textContent = 'SuperLoja Angola';
    mainContainer.appendChild(logoContainer);

    // Container do produto
    const productContainer = document.createElement('div');
    productContainer.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 40px 0;
    `;

    // Imagem do produto (se houver)
    if (product.image_url) {
      const productImage = document.createElement('img');
      productImage.src = product.image_url;
      productImage.crossOrigin = 'anonymous';
      productImage.style.cssText = `
        max-width: 400px;
        max-height: 400px;
        object-fit: contain;
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        margin-bottom: 40px;
        background: rgba(255,255,255,0.1);
        padding: 20px;
      `;
      productContainer.appendChild(productImage);
    }

    // Nome do produto
    const productName = document.createElement('h1');
    productName.textContent = product.name;
    productName.style.cssText = `
      font-size: 64px;
      font-weight: bold;
      margin: 0 0 30px 0;
      text-shadow: 2px 2px 8px rgba(0,0,0,0.5);
      line-height: 1.1;
      max-width: 100%;
      word-wrap: break-word;
    `;
    productContainer.appendChild(productName);

    // Preço
    const priceElement = document.createElement('div');
    priceElement.textContent = `${product.price.toLocaleString()} AOA`;
    priceElement.style.cssText = `
      font-size: 56px;
      font-weight: bold;
      background: rgba(255,255,255,0.2);
      padding: 25px 50px;
      border-radius: 30px;
      margin: 30px 0;
      border: 4px solid white;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    `;
    productContainer.appendChild(priceElement);

    mainContainer.appendChild(productContainer);

    // Badge promocional (se for promocional)
    if (postType === 'promotional') {
      const promoTag = document.createElement('div');
      promoTag.textContent = 'OFERTA ESPECIAL!';
      promoTag.style.cssText = `
        background: #FF6B35;
        color: white;
        padding: 15px 30px;
        border-radius: 25px;
        font-size: 32px;
        font-weight: bold;
        position: absolute;
        top: 100px;
        right: 60px;
        transform: rotate(15deg);
        box-shadow: 0 8px 25px rgba(0,0,0,0.4);
        z-index: 3;
      `;
      bannerDiv.appendChild(promoTag);
    }

    // Informações da loja no rodapé
    const storeInfo = document.createElement('div');
    storeInfo.style.cssText = `
      font-size: 28px;
      opacity: 0.9;
      text-align: center;
      background: rgba(255,255,255,0.1);
      padding: 20px 30px;
      border-radius: 20px;
      backdrop-filter: blur(10px);
    `;
    storeInfo.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">✨ Entrega grátis em Luanda</div>
      <div style="font-size: 24px;">www.superloja.ao • WhatsApp: +244 900 000 000</div>
    `;
    mainContainer.appendChild(storeInfo);

    bannerDiv.appendChild(mainContainer);
    return bannerDiv;
  }
}