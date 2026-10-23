// מחולל אייקוני PWA (PNG) בלי תלויות: רקע טורקיז וטבעת התקדמות לבנה.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

function png(size, { maskable }) {
  const bg = [15, 118, 110];
  const raw = Buffer.alloc((size * 3 + 1) * size);
  const c = size / 2;
  const scale = maskable ? 0.62 : 1; // maskable: תוכן בתוך האזור הבטוח
  const rOuter = size * 0.32 * scale;
  const rInner = size * 0.2 * scale;
  const dot = size * 0.07 * scale;
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x + 0.5 - c, y + 0.5 - c);
      const angle = Math.atan2(y + 0.5 - c, x + 0.5 - c);
      const inRing = d <= rOuter && d >= rInner;
      const inDot = d <= dot;
      // קצה ירוק-בהיר לחלק מהטבעת, כמו התקדמות
      const accent = inRing && angle > -Math.PI / 2 && angle < Math.PI / 6;
      const px = inDot || (inRing && !accent) ? [255, 255, 255] : accent ? [167, 243, 208] : bg;
      const o = y * (size * 3 + 1) + 1 + x * 3;
      raw[o] = px[0]; raw[o + 1] = px[1]; raw[o + 2] = px[2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.png", png(192, { maskable: false }));
writeFileSync("public/icons/icon-512.png", png(512, { maskable: false }));
writeFileSync("public/icons/icon-maskable-512.png", png(512, { maskable: true }));
writeFileSync("public/icons/apple-touch-icon.png", png(180, { maskable: false }));
console.log("icons generated");
