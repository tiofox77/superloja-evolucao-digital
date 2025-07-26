<?php
declare(strict_types=1);

header('Content-Type: application/xml');
header('Access-Control-Allow-Origin: *');

$baseUrl = 'http://localhost:8080';
$now = date('Y-m-d\TH:i:s\Z');

// Páginas estáticas
$staticPages = [
    ['url' => '', 'priority' => '1.0', 'changefreq' => 'daily'],
    ['url' => '/catalogo', 'priority' => '0.8', 'changefreq' => 'daily'],
    ['url' => '/leiloes', 'priority' => '0.8', 'changefreq' => 'daily'],
    ['url' => '/sobre', 'priority' => '0.5', 'changefreq' => 'monthly'],
    ['url' => '/contato', 'priority' => '0.5', 'changefreq' => 'monthly'],
    ['url' => '/termos', 'priority' => '0.3', 'changefreq' => 'yearly'],
    ['url' => '/privacidade', 'priority' => '0.3', 'changefreq' => 'yearly'],
];

// Produtos de exemplo
$sampleProducts = [
    'smartphone-samsung-galaxy',
    'laptop-lenovo-ideapad',
    'tablet-ipad-pro',
    'smartwatch-apple-watch',
    'fones-bluetooth-airpods',
    'adaptador-de-cabo-carregador',
    'powerbank-20000mah',
    'camera-canon-eos',
    'impressora-hp-laserjet',
    'monitor-dell-ultrawide'
];

// Categorias de exemplo
$sampleCategories = [
    'smartphones',
    'laptops',
    'tablets',
    'smartwatches',
    'fones-de-ouvido',
    'acessorios',
    'cameras',
    'impressoras',
    'monitores',
    'computadores'
];

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

// Adicionar páginas estáticas
foreach ($staticPages as $page) {
    echo "  <url>\n";
    echo "    <loc>{$baseUrl}{$page['url']}</loc>\n";
    echo "    <lastmod>{$now}</lastmod>\n";
    echo "    <changefreq>{$page['changefreq']}</changefreq>\n";
    echo "    <priority>{$page['priority']}</priority>\n";
    echo "  </url>\n";
}

// Adicionar produtos de exemplo
foreach ($sampleProducts as $product) {
    echo "  <url>\n";
    echo "    <loc>{$baseUrl}/produto/{$product}</loc>\n";
    echo "    <lastmod>{$now}</lastmod>\n";
    echo "    <changefreq>weekly</changefreq>\n";
    echo "    <priority>0.7</priority>\n";
    echo "  </url>\n";
}

// Adicionar categorias de exemplo
foreach ($sampleCategories as $category) {
    echo "  <url>\n";
    echo "    <loc>{$baseUrl}/categoria/{$category}</loc>\n";
    echo "    <lastmod>{$now}</lastmod>\n";
    echo "    <changefreq>daily</changefreq>\n";
    echo "    <priority>0.6</priority>\n";
    echo "  </url>\n";
}

echo '</urlset>';
?>
