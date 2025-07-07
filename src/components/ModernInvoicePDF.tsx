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
  private margin: number = 15;
  private currentY: number = 15;

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

  private addText(text: string, x: number, y: number, fontSize: number = 10, align: 'left' | 'center' | 'right' = 'left', fontStyle: 'normal' | 'bold' = 'normal', color: string = '#000000') {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', fontStyle);
    this.doc.setTextColor(color);
    this.doc.text(text, x, y, { align });
  }

  private addLine(x1: number, y1: number, x2: number, y2: number, color: string = '#e5e5e5', lineWidth: number = 0.5) {
    this.doc.setDrawColor(color);
    this.doc.setLineWidth(lineWidth);
    this.doc.line(x1, y1, x2, y2);
  }

  private addRect(x: number, y: number, width: number, height: number, fillColor?: string, borderColor: string = '#e5e5e5', lineWidth: number = 0.5) {
    this.doc.setLineWidth(lineWidth);
    if (fillColor) {
      this.doc.setFillColor(fillColor);
      this.doc.rect(x, y, width, height, 'FD');
    } else {
      this.doc.setDrawColor(borderColor);
      this.doc.rect(x, y, width, height);
    }
  }

  private async generateQRCode(url: string): Promise<string> {
    try {
      return await QRCode.toDataURL(url, {
        width: 80,
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
    // Company logo placeholder (if available)
    this.addRect(this.margin, this.margin, 35, 20, '#f8f9fa', '#e5e5e5');
    
    // Company Info (left side, below logo)
    this.addText(data.companyInfo.name.toUpperCase(), this.margin, this.margin + 30, 14, 'left', 'bold');
    this.addText(data.companyInfo.description, this.margin, this.margin + 42, 9, 'left', 'normal', '#666666');

    // Invoice title and number (right side)
    const rightX = this.pageWidth - this.margin;
    this.addText('FATURA', rightX, this.margin + 15, 16, 'right', 'bold');
    this.addText(`Pedido Nº ${data.order.order_number?.toString().padStart(6, '0')}`, rightX, this.margin + 28, 10, 'right', 'normal', '#666666');

    // Date section (right side, below invoice info)
    this.addText('Data do Pedido', rightX, this.margin + 42, 8, 'right', 'normal', '#666666');
    this.addText(this.formatDate(data.order.created_at), rightX, this.margin + 52, 10, 'right', 'bold');

    // QR Code (bottom right)
    const qrUrl = `${window.location.origin}/fatura/${data.order.id}`;
    const qrDataUrl = await this.generateQRCode(qrUrl);
    
    if (qrDataUrl) {
      this.doc.addImage(qrDataUrl, 'PNG', rightX - 25, this.margin + 60, 25, 25);
      this.addText('Verificar Online', rightX - 12.5, this.margin + 90, 7, 'center', 'normal', '#666666');
    }

    // Bottom border for header
    this.addLine(this.margin, this.margin + 100, this.pageWidth - this.margin, this.margin + 100, '#e5e5e5', 1);
    
    this.currentY = this.margin + 110;
  }

  private addCustomerInfo(data: InvoiceData) {
    // Customer section
    this.addText('Dados do Cliente', this.margin, this.currentY, 12, 'left', 'bold');
    this.currentY += 15;

    // Customer details in two columns
    const leftCol = this.margin;
    const rightCol = this.pageWidth / 2;

    this.addText(`Nome: ${data.order.customer_name || 'Cliente Balcão'}`, leftCol, this.currentY, 10);
    this.addText(`Email: ${data.order.customer_email || 'N/A'}`, leftCol, this.currentY + 8, 10);
    this.addText(`Telefone: ${data.order.customer_phone || 'N/A'}`, leftCol, this.currentY + 16, 10);

    // Payment info (right column)
    const paymentMethod = data.order.payment_method === 'cash' ? 'Dinheiro' : 'Transferência';
    const paymentStatus = data.order.payment_status === 'paid' ? 'Pago' : 'Pendente';
    const orderStatus = data.order.order_status === 'completed' ? 'Concluído' : 
                       data.order.order_status === 'pending' ? 'Pendente' : 'Cancelado';

    this.addText(`Método de Pagamento: ${paymentMethod}`, rightCol, this.currentY, 10);
    this.addText(`Status do Pagamento: ${paymentStatus}`, rightCol, this.currentY + 8, 10);
    this.addText(`Status do Pedido: ${orderStatus}`, rightCol, this.currentY + 16, 10);

    this.currentY += 30;
  }

  private addItemsTable(data: InvoiceData) {
    // Items header
    this.addText('Itens do Pedido', this.margin, this.currentY, 12, 'left', 'bold');
    this.currentY += 15;

    // Table headers background
    this.addRect(this.margin, this.currentY - 5, this.pageWidth - 2 * this.margin, 12, '#f8f9fa');
    
    // Table headers
    const col1 = this.margin + 5;
    const col2 = this.pageWidth - 80;
    const col3 = this.pageWidth - 50;
    const col4 = this.pageWidth - this.margin - 5;

    this.addText('PRODUTO', col1, this.currentY + 3, 9, 'left', 'bold');
    this.addText('QTD', col2, this.currentY + 3, 9, 'center', 'bold');
    this.addText('PREÇO UNIT.', col3, this.currentY + 3, 9, 'center', 'bold');
    this.addText('TOTAL', col4, this.currentY + 3, 9, 'right', 'bold');

    this.currentY += 15;

    // Items
    data.items.forEach((item, index) => {
      const rowY = this.currentY;
      const rowHeight = 12;

      // Alternate row colors
      if (index % 2 === 0) {
        this.addRect(this.margin, rowY - 2, this.pageWidth - 2 * this.margin, rowHeight, '#f9f9f9');
      }

      // Product name
      this.addText(item.products.name, col1, rowY + 5, 9);
      
      // Quantity
      this.addText(item.quantity.toString(), col2, rowY + 5, 9, 'center');
      
      // Unit price
      this.addText(this.formatCurrency(item.unit_price), col3, rowY + 5, 9, 'center');
      
      // Total
      this.addText(this.formatCurrency(item.total_price), col4, rowY + 5, 9, 'right', 'bold');

      this.currentY += rowHeight;
    });

    // Bottom table border
    this.addLine(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 15;
  }

  private addTotalsSection(data: InvoiceData) {
    const rightX = this.pageWidth - this.margin;
    const leftX = rightX - 60;

    // Subtotal
    this.addText('Subtotal:', leftX, this.currentY, 10, 'left');
    this.addText(this.formatCurrency(data.order.total_amount), rightX, this.currentY, 10, 'right');
    this.currentY += 10;

    // Shipping
    this.addText('Frete:', leftX, this.currentY, 10, 'left');
    this.addText('Grátis', rightX, this.currentY, 10, 'right');
    this.currentY += 10;

    // Separator line
    this.addLine(leftX, this.currentY, rightX, this.currentY);
    this.currentY += 8;

    // Total with background
    this.addRect(leftX - 5, this.currentY - 5, rightX - leftX + 10, 15, '#4f46e5');
    this.addText('Total:', leftX, this.currentY + 3, 12, 'left', 'bold', '#ffffff');
    this.addText(this.formatCurrency(data.order.total_amount), rightX, this.currentY + 3, 12, 'right', 'bold', '#ffffff');

    this.currentY += 25;
  }

  private addFooter(data: InvoiceData) {
    // Notes section
    if (data.order.notes) {
      this.addText('Observações', this.margin, this.currentY, 10, 'left', 'bold');
      this.currentY += 10;
      
      const noteLines = this.doc.splitTextToSize(data.order.notes, this.pageWidth - 2 * this.margin);
      noteLines.forEach((line: string) => {
        this.addText(line, this.margin, this.currentY, 9);
        this.currentY += 6;
      });
      
      this.currentY += 10;
    }

    // Footer
    const footerY = this.pageHeight - 40;
    
    this.addLine(this.margin, footerY - 10, this.pageWidth - this.margin, footerY - 10, '#e5e5e5');
    
    this.addText('Obrigado pela sua compra!', this.pageWidth / 2, footerY, 12, 'center', 'bold');
    this.addText(`${data.companyInfo.name} - ${data.companyInfo.address}`, this.pageWidth / 2, footerY + 8, 10, 'center');
    this.addText(`Telefone: ${data.companyInfo.phone} | Email: ${data.companyInfo.email}`, this.pageWidth / 2, footerY + 16, 8, 'center');
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
    // Receipt format (80mm width)
    this.doc = new jsPDF({
      unit: 'mm',
      format: [80, 150]
    });

    this.pageWidth = 80;
    this.margin = 5;
    this.currentY = 8;

    try {
      // Header
      this.addText(data.companyInfo.name.toUpperCase(), this.pageWidth / 2, this.currentY, 10, 'center', 'bold');
      this.currentY += 6;
      this.addText('Recibo de Venda', this.pageWidth / 2, this.currentY, 8, 'center');
      this.currentY += 10;

      // Order info
      this.addText(`Pedido: ${data.order.order_number}`, this.margin, this.currentY, 8);
      this.currentY += 5;
      this.addText(`Data: ${this.formatDate(data.order.created_at)}`, this.margin, this.currentY, 8);
      this.currentY += 5;
      
      if (data.order.customer_name) {
        this.addText(`Cliente: ${data.order.customer_name}`, this.margin, this.currentY, 8);
        this.currentY += 5;
      }

      this.addLine(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
      this.currentY += 6;

      // Items (simplified for receipt)
      data.items.forEach(item => {
        const productLine = `${item.quantity}x ${item.products.name}`;
        const productLines = this.doc.splitTextToSize(productLine, this.pageWidth - 2 * this.margin);
        
        productLines.forEach((line: string) => {
          this.addText(line, this.margin, this.currentY, 7);
          this.currentY += 4;
        });
        
        this.addText(this.formatCurrency(item.unit_price), this.margin, this.currentY, 7);
        this.addText(this.formatCurrency(item.total_price), this.pageWidth - this.margin, this.currentY, 7, 'right', 'bold');
        this.currentY += 6;
      });

      this.addLine(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
      this.currentY += 5;

      // Total
      this.addText('TOTAL:', this.margin, this.currentY, 9, 'left', 'bold');
      this.addText(this.formatCurrency(data.order.total_amount), this.pageWidth - this.margin, this.currentY, 9, 'right', 'bold');
      this.currentY += 12;

      // QR Code (smaller for receipt)
      const qrUrl = `${window.location.origin}/fatura/${data.order.id}`;
      const qrDataUrl = await this.generateQRCode(qrUrl);
      
      if (qrDataUrl) {
        this.doc.addImage(qrDataUrl, 'PNG', this.pageWidth / 2 - 8, this.currentY, 16, 16);
        this.currentY += 18;
        this.addText('Verificar online', this.pageWidth / 2, this.currentY, 6, 'center');
      }

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