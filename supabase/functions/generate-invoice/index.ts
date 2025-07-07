import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceRequest {
  orderId: string;
  type: 'invoice' | 'receipt';
}

interface OrderData {
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
}

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products: {
    name: string;
    image_url?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const { orderId, type }: InvoiceRequest = await req.json();

    if (!orderId) {
      return new Response(JSON.stringify({ error: "Order ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch order data
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('Error fetching order:', orderError);
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

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

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      return new Response(JSON.stringify({ error: "Error fetching order items" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('pt-AO', {
        style: 'currency',
        currency: 'AOA',
        minimumFractionDigits: 0
      }).format(amount);
    };

    const formatDate = (dateString: string): string => {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Generate QR Code URL for verification
    const qrUrl = `${req.headers.get('origin') || 'https://superloja.ao'}/fatura/${orderId}`;

    // Generate HTML for PDF
    const htmlContent = generateInvoiceHTML(orderData, itemsData || [], type, qrUrl, formatCurrency, formatDate);

    // Here you would typically use a service like Puppeteer to generate PDF
    // For now, we'll return the HTML that can be converted to PDF on the frontend
    return new Response(JSON.stringify({ 
      html: htmlContent,
      qrUrl: qrUrl,
      order: orderData,
      items: itemsData
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in generate-invoice function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

function generateInvoiceHTML(
  order: OrderData, 
  items: OrderItem[], 
  type: 'invoice' | 'receipt',
  qrUrl: string,
  formatCurrency: (amount: number) => string,
  formatDate: (dateString: string) => string
): string {
  
  const isReceipt = type === 'receipt';
  const width = isReceipt ? '80mm' : '210mm';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${isReceipt ? 'Recibo' : 'Fatura'} - ${order.order_number}</title>
      <style>
        @page { 
          size: ${isReceipt ? '80mm 200mm' : 'A4'};
          margin: ${isReceipt ? '5mm' : '15mm'};
        }
        
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 0;
          width: ${width};
          color: #333;
          line-height: 1.4;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px solid #4f46e5;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .company-info h1 {
          color: #4f46e5;
          font-size: ${isReceipt ? '16px' : '24px'};
          margin: 0 0 5px 0;
          font-weight: bold;
        }
        
        .company-info p {
          margin: 2px 0;
          font-size: ${isReceipt ? '8px' : '12px'};
          color: #666;
        }
        
        .invoice-details {
          text-align: right;
        }
        
        .invoice-number {
          font-size: ${isReceipt ? '14px' : '18px'};
          font-weight: bold;
          color: #4f46e5;
        }
        
        .qr-section {
          text-align: center;
          margin: 20px 0;
        }
        
        .customer-section {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
        
        .customer-section h3 {
          margin: 0 0 10px 0;
          font-size: ${isReceipt ? '12px' : '14px'};
        }
        
        .customer-grid {
          display: grid;
          grid-template-columns: ${isReceipt ? '1fr' : '1fr 1fr'};
          gap: 15px;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        
        .items-table th {
          background: #f8f9fa;
          padding: 12px 8px;
          border: 1px solid #dee2e6;
          font-size: ${isReceipt ? '8px' : '10px'};
          font-weight: bold;
          text-align: left;
        }
        
        .items-table td {
          padding: 10px 8px;
          border: 1px solid #dee2e6;
          font-size: ${isReceipt ? '8px' : '10px'};
        }
        
        .items-table tr:nth-child(even) {
          background: #f8f9fa;
        }
        
        .totals-section {
          margin-top: 30px;
          border-top: 2px solid #4f46e5;
          padding-top: 15px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
          font-size: ${isReceipt ? '10px' : '12px'};
        }
        
        .total-final {
          background: #4f46e5;
          color: white;
          padding: 15px;
          border-radius: 8px;
          font-size: ${isReceipt ? '12px' : '16px'};
          font-weight: bold;
        }
        
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: ${isReceipt ? '8px' : '10px'};
          color: #666;
          border-top: 1px solid #dee2e6;
          padding-top: 20px;
        }
        
        .notes-section {
          margin: 20px 0;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #4f46e5;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: ${isReceipt ? '8px' : '10px'};
          font-weight: bold;
        }
        
        .status-paid {
          background: #d4edda;
          color: #155724;
        }
        
        .status-pending {
          background: #fff3cd;
          color: #856404;
        }
        
        @media print {
          body { width: auto; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <h1>SUPERLOJA ANGOLA</h1>
          <p>Tecnologia & Inovação</p>
          <p>Rua dos Coqueiros, 123, Luanda</p>
          <p>Tel: +244 923 456 789</p>
          <p>Email: contato@superloja.ao</p>
        </div>
        
        <div class="invoice-details">
          <div class="invoice-number">${isReceipt ? 'RECIBO' : 'FATURA'}</div>
          <p>Nº ${order.order_number.toString().padStart(6, '0')}</p>
          <p>Data: ${formatDate(order.created_at)}</p>
        </div>
      </div>

      <div class="customer-section">
        <h3>DADOS DO CLIENTE</h3>
        <div class="customer-grid">
          <div>
            <p><strong>Nome:</strong> ${order.customer_name || 'Cliente Balcão'}</p>
            ${order.customer_email ? `<p><strong>Email:</strong> ${order.customer_email}</p>` : ''}
            ${order.customer_phone ? `<p><strong>Telefone:</strong> ${order.customer_phone}</p>` : ''}
          </div>
          <div>
            <p><strong>Pagamento:</strong> ${order.payment_method === 'cash' ? 'Dinheiro' : 'Transferência'}</p>
            <p><strong>Status:</strong> 
              <span class="status-badge ${order.payment_status === 'paid' ? 'status-paid' : 'status-pending'}">
                ${order.payment_status === 'paid' ? 'Pago' : 'Pendente'}
              </span>
            </p>
          </div>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>PRODUTO</th>
            <th style="text-align: center;">QTD</th>
            <th style="text-align: right;">PREÇO UNIT.</th>
            <th style="text-align: right;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.products.name}</td>
              <td style="text-align: center;">${item.quantity}</td>
              <td style="text-align: right;">${formatCurrency(item.unit_price)}</td>
              <td style="text-align: right; font-weight: bold;">${formatCurrency(item.total_price)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals-section">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>${formatCurrency(order.total_amount)}</span>
        </div>
        <div class="total-row">
          <span>Frete:</span>
          <span>GRÁTIS</span>
        </div>
        <div class="total-final total-row">
          <span>TOTAL:</span>
          <span>${formatCurrency(order.total_amount)}</span>
        </div>
      </div>

      ${order.notes ? `
        <div class="notes-section">
          <h4>OBSERVAÇÕES:</h4>
          <p>${order.notes}</p>
        </div>
      ` : ''}

      <div class="qr-section">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrUrl)}" 
             alt="QR Code" style="width: ${isReceipt ? '60px' : '100px'}; height: ${isReceipt ? '60px' : '100px'};">
        <p style="font-size: ${isReceipt ? '8px' : '10px'}; margin: 5px 0;">Escaneie para verificar online</p>
      </div>

      <div class="footer">
        <p><strong>Obrigado pela sua preferência!</strong></p>
        <p>SuperLoja Angola - A sua loja de tecnologia de confiança</p>
        <p>Para dúvidas ou suporte: contato@superloja.ao | +244 923 456 789</p>
        <p>Website: www.superloja.ao</p>
      </div>
    </body>
    </html>
  `;
}

serve(handler);