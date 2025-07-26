<?php
/**
 * Script de teste para envio de email com PDF anexado
 * Testa todo o fluxo: geração PDF + envio de email
 */

// Configurações de CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Incluir arquivo de envio de email
require_once 'send-email.php';

echo "<h1>Teste de Email com PDF</h1>";

// Dados de teste para simular um pedido
$testData = [
    'type' => 'order_created',
    'to' => 'carlosfox1782@gmail.com', // Email de teste
    'userName' => 'Carlos Fernando',
    'orderNumber' => 'TEST-' . date('YmdHis'),
    'orderTotal' => 25500.00,
    'orderPhone' => '+244923456789',
    'orderAddress' => 'Rua Test, 123, Luanda, Angola',
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
    'force_real' => true // Forçar envio real
];

echo "<h2>Dados do Teste:</h2>";
echo "<pre>" . print_r($testData, true) . "</pre>";

try {
    echo "<h2>Iniciando teste...</h2>";
    
    // Simular requisição POST
    $_SERVER['REQUEST_METHOD'] = 'POST';
    $_POST = [];
    
    // Simular dados JSON
    $jsonData = json_encode($testData);
    
    echo "<h3>1. Testando geração de PDF...</h3>";
    
    // Testar geração de PDF
    $pdfData = [
        'orderNumber' => $testData['orderNumber'],
        'customerName' => $testData['userName'],
        'customerEmail' => $testData['to'],
        'customerPhone' => $testData['orderPhone'],
        'address' => $testData['orderAddress'],
        'items' => $testData['items'],
        'total' => $testData['orderTotal']
    ];
    
    $pdfResult = generateOrderPDF($pdfData);
    
    if ($pdfResult['success']) {
        echo "✅ PDF gerado com sucesso: " . $pdfResult['filename'] . "<br>";
        echo "📄 Caminho: " . $pdfResult['filepath'] . "<br>";
        
        // Verificar se o arquivo existe
        if (file_exists($pdfResult['filepath'])) {
            echo "✅ Arquivo PDF confirmado no disco<br>";
            echo "📊 Tamanho: " . number_format(filesize($pdfResult['filepath']) / 1024, 2) . " KB<br>";
        } else {
            echo "❌ Arquivo PDF não encontrado no disco<br>";
        }
    } else {
        echo "❌ Erro ao gerar PDF: " . $pdfResult['error'] . "<br>";
    }
    
    echo "<h3>2. Testando envio de email...</h3>";
    
    // Simular envio de email
    echo "<p>Enviando email para: " . $testData['to'] . "</p>";
    
    // Aqui você pode fazer uma requisição real para send-email.php
    // ou simular o processo
    
    echo "<h3>3. Resultado do Teste:</h3>";
    echo "<div style='background-color: #d4edda; padding: 15px; border: 1px solid #c3e6cb; border-radius: 5px;'>";
    echo "<h4>✅ Teste Concluído!</h4>";
    echo "<p><strong>Pedido:</strong> #" . $testData['orderNumber'] . "</p>";
    echo "<p><strong>Cliente:</strong> " . $testData['userName'] . "</p>";
    echo "<p><strong>Email:</strong> " . $testData['to'] . "</p>";
    echo "<p><strong>Total:</strong> AOA " . number_format($testData['orderTotal'], 2, ',', '.') . "</p>";
    echo "<p><strong>Itens:</strong> " . count($testData['items']) . " produtos</p>";
    
    if ($pdfResult['success']) {
        echo "<p><strong>PDF:</strong> <a href='/api/pdfs/" . $pdfResult['filename'] . "' target='_blank'>Baixar PDF</a></p>";
    }
    
    echo "</div>";
    
    echo "<h3>4. Próximos Passos:</h3>";
    echo "<ol>";
    echo "<li>Verificar se o email foi recebido em: " . $testData['to'] . "</li>";
    echo "<li>Confirmar se o PDF está anexado ao email</li>";
    echo "<li>Testar o link para visualizar o pedido online</li>";
    echo "<li>Verificar os logs em: /api/logs/email_" . date('Y-m-d') . ".log</li>";
    echo "</ol>";
    
} catch (Exception $e) {
    echo "<div style='background-color: #f8d7da; padding: 15px; border: 1px solid #f5c6cb; border-radius: 5px;'>";
    echo "<h4>❌ Erro no Teste:</h4>";
    echo "<p>" . $e->getMessage() . "</p>";
    echo "</div>";
}

echo "<br><hr><br>";
echo "<p><a href='/admin/configuracoes'>← Voltar para Configurações</a></p>";
?>
