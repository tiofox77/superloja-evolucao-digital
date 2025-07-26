<?php
// Teste para verificar se o twilio_sender_id está sendo salvo e usado corretamente
require_once 'vendor/autoload.php';

use Supabase\CreateClient;

// Configuração do Supabase
$supabaseUrl = 'https://cqhqvgfvfpawvnpgvjhj.supabase.co';
$supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxaHF2Z2Z2ZnBhd3ZucGd2amhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyNzgxMjYsImV4cCI6MjA0OTg1NDEyNn0.qSKKJdmzZXP5P-tMXzCOLvE1KsU8LqVzjGkE8sU_r1A';

try {
    $supabase = CreateClient::create($supabaseUrl, $supabaseKey);
    
    echo '<h1>Teste de Configuração SMS Sender ID</h1>';
    
    // Buscar configurações SMS
    $response = $supabase
        ->from('settings')
        ->select('*')
        ->eq('key', 'sms_settings')
        ->single()
        ->execute();
    
    echo '<h2>Configurações SMS atuais:</h2>';
    echo '<pre>' . json_encode($response->data, JSON_PRETTY_PRINT) . '</pre>';
    
    if ($response->data && isset($response->data['value'])) {
        $smsSettings = $response->data['value'];
        
        echo '<h3>Campos SMS:</h3>';
        echo '<ul>';
        echo '<li><strong>twilio_account_sid:</strong> ' . ($smsSettings['twilio_account_sid'] ?? 'NÃO DEFINIDO') . '</li>';
        echo '<li><strong>twilio_phone_number:</strong> ' . ($smsSettings['twilio_phone_number'] ?? 'NÃO DEFINIDO') . '</li>';
        echo '<li><strong>twilio_sender_id:</strong> ' . ($smsSettings['twilio_sender_id'] ?? 'NÃO DEFINIDO') . '</li>';
        echo '<li><strong>sms_notifications_enabled:</strong> ' . ($smsSettings['sms_notifications_enabled'] ? 'true' : 'false') . '</li>';
        echo '</ul>';
        
        // Verificar qual valor seria usado como "From"
        $fromValue = $smsSettings['twilio_sender_id'] ?? $smsSettings['twilio_phone_number'] ?? 'NÃO DEFINIDO';
        echo '<h3>Valor "From" que seria usado:</h3>';
        echo '<p style="background-color: #f0f8ff; padding: 10px; border: 1px solid #cce7ff; border-radius: 5px;">';
        echo '<strong>' . $fromValue . '</strong>';
        echo '</p>';
        
        // Verificar se o sender_id está vazio ou nulo
        if (empty($smsSettings['twilio_sender_id'])) {
            echo '<div style="background-color: #fff3cd; padding: 15px; border: 1px solid #ffeaa7; border-radius: 5px; margin: 10px 0;">';
            echo '<h4>⚠️ Aviso:</h4>';
            echo '<p>O campo <code>twilio_sender_id</code> está vazio ou nulo. Por isso, o sistema está usando o número de telefone da Twilio.</p>';
            echo '</div>';
        } else {
            echo '<div style="background-color: #d4edda; padding: 15px; border: 1px solid #c3e6cb; border-radius: 5px; margin: 10px 0;">';
            echo '<h4>✅ Configuração OK:</h4>';
            echo '<p>O campo <code>twilio_sender_id</code> está configurado corretamente.</p>';
            echo '</div>';
        }
    } else {
        echo '<p>Nenhuma configuração SMS encontrada.</p>';
    }
    
} catch (Exception $e) {
    echo '<div style="background-color: #f8d7da; padding: 15px; border: 1px solid #f5c6cb; border-radius: 5px;">';
    echo '<h3>❌ Erro:</h3>';
    echo '<p>' . $e->getMessage() . '</p>';
    echo '</div>';
}
?>
