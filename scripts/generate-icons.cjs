/**
 * Script para gerar ícones PWA básicos
 * Cria ícones simples em diferentes tamanhos
 */

const fs = require('fs');
const path = require('path');

// Tamanhos de ícones necessários
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Função para criar um SVG simples
function createSVGIcon(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 4}" fill="#2563eb" stroke="#1d4ed8" stroke-width="8"/>
  <g transform="translate(${size/2}, ${size/2})">
    <!-- Hot air balloon -->
    <ellipse cx="0" cy="${-size/6}" rx="${size/6}" ry="${size/5}" fill="#ef4444"/>
    <ellipse cx="0" cy="${-size/6}" rx="${size/8}" ry="${size/6}" fill="#dc2626"/>
    <ellipse cx="0" cy="${-size/6}" rx="${size/12}" ry="${size/8}" fill="#b91c1c"/>
    
    <!-- Basket -->
    <rect x="${-size/24}" y="${size/12}" width="${size/12}" height="${size/24}" rx="2" fill="#92400e"/>
    
    <!-- Ropes -->
    <line x1="${-size/8}" y1="${-size/24}" x2="${-size/24}" y2="${size/12}" stroke="#374151" stroke-width="2"/>
    <line x1="${size/8}" y1="${-size/24}" x2="${size/24}" y2="${size/12}" stroke="#374151" stroke-width="2"/>
    
    <!-- Text A -->
    <text x="0" y="${size/4}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${size/16}" font-weight="bold">A</text>
  </g>
</svg>`;
}

// Criar diretório se não existir
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Gerar ícones SVG em diferentes tamanhos
iconSizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`✅ Criado: ${filename}`);
});

// Criar ícones de shortcut
const shortcutIcons = [
  { name: 'shortcut-new.svg', content: createShortcutIcon('plus') },
  { name: 'shortcut-check.svg', content: createShortcutIcon('check') },
  { name: 'shortcut-balloon.svg', content: createShortcutIcon('balloon') }
];

function createShortcutIcon(type) {
  let iconContent = '';
  
  switch (type) {
    case 'plus':
      iconContent = '<path stroke="#ffffff" stroke-width="8" stroke-linecap="round" d="M48 24v48M24 48h48"/>';
      break;
    case 'check':
      iconContent = '<path stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" d="M20 48l16 16 32-32"/>';
      break;
    case 'balloon':
      iconContent = '<ellipse cx="48" cy="32" rx="16" ry="20" fill="#ef4444"/><rect x="44" y="56" width="8" height="6" fill="#92400e"/>';
      break;
  }
  
  return `<svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="48" cy="48" r="44" fill="#2563eb"/>
  ${iconContent}
</svg>`;
}

shortcutIcons.forEach(({ name, content }) => {
  const filepath = path.join(iconsDir, name);
  fs.writeFileSync(filepath, content);
  console.log(`✅ Criado: ${name}`);
});

console.log('\n🎉 Todos os ícones PWA foram gerados com sucesso!');
console.log('\n📌 Nota: Para ícones de maior qualidade, considere usar uma ferramenta de design');
console.log('   ou converter os SVGs para PNG usando uma ferramenta online.');
console.log('\n🔗 Sugestão: https://convertio.co/svg-png/ para conversão SVG → PNG');