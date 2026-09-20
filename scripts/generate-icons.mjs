// Generates the PWA icon PNGs (no external deps, no network) using a tiny
// hand-rolled PNG encoder. Icon: forest-green full-bleed background (safe
// for maskable icons) + white rounded frame + a taegeuk (yin-yang) swirl in
// the Korean flag's red/blue, echoing the in-app Welcome screen badge.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const GREEN = [15, 107, 92]
const WHITE = [255, 255, 255]
const RED = [198, 12, 48]
const BLUE = [0, 52, 120]

function roundedRectContains(x, y, cx, cy, halfW, halfH, radius) {
  const qx = Math.max(Math.abs(x - cx) - (halfW - radius), 0)
  const qy = Math.max(Math.abs(y - cy) - (halfH - radius), 0)
  return Math.sqrt(qx * qx + qy * qy) <= radius
}

function taegeukColor(x, y, cx, cy, radius) {
  const dx = x - cx
  const dy = y - cy
  const theta = (-45 * Math.PI) / 180
  const rx = dx * Math.cos(theta) - dy * Math.sin(theta)
  const ry = dx * Math.sin(theta) + dy * Math.cos(theta)
  const d = Math.sqrt(rx * rx + ry * ry)
  if (d > radius) return null
  const half = radius / 2
  const dTop = Math.hypot(rx, ry + half)
  const dBottom = Math.hypot(rx, ry - half)
  if (rx >= 0) return dTop <= half ? RED : BLUE
  return dBottom <= half ? BLUE : RED
}

function renderIcon(size, { maskable = false } = {}) {
  const buf = Buffer.alloc(size * size * 4)
  const frameScale = maskable ? 0.58 : 0.74
  const circleScale = maskable ? 0.34 : 0.42
  const cx = size / 2
  const cy = size / 2
  const frameHalf = (size * frameScale) / 2
  const frameRadius = frameHalf * 0.4
  const circleR = (size * circleScale) / 2

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let color = GREEN
      if (roundedRectContains(x, y, cx, cy, frameHalf, frameHalf, frameRadius)) {
        color = WHITE
        const tg = taegeukColor(x, y, cx, cy, circleR)
        if (tg) color = tg
      }
      const i = (y * size + x) * 4
      buf[i] = color[0]
      buf[i + 1] = color[1]
      buf[i + 2] = color[2]
      buf[i + 3] = 255
    }
  }
  return buf
}

// --- minimal PNG encoder ---
const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

function encodePNG(rgbaBuf, size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(size, 0)
  ihdrData.writeUInt32BE(size, 4)
  ihdrData[8] = 8 // bit depth
  ihdrData[9] = 6 // color type RGBA
  ihdrData[10] = 0
  ihdrData[11] = 0
  ihdrData[12] = 0

  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1)
    raw[rowStart] = 0 // filter: none
    rgbaBuf.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4)
  }
  const idatData = deflateSync(raw)

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdrData),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function writeIcon(size, filename, opts) {
  const png = encodePNG(renderIcon(size, opts), size)
  writeFileSync(join(outDir, filename), png)
  console.log(`wrote ${filename} (${size}x${size})`)
}

writeIcon(192, 'icon-192.png')
writeIcon(512, 'icon-512.png')
writeIcon(512, 'icon-maskable-512.png', { maskable: true })
writeIcon(180, 'apple-touch-icon.png')
