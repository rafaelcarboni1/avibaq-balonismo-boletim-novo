// Script para criar ícones PNG usando Canvas
// Para ser executado no browser console ou como base64 data URLs

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

function createIconCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Background circle
  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 - 4, 0, 2 * Math.PI);
  ctx.fill();
  
  // Balloon envelope
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.ellipse(size/2, size/2 - size/6, size/6, size/5, 0, 0, 2 * Math.PI);
  ctx.fill();
  
  // Inner balloon
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.ellipse(size/2, size/2 - size/6, size/8, size/6, 0, 0, 2 * Math.PI);
  ctx.fill();
  
  // Basket
  ctx.fillStyle = '#92400e';
  ctx.fillRect(size/2 - size/24, size/2 + size/12, size/12, size/24);
  
  // Letter A
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size/16}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('A', size/2, size/2 + size/4);
  
  return canvas;
}

// Gerar base64 URLs para os ícones
console.log('// Adicione estes ícones como data URLs no manifesto:');
sizes.forEach(size => {
  const canvas = createIconCanvas(size);
  const dataURL = canvas.toDataURL('image/png');
  console.log(`// ${size}x${size}: "${dataURL}"`);
});

console.log('\n// Para salvar como arquivos, execute no browser:');
sizes.forEach(size => {
  console.log(`
// ${size}x${size}
const canvas${size} = createIconCanvas(${size});
const link${size} = document.createElement('a');
link${size}.download = 'icon-${size}x${size}.png';
link${size}.href = canvas${size}.toDataURL('image/png');
link${size}.click();
  `);
});

// Função helper para download
window.downloadIcon = function(size) {
  const canvas = createIconCanvas(size);
  const link = document.createElement('a');
  link.download = `icon-${size}x${size}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

console.log('\n// Para baixar todos os ícones:');
console.log('sizes.forEach(size => downloadIcon(size));');