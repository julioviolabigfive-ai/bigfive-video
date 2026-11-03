// Mide el encuadre del presentador para ubicar los gráficos sin tapar cara ni pecho.
// Uso: node zonas.mjs <video> <salida.jpg> [--zoom 1.12] [--n 4]
// Saca N fotogramas repartidos en el video, con el zoom de cámara indicado (el máximo que se vaya a usar),
// y les dibuja una regla cada 100 px (en px del video final). Leer en la hoja:
//   cabeza = línea justo por encima del pelo; pecho = línea donde terminan pecho y brazos (donde empieza la mesa o las manos).
// Copiar esos valores a src/brand.ts → ENCUADRE.vertical. La línea roja (1632) es el piso: debajo está la interfaz de la red.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {assertEngine, ffmpegOk, parseArgs, probe} from './lib.mjs';

assertEngine();
const {pos, flags} = parseArgs(process.argv.slice(2));
const [video, salida] = pos;
if (!video || !salida) {
  console.error('Uso: node zonas.mjs <video> <salida.jpg> [--zoom 1.12] [--n 4]');
  process.exit(1);
}
const zoom = Number(flags.zoom ?? 1.12);
const n = Number(flags.n ?? 4);
const {duration, width, height} = probe(video);
const [W, H] = height > width ? [1080, 1920] : [1920, 1080];

const FONTS = ['C:/Windows/Fonts/arialbd.ttf', '/System/Library/Fonts/Supplemental/Arial Bold.ttf', '/Library/Fonts/Arial Bold.ttf'];
const font = FONTS.find((p) => fs.existsSync(p));
const lines = [];
for (let y = 100; y < H; y += 100) {
  const piso = H === 1920 && y === 1600;
  lines.push(`drawbox=x=0:y=${y}:w=iw:h=3:color=${piso ? 'yellow' : 'cyan'}@0.85:t=fill`);
  if (font) lines.push(`drawtext=fontfile='${font.replace(':', '\\:')}':text='${y}':x=10:y=${y + 6}:fontsize=34:fontcolor=white:box=1:boxcolor=black@0.6`);
}
if (H === 1920) lines.push('drawbox=x=0:y=1632:w=iw:h=6:color=red@0.9:t=fill');
// El zoom del motor escala desde el 50% horizontal y el 36% vertical (transformOrigin de la cámara).
const vf = [
  `scale=${W}:${H}:force_original_aspect_ratio=increase`,
  `crop=${W}:${H}`,
  `scale=iw*${zoom}:ih*${zoom}`,
  `crop=${W}:${H}:(iw-${W})/2:(ih-${H})*0.36`,
  ...lines,
  `scale=-2:${H === 1920 ? 960 : 540}`,
].join(',');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zonas-'));
for (let k = 0; k < n; k++) {
  const t = (duration * (k + 0.5)) / n;
  ffmpegOk(['-ss', t.toFixed(2), '-i', video, '-frames:v', '1', '-vf', vf, '-q:v', '3', path.join(tmp, `${String(k).padStart(3, '0')}.jpg`)]);
}
ffmpegOk(['-framerate', '1', '-i', path.join(tmp, '%03d.jpg'), '-vf', `tile=${n}x1`, '-frames:v', '1', '-q:v', '3', salida]);
fs.rmSync(tmp, {recursive: true, force: true});
console.log(`listo: ${salida} (zoom ${zoom})`);
