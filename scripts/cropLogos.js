const fs = require('fs');
const zlib = require('zlib');

// CRC32 implementation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
  }
  crcTable[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function decodePng(sourcePath) {
  const buf = fs.readFileSync(sourcePath);
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  
  let pos = 8;
  const idatChunks = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IDAT') idatChunks.push(buf.subarray(pos + 8, pos + 8 + len));
    pos += 8 + len + 4;
  }
  const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
  
  const bpp = 4;
  const scanlineLen = 1 + w * bpp;
  const fullImg = Buffer.alloc(w * h * bpp);
  let prevScanline = Buffer.alloc(w * bpp);
  
  for (let y = 0; y < h; y++) {
    const filterType = decompressed[y * scanlineLen];
    const curr = decompressed.subarray(y * scanlineLen + 1, (y + 1) * scanlineLen);
    const unfil = Buffer.alloc(w * bpp);
    
    for (let x = 0; x < w * bpp; x++) {
      let a = x >= bpp ? unfil[x - bpp] : 0;
      let b = prevScanline[x];
      let c = x >= bpp ? prevScanline[x - bpp] : 0;
      let val = curr[x];
      if (filterType === 0) {}
      else if (filterType === 1) val = (val + a) & 0xff;
      else if (filterType === 2) val = (val + b) & 0xff;
      else if (filterType === 3) val = (val + Math.floor((a + b) / 2)) & 0xff;
      else if (filterType === 4) {
        let p = a + b - c;
        let pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        let pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
        val = (val + pr) & 0xff;
      }
      unfil[x] = val;
    }
    unfil.copy(fullImg, y * w * bpp);
    prevScanline = unfil;
  }
  return { w, h, fullImg };
}

function encodePng(fullImg, w, h, minX, minY, maxX, maxY, destPath) {
  const bpp = 4;
  const newW = maxX - minX + 1;
  const newH = maxY - minY + 1;
  
  const newRaw = Buffer.alloc(newH * (1 + newW * bpp));
  for (let y = 0; y < newH; y++) {
    const srcY = minY + y;
    newRaw[y * (1 + newW * bpp)] = 0; // filter None
    fullImg.copy(
      newRaw,
      y * (1 + newW * bpp) + 1,
      srcY * w * bpp + minX * bpp,
      srcY * w * bpp + (maxX + 1) * bpp
    );
  }
  
  const compressed = zlib.deflateSync(newRaw, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(newW, 0);
  ihdr.writeUInt32BE(newH, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  
  const finalPng = Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
  fs.writeFileSync(destPath, finalPng);
  console.log('Saved ' + destPath + ' (' + newW + 'x' + newH + ')');
}

// 1. Process media_1789713763703.png (Light Logo)
const light = decodePng('C:/Users/Princess/.gemini/antigravity/brain/73b36cd7-54c6-45bb-b602-814c02bac95f/.user_uploaded/media_1789713763703.png');

// Crop full light logo (minX: 116, minY: 42, maxX: 690, maxY: 277)
encodePng(light.fullImg, light.w, light.h, 114, 40, 692, 279, 'd:/Game_project/client/public/stackqueue-logo.png');

// Crop pure colored icon bars (minX: 340, minY: 42, maxX: 456, maxY: 170)
encodePng(light.fullImg, light.w, light.h, 338, 40, 458, 172, 'd:/Game_project/client/public/stackqueue-icon.png');

// Also process media_1789713748294.png (White text logo for dark mode if needed)
const dark = decodePng('C:/Users/Princess/.gemini/antigravity/brain/73b36cd7-54c6-45bb-b602-814c02bac95f/.user_uploaded/media_1789713748294.png');
// Find bounding box for dark
let dMinX = dark.w, dMaxX = 0, dMinY = dark.h, dMaxY = 0;
for (let y = 0; y < dark.h; y++) {
  for (let x = 0; x < dark.w; x++) {
    const a = dark.fullImg[y * dark.w * 4 + x * 4 + 3];
    if (a > 20) {
      if (x < dMinX) dMinX = x;
      if (x > dMaxX) dMaxX = x;
      if (y < dMinY) dMinY = y;
      if (y > dMaxY) dMaxY = y;
    }
  }
}
encodePng(dark.fullImg, dark.w, dark.h, Math.max(0, dMinX - 4), Math.max(0, dMinY - 4), Math.min(dark.w - 1, dMaxX + 4), Math.min(dark.h - 1, dMaxY + 4), 'd:/Game_project/client/public/stackqueue-logo-white.png');

console.log('All Stack Queue logos cropped and saved successfully.');
