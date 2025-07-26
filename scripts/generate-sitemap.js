const fs = require('fs');
const path = require('path');

// Configuração
const baseUrl = 'http://localhost:8080';
const outputFile = path.join(__dirname, '../public/sitemap.xml');

// Páginas estáticas
const staticPages = [
    { url: '/', changefreq: 'daily', priority: '1.0' },
    { url: '/catalogo', changefreq: 'daily', priority: '0.9' },
    { url: '/categorias', changefreq: 'weekly', priority: '0.8' },
    { url: '/leiloes', changefreq: 'daily', priority: '0.7' },
    { url: '/solicitar-produto', changefreq: 'monthly', priority: '0.6' },
    { url: '/sobre', changefreq: 'monthly', priority: '0.5' },
    { url: '/contato', changefreq: 'monthly', priority: '0.5' },
    { url: '/faq', changefreq: 'monthly', priority: '0.4' },
    { url: '/termos-uso', changefreq: 'yearly', priority: '0.3' },
    { url: '/politica-privacidade', changefreq: 'yearly', priority: '0.3' },
    { url: '/politica-devolucao', changefreq: 'yearly', priority: '0.3' }
];

// Gerar sitemap
function generateSitemap() {
    const currentDate = new Date().toISOString().split('T')[0];
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Adicionar páginas estáticas
    staticPages.forEach(page => {
        sitemap += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    });

    // TODO: Adicionar produtos dinâmicos do banco de dados
    // Aqui você pode adicionar uma consulta ao banco para buscar produtos
    
    sitemap += `</urlset>
`;

    // Salvar arquivo
    fs.writeFileSync(outputFile, sitemap);
    console.log(`✅ Sitemap gerado em: ${outputFile}`);
    console.log(`📊 Total de URLs: ${staticPages.length}`);
}

// Executar
try {
    generateSitemap();
} catch (error) {
    console.error('❌ Erro ao gerar sitemap:', error.message);
    process.exit(1);
}
