<?php
/**
 * SuperLoja - Endpoint PHP para envio de emails via SMTP
 * Compatível com cPanel e hospedagem compartilhada
 */

// Configurações de CORS ampliadas
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, Cache-Control, Pragma");
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

// Incluir PHPMailer (você precisa fazer upload via cPanel)
require_once 'vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Função para registrar logs
function logEmail($message, $type = 'info') {
    $logFile = __DIR__ . '/logs/email_' . date('Y-m-d') . '.log';
    $logDir = dirname($logFile);
    
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] [$type] $message" . PHP_EOL;
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

// Função para gerar PDF do pedido internamente
function generateOrderPDF($data) {
    try {
        // Garantir que o autoload está incluído
        require_once __DIR__ . '/vendor/autoload.php';
        
        // Verificar se TCPDF está disponível
        if (!class_exists('TCPDF')) {
            throw new Exception('TCPDF não encontrado. Verifique se composer install foi executado.');
        }
        
        logEmail('Iniciando geração de PDF para pedido: ' . $data['orderNumber'], 'info');
        
        // Criar novo PDF
        $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
        
        // Configuração inicial
        $pdf->SetCreator(PDF_CREATOR);
        $pdf->SetAuthor('SuperLoja');
        $pdf->SetTitle('Fatura do Pedido #' . $data['orderNumber']);
        $pdf->SetSubject('Fatura de Pedido');
        $pdf->SetKeywords('TCPDF, PDF, fatura, pedido');
        
        // Configuração da página
        $pdf->SetDefaultMonospacedFont(PDF_FONT_MONOSPACED);
        $pdf->SetMargins(15, 15, 15);
        $pdf->SetHeaderMargin(5);
        $pdf->SetFooterMargin(10);
        $pdf->SetAutoPageBreak(TRUE, 25);
        $pdf->setImageScale(PDF_IMAGE_SCALE_RATIO);
        
        // Criar nova página
        $pdf->AddPage();
        
        // Caminho para o logo
        $logoPath = __DIR__ . '/images/superloja-logo.png';
        
        // HTML do cabeçalho com logo
        $html = '<style>
            .header { font-family: Arial, sans-serif; }
            .logo { color: #FF6B35; font-size: 20px; font-weight: bold; }
            .company-name { color: #333; font-size: 16px; font-weight: bold; margin-left: 10px; }
            .company-info { color: #666; font-size: 10px; margin-top: 5px; margin-left: 10px; }
            .date-section { text-align: right; }
            .invoice-title { font-size: 18px; font-weight: bold; margin: 20px 0 10px 0; }
            .order-number { color: #666; font-size: 12px; margin-bottom: 20px; }
            .section-header { background-color: #f8f9fa; padding: 8px; font-weight: bold; border-left: 4px solid #4F46E5; font-size: 12px; }
            .customer-info { padding: 10px; font-size: 11px; }
            .status-info { padding: 10px; font-size: 11px; }
            .item-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .item-table th, .item-table td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
            .item-table th { background-color: #f8f9fa; font-weight: bold; }
            .price { text-align: right; }
            .total-row { font-weight: bold; background-color: #f8f9fa; }
            .observations { margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #666; }
        </style>';
        
        // Cabeçalho com logo
        $html .= '<table width="100%" cellpadding="0" cellspacing="0" style="border-bottom: 1px solid #ddd; padding-bottom: 15px;">';
        $html .= '<tr>';
        $html .= '<td width="50%" style="vertical-align: middle;">';
        
        // Inserir logo se existir
        if (file_exists($logoPath)) {
            $html .= '<img src="' . $logoPath . '" width="40" height="40" style="float: left; margin-right: 10px;">';
        }
        
        $html .= '<div style="display: inline-block; vertical-align: middle;">';
        $html .= '<div class="company-name">SuperLoja</div>';
        $html .= '<div class="company-info">A melhor loja de eletrônicos de Angola</div>';
        $html .= '</div>';
        $html .= '</td>';
        $html .= '<td width="50%" class="date-section">';
        $html .= '<div style="font-size: 10px; color: #666;">Data do pedido</div>';
        
        // Formatação da data em português
        $diasSemana = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
        $meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        $diaSemana = $diasSemana[date('w')];
        $dia = date('d');
        $mes = $meses[date('n') - 1];
        $ano = date('Y');
        
        $html .= '<div style="font-size: 12px; font-weight: bold;">' . $diaSemana . ', ' . $dia . ' de ' . $mes . ' de ' . $ano . '</div>';
        $html .= '<div style="font-size: 10px;">' . date('H:i') . '</div>';
        $html .= '</td>';
        $html .= '</tr>';
        $html .= '</table>';
        
        // Título da fatura
        $html .= '<div class="invoice-title">FATURA</div>';
        $html .= '<div class="order-number">Pedido N° ' . $data['orderNumber'] . '</div>';
        
        // Layout de duas colunas
        $html .= '<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">';
        $html .= '<tr>';
        
        // Coluna esquerda - Dados do Cliente
        $html .= '<td style="width: 50%; vertical-align: top; padding-right: 20px;">';
        $html .= '<div class="section-header">Dados do Cliente</div>';
        $html .= '<div class="customer-info">';
        $html .= '<div style="margin-bottom: 8px;"><strong>Nome:</strong> ' . htmlspecialchars($data['customerName']) . '</div>';
        $html .= '<div style="margin-bottom: 8px;"><strong>Email:</strong> ' . htmlspecialchars($data['customerEmail']) . '</div>';
        if (isset($data['customerPhone'])) {
            $html .= '<div style="margin-bottom: 8px;"><strong>Telefone:</strong> ' . htmlspecialchars($data['customerPhone']) . '</div>';
        }
        $html .= '</div>';
        $html .= '</td>';
        
        // Coluna direita - Status do Pedido
        $html .= '<td style="width: 50%; vertical-align: top;">';
        $html .= '<div class="section-header">Status do Pedido</div>';
        $html .= '<div class="status-info">';
        $html .= '<div style="margin-bottom: 8px;"><strong>Status:</strong> <span style="color: #3498db;">🕐 Pendente</span></div>';
        $html .= '<div style="margin-bottom: 8px;"><strong>Pagamento:</strong> <span style="color: #3498db;">Dinheiro - Pendente</span></div>';
        $html .= '</div>';
        $html .= '</td>';
        
        $html .= '</tr>';
        $html .= '</table>';
        
        // Seção Itens do Pedido
        $html .= '<div class="section-header">Itens do Pedido</div>';
        $html .= '<table class="item-table">';
        $html .= '<thead>';
        $html .= '<tr>';
        $html .= '<th style="width: 10%;"></th>';
        $html .= '<th style="width: 50%;">Produto</th>';
        $html .= '<th style="width: 10%; text-align: center;">Qtd</th>';
        $html .= '<th style="width: 15%; text-align: right;">Preço Unit.</th>';
        $html .= '<th style="width: 15%; text-align: right;">Subtotal</th>';
        $html .= '</tr>';
        $html .= '</thead>';
        $html .= '<tbody>';
        
        $subtotal = 0;
        foreach ($data['items'] as $item) {
            $itemTotal = $item['price'] * $item['quantity'];
            $subtotal += $itemTotal;
            
            $html .= '<tr>';
            $html .= '<td style="text-align: center;">❓</td>';
            $html .= '<td>' . htmlspecialchars($item['name']) . '<br><span style="color: #666; font-size: 9px;">' . number_format($item['price'], 0) . ' Kz x ' . intval($item['quantity']) . '</span></td>';
            $html .= '<td style="text-align: center;">' . intval($item['quantity']) . '</td>';
            $html .= '<td style="text-align: right;">' . number_format($item['price'], 0) . ' Kz</td>';
            $html .= '<td style="text-align: right;">' . number_format($itemTotal, 0) . ' Kz</td>';
            $html .= '</tr>';
        }
        
        $html .= '</tbody>';
        $html .= '</table>';
        
        // Seção de totais
        $html .= '<div style="text-align: right; margin: 20px 0;">';
        $html .= '<div style="font-size: 12px; margin-bottom: 5px;">Subtotal: <strong>' . number_format($subtotal, 0) . ' Kz</strong></div>';
        $html .= '<div style="font-size: 12px; margin-bottom: 5px; color: #666;">Frete: <strong>Grátis</strong></div>';
        $html .= '<div style="font-size: 14px; font-weight: bold; color: #e74c3c;">Total: ' . number_format($data['total'], 0) . ' Kz</div>';
        $html .= '</div>';
        
        // Seção Observações
        if (isset($data['address'])) {
            $html .= '<div class="observations">';
            $html .= '<div class="section-header">Observações</div>';
            $html .= '<div style="padding: 10px; font-size: 11px; color: #333; line-height: 1.4;">';
            $html .= 'Endereço: ' . htmlspecialchars($data['address']) . '<br>';
            $html .= 'Cidade: Luanda, Luanda<br>';
            $html .= 'País: Angola<br>';
            $html .= 'Rua: av 21';
            $html .= '</div>';
            $html .= '</div>';
        }
        
        // Rodapé
        $html .= '<div class="footer">';
        $html .= '<p>Obrigado pela sua compra!<br>';
        $html .= 'SuperLoja - Luanda, Angola<br>';
        $html .= 'Telefone: +244 900 000 000 | Email: carlosfox1782@gmail.com</p>';
        $html .= '</div>';
        
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
        logEmail('Salvando PDF em: ' . $filepath, 'info');
        $pdf->Output($filepath, 'F');
        
        // Verificar se o arquivo foi criado
        if (!file_exists($filepath)) {
            logEmail('ERRO: Arquivo PDF não foi criado em: ' . $filepath, 'error');
            throw new Exception('Erro ao criar arquivo PDF');
        }
        
        $fileSize = filesize($filepath);
        logEmail('PDF criado com sucesso. Tamanho: ' . $fileSize . ' bytes', 'info');
        
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

// Logs de diagnóstico para a requisição atual
logEmail("=== INÍCIO DE REQUISIÇÃO ====", 'debug');
logEmail("Host: " . (isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'N/A'), 'debug');
logEmail("Origin: " . (isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : 'N/A'), 'debug');
logEmail("Method: " . $_SERVER['REQUEST_METHOD'], 'debug');
logEmail("User Agent: " . (isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : 'N/A'), 'debug');

// Função para carregar configurações SMTP
function loadSmtpConfig() {
    $configFile = __DIR__ . '/config/smtp.json';
    
    if (!file_exists($configFile)) {
        throw new Exception('Arquivo de configuração SMTP não encontrado');
    }
    
    $config = json_decode(file_get_contents($configFile), true);
    
    if (!$config) {
        throw new Exception('Erro ao ler configurações SMTP');
    }
    
    return $config;
}

try {
    // Receber dados do POST e registrar para depuração
    $rawInput = file_get_contents('php://input');
    logEmail("Corpo da requisição: $rawInput", 'debug');
    
    $input = json_decode($rawInput, true);
    
    if (!$input) {
        $jsonError = json_last_error_msg();
        logEmail("Erro ao decodificar JSON: $jsonError", 'error');
        throw new Exception("Dados inválidos recebidos. Erro JSON: $jsonError");
    }
    
    // Registrar campos recebidos
    logEmail("Campos recebidos: " . implode(", ", array_keys($input)), 'debug');
    logEmail("Tipo de email: " . (isset($input['type']) ? $input['type'] : 'N/A'), 'debug');
    logEmail("Destinatário: " . (isset($input['to']) ? $input['to'] : 'N/A'), 'debug');
    logEmail("Forçar real: " . (isset($input['force_real']) ? ($input['force_real'] ? 'Sim' : 'Não') : 'Não definido'), 'debug');
    
    // Validar campos obrigatórios
    $required = ['type', 'to', 'userName'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            throw new Exception("Campo obrigatório '$field' não fornecido");
        }
    }
    
    // Verificar se é ambiente de desenvolvimento
    $isDevelopment = ($_SERVER['HTTP_HOST'] === 'localhost' || 
                      $_SERVER['HTTP_HOST'] === '127.0.0.1' || 
                      strpos($_SERVER['HTTP_HOST'], 'localhost') !== false);
    
    // Verificar se foi solicitado envio real (mesmo em desenvolvimento)
    // Forçar envio real mesmo se o valor for string 'true'
    $forceReal = isset($input['force_real']) && 
                 ($input['force_real'] === true || $input['force_real'] === 'true' || $input['force_real'] === 1);
    
    logEmail("Ambiente de desenvolvimento: " . ($isDevelopment ? 'Sim' : 'Não'), 'debug');
    logEmail("Forçar email real: " . ($forceReal ? 'Sim' : 'Não'), 'debug');
    
    // Se force_real for true, sempre enviar email real (mesmo em localhost)
    // Caso contrário, simular em desenvolvimento
    logEmail("Decisão de envio - isDev: $isDevelopment, forceReal: $forceReal", 'debug');
    
    if ($isDevelopment && !$forceReal) {
        // Em desenvolvimento, apenas simular o envio (a menos que force_real seja true)
        logEmail("[DEV] Simulando envio de email para: " . $input['to'] . " - Tipo: " . $input['type'], 'info');
        
        echo json_encode([
            'success' => true,
            'message' => 'Email enviado com sucesso (modo desenvolvimento)',
            'debug' => [
                'to' => $input['to'],
                'type' => $input['type'],
                'environment' => 'development',
                'note' => 'Para enviar email real, adicione "force_real": true no POST'
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit();
    }
    
    // Carregar configurações SMTP para produção
    $smtpConfig = loadSmtpConfig();
    
    // Templates padrão como fallback
    $defaultTemplates = [
        'welcome' => [
            'subject' => 'Bem-vindo à SuperLoja!',
            'body' => '<h3>Olá {userName}!</h3>
<p>Sua conta na SuperLoja foi criada com sucesso! Agora você pode aproveitar todas as nossas ofertas.</p>',
            'enabled' => true
        ],
        'order_created' => [
            'subject' => 'Pedido #{orderNumber} Confirmadoa',
            'body' => '<h3>Obrigado pela sua compra, {userName}!</h3>
<p>Seu pedido <strong>#{orderNumber}</strong> foi criado com sucesso!</p>
<p>Valor total: <strong>{orderTotal} AOA</strong></p>',
            'enabled' => true
        ],
        'status_changed' => [
            'subject' => 'Atualização do Pedido #{orderNumber}',
            'body' => '<h3>Olá {userName}!</h3>
<p>Seu pedido <strong>#{orderNumber}</strong> foi atualizado para: {newStatus}</p>',
            'enabled' => true
        ],
        'contact_form' => [
            'subject' => 'Confirmação de Contacto',
            'body' => '<h3>Olá {userName}!</h3>
<p>Recebemos sua mensagem enviada através do formulário de contacto.</p>',
            'enabled' => true
        ]
    ];
    
    // Carregar templates do ficheiro local
    $templates = $defaultTemplates;
    try {
        // Verificar se existe o ficheiro de templates
        $configFile = __DIR__ . '/config/templates.json';
        
        if (file_exists($configFile)) {
            // Carregar templates do ficheiro
            $templatesConfig = json_decode(file_get_contents($configFile), true);
            
            if ($templatesConfig && isset($templatesConfig['email_templates'])) {
                $dbTemplates = $templatesConfig['email_templates'];
                
                // Actualizar os templates padrão com os do ficheiro
                foreach ($dbTemplates as $type => $template) {
                    if (isset($templates[$type])) {
                        if (isset($template['subject'])) {
                            $templates[$type]['subject'] = $template['subject'];
                        }
                        if (isset($template['body'])) {
                            $templates[$type]['body'] = $template['body'];
                        }
                        if (isset($template['enabled'])) {
                            $templates[$type]['enabled'] = $template['enabled'];
                        }
                        
                        logEmail("Template '{$type}' carregado do ficheiro local", "info");
                    }
                }
                
                logEmail("Templates carregados com sucesso do ficheiro local", "info");
            } else {
                logEmail("Formato de templates inválido no ficheiro local", "warning");
            }
        } else {
            // Se não existe o ficheiro de templates, tentar sincronizar com o React
            logEmail("Ficheiro de templates não encontrado, tentando sincronizar com React", "info");
            
            // Configurar os dados em formato JSON
            $templatesData = [
                'email_templates' => $defaultTemplates
            ];
            
            // Criar directório config se não existir
            $configDir = dirname($configFile);
            if (!is_dir($configDir)) {
                mkdir($configDir, 0755, true);
            }
            
            // Guardar os templates no ficheiro
            file_put_contents($configFile, json_encode($templatesData, JSON_PRETTY_PRINT));
            logEmail("Criado ficheiro de templates padrão", "info");
        }
    } catch (Exception $e) {
        logEmail("Erro ao carregar templates: " . $e->getMessage(), "error");
    }
    
    // Confirmar que templates foram carregados
    logEmail("Template 'welcome' subject: " . $templates['welcome']['subject'], "debug");
    logEmail("Template 'welcome' enabled: " . ($templates['welcome']['enabled'] ? 'true' : 'false'), "debug");
    
    $type = $input['type'];
    $to = $input['to'];
    $userName = $input['userName'];
    $orderNumber = $input['orderNumber'] ?? '';
    $orderTotal = $input['orderTotal'] ?? '';
    $newStatus = $input['newStatus'] ?? '';
    $message = $input['message'] ?? '';
    
    // Verificar se o template existe
    if (!isset($templates[$type])) {
        throw new Exception("Tipo de email '$type' não suportado");
    }
    
    $template = $templates[$type];
    
    // Verificar se o template está activo
    if (isset($template['enabled']) && $template['enabled'] === false) {
        logEmail("Template de email '$type' está desactivado nas configurações. Email não enviado.", "info");
        echo json_encode([
            'success' => true, 
            'skipped' => true,
            'message' => 'Email não enviado: template desactivado nas configurações'
        ]);
        exit;
    }
    
    // Substituir variáveis no template
    $subject = str_replace(
        ['{userName}', '{orderNumber}', '{orderTotal}', '{newStatus}'],
        [$userName, $orderNumber, $orderTotal, $newStatus],
        $template['subject']
    );
    
    $body = str_replace(
        ['{userName}', '{orderNumber}', '{orderTotal}', '{newStatus}'],
        [$userName, $orderNumber, $orderTotal, $newStatus],
        $template['body']
    );
    
    // Configurar PHPMailer
    $mail = new PHPMailer(true);
    
    // Configurações do servidor SMTP
    $mail->isSMTP();
    $mail->Host = $smtpConfig['smtp_host'];
    $mail->SMTPAuth = true;
    $mail->Username = $smtpConfig['smtp_user'];
    $mail->Password = $smtpConfig['smtp_password'];
    // Configurar SSL/TLS baseado na porta e configuração
    if (isset($smtpConfig['smtp_use_ssl']) && $smtpConfig['smtp_use_ssl']) {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; // SSL para porta 465
    } elseif (isset($smtpConfig['smtp_use_tls']) && $smtpConfig['smtp_use_tls']) {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; // TLS para porta 587
    } else {
        // Auto-detectar baseado na porta
        $mail->SMTPSecure = ((int)$smtpConfig['smtp_port'] === 465) ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
    }
    $mail->Port = (int)$smtpConfig['smtp_port'];
    
    // Configurações do email
    $mail->setFrom($smtpConfig['smtp_from_email'], $smtpConfig['smtp_from_name']);
    $mail->addAddress($to);
    
    // Conteúdo do email
    $mail->isHTML(true);
    $mail->Subject = $subject;
    
    // Construir HTML do email
    $emailHtml = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>";
    $emailHtml .= "<h2 style='color: #4F46E5;'>$subject</h2>";
    $emailHtml .= "<p style='line-height: 1.6; color: #333;'>" . nl2br(htmlspecialchars($body)) . "</p>";
    
    // Se for email de pedido, adicionar informações extras
    if ($type === 'order_created' && isset($input['orderNumber'])) {
        $orderNumber = $input['orderNumber'];
        $baseUrl = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $baseUrl .= '://' . $_SERVER['HTTP_HOST'];
        $orderLink = $baseUrl . '/pedido/' . $orderNumber;
        
        $emailHtml .= "<div style='background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;'>";
        $emailHtml .= "<h3 style='color: #333; margin-top: 0;'>Detalhes do Pedido</h3>";
        $emailHtml .= "<p><strong>Número do Pedido:</strong> #$orderNumber</p>";
        
        if (isset($input['orderTotal'])) {
            $total = number_format($input['orderTotal'], 2, ',', '.');
            $emailHtml .= "<p><strong>Total:</strong> AOA $total</p>";
        }
        
        $emailHtml .= "<p style='margin-top: 15px;'>";
        $emailHtml .= "<a href='$orderLink' style='background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;'>";
        $emailHtml .= "Ver Pedido Online";
        $emailHtml .= "</a>";
        $emailHtml .= "</p>";
        $emailHtml .= "</div>";
        
        // Tentar gerar e anexar PDF do pedido
        if (isset($input['items']) && is_array($input['items'])) {
            try {
                logEmail("Tentando gerar PDF para pedido #$orderNumber", 'info');
                
                // Dados para gerar o PDF
                $pdfData = [
                    'orderNumber' => $orderNumber,
                    'customerName' => $input['userName'] ?? 'Cliente',
                    'customerEmail' => $input['to'],
                    'customerPhone' => $input['orderPhone'] ?? null,
                    'address' => $input['orderAddress'] ?? null,
                    'items' => $input['items'],
                    'total' => $input['orderTotal'] ?? 0
                ];
                
                // Chamar endpoint interno para gerar PDF
                $pdfResponse = generateOrderPDF($pdfData);
                
                if ($pdfResponse['success'] && isset($pdfResponse['filepath'])) {
                    // Anexar PDF ao email
                    $mail->addAttachment($pdfResponse['filepath'], 'pedido_' . $orderNumber . '.pdf');
                    logEmail("PDF anexado ao email: " . $pdfResponse['filepath'], 'info');
                    
                    $emailHtml .= "<p style='color: #666; font-size: 14px;'>";
                    $emailHtml .= "📎 Este email inclui em anexo a fatura do seu pedido em formato PDF.";
                    $emailHtml .= "</p>";
                } else {
                    logEmail("Erro ao gerar PDF: " . ($pdfResponse['error'] ?? 'Erro desconhecido'), 'warning');
                }
                
            } catch (Exception $pdfError) {
                logEmail("Erro ao processar PDF: " . $pdfError->getMessage(), 'warning');
            }
        }
    }
    
    $emailHtml .= "<hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;'>";
    $emailHtml .= "<p style='font-size: 12px; color: #666;'>";
    $emailHtml .= "Esta é uma mensagem automática da SuperLoja. Não responda a este email.";
    $emailHtml .= "</p>";
    $emailHtml .= "</div>";
    
    $mail->Body = $emailHtml;
    
    // Enviar email
    $mail->send();
    
    // Log de sucesso
    logEmail("Email '$type' enviado com sucesso para: $to", 'success');
    
    // Resposta de sucesso
    echo json_encode([
        'success' => true,
        'message' => 'Email enviado com sucesso',
        'data' => [
            'type' => $type,
            'to' => $to,
            'subject' => $subject,
            'sent_at' => date('Y-m-d H:i:s')
        ]
    ]);
    
} catch (Exception $e) {
    // Log de erro
    logEmail("Erro ao enviar email: " . $e->getMessage(), 'error');
    
    // Resposta de erro
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>