<?php
/**
 * Teste específico para email com PDF
 */

// Testar via POST simulando o fluxo real
$testData = [
    'type' => 'order_created',
    'to' => 'carlosfox1782@gmail.com',
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

// Fazer requisição POST para send-email.php
$url = 'http://localhost/superlojareact/public/api/send-email.php';
$options = [
    'http' => [
        'header' => "Content-type: application/json\r\n",
        'method' => 'POST',
        'content' => json_encode($testData)
    ]
];

$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);

echo "<h1>Teste de Email com PDF</h1>";
echo "<h2>Dados enviados:</h2>";
echo "<pre>" . print_r($testData, true) . "</pre>";

echo "<h2>Resposta da API:</h2>";
echo "<pre>$result</pre>";

$response = json_decode($result, true);
if ($response) {
    echo "<h2>Resposta decodificada:</h2>";
    echo "<pre>" . print_r($response, true) . "</pre>";
    
    if (isset($response['success']) && $response['success']) {
        echo "<div style='background-color: #d4edda; padding: 15px; border: 1px solid #c3e6cb; border-radius: 5px;'>";
        echo "<h3>✅ Email enviado com sucesso!</h3>";
        echo "<p>Verificar a caixa de entrada em: " . $testData['to'] . "</p>";
        echo "</div>";
    } else {
        echo "<div style='background-color: #f8d7da; padding: 15px; border: 1px solid #f5c6cb; border-radius: 5px;'>";
        echo "<h3>❌ Erro no envio:</h3>";
        echo "<p>" . ($response['message'] ?? 'Erro desconhecido') . "</p>";
        echo "</div>";
    }
} else {
    echo "<div style='background-color: #fff3cd; padding: 15px; border: 1px solid #ffeaa7; border-radius: 5px;'>";
    echo "<h3>⚠️ Resposta inválida da API</h3>";
    echo "<p>Não foi possível decodificar a resposta JSON</p>";
    echo "</div>";
}

// Verificar se PDFs foram gerados
$pdfDir = __DIR__ . '/pdfs';
if (is_dir($pdfDir)) {
    $pdfs = glob($pdfDir . '/*.pdf');
    echo "<h2>PDFs gerados:</h2>";
    if (count($pdfs) > 0) {
        echo "<ul>";
        foreach ($pdfs as $pdf) {
            $filename = basename($pdf);
            $size = filesize($pdf);
            echo "<li><a href='/api/pdfs/$filename' target='_blank'>$filename</a> (" . number_format($size / 1024, 2) . " KB)</li>";
        }
        echo "</ul>";
    } else {
        echo "<p>Nenhum PDF encontrado</p>";
    }
}
?>
