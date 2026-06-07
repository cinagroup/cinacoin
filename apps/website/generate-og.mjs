// Generates a 1200x630 OG image for cinacoin.com
// Uses the existing logo.svg as source
import { createCanvas } from 'canvas'
import fs from 'fs'
import path from 'path'

const W = 1200
const H = 630
const canvas = createCanvas(W, H)
const ctx = canvas.getContext('2d')

// Background: canvas-soft (#fafafa)
ctx.fillStyle = '#fafafa'
ctx.fillRect(0, 0, W, H)

// Mesh gradient circle (decorative)
const grad = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.4, W * 0.6)
grad.addColorStop(0, 'rgba(80, 227, 194, 0.25)')
grad.addColorStop(0.4, 'rgba(0, 124, 240, 0.15)')
grad.addColorStop(1, 'rgba(250, 250, 250, 0)')
ctx.fillStyle = grad
ctx.fillRect(0, 0, W, H)

// Logo: read the SVG and render it
const svgPath = path.join(import.meta.dirname, 'public', 'logo.svg')
const svgStr = fs.readFileSync(svgPath, 'utf-8')
const svgBuffer = Buffer.from(svgStr)

// Load logo onto canvas using Image
const { Image } = canvas
const logo = new Image()
logo.onload = () => {
  // Draw logo centered, 120px
  const logoSize = 120
  const lx = (W - logoSize) / 2
  const ly = H * 0.18
  ctx.drawImage(logo, lx, ly, logoSize, logoSize)

  // Title
  ctx.fillStyle = '#171717'
  ctx.font = '600 48px Inter, system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Onchain Access, Simplified', W / 2, ly + logoSize + 50)

  // Subtitle
  ctx.fillStyle = '#4d4d4d'
  ctx.font = '400 24px Inter, system-ui, -apple-system, sans-serif'
  ctx.fillText('Connect, authenticate, and transact across 100+ blockchains', W / 2, ly + logoSize + 100)

  // URL at bottom
  ctx.fillStyle = '#888888'
  ctx.font = '400 16px Inter, system-ui, -apple-system, sans-serif'
  ctx.fillText('cinacoin.com', W / 2, H - 40)

  // Save
  const outPath = path.join(import.meta.dirname, 'public', 'og-image.png')
  const out = fs.createWriteStream(outPath)
  canvas.createPNGStream().pipe(out)
  out.on('finish', () => {
    console.log(`OG image generated: ${outPath}`)
    console.log(`Size: ${W}x${H}`)
    const stat = fs.statSync(outPath)
    console.log(`File size: ${(stat.size / 1024).toFixed(1)} KB`)
  })
}
logo.onerror = (e) => {
  console.error('Failed to load logo SVG:', e)
}
logo.src = svgBuffer
