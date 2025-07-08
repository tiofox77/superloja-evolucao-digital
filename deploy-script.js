#!/usr/bin/env node

/**
 * Script de Deploy para cPanel - SuperLoja
 * 
 * Este script automatiza o processo de build e preparação para deploy
 * no cPanel, incluindo a geração dos arquivos necessários.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Iniciando processo de deploy para cPanel...\n');

// 1. Limpar diretório de build anterior
console.log('📁 Limpando diretório anterior...');
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}

// 2. Build do projeto
console.log('🔨 Construindo projeto...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build concluído com sucesso!\n');
} catch (error) {
  console.error('❌ Erro no build:', error.message);
  process.exit(1);
}

// 3. Verificar se arquivos essenciais existem
const essentialFiles = [
  'dist/index.html',
  'dist/assets',
  'public/.htaccess'
];

console.log('🔍 Verificando arquivos essenciais...');
essentialFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - OK`);
  } else {
    console.log(`❌ ${file} - FALTANDO`);
  }
});

// 4. Copiar .htaccess para dist
if (fs.existsSync('public/.htaccess')) {
  fs.copyFileSync('public/.htaccess', 'dist/.htaccess');
  console.log('✅ .htaccess copiado para dist/');
}

// 5. Copiar robots.txt se existir
if (fs.existsSync('public/robots.txt')) {
  fs.copyFileSync('public/robots.txt', 'dist/robots.txt');
  console.log('✅ robots.txt copiado para dist/');
}

// 6. Gerar relatório de arquivos
console.log('\n📊 Relatório de Build:');
const distSize = getDirSize('dist');
console.log(`📦 Tamanho total: ${(distSize / 1024 / 1024).toFixed(2)} MB`);

// 7. Listar arquivos principais
console.log('\n📋 Arquivos principais gerados:');
const files = fs.readdirSync('dist');
files.forEach(file => {
  const stats = fs.statSync(path.join('dist', file));
  if (stats.isFile()) {
    const size = (stats.size / 1024).toFixed(2);
    console.log(`   ${file} (${size} KB)`);
  } else {
    console.log(`   📁 ${file}/`);
  }
});

// 8. Instruções finais
console.log('\n🎉 Deploy preparado com sucesso!');
console.log('\n📋 Próximos passos:');
console.log('1. Faça upload de todos os arquivos da pasta "dist/" para "public_html/" no cPanel');
console.log('2. Certifique-se que o arquivo .htaccess foi enviado');
console.log('3. Teste o site em seu domínio');
console.log('4. Configure SSL se disponível');
console.log('\n📚 Consulte cpanel-deploy.md para instruções detalhadas.');

function getDirSize(dirPath) {
  let totalSize = 0;
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      totalSize += getDirSize(filePath);
    } else {
      totalSize += stats.size;
    }
  });
  
  return totalSize;
}