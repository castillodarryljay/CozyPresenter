import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Standard SVG Icon (Isometric Minecraft Grass Block with Pickaxe / Signpost)
const createSvg = (size, isMaskable = false) => {
  const padding = isMaskable ? size * 0.15 : size * 0.05;
  const innerSize = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#3b82f6"/>
        <stop offset="60%" stop-color="#60a5fa"/>
        <stop offset="100%" stop-color="#93c5fd"/>
      </linearGradient>
      <linearGradient id="grassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#65a30d"/>
        <stop offset="100%" stop-color="#4d7c0f"/>
      </linearGradient>
      <linearGradient id="dirtGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#854d0e"/>
        <stop offset="100%" stop-color="#713f12"/>
      </linearGradient>
    </defs>
    
    <!-- Background rounded card or full-bleed for maskable -->
    <rect width="${size}" height="${size}" rx="${isMaskable ? 0 : size * 0.22}" fill="url(#bgGrad)"/>
    
    <!-- Clouds in background -->
    <rect x="${cx - innerSize * 0.4}" y="${cy - innerSize * 0.42}" width="${innerSize * 0.4}" height="${innerSize * 0.08}" fill="#ffffff" opacity="0.85" rx="${size * 0.015}"/>
    <rect x="${cx + innerSize * 0.05}" y="${cy - innerSize * 0.35}" width="${innerSize * 0.35}" height="${innerSize * 0.07}" fill="#ffffff" opacity="0.85" rx="${size * 0.015}"/>
    
    <!-- Isometric 3D Voxel Grass Block -->
    <!-- Center coordinate for top vertex of cube -->
    <g transform="translate(${cx}, ${cy + innerSize * 0.05})">
      <!-- Top Face (Grass) -->
      <polygon points="0,${-innerSize * 0.32} ${innerSize * 0.36},${-innerSize * 0.14} 0,${innerSize * 0.04} ${-innerSize * 0.36},${-innerSize * 0.14}" 
               fill="#84cc16" stroke="#4d7c0f" stroke-width="${size * 0.008}"/>
      
      <!-- Grass fringe details on top -->
      <polygon points="${-innerSize * 0.1},${-innerSize * 0.2} ${innerSize * 0.1},${-innerSize * 0.2} 0,${-innerSize * 0.12}" fill="#a3e635"/>
      <polygon points="${-innerSize * 0.25},${-innerSize * 0.12} ${-innerSize * 0.12},${-innerSize * 0.06} ${-innerSize * 0.2},${-innerSize * 0.02}" fill="#65a30d"/>

      <!-- Left Face (Dirt + Grass top) -->
      <polygon points="${-innerSize * 0.36},${-innerSize * 0.14} 0,${innerSize * 0.04} 0,${innerSize * 0.44} ${-innerSize * 0.36},${innerSize * 0.26}" 
               fill="#78350f" stroke="#451a03" stroke-width="${size * 0.008}"/>
      
      <!-- Left side grass layer & dripping pixel hanging teeth -->
      <polygon points="${-innerSize * 0.36},${-innerSize * 0.14} 0,${innerSize * 0.04} 0,${innerSize * 0.12} ${-innerSize * 0.12},${innerSize * 0.09} ${-innerSize * 0.18},${innerSize * 0.15} ${-innerSize * 0.28},${innerSize * 0.05} ${-innerSize * 0.36},${innerSize * 0.04}" 
               fill="#4d7c0f"/>

      <!-- Right Face (Dirt shaded + Grass top) -->
      <polygon points="0,${innerSize * 0.04} ${innerSize * 0.36},${-innerSize * 0.14} ${innerSize * 0.36},${innerSize * 0.26} 0,${innerSize * 0.44}" 
               fill="#542407" stroke="#331402" stroke-width="${size * 0.008}"/>
      
      <!-- Right side grass layer -->
      <polygon points="0,${innerSize * 0.04} ${innerSize * 0.36},${-innerSize * 0.14} ${innerSize * 0.36},${innerSize * 0.03} ${innerSize * 0.24},${innerSize * 0.07} ${innerSize * 0.14},${innerSize * 0.14} 0,${innerSize * 0.12}" 
               fill="#3f6212"/>

      <!-- Mini Presenter / Signpost sticking out -->
      <rect x="${-innerSize * 0.03}" y="${-innerSize * 0.45}" width="${innerSize * 0.06}" height="${innerSize * 0.18}" fill="#a16207" stroke="#451a03" stroke-width="${size * 0.005}"/>
      <rect x="${-innerSize * 0.16}" y="${-innerSize * 0.55}" width="${innerSize * 0.32}" height="${innerSize * 0.14}" fill="#fde047" stroke="#854d0e" stroke-width="${size * 0.006}" rx="${size * 0.01}"/>
      
      <!-- Sign text lines -->
      <rect x="${-innerSize * 0.12}" y="${-innerSize * 0.51}" width="${innerSize * 0.24}" height="${innerSize * 0.02}" fill="#713f12" opacity="0.8"/>
      <rect x="${-innerSize * 0.10}" y="${-innerSize * 0.46}" width="${innerSize * 0.20}" height="${innerSize * 0.02}" fill="#713f12" opacity="0.8"/>
    </g>

    <!-- Badge '3D' pill bottom-right -->
    <rect x="${cx + innerSize * 0.12}" y="${cy + innerSize * 0.26}" width="${innerSize * 0.32}" height="${innerSize * 0.18}" rx="${innerSize * 0.05}" fill="#15803d" stroke="#86efac" stroke-width="${size * 0.008}"/>
    <text x="${cx + innerSize * 0.28}" y="${cy + innerSize * 0.39}" fill="#ffffff" font-family="monospace, sans-serif" font-weight="900" font-size="${innerSize * 0.11}" text-anchor="middle">3D</text>
  </svg>`;
};

async function generate() {
  const svg512 = createSvg(512, false);
  const svgMaskable512 = createSvg(512, true);
  const svg192 = createSvg(192, false);
  const svg180 = createSvg(180, false);

  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svg512);

  await sharp(Buffer.from(svg512))
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  await sharp(Buffer.from(svgMaskable512))
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  await sharp(Buffer.from(svg192))
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  await sharp(Buffer.from(svg180))
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  await sharp(Buffer.from(svg192))
    .resize(64, 64)
    .toFile(path.join(publicDir, 'favicon.ico'));

  console.log('Successfully generated all PWA icons!');
}

generate().catch(console.error);
