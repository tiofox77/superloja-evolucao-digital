import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';

export interface BannerSettings {
  width: number;
  height: number;
  background: string;
  textColor: string;
  logoEnabled: boolean;
  logoUrl?: string;
  pattern?: string;
  patternColor?: string;
}

export interface ProductData {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  description?: string;
}

export class BannerService {
  private static FALLBACK_LOGO = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiByeD0iMjAiIGZpbGw9IiM4QjRGQTMiLz4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0xMiAyQzEzLjEgMiAxNCAyLjkgMTQgNFYyMkMxNCAyMy4xIDEzLjEgMjQgMTIgMjRDMTAuOSAyNCAxMCAyMy4xIDEwIDIyVjRDMTAgMi45IDEwLjkgMiAxMiAyWiIvPgo8cGF0aCBkPSJNMTIgMTBDMTcuNSAxMCAyMiAxNC41IDIyIDIwSDJDMiAxNC41IDYuNSAxMCAxMiAxMFoiLz4KPHN2Zz4KPC9zdmc+';

  static async loadStoreLogo(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'store_info')
        .single();
      
      if (error) {
        console.warn('Erro ao carregar configurações da loja:', error);
        return this.FALLBACK_LOGO;
      }
      
      const storeInfo = data?.value as any;
      return storeInfo?.logo_url || this.FALLBACK_LOGO;
    } catch (error) {
      console.warn('Erro ao carregar logo da loja:', error);
      return this.FALLBACK_LOGO;
    }
  }

  static async generateProductBanner(
    product: ProductData, 
    postType: string = 'product',
    settings?: Partial<BannerSettings>
  ): Promise<string | null> {
    try {
      // Configurações padrão do banner
      const defaultSettings: BannerSettings = {
        width: 1080,
        height: 1080,
        background: '#8B4FA3',
        textColor: '#FFFFFF',
        logoEnabled: true,
        pattern: 'circles',
        patternColor: 'rgba(255,255,255,0.2)',
        ...settings
      };

      // Carregar logo da loja
      if (defaultSettings.logoEnabled && !defaultSettings.logoUrl) {
        defaultSettings.logoUrl = await this.loadStoreLogo();
      }

      // Criar elemento canvas para o banner
      const bannerElement = this.createBannerElement(product, defaultSettings, postType);
      
      // Adicionar temporariamente ao DOM
      document.body.appendChild(bannerElement);
      
      try {
        // Gerar imagem usando html2canvas
        const canvas = await html2canvas(bannerElement, {
          width: defaultSettings.width,
          height: defaultSettings.height,
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: defaultSettings.background
        });

        // Converter para base64
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        return dataUrl;
      } finally {
        // Remover elemento temporário
        document.body.removeChild(bannerElement);
      }
    } catch (error) {
      console.error('Erro ao gerar banner:', error);
      return null;
    }
  }

  private static createBannerElement(
    product: ProductData, 
    settings: BannerSettings, 
    postType: string
  ): HTMLDivElement {
    const bannerDiv = document.createElement('div');
    bannerDiv.style.cssText = `
      width: ${settings.width}px;
      height: ${settings.height}px;
      background: ${settings.background};
      color: ${settings.textColor};
      position: relative;
      font-family: 'Arial', sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 40px;
      box-sizing: border-box;
    `;

    // Adicionar padrão de fundo
    if (settings.pattern) {
      this.addBackgroundPattern(bannerDiv, settings);
    }

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

    // Adicionar logo no topo
    if (settings.logoEnabled && settings.logoUrl) {
      const logoContainer = this.createLogoElement(settings.logoUrl);
      mainContainer.appendChild(logoContainer);
    }

    // Container do produto
    const productContainer = document.createElement('div');
    productContainer.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 20px 0;
    `;

    // Imagem do produto
    if (product.image_url) {
      const productImage = document.createElement('img');
      productImage.src = product.image_url;
      productImage.style.cssText = `
        max-width: 300px;
        max-height: 300px;
        object-fit: contain;
        border-radius: 15px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        margin-bottom: 30px;
      `;
      productContainer.appendChild(productImage);
    }

    // Nome do produto
    const productName = document.createElement('h2');
    productName.textContent = product.name;
    productName.style.cssText = `
      font-size: 48px;
      font-weight: bold;
      margin: 0 0 20px 0;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
      line-height: 1.2;
    `;
    productContainer.appendChild(productName);

    // Preço
    const priceElement = document.createElement('div');
    priceElement.textContent = `${product.price.toLocaleString()} AOA`;
    priceElement.style.cssText = `
      font-size: 42px;
      font-weight: bold;
      background: rgba(255,255,255,0.2);
      padding: 15px 30px;
      border-radius: 25px;
      margin: 20px 0;
      border: 3px solid ${settings.textColor};
    `;
    productContainer.appendChild(priceElement);

    // Adicionar badge baseado no tipo de post
    if (postType === 'promotional') {
      const promoTag = document.createElement('div');
      promoTag.textContent = 'OFERTA ESPECIAL!';
      promoTag.style.cssText = `
        background: #FF6B35;
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        font-size: 24px;
        font-weight: bold;
        position: absolute;
        top: 80px;
        right: 40px;
        transform: rotate(15deg);
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      `;
      bannerDiv.appendChild(promoTag);
    }

    mainContainer.appendChild(productContainer);

    // Informações da loja no rodapé
    const storeInfo = document.createElement('div');
    storeInfo.style.cssText = `
      font-size: 24px;
      opacity: 0.9;
      text-align: center;
    `;
    storeInfo.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">SuperLoja Angola</div>
      <div>Entrega grátis em Luanda • www.superloja.ao</div>
    `;
    mainContainer.appendChild(storeInfo);

    bannerDiv.appendChild(mainContainer);
    return bannerDiv;
  }

  private static addBackgroundPattern(element: HTMLDivElement, settings: BannerSettings) {
    const patternDiv = document.createElement('div');
    patternDiv.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      opacity: 0.1;
      z-index: 1;
    `;

    switch (settings.pattern) {
      case 'circles':
        patternDiv.style.background = `
          radial-gradient(circle at 20% 20%, ${settings.patternColor} 20px, transparent 21px),
          radial-gradient(circle at 80% 80%, ${settings.patternColor} 15px, transparent 16px),
          radial-gradient(circle at 40% 70%, ${settings.patternColor} 25px, transparent 26px)
        `;
        break;
      case 'lines':
        patternDiv.style.background = `
          repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            ${settings.patternColor} 10px,
            ${settings.patternColor} 20px
          )
        `;
        break;
      case 'dots':
        patternDiv.style.background = `
          radial-gradient(${settings.patternColor} 2px, transparent 2px)
        `;
        patternDiv.style.backgroundSize = '30px 30px';
        break;
    }

    element.appendChild(patternDiv);
  }

  private static createLogoElement(logoUrl: string): HTMLDivElement {
    const logoContainer = document.createElement('div');
    logoContainer.style.cssText = `
      width: 120px;
      height: 120px;
      background: rgba(255,255,255,0.1);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255,255,255,0.2);
    `;

    const logo = document.createElement('img');
    logo.src = logoUrl;
    logo.style.cssText = `
      max-width: 80px;
      max-height: 80px;
      object-fit: contain;
    `;

    logoContainer.appendChild(logo);
    return logoContainer;
  }

  static async uploadBannerToStorage(dataUrl: string, productId: string): Promise<string | null> {
    try {
      // Converter dataUrl para blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Nome único do arquivo
      const fileName = `banner-${productId}-${Date.now()}.jpg`;

      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(`banners/${fileName}`, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) {
        console.error('Erro ao fazer upload do banner:', error);
        return null;
      }

      // Retornar URL pública
      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(`banners/${fileName}`);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload do banner:', error);
      return null;
    }
  }
}