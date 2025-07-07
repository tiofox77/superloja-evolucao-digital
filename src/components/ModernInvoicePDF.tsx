import React from 'react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { supabase } from '@/integrations/supabase/client';

interface InvoiceData {
  order: {
    id: string;
    order_number: number;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    total_amount: number;
    payment_method: string;
    payment_status: string;
    order_status: string;
    notes?: string;
    created_at: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    products: {
      name: string;
      image_url?: string;
    };
  }>;
  companyInfo: {
    name: string;
    description: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    logo?: string;
  };
}

export class ModernInvoicePDF {
  private doc: jsPDF;
  private pageWidth: number = 210; // A4 width in mm
  private pageHeight: number = 297; // A4 height in mm
  private margin: number = 20;
  private currentY: number = 20;

  constructor() {
    this.doc = new jsPDF();
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0
    }).format(amount);
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private addText(text: string, x: number, y: number, fontSize: number = 10, align: 'left' | 'center' | 'right' = 'left', fontStyle: 'normal' | 'bold' = 'normal') {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', fontStyle);
    this.doc.text(text, x, y, { align });
  }

  private addLine(x1: number, y1: number, x2: number, y2: number, color: string = '#000000') {
    this.doc.setDrawColor(color);
    this.doc.line(x1, y1, x2, y2);
  }

  private addRect(x: number, y: number, width: number, height: number, fillColor?: string, borderColor: string = '#000000') {
    if (fillColor) {
      this.doc.setFillColor(fillColor);
      this.doc.rect(x, y, width, height, 'F');
    }
    this.doc.setDrawColor(borderColor);
    this.doc.rect(x, y, width, height);
  }

  private async generateQRCode(url: string): Promise<string> {
    try {
      return await QRCode.toDataURL(url, {
        width: 100,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  }

  private async addHeader(data: InvoiceData) {
    // Company Logo Area
    this.addRect(this.margin, this.margin, 50, 30, '#f8f9fa');
    
    // Company Info
    this.addText(data.companyInfo.name.toUpperCase(), this.margin + 60, this.margin + 15, 18, 'left', 'bold');
    this.addText(data.companyInfo.description, this.margin + 60, this.margin + 25, 10);
    this.addText(data.companyInfo.address, this.margin + 60, this.margin + 35, 8);
    this.addText(`Tel: ${data.companyInfo.phone} | Email: ${data.companyInfo.email}`, this.margin + 60, this.margin + 42, 8);

    // Invoice Info (Right side)
    const rightX = this.pageWidth - this.margin - 60;
    this.addText('FATURA', rightX, this.margin + 15, 20, 'right', 'bold');
    this.addText(`Nº ${data.order.order_number.toString().padStart(6, '0')}`, rightX, this.margin + 25, 12, 'right');
    this.addText(`Data: ${this.formatDate(data.order.created_at)}`, rightX, this.margin + 35, 10, 'right');

    // QR Code for invoice verification
    const qrUrl = `${window.location.origin}/fatura/${data.order.id}`;
    const qrDataUrl = await this.generateQRCode(qrUrl);
    
    if (qrDataUrl) {
      this.doc.addImage(qrDataUrl, 'PNG', rightX - 30, this.margin + 40, 25, 25);
      this.addText('Verificar Online', rightX - 17, this.margin + 70, 7, 'center');
    }

    this.currentY = this.margin + 80;
  }

  private addCustomerInfo(data: InvoiceData) {
    // Customer section header
    this.addRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 8, '#4f46e5');
    this.doc.setTextColor(255, 255, 255);
    this.addText('DADOS DO CLIENTE', this.margin + 5, this.currentY + 6, 10, 'left', 'bold');
    this.doc.setTextColor(0, 0, 0);

    this.currentY += 15;

    // Customer details
    this.addText(`Nome: ${data.order.customer_name || 'Cliente Balcão'}`, this.margin + 5, this.currentY, 10);
    this.currentY += 7;
    
    if (data.order.customer_email) {
      this.addText(`Email: ${data.order.customer_email}`, this.margin + 5, this.currentY, 10);
      this.currentY += 7;
    }
    
    if (data.order.customer_phone) {
      this.addText(`Telefone: ${data.order.customer_phone}`, this.margin + 5, this.currentY, 10);
      this.currentY += 7;
    }

    // Payment info (right side)
    const rightX = this.pageWidth / 2 + 10;
    const paymentMethod = data.order.payment_method === 'cash' ? 'Dinheiro' : 'Transferência Bancária';
    const paymentStatus = data.order.payment_status === 'paid' ? 'Pago' : 'Pendente';
    
    this.addText(`Método de Pagamento: ${paymentMethod}`, rightX, this.currentY - 14, 10);
    this.addText(`Status do Pagamento: ${paymentStatus}`, rightX, this.currentY - 7, 10);

    this.currentY += 10;
  }

  private addItemsTable(data: InvoiceData) {
    // Table header
    this.addRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 10, '#f8f9fa');
    
    // Headers
    this.addText('PRODUTO', this.margin + 5, this.currentY + 7, 9, 'left', 'bold');
    this.addText('QTD', this.margin + 100, this.currentY + 7, 9, 'center', 'bold');
    this.addText('PREÇO UNIT.', this.margin + 130, this.currentY + 7, 9, 'center', 'bold');
    this.addText('TOTAL', this.pageWidth - this.margin - 25, this.currentY + 7, 9, 'right', 'bold');

    this.currentY += 15;

    // Items
    data.items.forEach((item, index) => {
      if (this.currentY > this.pageHeight - 50) {
        this.doc.addPage();
        this.currentY = this.margin;
      }

      const rowY = this.currentY;
      const rowHeight = 15;

      // Alternate row colors
      if (index % 2 === 0) {
        this.addRect(this.margin, rowY - 2, this.pageWidth - 2 * this.margin, rowHeight, '#f9f9f9');
      }

      // Product name (with line wrapping if needed)
      const productName = item.products.name;
      const maxWidth = 90;
      const splitText = this.doc.splitTextToSize(productName, maxWidth);
      
      this.addText(splitText[0], this.margin + 5, this.currentY + 5, 9);
      if (splitText.length > 1) {
        this.addText(splitText[1], this.margin + 5, this.currentY + 12, 8);
      }

      // Quantity
      this.addText(item.quantity.toString(), this.margin + 100, this.currentY + 5, 9, 'center');

      // Unit price
      this.addText(this.formatCurrency(item.unit_price), this.margin + 130, this.currentY + 5, 9, 'center');

      // Total
      this.addText(this.formatCurrency(item.total_price), this.pageWidth - this.margin - 5, this.currentY + 5, 9, 'right', 'bold');

      this.currentY += rowHeight;
    });

    // Bottom border
    this.addLine(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
  }

  private addTotalsSection(data: InvoiceData) {
    const rightX = this.pageWidth - this.margin - 60;
    const leftX = rightX - 40;

    // Subtotal
    this.addText('Subtotal:', leftX, this.currentY, 10);
    this.addText(this.formatCurrency(data.order.total_amount), rightX, this.currentY, 10, 'right');
    this.currentY += 8;

    // Shipping
    this.addText('Frete:', leftX, this.currentY, 10);
    this.addText('GRÁTIS', rightX, this.currentY, 10, 'right');
    this.currentY += 8;

    // Line
    this.addLine(leftX, this.currentY, rightX, this.currentY);
    this.currentY += 5;

    // Total
    this.addRect(leftX - 5, this.currentY - 3, 65, 12, '#4f46e5');
    this.doc.setTextColor(255, 255, 255);
    this.addText('TOTAL:', leftX, this.currentY + 5, 12, 'left', 'bold');
    this.addText(this.formatCurrency(data.order.total_amount), rightX - 5, this.currentY + 5, 12, 'right', 'bold');
    this.doc.setTextColor(0, 0, 0);

    this.currentY += 20;
  }

  private addFooter(data: InvoiceData) {
    // Notes section
    if (data.order.notes) {
      this.addText('OBSERVAÇÕES:', this.margin, this.currentY, 10, 'left', 'bold');
      this.currentY += 8;
      
      const noteLines = this.doc.splitTextToSize(data.order.notes, this.pageWidth - 2 * this.margin);
      noteLines.forEach((line: string) => {
        this.addText(line, this.margin, this.currentY, 9);
        this.currentY += 6;
      });
      
      this.currentY += 10;
    }

    // Terms and footer
    const footerY = this.pageHeight - 40;
    
    this.addLine(this.margin, footerY - 10, this.pageWidth - this.margin, footerY - 10, '#cccccc');
    
    this.addText('Obrigado pela sua preferência!', this.pageWidth / 2, footerY, 12, 'center', 'bold');
    this.addText(`${data.companyInfo.name} - ${data.companyInfo.description}`, this.pageWidth / 2, footerY + 8, 10, 'center');
    this.addText(`Para dúvidas ou suporte: ${data.companyInfo.email} | ${data.companyInfo.phone}`, this.pageWidth / 2, footerY + 16, 8, 'center');
    
    // Page number
    this.addText(`Página ${this.doc.getCurrentPageInfo().pageNumber}`, this.pageWidth - this.margin, footerY + 20, 8, 'right');
  }

  public async generateInvoice(data: InvoiceData): Promise<void> {
    try {
      await this.addHeader(data);
      this.addCustomerInfo(data);
      this.addItemsTable(data);
      this.addTotalsSection(data);
      this.addFooter(data);

      // Save the PDF
      const fileName = `Fatura_${data.order.order_number.toString().padStart(6, '0')}.pdf`;
      this.doc.save(fileName);
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      throw error;
    }
  }

  public async generateReceiptPDF(data: InvoiceData): Promise<void> {
    // Smaller receipt format (80mm width)
    this.doc = new jsPDF({
      unit: 'mm',
      format: [80, 200] // Thermal printer format
    });

    this.pageWidth = 80;
    this.margin = 5;
    this.currentY = 10;

    try {
      // Header
      this.addText(data.companyInfo.name.toUpperCase(), this.pageWidth / 2, this.currentY, 11, 'center', 'bold');
      this.currentY += 6;
      this.addText('Recibo de Venda', this.pageWidth / 2, this.currentY, 9, 'center');
      this.currentY += 10;

      // Order info
      this.addText(`Pedido: ${data.order.order_number}`, this.margin, this.currentY, 9);
      this.currentY += 6;
      this.addText(`Data: ${this.formatDate(data.order.created_at)}`, this.margin, this.currentY, 9);
      this.currentY += 6;
      
      if (data.order.customer_name) {
        this.addText(`Cliente: ${data.order.customer_name}`, this.margin, this.currentY, 9);
        this.currentY += 6;
      }

      this.addLine(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
      this.currentY += 8;

      // Items
      data.items.forEach(item => {
        const productName = this.doc.splitTextToSize(item.products.name, this.pageWidth - 2 * this.margin);
        productName.forEach((line: string) => {
          this.addText(line, this.margin, this.currentY, 8);
          this.currentY += 5;
        });
        
        this.addText(`${item.quantity}x ${this.formatCurrency(item.unit_price)}`, this.margin, this.currentY, 8);
        this.addText(this.formatCurrency(item.total_price), this.pageWidth - this.margin, this.currentY, 8, 'right', 'bold');
        this.currentY += 8;
      });

      this.addLine(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
      this.currentY += 6;

      // Total
      this.addText('TOTAL:', this.margin, this.currentY, 10, 'left', 'bold');
      this.addText(this.formatCurrency(data.order.total_amount), this.pageWidth - this.margin, this.currentY, 10, 'right', 'bold');
      this.currentY += 15;

      // QR Code
      const qrUrl = `${window.location.origin}/fatura/${data.order.id}`;
      const qrDataUrl = await this.generateQRCode(qrUrl);
      
      if (qrDataUrl) {
        this.doc.addImage(qrDataUrl, 'PNG', this.pageWidth / 2 - 12, this.currentY, 24, 24);
        this.currentY += 28;
        this.addText('Escaneie para ver online', this.pageWidth / 2, this.currentY, 7, 'center');
      }

      // Footer
      this.currentY += 10;
      this.addText('Obrigado!', this.pageWidth / 2, this.currentY, 9, 'center', 'bold');

      const fileName = `Recibo_${data.order.order_number.toString().padStart(6, '0')}.pdf`;
      this.doc.save(fileName);
    } catch (error) {
      console.error('Error generating receipt PDF:', error);
      throw error;
    }
  }
}

// Helper function to use in components
export const generateModernInvoicePDF = async (orderId: string, isReceipt: boolean = false) => {
  try {
    // Fetch order data
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    // Fetch order items
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        products (
          name,
          image_url
        )
      `)
      .eq('order_id', orderId);

    if (itemsError) throw itemsError;

    // Fetch company settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('*');

    if (settingsError) throw settingsError;

    // Parse settings
    const companyInfo = {
      name: 'SuperLoja',
      description: 'Tecnologia & Inovação',
      address: 'Luanda, Angola',
      phone: '+244 942 705 533',
      email: 'contato@superloja.com',
      website: '',
      logo: null
    };

    settingsData?.forEach(setting => {
      const value = setting.value as any;
      if (setting.key === 'store_info') {
        companyInfo.name = value.name || companyInfo.name;
        companyInfo.description = value.description || companyInfo.description;
        companyInfo.logo = value.logo_url;
      } else if (setting.key === 'contact_info') {
        companyInfo.email = value.email || companyInfo.email;
        companyInfo.phone = value.phone || companyInfo.phone;
        companyInfo.address = value.address || companyInfo.address;
      } else if (setting.key === 'business_info') {
        companyInfo.website = value.website || '';
      }
    });

    const invoiceData: InvoiceData = {
      order: orderData,
      items: itemsData || [],
      companyInfo
    };

    const pdfGenerator = new ModernInvoicePDF();
    
    if (isReceipt) {
      await pdfGenerator.generateReceiptPDF(invoiceData);
    } else {
      await pdfGenerator.generateInvoice(invoiceData);
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};