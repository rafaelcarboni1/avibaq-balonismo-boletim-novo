#!/usr/bin/env node

/**
 * Script para gerar ícones PNG para PWA
 * Gera imagens base64 que podem ser usadas no manifest.json
 */

import fs from 'fs';
import path from 'path';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// SVG icon base
const createSVGIcon = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Background circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 4}" fill="#2563eb"/>
  
  <!-- Balloon envelope -->
  <ellipse cx="${size/2}" cy="${size/2 - size/6}" rx="${size/6}" ry="${size/5}" fill="#ef4444"/>
  
  <!-- Inner balloon -->
  <ellipse cx="${size/2}" cy="${size/2 - size/6}" rx="${size/8}" ry="${size/6}" fill="#dc2626"/>
  
  <!-- Basket -->
  <rect x="${size/2 - size/24}" y="${size/2 + size/12}" width="${size/12}" height="${size/24}" fill="#92400e"/>
  
  <!-- Letter A -->
  <text x="${size/2}" y="${size/2 + size/4}" text-anchor="middle" font-family="Arial, sans-serif" 
        font-size="${size/16}" font-weight="bold" fill="white">A</text>
</svg>
`.trim();

// Create icons directory if it doesn't exist
const iconsDir = path.join(process.cwd(), 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate PNG icons as base64 data URLs for manifest
console.log('Generating PNG icons for PWA manifest...\n');

const manifestIcons = [];

sizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const base64SVG = Buffer.from(svgContent).toString('base64');
  const dataURL = `data:image/svg+xml;base64,${base64SVG}`;
  
  // Add to manifest icons array
  manifestIcons.push({
    src: dataURL,
    sizes: `${size}x${size}`,
    type: "image/svg+xml",
    purpose: "any"
  });
  
  // Also create a maskable version for adaptive icons
  if (size >= 192) {
    manifestIcons.push({
      src: dataURL,
      sizes: `${size}x${size}`,
      type: "image/svg+xml", 
      purpose: "maskable"
    });
  }
  
  console.log(`✓ Generated ${size}x${size} icon`);
});

// Update manifest.json with the new icons
const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Replace the icons array
manifest.icons = manifestIcons;

// Write updated manifest
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log(`\n✓ Updated manifest.json with ${manifestIcons.length} icons`);
console.log('✓ All icons are embedded as base64 data URLs for better mobile compatibility');

// Also save individual SVG files
sizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  fs.writeFileSync(filepath, svgContent);
});

console.log(`✓ Saved individual SVG files to ${iconsDir}`);
console.log('\nPWA icons generation complete! 🎉');