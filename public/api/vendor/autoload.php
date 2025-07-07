<?php
/**
 * SuperLoja - Autoloader para PHPMailer
 * Este é um autoloader simples para PHPMailer quando não há Composer
 */

// Função de autoload
function superloja_autoload($className) {
    // Converter namespace para caminho de arquivo
    $className = ltrim($className, '\\');
    $fileName = '';
    $namespace = '';
    
    if ($lastNsPos = strrpos($className, '\\')) {
        $namespace = substr($className, 0, $lastNsPos);
        $className = substr($className, $lastNsPos + 1);
        $fileName = str_replace('\\', DIRECTORY_SEPARATOR, $namespace) . DIRECTORY_SEPARATOR;
    }
    
    $fileName .= str_replace('_', DIRECTORY_SEPARATOR, $className) . '.php';
    
    // Procurar o arquivo na pasta vendor
    $fullPath = __DIR__ . DIRECTORY_SEPARATOR . $fileName;
    
    if (file_exists($fullPath)) {
        require $fullPath;
        return true;
    }
    
    return false;
}

// Registrar o autoloader
spl_autoload_register('superloja_autoload');

// Verificar se o PHPMailer está disponível
if (!class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
    // Se não tiver PHPMailer, usar função nativa mail() como fallback
    
    class PHPMailer {
        private $to = [];
        private $from = '';
        private $fromName = '';
        private $subject = '';
        private $body = '';
        private $isHTML = false;
        
        public function __construct($enableExceptions = false) {
            // Construtor vazio
        }
        
        public function isSMTP() {
            // Placeholder - usando mail() nativo
        }
        
        public function setFrom($email, $name = '') {
            $this->from = $email;
            $this->fromName = $name;
        }
        
        public function addAddress($email) {
            $this->to[] = $email;
        }
        
        public function isHTML($isHTML = true) {
            $this->isHTML = $isHTML;
        }
        
        public function send() {
            $headers = [];
            
            if ($this->from) {
                $from = $this->fromName ? "{$this->fromName} <{$this->from}>" : $this->from;
                $headers[] = "From: $from";
                $headers[] = "Reply-To: {$this->from}";
            }
            
            if ($this->isHTML) {
                $headers[] = "Content-Type: text/html; charset=UTF-8";
            } else {
                $headers[] = "Content-Type: text/plain; charset=UTF-8";
            }
            
            $headers[] = "MIME-Version: 1.0";
            $headers[] = "X-Mailer: SuperLoja PHP Mailer";
            
            $headerString = implode("\r\n", $headers);
            
            $success = true;
            foreach ($this->to as $email) {
                if (!mail($email, $this->subject, $this->body, $headerString)) {
                    $success = false;
                }
            }
            
            if (!$success) {
                throw new Exception('Falha ao enviar email usando função mail() nativa');
            }
            
            return true;
        }
        
        // Propriedades públicas para compatibilidade
        public $Host = '';
        public $SMTPAuth = false;
        public $Username = '';
        public $Password = '';
        public $SMTPSecure = '';
        public $Port = 25;
        public $Subject = '';
        public $Body = '';
    }
    
    // Criar aliases para namespaces
    class_alias('PHPMailer', 'PHPMailer\\PHPMailer\\PHPMailer');
    
    // Definir constantes se não existirem
    if (!defined('PHPMailer\\PHPMailer\\PHPMailer::ENCRYPTION_STARTTLS')) {
        define('PHPMailer\\PHPMailer\\PHPMailer::ENCRYPTION_STARTTLS', 'tls');
        define('PHPMailer\\PHPMailer\\PHPMailer::ENCRYPTION_SMTPS', 'ssl');
    }
}
?>