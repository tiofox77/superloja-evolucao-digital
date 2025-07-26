/**
 * Serviço para geração de PDFs na aplicação
 * Utilizando jsPDF e html2canvas para transformar elementos DOM em PDFs
 */
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { products as catalogProducts } from '../data/products';

// Fontes adicionais para melhorar a estética do PDF
import 'jspdf/dist/polyfills.es.js';

/**
 * Converte cor hexadecimal para RGB
 * @param hex String hexadecimal da cor (com ou sem #)
 * @returns Array com valores RGB [r, g, b]
 */
const hexToRgb = (hex: string): [number, number, number] => {
  // Remove o # se existir
  hex = hex.replace('#', '');
  
  // Converte para valores RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return [r, g, b];
};

/**
 * Gera um cabeçalho de categoria para diferentes estilos de catálogo
 */
const addCategoryHeader = (pdf: jsPDF, category: string, settings: CatalogueSettings, colors: ThemeColors, pageWidth: number) => {
  const catalogType = settings.catalogType || 'general';
  // Usar o método correto para obter o número da página atual
  // jsPDF tem diferentes formas de acessar a página atual dependendo da versão
  const pageNumber = (pdf as any).getCurrentPageInfo ? (pdf as any).getCurrentPageInfo().pageNumber : pdf.internal.pages.length;
  
  switch (catalogType) {
    case 'supermercado':
      // Estilo CentroSul com fundo vermelho e texto branco
      const rgbCategoryBgSuper = hexToRgb(colors.categoryBg);
      pdf.setFillColor(rgbCategoryBgSuper[0], rgbCategoryBgSuper[1], rgbCategoryBgSuper[2]);
      pdf.rect(0, pageNumber > 1 ? 20 : 30, pageWidth, 15, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(category, 10, pageNumber > 1 ? 30 : 40);
      break;
      
    case 'bebidas':
      // Estilo Empório com fundo azul escuro e texto branco
      const rgbCategoryBgBebidas = hexToRgb(colors.categoryBg);
      pdf.setFillColor(rgbCategoryBgBebidas[0], rgbCategoryBgBebidas[1], rgbCategoryBgBebidas[2]);
      pdf.rect(0, pageNumber > 1 ? 20 : 40, pageWidth, 20, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(category.toUpperCase(), pageWidth / 2, pageNumber > 1 ? 33 : 53, { align: 'center' });
      break;
      
    case 'limpeza':
      // Estilo AKLIMP com fundo azul claro
      const rgbCategoryBgLimpeza = hexToRgb(colors.categoryBg);
      pdf.setFillColor(rgbCategoryBgLimpeza[0], rgbCategoryBgLimpeza[1], rgbCategoryBgLimpeza[2]);
      pdf.rect(0, pageNumber > 1 ? 20 : 40, pageWidth, 15, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(category.toUpperCase(), 10, pageNumber > 1 ? 30 : 50);
      
      // Linha decorativa abaixo do cabeçalho
      const rgbAccentLimpeza = hexToRgb(colors.accent);
      pdf.setDrawColor(rgbAccentLimpeza[0], rgbAccentLimpeza[1], rgbAccentLimpeza[2]);
      pdf.setLineWidth(1);
      pdf.line(0, pageNumber > 1 ? 36 : 56, pageWidth, pageNumber > 1 ? 36 : 56);
      break;
      
    case 'industrial':
      // Estilo industrial com barra laranja e texto verde
      const rgbCategoryBgIndustrial = hexToRgb(colors.categoryBg);
      pdf.setFillColor(rgbCategoryBgIndustrial[0], rgbCategoryBgIndustrial[1], rgbCategoryBgIndustrial[2]);
      pdf.rect(10, pageNumber > 1 ? 20 : 40, pageWidth - 20, 15, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(category.toUpperCase(), pageWidth / 2, pageNumber > 1 ? 30 : 50, { align: 'center' });
      break;
      
    default:
      // Estilo padrão
      const rgbPrimary = hexToRgb(colors.primary);
      pdf.setFillColor(rgbPrimary[0], rgbPrimary[1], rgbPrimary[2], 0.2);
      pdf.rect(10, pageNumber > 1 ? 20 : 40, pageWidth - 20, 12, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(category, pageWidth / 2, pageNumber > 1 ? 28 : 48, { align: 'center' });
  }
};

// Cores do tema para usar no catálogo
interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  muted: string;
  categoryBg?: string;
  categoryText?: string;
  priceBg?: string;
  priceText?: string;
  promoBadge?: string;
}

const themeColors: { [key: string]: ThemeColors } = {
  modern: {
    primary: '#3498db',
    secondary: '#2c3e50',
    accent: '#e74c3c',
    background: '#f9f9f9',
    text: '#2c3e50',
    muted: '#7f8c8d'
  },
  elegant: {
    primary: '#2c3e50',
    secondary: '#34495e',
    accent: '#9b59b6',
    background: '#ecf0f1',
    text: '#2c3e50',
    muted: '#95a5a6'
  },
  bold: {
    primary: '#e74c3c',
    secondary: '#c0392b',
    accent: '#f39c12',
    background: '#ecf0f1',
    text: '#2c3e50',
    muted: '#7f8c8d'
  },
  minimal: {
    primary: '#2c3e50',
    secondary: '#7f8c8d',
    accent: '#3498db',
    background: '#ffffff',
    text: '#2c3e50',
    muted: '#bdc3c7'
  },
  classic: {
    primary: '#27ae60',
    secondary: '#2ecc71',
    accent: '#f1c40f',
    background: '#ecf0f1',
    text: '#2c3e50',
    muted: '#95a5a6'
  },
  supermercado: {
    primary: '#e01a32', // Vermelho CentroSul
    secondary: '#940020',
    accent: '#ffcc00',
    background: '#ffffff',
    text: '#333333',
    muted: '#7f8c8d',
    categoryBg: '#e01a32',
    categoryText: '#ffffff',
    priceBg: '#e01a32',
    priceText: '#ffffff'
  },
  bebidas: {
    primary: '#000080', // Azul escuro Empório
    secondary: '#000045',
    accent: '#bd9b60', // Dourado
    background: '#1a1a35',
    text: '#ffffff',
    muted: '#cccccc',
    categoryBg: '#000080',
    categoryText: '#ffffff',
    priceBg: '#bd9b60',
    priceText: '#ffffff'
  },
  limpeza: {
    primary: '#0098d8', // Azul AKLIMP
    secondary: '#005e85',
    accent: '#ffa500',
    background: '#ffffff',
    text: '#333333',
    muted: '#7f8c8d',
    categoryBg: '#0098d8',
    categoryText: '#ffffff',
    priceBg: '#0098d8',
    priceText: '#ffffff'
  },
  industrial: {
    primary: '#e19000', // Laranja industrial
    secondary: '#006633', // Verde
    accent: '#ffcc00',
    background: '#ffffff',
    text: '#333333',
    muted: '#7f8c8d',
    categoryBg: '#e19000',
    categoryText: '#ffffff',
    priceBg: '#006633',
    priceText: '#ffffff'
  },
  promocional: {
    primary: '#0066cc',
    secondary: '#003366',
    accent: '#ffcc00',
    background: '#f2f2f2',
    text: '#333333',
    muted: '#7f8c8d',
    categoryBg: '#0066cc',
    categoryText: '#ffffff',
    priceBg: '#ff0000', // Vermelho para preços promocionais
    priceText: '#ffffff',
    promoBadge: '#ff0000'
  }
};

/**
 * Interface para as configurações do catálogo
 */
export interface CatalogueSettings {
  title: string;
  subtitle: string;
  orientation: string;
  pageSize?: string;
  columns?: number;
  showPrices?: boolean;
  groupByCategory?: boolean;
  coverImage?: string;
  logoUrl?: string;
  contactInfo?: string;
  footerText?: string;
  // Campos de configuração visual
  showSKU?: boolean;
  showBarcode?: boolean;
  showCategoryHeaders?: boolean;
  showStockInfo?: boolean;
  badgeStyle?: string;
  priceStyle?: string;
  // Campos de personalização adicional
  includeDescription?: boolean;
  templateStyle?: string;
  logoOnEveryPage?: boolean;
  showPromotionalPrice?: boolean;
  catalogType?: 'general' | 'supermercado' | 'bebidas' | 'limpeza' | 'industrial' | 'promocional';
  startDate?: string;
  endDate?: string;
}

/**
 * Gera um PDF a partir de um elemento DOM específico
 * @param element Elemento DOM a ser convertido em PDF
 * @param filename Nome do arquivo PDF a ser gerado
 * @returns Promise com o URL do objeto Blob gerado
 */
export const generatePdfFromElement = async (
  element: HTMLElement, 
  filename: string = 'documento.pdf'
): Promise<string> => {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    const blob = pdf.output('blob');
    
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw new Error('Não foi possível gerar o PDF');
  }
};



/**
 * Adiciona uma capa ao catálogo de produtos baseada no tipo selecionado
 * @param pdf Instância do jsPDF
 * @param settings Configurações do catálogo
 * @param storeInfo Informações da loja
 */
const addCoverPage = (pdf: jsPDF, settings: CatalogueSettings, storeInfo: any) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const catalogType = settings.catalogType || 'general';
  
  // Obter as cores do tema baseado no tipo de catálogo
  let themeKey: string;
  if (catalogType === 'promocional') {
    themeKey = 'bold';
  } else if (settings.templateStyle && themeColors[settings.templateStyle as keyof typeof themeColors]) {
    themeKey = settings.templateStyle;
  } else {
    themeKey = catalogType;
  }
  const colors = themeColors[themeKey as keyof typeof themeColors] || themeColors.modern;
  
  // Configurações específicas por tipo de capa
  switch(catalogType) {
    case 'supermercado':
      // Estilo supermercado com faixa vermelha no topo e base
      const rgbHeaderSuper = hexToRgb(colors.primary);
      pdf.setFillColor(rgbHeaderSuper[0], rgbHeaderSuper[1], rgbHeaderSuper[2]);
      pdf.rect(0, 0, pageWidth, 40, 'F');
      pdf.rect(0, pageHeight - 30, pageWidth, 30, 'F');
      
      // Logo da loja no topo
      if (storeInfo?.logo) {
        try {
          pdf.addImage(storeInfo.logo, 'PNG', pageWidth / 2 - 30, 10, 60, 20);
        } catch (error) {
          console.error('Erro ao adicionar logo na capa:', error);
        }
      }
      
      // Título do catálogo
      const rgbAccentSuper = hexToRgb(colors.accent);
      pdf.setFillColor(rgbAccentSuper[0], rgbAccentSuper[1], rgbAccentSuper[2]);
      pdf.rect(pageWidth / 2 - 80, 60, 160, 30, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text(settings.title.toUpperCase(), pageWidth / 2, 80, { align: 'center' });
      
      // Subtítulo
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'normal');
      pdf.text(settings.subtitle, pageWidth / 2, 110, { align: 'center' });
      
      // Data
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      const startDate = settings.startDate ? new Date(settings.startDate).toLocaleDateString('pt-AO') : new Date().toLocaleDateString('pt-AO');
      const endDate = settings.endDate ? new Date(settings.endDate).toLocaleDateString('pt-AO') : new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('pt-AO');
      pdf.text(`Válido de ${startDate} a ${endDate}`, 
        pageWidth / 2, pageHeight - 40, { align: 'center' });
      break;
      
    case 'bebidas':
      // Estilo empório com fundo azul escuro e detalhes dourados
      const rgbHeaderBebidas = hexToRgb(colors.primary);
      pdf.setFillColor(rgbHeaderBebidas[0], rgbHeaderBebidas[1], rgbHeaderBebidas[2]);
      pdf.rect(0, 0, pageWidth, 60, 'F');
      pdf.rect(0, pageHeight - 60, pageWidth, 60, 'F');
      
      // Logo dourada no topo
      pdf.setTextColor(hexToRgb(colors.accent)[0], hexToRgb(colors.accent)[1], hexToRgb(colors.accent)[2]);
      pdf.setFontSize(26);
      pdf.setFont('helvetica', 'bold');
      pdf.text('EMPÓRIO', 30, 40);
      
      // Título do catálogo
      pdf.setTextColor(hexToRgb(colors.accent)[0], hexToRgb(colors.accent)[1], hexToRgb(colors.accent)[2]);
      pdf.setFontSize(36);
      pdf.setFont('helvetica', 'bold');
      pdf.text(settings.title, pageWidth / 2, pageHeight / 2, { align: 'center' });
      
      // Subtítulo
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'italic');
      pdf.text(settings.subtitle, pageWidth / 2, pageHeight / 2 + 30, { align: 'center' });
      
      // Informações de contato
      if (settings.contactInfo) {
        pdf.setTextColor(hexToRgb(colors.accent)[0], hexToRgb(colors.accent)[1], hexToRgb(colors.accent)[2]);
        pdf.setFontSize(12);
        pdf.text(settings.contactInfo, pageWidth / 2, pageHeight - 30, { align: 'center' });
      }
      break;
      
    case 'limpeza':
      // Estilo limpeza com elementos circulares e cores suaves
      // Fundo branco com faixa azul no topo
      const rgbHeaderLimpeza = hexToRgb(colors.primary);
      pdf.setFillColor(rgbHeaderLimpeza[0], rgbHeaderLimpeza[1], rgbHeaderLimpeza[2]);
      pdf.rect(0, 0, pageWidth, 80, 'F');
      
      // Logo ou título
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(30);
      pdf.setFont('helvetica', 'bold');
      pdf.text(storeInfo?.name || 'PRODUTOS DE LIMPEZA', pageWidth / 2, 50, { align: 'center' });
      
      // Elementos decorativos circulares
      const accent = hexToRgb(colors.accent);
      pdf.setFillColor(accent[0], accent[1], accent[2], 0.7);
      pdf.circle(pageWidth - 40, 40, 20, 'F');
      pdf.circle(30, pageHeight - 50, 15, 'F');
      
      // Título principal
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(28);
      pdf.text(settings.title, pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });
      
      // Subtítulo
      pdf.setFontSize(16);
      pdf.setTextColor(80, 80, 80);
      pdf.text(settings.subtitle, pageWidth / 2, pageHeight / 2 + 10, { align: 'center' });
      break;
      
    case 'industrial':
      // Estilo industrial com bordas laranja e elementos verdes
      const rgbBorder = hexToRgb(colors.primary);
      pdf.setDrawColor(rgbBorder[0], rgbBorder[1], rgbBorder[2]);
      pdf.setLineWidth(15);
      pdf.rect(20, 20, pageWidth - 40, pageHeight - 40, 'S');
      
      // Faixa verde para título
      const rgbHeader = hexToRgb(colors.secondary);
      pdf.setFillColor(rgbHeader[0], rgbHeader[1], rgbHeader[2]);
      pdf.rect(30, pageHeight / 3, pageWidth - 60, 50, 'F');
      
      // Título e subtítulo
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text(settings.title.toUpperCase(), pageWidth / 2, pageHeight / 3 + 30, { align: 'center' });
      
      // Logo se disponível
      if (storeInfo?.logo) {
        try {
          pdf.addImage(storeInfo.logo, 'PNG', pageWidth / 2 - 40, 60, 80, 40);
        } catch (error) {
          console.error('Erro ao adicionar logo na capa:', error);
        }
      }
      
      // Informações adicionais
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(settings.subtitle, pageWidth / 2, pageHeight - 80, { align: 'center' });
      break;
      
    case 'promocional':
      // Estilo promocional com elementos diagonais e destaque para ofertas
      // Fundo branco
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Banner diagonal vermelho
      const rgbPromo = hexToRgb(colors.primary);
      pdf.setFillColor(rgbPromo[0], rgbPromo[1], rgbPromo[2]);
      
      // Faixa diagonal não é suportada diretamente pelo jsPDF nesta versão
      // Então usamos duas faixas retangulares para um efeito semelhante
      pdf.setFillColor(rgbPromo[0], rgbPromo[1], rgbPromo[2]);
      
      // Faixa superior
      pdf.rect(0, 30, pageWidth, 40, 'F');
      
      // Texto na faixa
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SUPER OFERTAS', pageWidth / 2, 55, { align: 'center' });
      
      // Título principal
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(36);
      pdf.setFont('helvetica', 'bold');
      pdf.text(settings.title, pageWidth / 2, pageHeight / 2, { align: 'center' });
      
      // Subtítulo
      pdf.setTextColor(rgbPromo[0], rgbPromo[1], rgbPromo[2]);
      pdf.setFontSize(20);
      pdf.text(settings.subtitle, pageWidth / 2, pageHeight / 2 + 30, { align: 'center' });
      
      // Período promocional
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      const startDatePromo = settings.startDate ? new Date(settings.startDate).toLocaleDateString('pt-AO') : new Date().toLocaleDateString('pt-AO');
      const endDatePromo = settings.endDate ? new Date(settings.endDate).toLocaleDateString('pt-AO') : new Date(Date.now() + 14*24*60*60*1000).toLocaleDateString('pt-AO');
      pdf.text(`Ofertas válidas de ${startDatePromo} a ${endDatePromo}`,
        pageWidth / 2, pageHeight - 60, { align: 'center' });
      break;
      
    default: // Caso general ou outros
      // Capa moderna com gradiente lateral
      // Fundo branco com faixa colorida lateral
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      
      const rgbDefault = hexToRgb(colors.primary);
      pdf.setFillColor(rgbDefault[0], rgbDefault[1], rgbDefault[2]);
      pdf.rect(0, 0, pageWidth / 3, pageHeight, 'F');
      
      // Logo se disponível
      if (storeInfo?.logo) {
        try {
          pdf.addImage(storeInfo.logo, 'PNG', pageWidth / 2 - 30, 40, 60, 30);
        } catch (error) {
          console.error('Erro ao adicionar logo na capa:', error);
        }
      }
      
      // Título
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text(settings.title, pageWidth * 0.65, pageHeight / 2 - 20, { align: 'center' });
      
      // Subtítulo
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'normal');
      pdf.text(settings.subtitle, pageWidth * 0.65, pageHeight / 2 + 10, { align: 'center' });
      
      // Informações da loja
      if (storeInfo?.name) {
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(storeInfo.name, pageWidth * 0.15, 40, { align: 'center' });
      }
      
      // Informações de contato
      if (settings.contactInfo) {
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.text(settings.contactInfo, pageWidth * 0.15, pageHeight - 40, { align: 'center' });
      }
      break;
  }
};

/**
 * Gera um catálogo de produtos em PDF
 * @param products Lista de produtos a incluir no catálogo
 * @param settings Configurações do catálogo
 * @param storeInfo Informações da loja para incluir no catálogo
 * @returns Promise com o URL do objeto Blob gerado
 */
export const generateProductCatalogue = async (
  products: any[],
  settings: CatalogueSettings,
  storeInfo: any
): Promise<string> => {
  if (products.length === 0) {
    throw new Error('Nenhum produto disponível para gerar o catálogo');
  }
  
  try {
    // Cria um novo documento PDF com as configurações especificadas
    const pdf = new jsPDF({
      orientation: settings.orientation as 'portrait' | 'landscape',
      unit: 'mm',
      format: settings.pageSize || 'a4'
    });
    
    // Adicionar capa do catálogo
    addCoverPage(pdf, settings, storeInfo);
    
    // Agrupar produtos por categoria se necessário
    const groupedProducts = settings.groupByCategory 
      ? groupProductsByCategory(products)
      : { "Todos os Produtos": products };
      
    // Para cada categoria (ou grupo único), adicionar os produtos
    let currentPage = 1;
    
    Object.entries(groupedProducts).forEach(([categoryName, categoryProducts], categoryIndex) => {
      if (categoryIndex > 0 || settings.coverImage) {
        pdf.addPage();
        currentPage++;
      }
      
      // Adicionar título da categoria
      pdf.setFontSize(16);
      
      // Configurar layout baseado em colunas
      const margin = 15;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const contentWidth = pageWidth - (margin * 2);
      const columns = Math.min(settings.columns || 3, 5); // Máximo de 5 colunas
      const columnWidth = contentWidth / columns;
      
      // Ajustar altura com base no tipo de catálogo
      let rowHeight = settings.includeDescription ? 120 : 100;
      
      // Personalização por tipo de catálogo
      if (settings.catalogType === 'supermercado') {
        rowHeight = 90; // Produtos mais compactos como no Catálogo CentroSul
      } else if (settings.catalogType === 'bebidas') {
        rowHeight = 130; // Garrafas mais altas precisam de mais espaço
      } else if (settings.catalogType === 'industrial') {
        rowHeight = 140; // Peças industriais com mais informações técnicas
      }
      
      const rowsPerPage = Math.floor((pageHeight - 40) / rowHeight);
      const productsPerPage = rowsPerPage * columns;
      
      // Adicionar produtos em grade
      for (let i = 0; i < categoryProducts.length; i++) {
        if (i > 0 && i % productsPerPage === 0) {
          pdf.addPage();
          currentPage++;
          
          // Repetir cabeçalho da categoria em cada nova página
          const catalogType = settings.catalogType || 'general';
          const themeKey = catalogType === 'promocional' ? 'bold' : catalogType;
          const colors = themeColors[themeKey as keyof typeof themeColors] || themeColors.modern;
          addCategoryHeader(pdf, categoryName, settings, colors, pdf.internal.pageSize.getWidth());
          
          // Adicionar logo se configurado
          if (settings.logoOnEveryPage && settings.logoUrl) {
            const storeInfo = { logo: settings.logoUrl };
            addLogoToPage(pdf, storeInfo);
          }
        }
        
        const product = categoryProducts[i];
        const col = i % columns;
        const row = Math.floor((i % productsPerPage) / columns);
        
        const x = margin + (col * columnWidth);
        const y = 40 + (row * rowHeight);
        
        addProductToPage(pdf, product, x, y, columnWidth - 5, rowHeight - 5, settings);
      }
    });
    
    // Adicionar informações de contato na última página
    if (settings.contactInfo && storeInfo) {
      pdf.addPage();
      addContactPage(pdf, storeInfo);
    }
    
    // Gerar blob e retornar URL
    const blob = pdf.output('blob');
    return URL.createObjectURL(blob);
    
  } catch (error) {
    console.error('Erro ao gerar catálogo:', error);
    throw new Error('Não foi possível gerar o catálogo de produtos');
  }
};

/**
 * Adiciona um produto a uma posição específica no PDF
 * Com suporte para imagens e estilos melhorados
 */
const addProductToPage = (
  pdf: jsPDF, 
  product: any, 
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  settings: CatalogueSettings
) => {
  // Determinar o tema de cores baseado no tipo de catálogo
  const catalogType = settings.catalogType || 'general';
  const themeKey = catalogType === 'promocional' ? 'bold' : catalogType;
  const colors = themeColors[themeKey as keyof typeof themeColors] || themeColors.modern;
  
  // Adicionar fundo estilizado baseado no tema
  switch (catalogType) {
    case 'supermercado':
      // Estilo supermercado com fundo branco e bordas vermelhas
      pdf.setFillColor(255, 255, 255);
      pdf.rect(x, y, width, height, 'F');
      pdf.setDrawColor(hexToRgb(colors.primary)[0], hexToRgb(colors.primary)[1], hexToRgb(colors.primary)[2]);
      pdf.setLineWidth(0.5);
      pdf.rect(x, y, width, height, 'D');
      
      // Marca superior vermelha
      pdf.setFillColor(hexToRgb(colors.primary)[0], hexToRgb(colors.primary)[1], hexToRgb(colors.primary)[2]);
      pdf.rect(x, y, width, 4, 'F');
      break;
      
    case 'bebidas':
      // Estilo empório com fundo escuro e detalhes dourados
      pdf.setFillColor(hexToRgb(colors.background)[0], hexToRgb(colors.background)[1], hexToRgb(colors.background)[2]);
      pdf.rect(x, y, width, height, 'F');
      pdf.setDrawColor(hexToRgb(colors.accent)[0], hexToRgb(colors.accent)[1], hexToRgb(colors.accent)[2]);
      pdf.setLineWidth(0.5);
      pdf.rect(x, y, width, height, 'D');
      break;
      
    case 'limpeza':
      // Estilo limpeza com cantos arredondados e azul
      pdf.setFillColor(250, 250, 252);
      pdf.roundedRect(x, y, width, height, 3, 3, 'F');
      pdf.setDrawColor(hexToRgb(colors.primary)[0], hexToRgb(colors.primary)[1], hexToRgb(colors.primary)[2]);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(x, y, width, height, 3, 3, 'D');
      break;
      
    case 'industrial':
      // Design industrial com bordas laranja fortes
      pdf.setFillColor(255, 255, 255);
      pdf.rect(x, y, width, height, 'F');
      pdf.setDrawColor(hexToRgb(colors.primary)[0], hexToRgb(colors.primary)[1], hexToRgb(colors.primary)[2]);
      pdf.setLineWidth(1.5);
      pdf.rect(x, y, width, height, 'D');
      
      // Detalhe verde no canto
      pdf.setFillColor(hexToRgb(colors.secondary)[0], hexToRgb(colors.secondary)[1], hexToRgb(colors.secondary)[2]);
      pdf.triangle(x + width - 10, y, x + width, y, x + width, y + 10, 'F');
      break;
      
    case 'promocional':
      // Design promocional com destaque em vermelho
      pdf.setFillColor(hexToRgb(colors.background)[0], hexToRgb(colors.background)[1], hexToRgb(colors.background)[2]);
      pdf.rect(x, y, width, height, 'F');
      pdf.setDrawColor(hexToRgb(colors.primary)[0], hexToRgb(colors.primary)[1], hexToRgb(colors.primary)[2]);
      pdf.setLineWidth(1);
      pdf.rect(x, y, width, height, 'D');
      break;
      
    default: // general ou outros
      // Design padrão minimalista
      pdf.setDrawColor(180, 180, 180);
      pdf.setLineWidth(0.3);
      pdf.rect(x, y, width, height, 'D');
      break;
  }

  
  // Adicionar SKU e código de barras se configurado
  if (settings.showSKU && product.sku) {
    pdf.setFontSize(7);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`SKU: ${product.sku}`, x + 5, y + 10);
  }
  
  if (settings.showBarcode && product.barcode) {
    // Simulando um código de barras com linhas verticais
    pdf.setFillColor(0, 0, 0);
    const barcodeY = y + 12;
    const barcodeHeight = 8;
    for (let i = 0; i < 20; i++) {
      if (i % 3 !== 0) { // Criar padrão de linhas
        pdf.rect(x + 30 + (i * 1.5), barcodeY, 1, barcodeHeight, 'F');
      }
    }
    
    pdf.setFontSize(6);
    pdf.text(product.barcode, x + 30 + 10, barcodeY + barcodeHeight + 4);
  }
  
  // Tenta adicionar a imagem do produto se disponível
  const imageY = y + 5;
  const imageHeight = height * 0.55;
  const textStartY = imageY + imageHeight + 5;
  
  if (product.image_url) {
    try {
      // Tente adicionar a imagem, com tratamento de erros aprimorado
      const imgWidth = width - 10;
      const imgX = x + 5;
      
      // Converte base64 direto ou URL da imagem via proxy CORS se necessário
      const imgSrc = product.image_url.startsWith('data:') 
        ? product.image_url
        : product.image_url;
      
      pdf.addImage(
        imgSrc,
        'JPEG',
        imgX,
        imageY,
        imgWidth,
        imageHeight,
        product.id, // Identificador único para cada imagem
        'FAST' // Compressão rápida
      );
    } catch (error) {
      console.warn(`Não foi possível carregar a imagem do produto ${product.name}`, error);
      // Desenhar placeholder para imagem
      pdf.setFillColor(240, 240, 240);
      pdf.rect(x + 5, imageY, width - 10, imageHeight, 'F');
      
      pdf.setFontSize(9);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Imagem não disponível', x + width/2, imageY + imageHeight/2, { align: 'center' });
    }
  } else {
    // Se não houver imagem, desenhar um placeholder
    pdf.setFillColor(245, 245, 245);
    pdf.rect(x + 5, imageY, width - 10, imageHeight, 'F');
  }
  
  // Adicionar título do produto abaixo da imagem
  pdf.setFontSize(11);
  pdf.setTextColor(hexToRgb(colors.text)[0], hexToRgb(colors.text)[1], hexToRgb(colors.text)[2]);
  pdf.setFont('helvetica', 'bold');
  
  const title = product.name.length > 30 
    ? product.name.substring(0, 30) + '...' 
    : product.name;
  pdf.text(title, x + 5, textStartY);
  
  // Adicionar preço se configurado
  if (settings.showPrices) {
    const priceY = textStartY + 8;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    if (product.discount_price && settings.showPromotionalPrice) {
      // Preço original riscado
      pdf.setTextColor(150, 150, 150);
      pdf.setFont('helvetica', 'italic');
      const originalPrice = `${product.price.toLocaleString('pt-AO')} Kz`;
      pdf.text(originalPrice, x + 5, priceY);
      
      // Linha sobre o preço original
      const textWidth = pdf.getTextWidth(originalPrice);
      pdf.setDrawColor(150, 150, 150);
      pdf.line(x + 5, priceY - 1, x + 5 + textWidth, priceY - 1);
      
      // Preço com desconto
      pdf.setTextColor(hexToRgb(colors.accent)[0], hexToRgb(colors.accent)[1], hexToRgb(colors.accent)[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${product.discount_price.toLocaleString('pt-AO')} Kz`, x + 5, priceY + 8);
    } else {
      // Preço normal
      pdf.setTextColor(hexToRgb(colors.primary)[0], hexToRgb(colors.primary)[1], hexToRgb(colors.primary)[2]);
      pdf.text(`${product.price.toLocaleString('pt-AO')} Kz`, x + 5, priceY);
    }
  }
  
  // Adicionar descrição se configurado
  if (settings.includeDescription && product.description) {
    const descY = settings.showPrices 
      ? (product.discount_price && settings.showPromotionalPrice ? textStartY + 18 : textStartY + 12)
      : textStartY + 8;
    
    pdf.setFontSize(8);
    pdf.setTextColor(hexToRgb(colors.muted)[0], hexToRgb(colors.muted)[1], hexToRgb(colors.muted)[2]);
    pdf.setFont('helvetica', 'normal');
    
    const description = product.description.length > 120 
      ? product.description.substring(0, 120) + '...' 
      : product.description;
    
    const splitDescription = pdf.splitTextToSize(description, width - 10);
    pdf.text(splitDescription, x + 5, descY);
  }
  
  // Adicionar ícone ou badge de destaque se for um produto em destaque
  if (product.featured) {
    pdf.setFontSize(7);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    
    // Círculo de destaque
    pdf.setFillColor(255, 165, 0); // Laranja
    pdf.circle(x + width - 8, y + 8, 6, 'F');
    pdf.text('★', x + width - 8, y + 10, { align: 'center' }); // Estrela Unicode
  }
};

/**
 * Agrupa produtos por categoria
 */
const groupProductsByCategory = (products: any[]): Record<string, any[]> => {
  return products.reduce((groups, product) => {
    const category = product.categories?.name || 'Sem categoria';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(product);
    return groups;
  }, {});
};

/**
 * Adiciona o logo a cada página do catálogo
 */
const addLogoToPage = (pdf: jsPDF, storeInfo: any) => {
  if (!storeInfo || !storeInfo.logo) return;
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const logoSize = 20;
  
  try {
    pdf.addImage(
      storeInfo.logo,
      'PNG',
      pageWidth - logoSize - 10,
      10,
      logoSize,
      logoSize
    );
  } catch (error) {
    console.warn('Não foi possível adicionar o logo à página:', error);
  }
};

/**
 * Adiciona página final com informações de contacto
 */
const addContactPage = (pdf: jsPDF, storeInfo: any) => {
  if (!storeInfo) return;

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const colors = themeColors.elegant;  // Usar o estilo elegante para a página de contacto
  
  // Título da página
  pdf.setFontSize(24);
  pdf.setTextColor(40, 40, 40);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Contacte-nos', pageWidth / 2, 30, { align: 'center' });
  
  // Adicionar informações da loja
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(storeInfo.name || 'Sua Loja', pageWidth / 2, 60, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  const contactInfo = [
    `Endereço: ${storeInfo.address || ''}`,
    `Telefone: ${storeInfo.phone || ''}`,
    `Email: ${storeInfo.email || ''}`,
    `Website: ${storeInfo.website || ''}`,
    `Horário de funcionamento: ${storeInfo.businessHours || ''}`
  ];
  
  let yPos = 80;
  contactInfo.forEach(info => {
    pdf.text(info, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
  });
  
  // Adicionar QR Code se configurado
  if (storeInfo.qrCodeUrl) {
    const qrSize = 50;
    pdf.addImage(
      storeInfo.qrCodeUrl, 
      'PNG', 
      pageWidth / 2 - qrSize / 2, 
      pageHeight - 100, 
      qrSize, 
      qrSize
    );
    
    pdf.setFontSize(10);
    pdf.text('Visite nossa loja online', pageWidth / 2, pageHeight - 40, { align: 'center' });
  }
  
  // Adicionar nota de rodapé
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(
    `Catálogo gerado em ${new Date().toLocaleDateString('pt-AO')}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );
};

// Função para pré-carregar todas as imagens dos produtos
const preloadImages = async (products: any[]): Promise<Record<string, string>> => {
  const imageCache: Record<string, string> = {};
  
  const loadImagePromises = products.map(async (product) => {
    // Usar campos da base de dados: image_url ou images
    const imageUrl = product.image_url || product.images || product.image || product.imageUrl;
    
    if (!imageUrl || imageUrl.trim() === '') {
      return;
    }
    
    // Se for array de imagens, usar a primeira
    let finalImageUrl = imageUrl;
    if (Array.isArray(imageUrl) && imageUrl.length > 0) {
      finalImageUrl = imageUrl[0];
    }
    
    // Se for string que parece ser JSON array, tentar fazer parse
    if (typeof finalImageUrl === 'string' && finalImageUrl.startsWith('[')) {
      try {
        const parsedArray = JSON.parse(finalImageUrl);
        if (Array.isArray(parsedArray) && parsedArray.length > 0) {
          finalImageUrl = parsedArray[0];
        }
      } catch (e) {
        // Se falhar o parse, usar a string original
      }
    }
    
    // Usar URL completa (já vem do Supabase)
    const fullImageUrl = finalImageUrl;
    
    try {
      // Criar promessa para carregar imagem
      const imagePromise = new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Redimensionar imagem para otimizar PDF
            const maxWidth = 200;
            const maxHeight = 200;
            
            let { width, height } = img;
            
            // Calcular novo tamanho mantendo aspecto
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width *= ratio;
              height *= ratio;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            ctx?.drawImage(img, 0, 0, width, height);
            const base64 = canvas.toDataURL('image/jpeg', 0.7);
            
            resolve(base64);
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = () => reject(new Error('Falha ao carregar imagem'));
        img.src = fullImageUrl;
      });
      
      const base64Image = await imagePromise;
      imageCache[product.id] = base64Image;
      console.log(`Imagem carregada com sucesso para produto ${product.id}`);
      
    } catch (error) {
      console.warn(`Erro ao carregar imagem para produto ${product.id}:`, error);
      console.warn('URL da imagem:', finalImageUrl);
      // Não adicionar ao cache se falhar
    }
  });
  
  await Promise.all(loadImagePromises);
  return imageCache;
};

/**
 * Gera um catálogo de produtos em PDF seguindo exatamente o layout da imagem enviada
 * @param settings Configurações do catálogo
 * @param storeInfo Informações da loja para incluir no catálogo
 * @param products Produtos selecionados para incluir no catálogo
 * @returns Promise com o URL do objeto Blob gerado
 */
export const generateNewCatalogPdf = async (
  settings: CatalogueSettings,
  storeInfo: any,
  products: any[]
): Promise<string> => {
  if (!products || products.length === 0) {
    throw new Error('Nenhum produto selecionado para gerar o catálogo');
  }
  
  try {
    // Pré-carregar todas as imagens
    const imageCache = await preloadImages(products);

    // Aplicar configurações do catálogo
    const orientation = settings.orientation || 'portrait';
    const pageFormat = settings.pageSize || 'a4';
    const columnsConfig = settings.columns || 2;
    
    // Criar um novo documento PDF com configurações aplicadas
    const pdf = new jsPDF({
      orientation: orientation as 'portrait' | 'landscape',
      unit: 'mm',
      format: pageFormat as any
    });
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Adicionar banner laranja "Ofertas e Novidades" no topo com bordas arredondadas
    pdf.setFillColor(249, 115, 22); // Laranja vibrante
    pdf.roundedRect(10, 10, pageWidth - 20, 25, 3, 3, 'F');
    
    // Texto do banner
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(settings.title || 'Ofertas e Novidades', pageWidth / 2, 27, { align: 'center' });
    
    // Filtrar produtos conforme configurações
    let filteredProducts = products;
    
    // Aplicar agrupamento por categoria se configurado
    let groupedProducts: Record<string, any[]>;
    if (settings.groupByCategory) {
      groupedProducts = filteredProducts.reduce((acc, product) => {
        // Verificar vários campos possíveis para categoria
        const categoryName = product.category || product.category_name || product.categoria || 'Outros';
        if (!acc[categoryName]) {
          acc[categoryName] = [];
        }
        acc[categoryName].push(product);
        return acc;
      }, {} as Record<string, any[]>);
      
      // Log para debug
      console.log('Produtos agrupados por categoria:', groupedProducts);
    } else {
      // Se não agrupar por categoria, colocar todos em uma categoria única
      groupedProducts = { 'Produtos': filteredProducts };
    }
    
    let currentY = 50;
    const margin = 15;
    // Configurar layout para 6 artigos por página (3 colunas x 2 linhas)
    const availableWidth = pageWidth - (margin * 2);
    const spacing = 12;
    const productsPerRow = 3; // Forçar 3 colunas
    const rowsPerPage = 2; // Forçar 2 linhas
    const productsPerPage = productsPerRow * rowsPerPage; // 6 produtos por página
    const productWidth = (availableWidth - (spacing * (productsPerRow - 1))) / productsPerRow;
    const productHeight = 85; // Altura fixa para melhor controle
    
    // Ícones das categorias com acentuações corrigidas
    const categoryIcons = {
      'Carregadores e Cabos': '🔌',
      'Acessórios para Smartphone': '📱',
      'Fones de Ouvido': '🎧',
      'Outros': '📦'
    };
    
    // Ordem das categorias
    const categoryOrder = [
      'Carregadores e Cabos',
      'Acessórios para Smartphone', 
      'Fones de Ouvido',
      'Outros'
    ];
    
    // Ordenar categorias conforme ordem definida
    const sortedCategories = categoryOrder.filter(cat => groupedProducts[cat] && groupedProducts[cat].length > 0);
    
    // Para cada categoria na ordem correta
    sortedCategories.forEach(categoryName => {
      const productsArray = groupedProducts[categoryName] as any[];
      
      // Verificar se precisa de nova página para o cabeçalho
      if (currentY > pageHeight - 150) {
        pdf.addPage();
        currentY = 50;
      }
      
      // Cabeçalho da categoria com ícone e estilo moderno
      const icon = categoryIcons[categoryName] || '📦';
      pdf.setFillColor(45, 45, 45); // Cinza moderno
      pdf.roundedRect(10, currentY, pageWidth - 20, 18, 2, 2, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${icon} ${categoryName}`, margin + 5, currentY + 12);
      
      currentY += 25;
      
      // Processar produtos em lotes de 6 por página
      for (let i = 0; i < productsArray.length; i += productsPerPage) {
        const pageProducts = productsArray.slice(i, i + productsPerPage);
        
        // Se não é o primeiro lote, adicionar nova página
        if (i > 0) {
          pdf.addPage();
          currentY = 50;
          
          // Adicionar cabeçalho da categoria na nova página
          pdf.setFillColor(45, 45, 45);
          pdf.roundedRect(10, currentY, pageWidth - 20, 18, 2, 2, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${icon} ${categoryName}`, margin + 5, currentY + 12);
          currentY += 25;
        }
        
        // Adicionar produtos da página em grid 3x2
        let row = 0;
        let col = 0;
        
        pageProducts.forEach((product, index) => {
          const x = margin + (col * (productWidth + spacing));
          const y = currentY + (row * (productHeight + spacing));
          
          // Desenhar produto com layout melhorado
          addProductToPageModern(pdf, product, x, y, productWidth, productHeight, imageCache);
          
          // Avançar posição
          col++;
          if (col >= productsPerRow) {
            col = 0;
            row++;
          }
        });
        
        // Ajustar Y para próxima categoria ou página
        currentY += (rowsPerPage * (productHeight + spacing)) + 25;
      }
    });
    
    // Gerar o Blob e retornar URL
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);
    
    return url;
  } catch (error) {
    console.error('Erro ao gerar catálogo:', error);
    throw error;
  }
};

/**
 * Adiciona um produto do novo catálogo ao PDF
 */
const addProductToPageNew = (
  pdf: jsPDF,
  product: any,
  x: number,
  y: number,
  width: number,
  height: number,
  settings: CatalogueSettings
) => {
  // Desenhar fundo do produto
  pdf.setFillColor(255, 255, 255);
  pdf.rect(x, y, width, height, 'F');
  
  // Desenhar borda
  pdf.setDrawColor(230, 230, 230);
  pdf.rect(x, y, width, height, 'S');
  
  // Adicionar badge se existir
  if (product.badge) {
    const badgeColor = product.badge === 'NOVIDADE' ? [249, 115, 22] : [234, 179, 8];
    pdf.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    pdf.rect(x + width - 25, y, 25, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
    pdf.text(product.badge, x + width - 23, y + 5);
  }
  
  // Adicionar placeholder da imagem
  pdf.setFillColor(243, 244, 246);
  pdf.rect(x + 5, y + 5, width - 10, height * 0.5, 'F');
  pdf.setTextColor(156, 163, 175);
  pdf.setFontSize(8);
  pdf.text('Imagem', x + width/2, y + height * 0.25 + 2, { align: 'center' });
  
  // Adicionar nome do produto
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const lines = pdf.splitTextToSize(product.name, width - 10);
  let textY = y + height * 0.6;
  lines.slice(0, 2).forEach((line: string, index: number) => {
    pdf.text(line, x + 5, textY + (index * 4));
  });
  
  // Adicionar preço
  pdf.setTextColor(249, 115, 22);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text(product.price, x + 5, y + height - 5);
};

/**
 * Adiciona um produto ao PDF seguindo exatamente o layout da imagem enviada
 */
const addProductToPageExact = (
  pdf: jsPDF,
  product: any,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  // Desenhar fundo do produto com borda
  pdf.setFillColor(255, 255, 255);
  pdf.rect(x, y, width, height, 'F');
  
  // Desenhar borda cinza
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(x, y, width, height, 'S');
  
  // Adicionar badge se existir
  if (product.badge) {
    const badgeColor = product.badge === 'NOVIDADE' ? [249, 115, 22] : [234, 179, 8];
    pdf.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    pdf.rect(x + width - 30, y + 2, 28, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
    pdf.text(product.badge, x + width - 16, y + 7, { align: 'center' });
  }
  
  // Adicionar área da imagem
  pdf.setFillColor(243, 244, 246);
  pdf.rect(x + 3, y + 3, width - 6, height * 0.5, 'F');
  pdf.setTextColor(156, 163, 175);
  pdf.setFontSize(8);
  pdf.text('Imagem', x + width/2, y + height * 0.25 + 2, { align: 'center' });
  
  // Adicionar nome do produto
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const lines = pdf.splitTextToSize(product.name, width - 8);
  let textY = y + height * 0.55;
  lines.slice(0, 2).forEach((line: string, index: number) => {
    pdf.text(line, x + 4, textY + (index * 4));
  });
  
  // Adicionar preço em laranja
  pdf.setTextColor(249, 115, 22);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text(product.price, x + 4, y + height - 4);
};

/**
 * Adiciona um produto ao PDF com layout moderno, bonito e chamativo
 */
const addProductToPageModern = (
  pdf: jsPDF,
  product: any,
  x: number,
  y: number,
  width: number,
  height: number,
  imageCache: Record<string, string>
) => {
  // Desenhar fundo do produto com sombra sutil
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(x, y, width, height, 5, 5, 'F');
  
  // Adicionar sombra sutil
  pdf.setFillColor(240, 240, 240);
  pdf.roundedRect(x + 1, y + 1, width, height, 5, 5, 'F');
  
  // Redesenhar fundo principal
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(x, y, width, height, 5, 5, 'F');
  
  // Desenhar borda moderna
  pdf.setDrawColor(230, 230, 230);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(x, y, width, height, 5, 5, 'S');
  
  // Adicionar área da imagem com estilo moderno
  const imageHeight = height * 0.55;
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(x + 5, y + 5, width - 10, imageHeight, 3, 3, 'F');
  
  // Adicionar borda da imagem
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(x + 5, y + 5, width - 10, imageHeight, 3, 3, 'S');
  
  // Carregar imagem do cache pré-carregado
  const cachedImage = imageCache[product.id];
  
  if (cachedImage) {
    // Usar imagem do cache
    try {
      pdf.addImage(cachedImage, 'JPEG', x + 8, y + 8, width - 16, imageHeight - 6);
    } catch (error) {
      // Se falhar ao adicionar imagem do cache, usar placeholder
      addImagePlaceholder();
    }
  } else {
    // Usar placeholder se não houver imagem no cache
    addImagePlaceholder();
  }
  
  // Função para adicionar placeholder
  function addImagePlaceholder() {
    pdf.setTextColor(148, 163, 184);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Imagem', x + width/2, y + imageHeight/2 + 5, { align: 'center' });
  }
  
  // Adicionar badge se existir com estilo moderno (SOBREPONDO A IMAGEM)
  if (product.badge) {
    const badgeText = String(product.badge);
    const badgeColor = badgeText === 'NOVIDADE' ? [249, 115, 22] : [234, 179, 8];
    pdf.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    // Posicionar badge no canto superior direito DA IMAGEM
    pdf.roundedRect(x + width - 30, y + 8, 25, 10, 3, 3, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text(badgeText, x + width - 17.5, y + 14, { align: 'center' });
  }
  
  // Adicionar nome do produto com quebra de linha melhorada
  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  const productName = String(product.name || product.title || 'Produto sem nome');
  const lines = pdf.splitTextToSize(productName, width - 12);
  let textY = y + imageHeight + 12;
  lines.slice(0, 2).forEach((line: string, index: number) => {
    pdf.text(line, x + 6, textY + (index * 5));
  });
  
  // Adicionar preço em destaque com estilo moderno
  pdf.setTextColor(249, 115, 22);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  const rawPrice = product.price || product.salePrice || 0;
  const productPrice = rawPrice !== 0 ? `${String(rawPrice)} AOA` : 'Preço não disponível';
  pdf.text(productPrice, x + 6, y + height - 8);
  
  // Adicionar linha decorativa acima do preço
  pdf.setDrawColor(249, 115, 22);
  pdf.setLineWidth(1);
  pdf.line(x + 6, y + height - 12, x + width - 6, y + height - 12);
};

export default {
  generatePdfFromElement,
  generateProductCatalogue,
  generateNewCatalogPdf
};
