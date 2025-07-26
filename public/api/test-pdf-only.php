<?php
/**
 * Teste isolado para geração de PDF
 */

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

// Função para gerar PDF do pedido
function generateOrderPDF($data) {
    try {
        // Verificar se TCPDF está disponível
        if (!class_exists('TCPDF')) {
            // Tentar incluir TCPDF se não estiver carregado
            if (file_exists(__DIR__ . '/vendor/autoload.php')) {
                require_once __DIR__ . '/vendor/autoload.php';
            } else {
                throw new Exception('TCPDF não encontrado. Execute: composer require tecnickcom/tcpdf');
            }
        }
        
        // Criar novo PDF
        $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
        
        // Configurar informações do documento
        $pdf->SetCreator('SuperLoja');
        $pdf->SetAuthor('SuperLoja');
        $pdf->SetTitle('Pedido #' . $data['orderNumber']);
        $pdf->SetSubject('Fatura do Pedido');
        
        // Configurar margens
        $pdf->SetMargins(15, 20, 15);
        $pdf->SetHeaderMargin(10);
        $pdf->SetFooterMargin(10);
        
        // Configurar fonte
        $pdf->SetFont('helvetica', '', 10);
        
        // Adicionar página
        $pdf->AddPage();
        
        // Conteúdo do PDF
        $html = '<h1 style="text-align: center; color: #4F46E5;">SuperLoja</h1>';
        $html .= '<p style="text-align: center; color: #666;">Sua loja online de confiança</p>';
        $html .= '<hr style="border: 1px solid #eee;">';
        
        // Informações do pedido
        $html .= '<h2 style="color: #333;">Fatura do Pedido #' . htmlspecialchars($data['orderNumber']) . '</h2>';
        $html .= '<p><strong>Data:</strong> ' . date('d/m/Y H:i:s') . '</p>';
        $html .= '<p><strong>Cliente:</strong> ' . htmlspecialchars($data['customerName']) . '</p>';
        $html .= '<p><strong>Email:</strong> ' . htmlspecialchars($data['customerEmail']) . '</p>';
        
        if (isset($data['customerPhone'])) {
            $html .= '<p><strong>Telefone:</strong> ' . htmlspecialchars($data['customerPhone']) . '</p>';
        }
        
        if (isset($data['address'])) {
            $html .= '<p><strong>Endereço:</strong> ' . htmlspecialchars($data['address']) . '</p>';
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
        
        foreach ($data['items'] as $item) {
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
        $html .= '<strong>Total Geral: AOA ' . number_format($data['total'], 2, ',', '.') . '</strong>';
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
        $filename = 'pedido_' . $data['orderNumber'] . '_' . date('Y-m-d_H-i-s') . '.pdf';
        $filepath = $pdfDir . '/' . $filename;
        
        // Salvar PDF
        $pdf->Output($filepath, 'F');
        
        // Verificar se o arquivo foi criado
        if (!file_exists($filepath)) {
            throw new Exception('Erro ao criar arquivo PDF');
        }
        
        return [
            'success' => true,
            'message' => 'PDF gerado com sucesso',
            'filename' => $filename,
            'filepath' => $filepath,
            'url' => '/api/pdfs/' . $filename
        ];
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}

// Teste
echo "<h1>Teste de Geração de PDF</h1>";

$testData = [
    'orderNumber' => 'TEST-' . date('YmdHis'),
    'customerName' => 'Carlos Fernando',
    'customerEmail' => 'carlosfox1782@gmail.com',
    'customerPhone' => '+244923456789',
    'address' => 'Rua Test, 123, Luanda, Angola',
    'items' => [
        [
            'id' => 'prod1',
            'name' => 'Produto Teste 1',
            'price' => 12500.00,
            'quantity' => 1
        ],
        [
            'id' => 'prod2', 
            'name' => 'Produto Teste 2',
            'price' => 6500.00,
            'quantity' => 2
        ]
    ],
    'total' => 25500.00
];

$result = generateOrderPDF($testData);

echo "<h2>Resultado:</h2>";
echo "<pre>" . print_r($result, true) . "</pre>";

if ($result['success']) {
    echo "<p>✅ PDF gerado com sucesso!</p>";
    echo "<p>📄 Arquivo: " . $result['filename'] . "</p>";
    echo "<p>📁 Caminho: " . $result['filepath'] . "</p>";
    echo "<p>🔗 <a href='" . $result['url'] . "' target='_blank'>Download PDF</a></p>";
    
    // Verificar se o arquivo realmente existe
    if (file_exists($result['filepath'])) {
        echo "<p>✅ Arquivo confirmado no disco</p>";
        echo "<p>📊 Tamanho: " . number_format(filesize($result['filepath']) / 1024, 2) . " KB</p>";
    } else {
        echo "<p>❌ Arquivo não encontrado no disco</p>";
    }
} else {
    echo "<p>❌ Erro: " . $result['error'] . "</p>";
}
?>
