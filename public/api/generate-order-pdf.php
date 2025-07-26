<?php
/**
 * SuperLoja - Endpoint para gerar PDF do pedido
 * Gera um PDF com os detalhes do pedido para anexar ao email
 */

// Configurações de CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verificar se é POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

// Incluir biblioteca TCPDF (você precisa instalar via composer)
require_once 'vendor/autoload.php';

// Função para registrar logs
function logPdf($message, $type = 'info') {
    $logFile = __DIR__ . '/logs/pdf_' . date('Y-m-d') . '.log';
    $logDir = dirname($logFile);
    
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] [$type] $message" . PHP_EOL;
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

try {
    // Receber dados do POST
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Dados inválidos recebidos');
    }
    
    // Validar campos obrigatórios
    $required = ['orderNumber', 'customerName', 'customerEmail', 'items', 'total'];
    foreach ($required as $field) {
        if (!isset($input[$field])) {
            throw new Exception("Campo obrigatório '$field' não fornecido");
        }
    }
    
    logPdf("Gerando PDF para pedido: " . $input['orderNumber'], 'info');
    
    // Criar novo PDF usando TCPDF
    $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
    
    // Configurar informações do documento
    $pdf->SetCreator('SuperLoja');
    $pdf->SetAuthor('SuperLoja');
    $pdf->SetTitle('Pedido #' . $input['orderNumber']);
    $pdf->SetSubject('Fatura do Pedido');
    
    // Configurar margens
    $pdf->SetMargins(15, 20, 15);
    $pdf->SetHeaderMargin(10);
    $pdf->SetFooterMargin(10);
    
    // Configurar fonte
    $pdf->SetFont('helvetica', '', 10);
    
    // Adicionar página
    $pdf->AddPage();
    
    // Cabeçalho da empresa
    $html = '<h1 style="text-align: center; color: #4F46E5;">SuperLoja</h1>';
    $html .= '<p style="text-align: center; color: #666;">Sua loja online de confiança</p>';
    $html .= '<hr style="border: 1px solid #eee;">';
    
    // Informações do pedido
    $html .= '<h2 style="color: #333;">Fatura do Pedido #' . htmlspecialchars($input['orderNumber']) . '</h2>';
    $html .= '<p><strong>Data:</strong> ' . date('d/m/Y H:i:s') . '</p>';
    $html .= '<p><strong>Cliente:</strong> ' . htmlspecialchars($input['customerName']) . '</p>';
    $html .= '<p><strong>Email:</strong> ' . htmlspecialchars($input['customerEmail']) . '</p>';
    
    if (isset($input['customerPhone'])) {
        $html .= '<p><strong>Telefone:</strong> ' . htmlspecialchars($input['customerPhone']) . '</p>';
    }
    
    if (isset($input['address'])) {
        $html .= '<p><strong>Endereço:</strong> ' . htmlspecialchars($input['address']) . '</p>';
    }
    
    $html .= '<br><hr><br>';
    
    // Tabela de itens
    $html .= '<h3 style="color: #333;">Itens do Pedido</h3>';
    $html .= '<table border="1" cellpadding="5" cellspacing="0" style="width: 100%;">';
    $html .= '<thead>';
    $html .= '<tr style="background-color: #f8f9fa;">';
    $html .= '<th style="text-align: left;"><strong>Produto</strong></th>';
    $html .= '<th style="text-align: center;"><strong>Qtd</strong></th>';
    $html .= '<th style="text-align: right;"><strong>Preço Unit.</strong></th>';
    $html .= '<th style="text-align: right;"><strong>Subtotal</strong></th>';
    $html .= '</tr>';
    $html .= '</thead>';
    $html .= '<tbody>';
    
    foreach ($input['items'] as $item) {
        $html .= '<tr>';
        $html .= '<td>' . htmlspecialchars($item['name']) . '</td>';
        $html .= '<td style="text-align: center;">' . intval($item['quantity']) . '</td>';
        $html .= '<td style="text-align: right;">AOA ' . number_format($item['price'], 2, ',', '.') . '</td>';
        $html .= '<td style="text-align: right;">AOA ' . number_format($item['price'] * $item['quantity'], 2, ',', '.') . '</td>';
        $html .= '</tr>';
    }
    
    $html .= '</tbody>';
    $html .= '</table>';
    
    // Total
    $html .= '<br>';
    $html .= '<div style="text-align: right; font-size: 14px;">';
    $html .= '<strong>Total Geral: AOA ' . number_format($input['total'], 2, ',', '.') . '</strong>';
    $html .= '</div>';
    
    // Rodapé
    $html .= '<br><br>';
    $html .= '<hr style="border: 1px solid #eee;">';
    $html .= '<p style="text-align: center; color: #666; font-size: 8px;">';
    $html .= 'Este documento foi gerado automaticamente pela SuperLoja<br>';
    $html .= 'Para dúvidas, entre em contato: superloja@superloja.vip';
    $html .= '</p>';
    
    // Escrever HTML no PDF
    $pdf->writeHTML($html, true, false, true, false, '');
    
    // Diretório para salvar PDFs
    $pdfDir = __DIR__ . '/pdfs';
    if (!is_dir($pdfDir)) {
        mkdir($pdfDir, 0755, true);
    }
    
    // Nome do arquivo PDF
    $filename = 'pedido_' . $input['orderNumber'] . '_' . date('Y-m-d_H-i-s') . '.pdf';
    $filepath = $pdfDir . '/' . $filename;
    
    // Salvar PDF
    $pdf->Output($filepath, 'F');
    
    // Verificar se o arquivo foi criado
    if (!file_exists($filepath)) {
        throw new Exception('Erro ao criar arquivo PDF');
    }
    
    logPdf("PDF criado com sucesso: $filepath", 'info');
    
    // Retornar resposta de sucesso
    echo json_encode([
        'success' => true,
        'message' => 'PDF gerado com sucesso',
        'filename' => $filename,
        'filepath' => $filepath,
        'url' => '/api/pdfs/' . $filename
    ]);
    
} catch (Exception $e) {
    logPdf("Erro ao gerar PDF: " . $e->getMessage(), 'error');
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
