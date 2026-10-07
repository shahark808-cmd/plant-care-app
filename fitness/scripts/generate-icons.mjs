// Generates PWA icon PNGs without dependencies: deep-green background with a
// cream barbell mark (bar + two plates on each side).
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const GREEN = [46, 94, 78]
const CREAM = [247, 244, 238]

function inRect(x, y, cx, cy, hw, hh, r) {
  const qx = Math.max(Math.abs(x - cx) - (hw - r), 0)
  const qy = Math.max(Math.abs(y - cy) - (hh - r), 0)
  return Math.hypot(qx, qy) <= r
}

function renderIcon(size, { maskable = false } = {}) {
  const buf = Buffer.alloc(size * size * 4)
  const s = size * (maskable ? 0.62 : 0.78)
  const u = s / 100
  const cx = size / 2
  const cy = size / 2
  const parts = [
    [0, 0, 50, 3.5, 1.5], // bar
    [-30, 0, 5, 20, 3], [30, 0, 5, 20, 3], // inner plates
    [-40, 0, 4, 14, 3], [40, 0, 4, 14, 3], // outer plates
  ]
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let c = GREEN
      for (const [px, py, hw, hh, r] of parts) {
        if (inRect(x, y, cx + px * u, cy + py * u, hw * u, hh * u, r * u)) c = CREAM
      }
      const i = (y * size + x) * 4
      buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = 255
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
