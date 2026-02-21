// Run with: node scripts/generate-icons.js
// Requires: pnpm add -D sharp

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
const ICONS_DIR = path.join(__dirname, '../public/icons')

if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR, { recursive: true })

// Generate a simple shield icon programmatically using SVG
const generateSvgIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#0F172A"/>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563EB;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
    </linearGradient>
  </defs>
  <!-- Shield shape -->
  <path d="M${size/2} ${size*0.12} L${size*0.8} ${size*0.28} L${size*0.8} ${size*0.52} C${size*0.8} ${size*0.72} ${size*0.67} ${size*0.84} ${size*0.5} ${size*0.88} C${size*0.33} ${size*0.84} ${size*0.2} ${size*0.72} ${size*0.2} ${size*0.52} L${size*0.2} ${size*0.28} Z"
    fill="white" opacity="0.95"/>
  <!-- K letter -->
  <text x="${size/2}" y="${size*0.62}" font-family="Arial Black, sans-serif"
    font-size="${size*0.28}" font-weight="900" fill="#2563EB"
    text-anchor="middle" dominant-baseline="middle">K</text>
</svg>
`

async function generateIcons() {
  for (const size of SIZES) {
    const svgBuffer = Buffer.from(generateSvgIcon(size))
    await sharp(svgBuffer)
      .png()
      .toFile(path.join(ICONS_DIR, `icon-${size}x${size}.png`))
    console.log(`✅ Generated icon-${size}x${size}.png`)
  }
  console.log('\n🎉 All icons generated in public/icons/')
}

generateIcons().catch(console.error)
