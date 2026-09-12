import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Pixel-perfect Minecraft Dungeons App Icon
// Features: Isometric Voxel Block, Iconic Diamond Sword, Glowing Emerald & Redstone Power Diamond
const createSvg = (size, isMaskable = false) => {
  const padding = isMaskable ? size * 0.12 : size * 0.04;
  const innerSize = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Background Obsidian Gradient -->
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#18181b"/>
        <stop offset="50%" stop-color="#09090b"/>
        <stop offset="100%" stop-color="#020617"/>
      </linearGradient>

      <!-- Golden Border Gradient -->
      <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fde047"/>
        <stop offset="50%" stop-color="#d97706"/>
        <stop offset="100%" stop-color="#78350f"/>
      </linearGradient>

      <!-- Diamond Blade Shading -->
      <linearGradient id="diamondBlade" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#a5f3fc"/>
        <stop offset="40%" stop-color="#22d3ee"/>
        <stop offset="100%" stop-color="#0891b2"/>
      </linearGradient>

      <!-- Emerald Shading -->
      <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#86efac"/>
        <stop offset="45%" stop-color="#10b981"/>
        <stop offset="100%" stop-color="#047857"/>
      </linearGradient>
    </defs>
    
    <!-- Background Card with Golden Bevel -->
    <rect width="${size}" height="${size}" rx="${isMaskable ? 0 : size * 0.22}" fill="url(#bgGrad)"/>
    ${!isMaskable ? `
    <rect x="${size * 0.03}" y="${size * 0.03}" width="${size * 0.94}" height="${size * 0.94}" rx="${size * 0.20}" fill="none" stroke="url(#goldBorder)" stroke-width="${size * 0.02}"/>
    ` : ''}

    <!-- Background Minecraft Dungeon Brick Vignette Lines -->
    <g opacity="0.18">
      <line x1="${size * 0.1}" y1="${size * 0.25}" x2="${size * 0.9}" y2="${size * 0.25}" stroke="#ffffff" stroke-width="${size * 0.006}"/>
      <line x1="${size * 0.1}" y1="${size * 0.5}" x2="${size * 0.9}" y2="${size * 0.5}" stroke="#ffffff" stroke-width="${size * 0.006}"/>
      <line x1="${size * 0.1}" y1="${size * 0.75}" x2="${size * 0.9}" y2="${size * 0.75}" stroke="#ffffff" stroke-width="${size * 0.006}"/>
    </g>

    <!-- Center Composition: Isometric Minecraft Voxel Block (Grass / Cobblestone) -->
    <g transform="translate(${cx}, ${cy + innerSize * 0.16})">
      <!-- Top Face (Lush Grass) -->
      <polygon points="0,${-innerSize * 0.24} ${innerSize * 0.32},${-innerSize * 0.08} 0,${innerSize * 0.08} ${-innerSize * 0.32},${-innerSize * 0.08}" 
               fill="#4ade80" stroke="#15803d" stroke-width="${size * 0.008}"/>
      
      <!-- Grass fringe details on top -->
      <polygon points="${-innerSize * 0.08},${-innerSize * 0.14} ${innerSize * 0.08},${-innerSize * 0.14} 0,${-innerSize * 0.07}" fill="#86efac"/>
      <polygon points="${-innerSize * 0.20},${-innerSize * 0.07} ${-innerSize * 0.09},${-innerSize * 0.02} ${-innerSize * 0.16},${innerSize * 0.02}" fill="#22c55e"/>

      <!-- Left Face (Dirt) -->
      <polygon points="${-innerSize * 0.32},${-innerSize * 0.08} 0,${innerSize * 0.08} 0,${innerSize * 0.36} ${-innerSize * 0.32},${innerSize * 0.20}" 
               fill="#78350f" stroke="#451a03" stroke-width="${size * 0.008}"/>
      
      <!-- Left side hanging grass teeth -->
      <polygon points="${-innerSize * 0.32},${-innerSize * 0.08} 0,${innerSize * 0.08} 0,${innerSize * 0.15} ${-innerSize * 0.10},${innerSize * 0.12} ${-innerSize * 0.16},${innerSize * 0.18} ${-innerSize * 0.24},${innerSize * 0.08} ${-innerSize * 0.32},${innerSize * 0.06}" 
               fill="#16a34a"/>

      <!-- Right Face (Darker Shaded Dirt) -->
      <polygon points="0,${innerSize * 0.08} ${innerSize * 0.32},${-innerSize * 0.08} ${innerSize * 0.32},${innerSize * 0.20} 0,${innerSize * 0.36}" 
               fill="#542407" stroke="#331402" stroke-width="${size * 0.008}"/>
      
      <!-- Right side hanging grass teeth -->
      <polygon points="0,${innerSize * 0.08} ${innerSize * 0.32},${-innerSize * 0.08} ${innerSize * 0.32},${innerSize * 0.05} ${innerSize * 0.22},${innerSize * 0.10} ${innerSize * 0.12},${innerSize * 0.16} 0,${innerSize * 0.14}" 
               fill="#15803d"/>
    </g>

    <!-- Iconic Minecraft Pixelated Diamond Sword (Diagonal 45 degrees) -->
    <g transform="translate(${cx - innerSize * 0.04}, ${cy - innerSize * 0.12}) rotate(-25)">
      <!-- Sword Tip & Blade with Pixel Stepping -->
      <!-- Glow Underlay -->
      <polygon points="0,${-innerSize * 0.44} ${innerSize * 0.08},${-innerSize * 0.36} ${innerSize * 0.08},${innerSize * 0.08} ${-innerSize * 0.08},${innerSize * 0.08} ${-innerSize * 0.08},${-innerSize * 0.36}" 
               fill="#0891b2" stroke="#06b6d4" stroke-width="${size * 0.016}" opacity="0.6"/>

      <!-- Main Diamond Blade Core -->
      <polygon points="0,${-innerSize * 0.42} ${innerSize * 0.07},${-innerSize * 0.35} ${innerSize * 0.07},${innerSize * 0.08} ${-innerSize * 0.07},${innerSize * 0.08} ${-innerSize * 0.07},${-innerSize * 0.35}" 
               fill="url(#diamondBlade)" stroke="#0e7490" stroke-width="${size * 0.008}"/>

      <!-- Center Highlight Spine -->
      <line x1="0" y1="${-innerSize * 0.40}" x2="0" y2="${innerSize * 0.07}" stroke="#e0f2fe" stroke-width="${size * 0.018}" stroke-linecap="round"/>

      <!-- Gold Crossguard -->
      <polygon points="${-innerSize * 0.16},${innerSize * 0.08} ${innerSize * 0.16},${innerSize * 0.08} ${innerSize * 0.13},${innerSize * 0.14} ${-innerSize * 0.13},${innerSize * 0.14}" 
               fill="#f59e0b" stroke="#78350f" stroke-width="${size * 0.007}"/>
      
      <!-- Guard Jewel -->
      <rect x="${-innerSize * 0.03}" y="${innerSize * 0.09}" width="${innerSize * 0.06}" height="${innerSize * 0.04}" fill="#ef4444" stroke="#991b1b" stroke-width="${size * 0.004}"/>

      <!-- Oak Grip / Hilt -->
      <rect x="${-innerSize * 0.035}" y="${innerSize * 0.14}" width="${innerSize * 0.07}" height="${innerSize * 0.14}" fill="#854d0e" stroke="#451a03" stroke-width="${size * 0.006}"/>
      <!-- Grip Wrap Bands -->
      <line x1="${-innerSize * 0.03}" y1="${innerSize * 0.18}" x2="${innerSize * 0.03}" y2="${innerSize * 0.18}" stroke="#ca8a04" stroke-width="${size * 0.005}"/>
      <line x1="${-innerSize * 0.03}" y1="${innerSize * 0.23}" x2="${innerSize * 0.03}" y2="${innerSize * 0.23}" stroke="#ca8a04" stroke-width="${size * 0.005}"/>

      <!-- Golden Pommel -->
      <polygon points="0,${innerSize * 0.33} ${innerSize * 0.05},${innerSize * 0.28} ${-innerSize * 0.05},${innerSize * 0.28}" 
               fill="#fbbf24" stroke="#78350f" stroke-width="${size * 0.006}"/>
    </g>

    <!-- Sparkling Minecraft Emerald (Right Foreground) -->
    <g transform="translate(${cx + innerSize * 0.26}, ${cy + innerSize * 0.14})">
      <!-- Emerald Diamond / Hexagon Facet Shape -->
      <polygon points="0,${-innerSize * 0.14} ${innerSize * 0.12},${-innerSize * 0.05} ${innerSize * 0.12},${innerSize * 0.07} 0,${innerSize * 0.16} ${-innerSize * 0.12},${innerSize * 0.07} ${-innerSize * 0.12},${-innerSize * 0.05}" 
               fill="url(#emeraldGrad)" stroke="#047857" stroke-width="${size * 0.01}"/>
      
      <!-- Inner Facet -->
      <polygon points="0,${-innerSize * 0.09} ${innerSize * 0.08},${-innerSize * 0.03} ${innerSize * 0.08},${innerSize * 0.05} 0,${innerSize * 0.10} ${-innerSize * 0.08},${innerSize * 0.05} ${-innerSize * 0.08},${-innerSize * 0.03}" 
               fill="#34d399" stroke="#059669" stroke-width="${size * 0.006}"/>
      
      <!-- Sparkle Highlights -->
      <circle cx="${-innerSize * 0.03}" cy="${-innerSize * 0.04}" r="${size * 0.016}" fill="#ffffff"/>
      <polygon points="0,${-innerSize * 0.16} ${innerSize * 0.02},${-innerSize * 0.13} 0,${-innerSize * 0.10} ${-innerSize * 0.02},${-innerSize * 0.13}" fill="#ffffff"/>
    </g>

    <!-- Top Left: Redstone / Dungeons Power Diamond Badge (◆) -->
    <g transform="translate(${cx - innerSize * 0.32}, ${cy - innerSize * 0.28})">
      <polygon points="0,${-innerSize * 0.08} ${innerSize * 0.08},0 0,${innerSize * 0.08} ${-innerSize * 0.08},0" 
               fill="#ef4444" stroke="#fca5a5" stroke-width="${size * 0.008}"/>
      <polygon points="0,${-innerSize * 0.04} ${innerSize * 0.04},0 0,${innerSize * 0.04} ${-innerSize * 0.04},0" 
               fill="#ffffff"/>
    </g>

    <!-- Bottom Emblem Text Pill: 'COZYWORLD' -->
    <g transform="translate(${cx}, ${cy + innerSize * 0.40})">
      <rect x="${-innerSize * 0.38}" y="${-innerSize * 0.07}" width="${innerSize * 0.76}" height="${innerSize * 0.14}" rx="${innerSize * 0.03}" 
            fill="#0f172a" stroke="#fbbf24" stroke-width="${size * 0.008}"/>
      <text x="0" y="${innerSize * 0.035}" fill="#fde047" font-family="'VT323', monospace, sans-serif" font-weight="900" font-size="${innerSize * 0.10}" text-anchor="middle" letter-spacing="1.5">
        COZYWORLD
      </text>
    </g>
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

  console.log('Successfully generated all Minecraft Dungeons app icons and favicons!');
}

generate().catch(console.error);

